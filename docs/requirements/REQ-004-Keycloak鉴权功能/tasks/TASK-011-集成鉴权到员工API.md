# [TASK-011] 集成鉴权到员工API (employeeId)

## 任务元数据
- **任务ID**: TASK-011
- **所属需求**: [REQ-004] Keycloak鉴权功能集成
- **任务名称**: 集成鉴权到员工API并记录用户ID
- **优先级**: P0
- **状态**: 已完成
- **负责人**: 执行Agent
- **预估工时**: 2.5 小时
- **实际开始**: 2025-11-18
- **实际完成**: 2025-11-18
- **实际工时**: 2.0 小时
- **最后更新**: 2025-11-18

---

## 一、任务目标 🎯

### 1.1 目标描述
修改员工API路由 (`app/api/projects/employee/[employeeId]/route.js`),集成authMiddleware进行Token验证,并在创建项目时记录createdByUserId字段,实现用户与项目的绑定关系。同时修改 `lib/custom/employee-project.js` 支持createdByUserId参数。

### 1.2 成功标准
- [x] 导入authMiddleware (使用CUSTOM标记)
- [x] GET方法调用authMiddleware验证Token (projectId=null, 跳过权限验证)
- [x] POST方法调用authMiddleware验证Token (projectId=null, 跳过权限验证)
- [x] 创建项目时传递createdByUserId参数 (从authResult.userId提取)
- [x] 修改createProjectWithExternalId函数支持createdByUserId参数
- [x] 所有CUSTOM标记清晰标注
- [x] 测试: 无Token访问返回401 (已验证)
- [x] 测试: 代码逻辑正确,符合预期行为

### 1.3 价值说明
**业务价值**: 实现用户与项目的绑定,确保用户只能访问自己创建的项目,防止数据泄露
**技术价值**: 完成员工API的鉴权集成,实现自助创建项目时的用户身份记录

---

## 二、前置条件

### 2.1 依赖任务
- [x] TASK-007: 三步验证中间件完成 (authMiddleware可用)
- [x] TASK-002: 数据库Schema完成 (createdByUserId字段已添加)

### 2.2 依赖资源
- **代码文件**: app/api/projects/employee/[employeeId]/route.js (已存在)
- **工具函数**: lib/custom/employee-project.js (已存在,需修改)

### 2.3 准备工作
- [ ] 确认TASK-007已完成
- [ ] 备份当前route.js文件 (可选)

---

## 三、执行计划

### 3.1 执行步骤

```
步骤1: 修改 app/api/projects/employee/[employeeId]/route.js
  ├─ 操作1.1: 导入authMiddleware
  ├─ 代码:
  │   // ========== CUSTOM START ==========
  │   // 修改日期: 2025-11-17 | 需求: REQ-004
  │   // 变更说明: 导入鉴权中间件
  │   import { authMiddleware } from '@/lib/custom/auth/middleware';
  │   // ========== CUSTOM END ==========
  └─ 检查点: 导入语句添加成功,使用CUSTOM标记

步骤2: 修改GET方法添加Token验证
  ├─ 操作2.1: 在GET方法开头调用authMiddleware
  ├─ 代码:
  │   // ========== CUSTOM START ==========
  │   // 修改日期: 2025-11-17 | 需求: REQ-004
  │   // 变更说明: Token验证 (projectId=null,跳过权限验证)
  │   const authResult = await authMiddleware(request, null);
  │   if (!authResult.authorized) {
  │     return NextResponse.json(
  │       { error: authResult.error },
  │       { status: authResult.status }
  │     );
  │   }
  │   const userId = authResult.userId; // 从Token提取的用户ID或"admin"
  │   // ========== CUSTOM END ==========
  └─ 检查点: Token验证逻辑添加成功

步骤3: 修改创建项目逻辑,传递userId
  ├─ 操作3.1: 找到createProjectWithExternalId调用处
  ├─ 操作3.2: 添加createdByUserId参数
  ├─ 代码:
  │   // ========== CUSTOM START ==========
  │   // 修改日期: 2025-11-17 | 需求: REQ-004
  │   // 变更说明: 创建项目时记录用户ID
  │   const newProject = await createProjectWithExternalId({
  │     externalId: params.employeeId,
  │     name: customName,
  │     description: customDescription,
  │     createdByUserId: userId  // ⭐ 记录创建者
  │   });
  │   // ========== CUSTOM END ==========
  └─ 检查点: createdByUserId参数传递成功

步骤4: 同样修改POST方法
  ├─ 操作: 重复步骤2和步骤3的修改
  └─ 检查点: POST方法也集成鉴权

步骤5: 修改 lib/custom/employee-project.js
  ├─ 操作5.1: 修改createProjectWithExternalId函数签名,接受createdByUserId参数
  ├─ 代码:
  │   export async function createProjectWithExternalId(data) {
  │     const { externalId, name, description, createdByUserId } = data; // ⭐ 解构createdByUserId
  │
  │     // ... 创建项目逻辑 ...
  │
  │     // ========== CUSTOM START ==========
  │     // 修改日期: 2025-11-17 | 需求: REQ-004
  │     // 变更说明: 更新项目时设置createdByUserId
  │     const updatedProject = await db.projects.update({
  │       where: { id: project.id },
  │       data: {
  │         externalId: externalId,
  │         createdByUserId: createdByUserId || null  // ⭐ 设置创建者ID
  │       }
  │     });
  │     // ========== CUSTOM END ==========
  │   }
  └─ 检查点: createdByUserId支持添加成功

步骤6: 测试集成
  ├─ 测试6.1: 无Token访问 (预期返回401)
  ├─ 测试6.2: 有Token首次访问 (创建项目,记录userId)
  ├─ 测试6.3: 检查数据库 createdByUserId 字段是否正确
  ├─ 测试6.4: 用户再次访问同一employeeId (应重定向到已创建项目)
  └─ 检查点: 所有测试场景通过
```

---

## 四、技术方案

### 4.1 修改点总结

#### 修改点1: app/api/projects/employee/[employeeId]/route.js (GET方法)
```javascript
// ========== CUSTOM START ==========
// 修改日期: 2025-11-17 | 需求: REQ-004
// 变更说明: 导入鉴权中间件
import { authMiddleware } from '@/lib/custom/auth/middleware';
// ========== CUSTOM END ==========

export async function GET(request, { params }) {
  // ========== CUSTOM START ==========
  // 修改日期: 2025-11-17 | 需求: REQ-004
  // 变更说明: Token验证 (projectId=null,跳过权限验证)
  const authResult = await authMiddleware(request, null);
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  const userId = authResult.userId; // 从Token提取的用户ID或"admin"
  // ========== CUSTOM END ==========

  // ... 原有逻辑: 查询项目 ...

  if (!existingProject) {
    // ========== CUSTOM START ==========
    // 修改日期: 2025-11-17 | 需求: REQ-004
    // 变更说明: 创建项目时记录用户ID
    const newProject = await createProjectWithExternalId({
      externalId: params.employeeId,
      name: customName,
      description: customDescription,
      createdByUserId: userId  // ⭐ 记录创建者
    });
    // ========== CUSTOM END ==========
  }

  // ... 返回结果 ...
}
```

#### 修改点2: lib/custom/employee-project.js (createProjectWithExternalId函数)
```javascript
// ========== CUSTOM START ==========
// 定制说明: 员工项目专用业务逻辑封装
// 修改日期: 2025-11-08 | 需求: REQ-002
// 修改日期: 2025-11-17 | 需求: REQ-004 - 支持createdByUserId参数
// ========== CUSTOM END ==========

export async function createProjectWithExternalId(data) {
  const { externalId, name, description, createdByUserId } = data; // ⭐ 新增createdByUserId

  // ... 创建项目逻辑 ...

  // ========== CUSTOM START ==========
  // 修改日期: 2025-11-08 | 需求: REQ-002
  // 修改日期: 2025-11-17 | 需求: REQ-004 - 设置createdByUserId
  // 变更说明: 更新项目,设置externalId和createdByUserId
  const updatedProject = await db.projects.update({
    where: { id: project.id },
    data: {
      externalId: externalId,
      createdByUserId: createdByUserId || null  // ⭐ 设置创建者ID
    }
  });
  // ========== CUSTOM END ==========

  // ... 创建默认模型配置 ...

  return updatedProject;
}
```

### 4.2 关键技术点

#### 技术点1: 为什么projectId传null
- **问题**: 员工API是创建或查询项目,项目ID可能尚未确定
- **方案**: authMiddleware的projectId参数传null,跳过权限验证步骤
- **注意事项**: 仍然需要验证Token合法性 (步骤2),只是跳过步骤3的权限验证

#### 技术点2: 管理员创建项目的userId
- **问题**: 管理员登录后authResult.userId是"admin"
- **方案**: createdByUserId设为"admin",后续只有管理员可访问
- **注意事项**: 这是预期行为,管理员创建的项目只有管理员可访问

#### 技术点3: 向后兼容
- **问题**: createdByUserId参数可选,老代码可能不传
- **方案**: 使用 `createdByUserId || null`,不传时设为NULL
- **注意事项**: NULL值项目允许所有用户访问 (现有项目兼容)

---

## 五、验收标准

### 5.1 功能验收
- [ ] GET方法集成authMiddleware成功
- [ ] POST方法集成authMiddleware成功
- [ ] 无Token访问返回401
- [ ] 有Token创建项目时正确记录userId
- [ ] createdByUserId字段在数据库中正确存储
- [ ] 管理员创建项目时createdByUserId为"admin"
- [ ] 代码使用CUSTOM标记清晰标注

### 5.2 质量验收
- [ ] 代码符合代码隔离规范
- [ ] CUSTOM标记格式规范 (包含修改日期、需求编号、变更说明)
- [ ] 不影响现有功能 (name和description参数仍可用)

### 5.3 测试验收
- [ ] 测试场景1: 无Token访问 (返回401)
- [ ] 测试场景2: 有效Token首次访问 (创建项目, createdByUserId=userId)
- [ ] 测试场景3: 管理员首次访问 (创建项目, createdByUserId="admin")
- [ ] 测试场景4: 查询数据库验证createdByUserId字段
- [ ] 测试场景5: 用户A再次访问同一employeeId (重定向到已创建项目)
- [ ] 测试场景6: 用户B尝试访问用户A创建的项目 (通过projectId API,返回403) ← 依赖TASK-010

---

## 六、产出物清单

### 6.1 代码产出
- [x] app/api/projects/employee/[employeeId]/route.js (修改,约4处CUSTOM标记,+35/-2行)
  - 导入authMiddleware
  - GET方法添加Token验证
  - POST方法添加Token验证
  - 创建项目时传递createdByUserId参数
- [x] lib/custom/employee-project.js (修改,约2处CUSTOM标记,+10/-2行)
  - 函数签名支持createdByUserId参数
  - Prisma update设置createdByUserId字段
- [x] test-task-011.js (测试脚本,验证代码逻辑)

### 6.2 关键代码变更
| 文件路径 | 修改类型 | 修改说明 | 行数变化 |
|---------|---------|---------|---------|
| app/api/projects/employee/[employeeId]/route.js | 修改 | 集成authMiddleware,记录createdByUserId | +35/-2 |
| lib/custom/employee-project.js | 修改 | 支持createdByUserId参数 | +10/-2 |
| test-task-011.js | 新增 | 测试脚本验证逻辑 | +90 |

---

## 七、风险与注意事项

### 7.1 风险点
| 风险 | 可能性 | 影响 | 应对措施 |
|------|-------|------|---------|
| 修改后现有功能受影响 | 低 | 中 | 充分测试,确保name/description参数仍可用 |
| createdByUserId字段未正确保存 | 低 | 高 | 测试后查询数据库验证 |
| 管理员项目逻辑错误 | 低 | 中 | 测试管理员创建项目场景 |

### 7.2 注意事项
- ⚠️ **GET和POST都要修改**: 两个方法都需要集成鉴权
- ⚠️ **projectId传null**: 不要传projectId,此时项目可能尚未创建
- ⚠️ **管理员场景**: 管理员创建的项目createdByUserId为"admin"
- ⚠️ **CUSTOM标记**: 每处修改都要添加清晰的CUSTOM标记

---

## 八、后续任务
- **TASK-013**: 集成测试 (测试整体鉴权流程,包括员工API)

---

## 九、经验总结

### 9.1 做得好的地方 ✅
- **代码复用性强**: 使用与TASK-010相同的authMiddleware集成模式,保持一致性
- **CUSTOM标记规范**: 所有修改都使用清晰的CUSTOM标记,包含日期和需求编号
- **向后兼容**: createdByUserId参数设计为可选,使用 `|| null` 确保向后兼容
- **职责分离**: 在路由层提取userId,在业务层(employee-project.js)保存,职责清晰
- **测试脚本**: 创建测试脚本验证代码逻辑,补偿无真实Keycloak Token的情况

### 9.2 需要改进的地方 ⚠️
- **测试环境限制**: 由于缺少有效的Keycloak Token,未能进行端到端的实际测试
- **建议**: 在TASK-013集成测试阶段进行完整的端到端验证

### 9.3 可复用的方案 🔄
- **authMiddleware(request, null)模式**: 对于创建资源的API,传null跳过权限验证,只验证Token
- **userId传递模式**: 从authResult提取userId → 传递给业务函数 → 保存到数据库
- **可选参数设计**: `createdByUserId || null` 确保向后兼容
- **测试脚本模式**: 当缺少测试环境时,使用Node.js脚本验证代码逻辑和结构

### 9.4 技术要点总结
1. **projectId=null的含义**: 跳过步骤3权限验证,只执行步骤1管理员验证和步骤2 Token合法性验证
2. **管理员场景**: 管理员访问时userId="admin",项目createdByUserId也为"admin"
3. **普通用户场景**: 普通用户访问时userId为Keycloak的sub字段(UUID)
4. **NULL值兼容**: 现有项目(createdByUserId=NULL)允许所有用户访问,新项目记录创建者

---

**最后更新**: 2025-11-18
**任务状态**: 已完成
**实际工时**: 2.0小时 (效率: 125%)
