# ISS-005: 旧项目createdByUserId自动补充

**Issue ID**: ISS-005
**需求ID**: REQ-004
**问题类型**: 数据迁移/自动修复
**优先级**: P1 (中优先级)
**状态**: 📝 草稿
**创建日期**: 2025-11-18
**预估工时**: 0.5h (30分钟)

---

## 📋 问题描述

### 背景

在REQ-004实施前，公司平台创建的项目都有`externalId`字段，但没有`createdByUserId`字段（值为NULL）。这些是**旧数据项目**。

### 数据现状

**旧项目特征**:
- ✅ 有 `externalId` 字段（公司平台创建）
- ❌ `createdByUserId = NULL`（缺失用户ID）

**问题**:
- 权限验证逻辑中，`createdByUserId=NULL`的项目允许所有人访问（向后兼容设计）
- 但这不符合安全要求：应该记录项目的真实创建者
- 需要一个**一次性的数据迁移机制**，在用户正常访问时自动补充

---

## 🎯 解决方案

### 自动补充机制

**触发时机**: 用户通过employee API访问项目时

**补充条件**:
```
externalId IS NOT NULL  // 公司平台项目
AND
createdByUserId IS NULL  // 缺失用户ID
```

**补充逻辑**:
1. 从JWT Token的`sub`字段提取`userId`
2. 更新项目的`createdByUserId`字段
3. 记录补充操作日志

**适用范围**:
- Employee API的GET方法（查询项目）
- Employee API的POST方法（创建项目）

---

## 🛠️ 技术实现

### 修改文件

**影响范围**:
1. `app/api/employees/route.js` - **GET方法**
2. `app/api/employees/route.js` - **POST方法**

---

### 实现1: GET方法 - 查询项目时自动补充

**文件**: `app/api/employees/route.js`

**当前逻辑**:
```javascript
export async function GET(request) {
  // ... authMiddleware验证,获取userId ...

  // 根据externalId查询项目
  const project = await db.projects.findFirst({
    where: { externalId }
  });

  if (!project) {
    return Response.json({ error: '项目不存在' }, { status: 404 });
  }

  return Response.json(project);
}
```

**修改后**:
```javascript
export async function GET(request) {
  // ... authMiddleware验证,获取userId ...

  // 根据externalId查询项目
  const project = await db.projects.findFirst({
    where: { externalId }
  });

  if (!project) {
    return Response.json({ error: '项目不存在' }, { status: 404 });
  }

  // ========== CUSTOM START ==========
  // ISS-005: 旧项目createdByUserId自动补充
  // 定制说明: 首次访问时自动补充缺失的createdByUserId字段
  // 修改日期: 2025-11-18

  // 检测旧数据项目: 有externalId但createdByUserId为NULL
  if (project.externalId && project.createdByUserId === null) {
    console.log(`[Employee API GET] Auto-filling createdByUserId for project ${project.id}, externalId: ${project.externalId}, userId: ${userId}`);

    // 从JWT的sub字段补充createdByUserId
    await db.projects.update({
      where: { id: project.id },
      data: { createdByUserId: userId }
    });

    // 更新返回的project对象
    project.createdByUserId = userId;

    console.log(`[Employee API GET] Successfully filled createdByUserId for project ${project.id}`);
  }
  // ========== CUSTOM END ==========

  return Response.json(project);
}
```

---

### 实现2: POST方法 - 创建项目时直接记录

**文件**: `app/api/employees/route.js`

**当前逻辑**:
```javascript
export async function POST(request) {
  // ... authMiddleware验证,获取userId ...

  // 创建项目
  const project = await db.projects.create({
    data: {
      name: projectName,
      externalId: externalId,
      createdByUserId: userId,  // ← 已经有这个字段
      ...
    }
  });

  return Response.json(project);
}
```

**修改后**:
```javascript
export async function POST(request) {
  // ... authMiddleware验证,获取userId ...

  // ========== CUSTOM START ==========
  // ISS-005: 确保新创建的项目记录createdByUserId
  // 定制说明: 创建项目时同时记录externalId和createdByUserId
  // 修改日期: 2025-11-18

  // 检查是否存在同名项目(根据externalId)
  const existingProject = await db.projects.findFirst({
    where: { externalId: externalId }
  });

  if (existingProject) {
    // 如果是旧数据项目,补充createdByUserId
    if (existingProject.createdByUserId === null) {
      console.log(`[Employee API POST] Auto-filling createdByUserId for existing project ${existingProject.id}`);

      const updatedProject = await db.projects.update({
        where: { id: existingProject.id },
        data: { createdByUserId: userId }
      });

      return Response.json(updatedProject);
    }

    // 已有完整数据,直接返回
    return Response.json(existingProject);
  }
  // ========== CUSTOM END ==========

  // 创建新项目(已有createdByUserId字段,无需修改)
  const project = await db.projects.create({
    data: {
      name: projectName,
      externalId: externalId,
      createdByUserId: userId,  // ✅ 新项目直接记录
      ...
    }
  });

  return Response.json(project);
}
```

---

## 🔒 风险分析

### 风险1: 其他用户访问导致错误的createdByUserId

**场景描述**:
- 用户A创建了项目（旧数据，createdByUserId=NULL）
- 用户B使用curl + 自己的JWT Token访问该项目
- 系统补充 createdByUserId = 用户B的ID（错误）

**发生概率**: 极低
- 需要用户专门用curl调用employee API
- 需要知道其他人项目的externalId
- 技术门槛高，普通用户不会这样操作

**影响范围**: 单个项目的创建者记录错误

**应对措施**:
- ✅ **接受风险**: 这是一次性的数据迁移，大概率不会发生
- ✅ **记录日志**: 所有补充操作都有console.log记录，可审计
- ✅ **仅补充一次**: createdByUserId已有值时不会覆盖

**用户反馈**:
> "一般来说不会发生,比较难,需要用户专门用curl,用自己的jwt token,调用employee相关API接口,去访问别人的旧数据集项目时才会发生,所以我只是说一个单独可能得风险.实际上大概率不用管这个事,因为这种数据补充是一次性的事情."

**结论**: ✅ 风险可接受，不需要额外的保护机制

---

### 风险2: 补充操作失败

**场景**: 数据库更新失败

**应对措施**:
```javascript
try {
  await db.projects.update({
    where: { id: project.id },
    data: { createdByUserId: userId }
  });
  console.log(`[Employee API] Successfully filled createdByUserId for project ${project.id}`);
} catch (error) {
  // 补充失败不影响主流程,仅记录日志
  console.error(`[Employee API] Failed to fill createdByUserId for project ${project.id}:`, error);
  // 继续返回项目数据,不抛出错误
}
```

---

## ✅ 验收标准

### 功能验收
- [ ] 旧项目首次访问时自动补充`createdByUserId`
- [ ] 补充后的项目包含正确的`createdByUserId`（来自JWT的sub）
- [ ] 已有`createdByUserId`的项目不会被覆盖
- [ ] 新创建的项目直接记录`createdByUserId`

### 数据验收
- [ ] 补充前: `externalId=XXX, createdByUserId=NULL`
- [ ] 补充后: `externalId=XXX, createdByUserId=用户ID`
- [ ] 未来创建: `externalId=XXX, createdByUserId=用户ID`（同时记录）

### 日志验收
- [ ] 补充操作有console.log记录
- [ ] 日志包含: projectId, externalId, userId
- [ ] 失败时有error日志

### 代码验收
- [ ] 使用CUSTOM START/END标记
- [ ] 标记包含ISS-005、修改说明、修改日期
- [ ] 遵循REQ-001代码隔离规范

---

## 🧪 测试计划

### 测试场景1: 旧项目首次访问（GET方法）

**前置条件**:
- 数据库中有项目: `externalId='test-001', createdByUserId=NULL`

**测试步骤**:
1. 用户A使用有效JWT Token调用 `GET /api/employees?externalId=test-001`
2. 检查返回的项目数据
3. 检查数据库中的项目记录

**预期结果**:
- API返回项目数据，包含 `createdByUserId=用户A的ID`
- 数据库中项目的 `createdByUserId` 已更新为用户A的ID
- 控制台输出补充操作日志

---

### 测试场景2: 已补充的项目再次访问

**前置条件**:
- 项目已有 `createdByUserId='user-a'`

**测试步骤**:
1. 用户B调用 `GET /api/employees?externalId=test-001`

**预期结果**:
- API正常返回项目数据
- `createdByUserId` 仍然是 `'user-a'`（不会被覆盖）
- 无补充操作日志

---

### 测试场景3: 创建新项目（POST方法）

**测试步骤**:
1. 用户A调用 `POST /api/employees` 创建项目

**预期结果**:
- 新项目同时记录 `externalId` 和 `createdByUserId`
- `createdByUserId = 用户A的ID`

---

### 测试场景4: POST方法遇到旧项目

**前置条件**:
- 数据库中已有项目: `externalId='test-002', createdByUserId=NULL`

**测试步骤**:
1. 用户A调用 `POST /api/employees` 创建同名项目（externalId='test-002'）

**预期结果**:
- 不创建新项目
- 返回现有项目，并补充 `createdByUserId=用户A的ID`
- 控制台输出补充操作日志

---

## 📊 影响评估

### 影响范围

| 影响类型 | 影响内容 | 风险等级 |
|---------|---------|---------|
| **修改文件** | app/api/employees/route.js (GET +15行, POST +20行) | 低 |
| **数据变更** | 旧项目的createdByUserId从NULL补充为实际用户ID | 低 |
| **性能影响** | 每个旧项目首次访问时额外1次UPDATE操作 | 极低 |

### 向后兼容性

- ✅ **完全兼容**: 仅补充缺失数据，不影响现有逻辑
- ✅ **一次性操作**: 每个项目仅补充一次，后续无额外开销
- ✅ **不破坏数据**: 已有createdByUserId的项目不受影响

---

## 📝 实施记录

### 预计Git提交

```bash
git commit -m "feat(ISS-005): 旧项目createdByUserId自动补充

问题: 旧项目有externalId但createdByUserId=NULL
影响: 权限验证不完整,缺少项目创建者记录

解决方案:
- employee API GET方法: 查询时检测并补充createdByUserId
- employee API POST方法: 遇到旧项目时补充createdByUserId
- 从JWT的sub字段提取userId进行补充
- 已有值的项目不覆盖,仅一次性补充

技术实现:
- 检测条件: externalId存在 && createdByUserId=NULL
- 补充逻辑: UPDATE projects SET createdByUserId=userId
- 日志记录: 所有补充操作有console.log

风险控制:
- 接受极低概率的错误补充风险(需curl+他人externalId)
- 补充失败不影响主流程,仅记录error日志
- 一次性数据迁移,后续无额外开销

代码变更:
- app/api/employees/route.js GET方法 (+15行)
- app/api/employees/route.js POST方法 (+20行)

Related: REQ-004 Keycloak鉴权功能"
```

---

## 💡 经验总结

### 最佳实践

1. **数据迁移策略**:
   - 在用户正常访问时自动补充（无感知）
   - 仅补充一次，避免重复操作
   - 记录详细日志，便于审计

2. **风险评估**:
   - 识别潜在风险，评估发生概率和影响范围
   - 接受极低概率的风险，避免过度设计
   - 提供日志审计能力，可事后追溯

3. **代码设计**:
   - 补充操作失败不影响主流程
   - 使用try-catch保护，优雅降级
   - 清晰的CUSTOM标记和注释

---

## 🔗 相关文档

- [REQ-004 项目现状](../00-PROJECT-STATUS.md)
- [REQ-004 需求文档](../需求文档.md)
- [REQ-004 技术方案设计](../技术方案设计.md)
- [REQ-002 员工ID映射优化](../../REQ-002-员工ID映射优化/需求文档.md)

---

**创建人**: Claude Code
**最后更新**: 2025-11-18
**状态**: 📝 草稿 - 待用户确认
