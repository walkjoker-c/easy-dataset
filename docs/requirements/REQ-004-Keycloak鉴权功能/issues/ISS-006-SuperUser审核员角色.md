# ISS-006: Super User审核员角色

**Issue ID**: ISS-006
**需求ID**: REQ-004
**问题类型**: 新功能 - 权限管理
**优先级**: P1 (中优先级)
**状态**: 📝 设计完成 - 待实施
**创建日期**: 2025-11-18
**预估工时**: 3.5h

---

## 📋 问题描述

### 背景

**当前问题**:
1. 管理员创建数据集项目后,需要业务专家审核
2. 业务专家需要访问管理员创建的项目,但不应该:
   - 获得管理员完整权限 (创建/删除项目)
   - 访问公司平台项目 (有externalId的项目)
3. 不能直接给业务专家管理员账号密码 (安全风险)

**业务场景**:
- 管理员创建"客服话术数据集"项目
- 管理员生成训练数据
- 管理员将项目链接发给业务专家审核
- 业务专家需要登录访问,但只能看到管理员项目,不能访问公司项目

---

## 🎯 解决方案

### 方案概述

创建 **super_user 角色** (审核员),具有以下特性:

**核心定位**: 管理员项目的审核员,可以访问和修改管理员创建的项目,但不能创建/删除项目

**权限设计**:
- ✅ 可以访问管理员创建的项目 (createdByUserId='admin')
- ❌ 不能访问公司平台项目 (有externalId的项目)
- ✅ 可以访问首页,但只显示管理员创建的项目
- ❌ 不能在首页创建项目
- ❌ 不能在首页删除项目
- ✅ 可以在项目内修改/删除数据 (文本分割、标注等)

---

## 📊 权限矩阵

| 功能/页面 | admin | super_user | 员工(JWT) |
|---------|-------|-----------|----------|
| **公司项目访问** | ✅ 完全访问 | ❌ 不能访问 | ✅ 仅自己的项目 |
| **管理员项目访问** | ✅ 完全访问 | ✅ 完全访问 | ❌ 不能访问 |
| **访问首页 `/`** | ✅ 显示所有项目 | ✅ 显示管理员项目 | ❌ 不能访问 |
| **创建项目** | ✅ 可以 | ❌ **不可以** | ❌ 不可以 |
| **项目列表删除项目** | ✅ 可以 | ❌ **不可以** | ❌ 不可以 |
| **项目内修改数据** | ✅ 可以 | ✅ 可以(仅管理员项目) | ✅ 可以(仅自己的项目) |
| **项目内删除数据** | ✅ 可以 | ✅ 可以(仅管理员项目) | ✅ 可以(仅自己的项目) |

---

## 🔧 技术方案

### 方案选型

**采用方案**: 扩展现有Session系统 (与admin共用机制)

**原因**:
- ✅ 复用现有Session基础设施
- ✅ 长期账户,不需要频繁生成令牌
- ✅ 简单可靠,易于维护

**不采用JWT临时令牌的原因**:
- ❌ 业务专家需要长期访问,不是一次性临时访问
- ❌ 临时令牌频繁过期,影响用户体验

---

### 核心实现

#### 1. authMiddleware 智能判断 ⭐核心

**文件**: `lib/custom/auth/middleware.js`

**实现逻辑**:

```javascript
export async function authMiddleware(request, projectId) {
  const session = await getSession();

  // ========== Step 1: Admin检查 ==========
  if (session?.isAdmin) {
    return {
      authorized: true,
      userId: 'admin',
      role: 'admin',
      bypass: true
    };
  }

  // ========== Step 2: Super User检查 ==========
  if (session?.isSuperUser) {
    if (projectId) {
      const project = await db.projects.findUnique({
        where: { id: projectId },
        select: { createdByUserId: true, externalId: true }
      });

      // 公司项目 - super_user不能访问
      if (project?.externalId) {
        return {
          authorized: false,
          status: 403,
          error: '审核员仅能访问管理员创建的项目'
        };
      }

      // 管理员项目 - super_user可以访问
      if (project?.createdByUserId === 'admin') {
        return {
          authorized: true,
          userId: 'super_user',
          role: 'super_user',
          bypass: false
        };
      }

      return {
        authorized: false,
        status: 403,
        error: '您无权访问此项目'
      };
    }

    // 没有projectId (访问首页等) - 允许
    return {
      authorized: true,
      userId: 'super_user',
      role: 'super_user',
      bypass: false
    };
  }

  // ========== Step 3: 未登录 - 智能判断 ==========
  if (projectId) {
    const project = await db.projects.findUnique({
      where: { id: projectId },
      select: { createdByUserId: true, externalId: true }
    });

    if (!project) {
      return { authorized: false, status: 404, error: '项目不存在' };
    }

    // ⭐ 关键判断: 公司项目 vs 管理员项目
    if (project.externalId) {
      // ========== 公司项目: 走Token验证流程 ==========
      const token = request.cookies.get('Authorization')?.value;
      if (!token) {
        return {
          authorized: false,
          status: 401,
          error: '无权访问此项目'
        };
      }

      // 验证JWT Token (原有逻辑)
      // ...

    } else if (project.createdByUserId === 'admin') {
      // ========== 管理员项目: 提示super_user登录 ==========
      return {
        authorized: false,
        status: 401,
        error: '无权访问此项目',
        projectType: 'admin' // 标记,用于前端显示登录按钮
      };
    }
  }

  return {
    authorized: false,
    status: 401,
    error: '请先登录'
  };
}
```

**关键点**:
- ⭐ 根据项目属性 (externalId, createdByUserId) 走不同验证流程
- ⭐ 公司项目: admin + JWT Token
- ⭐ 管理员项目: admin + super_user

---

#### 2. Session扩展

**文件**: `lib/custom/auth/session.js`

**新增函数**:

```javascript
/**
 * 创建Super User Session
 */
export async function createSuperUserSession() {
  const session = await getSession();
  session.isSuperUser = true;
  session.userId = 'super_user';
  await session.save();
  console.log('[Session] Super user session created');
}

/**
 * 检查是否是Super User
 */
export async function isSuperUser() {
  const session = await getSession();
  return session?.isSuperUser === true;
}
```

---

#### 3. Super User登录页面

**文件**: `app/super-user/login/page.js` (新建)

**功能**:
- 独立的super_user登录页面
- 支持 `?redirect=` 参数,登录后自动返回原页面
- 密码验证: 环境变量 `SUPER_USER_PASSWORD`

**UI设计**:
```
┌─────────────────────────────┐
│     审核员登录              │
│                             │
│  密码: [______________]     │
│                             │
│       [登录]                │
└─────────────────────────────┘
```

---

#### 4. 首页权限控制

**文件**: `app/page.js`

**修改点**:

```javascript
export default async function HomePage() {
  const session = await getSession();

  // 支持admin和super_user
  if (!session?.isAdmin && !session?.isSuperUser) {
    redirect('/admin/login');
  }

  // 根据角色过滤项目
  let projects;
  if (session.isAdmin) {
    // 管理员: 显示所有项目
    projects = await db.projects.findMany({
      orderBy: { updatedAt: 'desc' }
    });
  } else if (session.isSuperUser) {
    // Super User: 仅显示管理员创建的项目
    projects = await db.projects.findMany({
      where: { createdByUserId: 'admin' },
      orderBy: { updatedAt: 'desc' }
    });
  }

  return <HomeClient
    projects={projects}
    role={session.isAdmin ? 'admin' : 'super_user'}
  />;
}
```

**文件**: `app/HomeClient.js`

**修改点**:

```javascript
export default function HomeClient({ projects, role }) {
  const canCreateProject = role === 'admin';
  const canDeleteProject = role === 'admin';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">项目列表</Typography>

        {/* 仅admin显示创建按钮 */}
        {canCreateProject && (
          <Button variant="contained" onClick={handleCreate}>
            创建项目
          </Button>
        )}

        {/* Super User显示提示 */}
        {!canCreateProject && (
          <Chip label="审核模式" color="info" />
        )}
      </Box>

      {/* 项目列表 - 根据角色显示/隐藏删除按钮 */}
      <ProjectList
        projects={projects}
        canDelete={canDeleteProject}
      />
    </Box>
  );
}
```

---

#### 5. 项目详情页错误优化

**文件**: `app/projects/[projectId]/layout.js`

**修改点**: 401错误显示super_user登录按钮

```javascript
if (error) {
  const currentPath = window.location.pathname;

  return (
    <Box sx={{ ... }}>
      <Alert severity="error" sx={{ maxWidth: 600 }}>
        <Typography variant="body1" fontWeight="600">
          {error}
        </Typography>

        {/* ========== CUSTOM START ========== */}
        {/* ISS-006: 管理员项目显示super_user登录提示 */}
        {/* 修改日期: 2025-11-18 */}
        {error.includes('无权访问') && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              如果您是审核员,请
              <Button
                size="small"
                sx={{ ml: 1 }}
                variant="outlined"
                onClick={() => router.push(
                  `/super-user/login?redirect=${encodeURIComponent(currentPath)}`
                )}
              >
                点击登录
              </Button>
            </Typography>
          </Box>
        )}
        {/* ========== CUSTOM END ========== */}
      </Alert>
    </Box>
  );
}
```

---

#### 6. 创建项目API保护

**文件**: `app/api/projects/route.js`

**修改点**: POST方法禁止super_user

```javascript
export async function POST(request) {
  // ========== CUSTOM START ==========
  // ISS-006: Super User不能创建项目
  // 修改日期: 2025-11-18

  const session = await getSession();

  if (!session?.isAdmin) {
    return Response.json(
      { error: '您没有权限创建项目' },
      { status: 403 }
    );
  }
  // ========== CUSTOM END ==========

  // 原有创建逻辑...
}
```

---

## 🎨 用户访问流程

### 流程1: 业务专家首次访问

```
1. 管理员发送项目链接给业务专家
   "请访问: http://localhost:1717/projects/xxx/text-split"

2. 业务专家点击链接
   ↓
3. authMiddleware检查Session → 未登录
   ↓
4. authMiddleware查询项目 → createdByUserId='admin'
   ↓
5. 返回401错误,前端显示:
   "无权访问此项目"
   [如果您是审核员,请 点击登录]
   ↓
6. 业务专家点击"点击登录"
   ↓
7. 跳转到 /super-user/login?redirect=/projects/xxx/text-split
   ↓
8. 输入密码,登录成功
   ↓
9. 自动重定向回 /projects/xxx/text-split
   ↓
10. authMiddleware检查 → isSuperUser=true + createdByUserId='admin'
   ↓
11. ✅ 允许访问
```

### 流程2: super_user访问首页

```
1. super_user登录后访问 /
   ↓
2. app/page.js检查Session → isSuperUser=true
   ↓
3. 查询数据库: WHERE createdByUserId='admin'
   ↓
4. 仅显示管理员创建的项目列表
   ↓
5. 隐藏"创建项目"按钮
   ↓
6. 隐藏项目列表的"删除"按钮
   ↓
7. 显示"审核模式"标签
```

### 流程3: super_user尝试访问公司项目

```
1. super_user访问 /projects/xxx (公司项目)
   ↓
2. authMiddleware检查Session → isSuperUser=true
   ↓
3. 查询项目 → externalId存在 (公司项目)
   ↓
4. ❌ 返回403错误: "审核员仅能访问管理员创建的项目"
```

---

## 📦 文件变更清单

### 新增文件

| 文件 | 说明 | 行数 |
|------|------|------|
| `app/super-user/login/page.js` | super_user登录页面 | ~80行 |
| `app/api/super-user/login/route.js` | super_user登录API | ~30行 |
| `app/api/super-user/logout/route.js` | super_user登出API (可复用admin) | ~20行 |

**新增代码总计**: ~130行

### 修改文件

| 文件 | 修改内容 | 行数变化 |
|------|---------|---------|
| `lib/custom/auth/session.js` | 添加 `createSuperUserSession()` | +15行 |
| `lib/custom/auth/middleware.js` | **核心修改**: 智能判断逻辑 | +80行 |
| `app/page.js` | 支持super_user,过滤项目列表 | +20行 |
| `app/HomeClient.js` | 隐藏创建/删除按钮,显示"审核模式" | +15行 |
| `app/projects/[projectId]/layout.js` | 401错误显示登录按钮 | +20行 |
| `app/api/projects/route.js` | POST方法禁止super_user | +10行 |

**修改代码总计**: ~160行

**总代码变更**: ~290行

---

## 🔒 安全考虑

### 安全措施

1. **密码保护**: super_user独立密码 (环境变量)
2. **Session隔离**: super_user和admin使用不同Session标识
3. **权限验证**: 每次访问都验证项目类型和权限
4. **日志记录**: 所有super_user操作记录日志

### 潜在风险

| 风险 | 风险等级 | 缓解措施 |
|------|---------|---------|
| 暴露super_user登录入口 | 中 | 仅在401错误时显示,不主动暴露 |
| 密码泄露 | 中 | 使用强密码,定期更换 |
| Session劫持 | 低 | 使用httpOnly Cookie, 定期过期 |

---

## ✅ 验收标准

### 功能验收

- [ ] super_user可以登录,创建Session
- [ ] super_user可以访问首页,仅显示管理员项目
- [ ] super_user可以访问管理员项目 (createdByUserId='admin')
- [ ] super_user不能访问公司项目 (有externalId)
- [ ] super_user不能在首页创建项目
- [ ] super_user不能在首页删除项目
- [ ] super_user可以在项目内修改/删除数据

### UI验收

- [ ] super_user登录页面正常显示
- [ ] 登录后自动重定向到原页面
- [ ] 首页显示"审核模式"标签
- [ ] 首页隐藏"创建项目"按钮
- [ ] 首页隐藏项目的"删除"按钮
- [ ] 401错误页面显示"点击登录"按钮

### 安全验收

- [ ] super_user不能访问公司项目 (返回403)
- [ ] super_user不能创建项目 (API返回403)
- [ ] 密码错误时登录失败
- [ ] Session正确隔离,不混淆admin和super_user

### 代码验收

- [ ] 所有修改使用CUSTOM START/END标记
- [ ] 标记包含ISS-006、修改说明、修改日期
- [ ] 遵循REQ-001代码隔离规范
- [ ] 完整的错误处理和日志记录

---

## 🧪 测试计划

### 测试场景1: super_user登录

**测试步骤**:
1. 访问 `/super-user/login`
2. 输入正确密码
3. 点击登录

**预期结果**:
- 登录成功,重定向到首页
- 首页显示"审核模式"标签
- 仅显示管理员创建的项目

---

### 测试场景2: super_user访问管理员项目

**前置条件**: super_user已登录

**测试步骤**:
1. 访问管理员项目: `/projects/xxx/text-split`
   (项目: createdByUserId='admin', externalId=NULL)

**预期结果**:
- ✅ 可以正常访问
- ✅ 可以修改数据 (文本分割、标注等)

---

### 测试场景3: super_user访问公司项目

**前置条件**: super_user已登录

**测试步骤**:
1. 访问公司项目: `/projects/yyy/text-split`
   (项目: externalId='test-001')

**预期结果**:
- ❌ 返回403错误
- 显示: "审核员仅能访问管理员创建的项目"

---

### 测试场景4: super_user尝试创建项目

**前置条件**: super_user已登录

**测试步骤**:
1. 访问首页 `/`
2. 检查是否有"创建项目"按钮

**预期结果**:
- ❌ 首页不显示"创建项目"按钮
- 显示"审核模式"标签

**额外测试**:
1. 使用curl直接调用创建项目API

```bash
curl -X POST http://localhost:1717/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'
```

**预期结果**:
- ❌ 返回403错误
- 错误信息: "您没有权限创建项目"

---

### 测试场景5: super_user尝试删除项目

**前置条件**: super_user已登录

**测试步骤**:
1. 访问首页 `/`
2. 检查项目列表是否有"删除"按钮

**预期结果**:
- ❌ 项目列表不显示"删除"按钮

---

### 测试场景6: 未登录访问管理员项目

**测试步骤**:
1. 无痕浏览器访问管理员项目: `/projects/xxx/text-split`

**预期结果**:
- 显示401错误: "无权访问此项目"
- 显示"如果您是审核员,请 [点击登录]" 提示

**测试步骤2**:
1. 点击"点击登录"按钮

**预期结果**:
- 跳转到 `/super-user/login?redirect=/projects/xxx/text-split`

**测试步骤3**:
1. 输入密码,登录成功

**预期结果**:
- 自动重定向回 `/projects/xxx/text-split`
- ✅ 可以正常访问项目

---

## 📊 环境变量

### 新增环境变量

```env
# .env.local

# Super User (审核员) 密码
SUPER_USER_PASSWORD=your-secure-super-user-password-here
```

**说明**:
- 建议使用16位以上随机密码
- 定期更换密码
- 不要与admin密码相同

---

## 💡 经验总结

### 设计亮点

1. **智能判断**: authMiddleware根据项目属性自动选择验证流程
2. **权限精细化**: 区分"项目列表权限"和"项目内权限"
3. **用户体验**: 登录后自动返回原页面,无缝衔接
4. **安全可控**: 仅在401错误时显示登录入口,不主动暴露

### 可复用方案

- **角色扩展模式**: 可以继续扩展更多角色 (如viewer, editor等)
- **智能判断模式**: 根据数据属性走不同验证流程,可复用到其他场景

---

## 🔗 相关文档

- [REQ-004 项目现状](../00-PROJECT-STATUS.md)
- [REQ-004 需求文档](../需求文档.md)
- [REQ-004 技术方案设计](../技术方案设计.md)
- [ISS-002 安全优化-禁止项目详情页跳转登录](./ISS-002-安全优化-禁止项目详情页跳转登录.md)
- [ISS-003 页面级登录保护和登出功能](./ISS-003-页面级登录保护和登出功能.md)

---

**创建人**: Claude Code
**最后更新**: 2025-11-18
**状态**: 📝 设计完成 - 待实施

---

## 📌 下一步

**等待用户确认后开始实施**

实施步骤:
1. 创建super_user登录页面和API
2. 修改authMiddleware添加智能判断逻辑
3. 修改首页,支持super_user访问但隐藏创建/删除按钮
4. 修改项目详情页错误显示,添加登录提示
5. 保护创建项目API
6. 测试所有场景
