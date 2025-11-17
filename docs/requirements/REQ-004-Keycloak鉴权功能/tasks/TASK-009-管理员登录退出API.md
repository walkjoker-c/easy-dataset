# [TASK-009] 管理员登录退出API

## 任务元数据
- **任务ID**: TASK-009
- **所属需求**: [REQ-004] Keycloak鉴权功能集成
- **任务名称**: 管理员登录和退出API实现
- **优先级**: P0
- **状态**: 已完成
- **负责人**: 执行Agent
- **预估工时**: 1.5 小时
- **实际开始**: 2025-11-18
- **实际完成**: 2025-11-18
- **实际工时**: 1.0 小时
- **最后更新**: 2025-11-18

---

## 一、任务目标 🎯

### 1.1 目标描述
创建管理员登录API (`app/api/admin/login/route.js`) 和退出API (`app/api/admin/logout/route.js`),实现密码验证和Session管理,支持管理员登录状态持久化,为管理员提供免Token访问能力。

### 1.2 成功标准
- [x] 创建 POST /api/admin/login 路由
- [x] 创建 POST /api/admin/logout 路由
- [x] 登录API验证管理员密码 (环境变量ADMIN_PASSWORD)
- [x] 密码正确时设置Session (isAdmin=true)
- [x] 密码错误返回401错误
- [x] 退出API销毁Session
- [x] 日志记录登录和退出事件
- [x] 测试登录和退出功能

### 1.3 价值说明
**业务价值**: 为管理员提供登录认证,支持管理员免Token访问所有项目
**技术价值**: 完成管理员鉴权流程的后端部分,配合Session管理实现持久化登录

---

## 二、前置条件

### 2.1 依赖任务
- [x] TASK-004: Session管理模块完成 (saveSession, destroySession)
- [x] TASK-003: authConfig配置模块完成 (提供admin.password)

### 2.2 依赖资源
- **Session模块**: lib/custom/auth/session.js
- **配置模块**: lib/custom/config/auth.config.js
- **环境变量**: ADMIN_PASSWORD

### 2.3 准备工作
- [ ] 确认Session管理模块已完成
- [ ] 确认ADMIN_PASSWORD已配置

---

## 三、执行计划

### 3.1 执行步骤

```
步骤1: 创建管理员登录API目录
  ├─ 操作: 创建 app/api/admin/login/ 目录
  ├─ 命令: mkdir -p app/api/admin/login
  └─ 检查点: 目录创建成功

步骤2: 创建登录API路由文件
  ├─ 操作: 创建 app/api/admin/login/route.js
  ├─ 命令: touch app/api/admin/login/route.js
  └─ 检查点: 文件创建成功

步骤3: 实现登录API逻辑
  ├─ 操作3.1: 导入依赖 (NextResponse, saveSession)
  ├─ 操作3.2: 实现POST函数
  ├─ 操作3.3: 解析请求体 (password)
  ├─ 操作3.4: 验证密码 (与ADMIN_PASSWORD比对)
  ├─ 操作3.5: 密码正确时设置Session (isAdmin=true)
  ├─ 操作3.6: 密码错误返回401
  └─ 检查点: 登录逻辑实现正确

步骤4: 创建退出API目录
  ├─ 操作: 创建 app/api/admin/logout/ 目录
  ├─ 命令: mkdir -p app/api/admin/logout
  └─ 检查点: 目录创建成功

步骤5: 创建退出API路由文件
  ├─ 操作: 创建 app/api/admin/logout/route.js
  ├─ 命令: touch app/api/admin/logout/route.js
  └─ 检查点: 文件创建成功

步骤6: 实现退出API逻辑
  ├─ 操作6.1: 导入依赖 (NextResponse, destroySession)
  ├─ 操作6.2: 实现POST函数
  ├─ 操作6.3: 销毁Session
  ├─ 操作6.4: 返回成功响应
  └─ 检查点: 退出逻辑实现正确

步骤7: 添加日志记录
  ├─ 操作7.1: 登录成功时记录日志
  ├─ 操作7.2: 登录失败时记录警告
  ├─ 操作7.3: 退出时记录日志
  └─ 检查点: 日志完整

步骤8: 测试登录和退出功能
  ├─ 测试8.1: 正确密码登录 (返回200)
  ├─ 测试8.2: 错误密码登录 (返回401)
  ├─ 测试8.3: 空密码登录 (返回400)
  ├─ 测试8.4: 登录后退出 (返回200)
  ├─ 测试8.5: 检查Session是否正确设置和销毁
  └─ 检查点: 所有测试通过
```

---

## 四、技术方案

### 4.1 登录API完整代码

**文件**: `app/api/admin/login/route.js`

```javascript
// ========== CUSTOM START ==========
// 定制说明: REQ-004 Keycloak鉴权功能 - 管理员登录API
// 修改日期: 2025-11-17
// 功能: 管理员密码验证和Session设置
// ========== CUSTOM END ==========

import { NextResponse } from 'next/server';
import { saveSession } from '@/lib/custom/auth/session';

/**
 * 管理员登录API
 * POST /api/admin/login
 * @param {Request} req - Next.js请求对象
 * @returns {NextResponse} - JSON响应
 */
export async function POST(req) {
  try {
    // 解析请求体
    const { password } = await req.json();

    // 验证密码不为空
    if (!password) {
      return NextResponse.json(
        { error: '请输入密码' },
        { status: 400 }
      );
    }

    // 验证密码
    if (password === process.env.ADMIN_PASSWORD) {
      // 密码正确,设置管理员Session
      await saveSession(req, {
        isAdmin: true,
        loginAt: Date.now(),
      });

      console.log('[Admin] Admin login successful');

      return NextResponse.json({
        success: true,
        message: '登录成功',
      });
    } else {
      // 密码错误
      console.warn('[Admin] Admin login failed: incorrect password');

      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[Admin] Login error:', error);

    return NextResponse.json(
      { error: '登录失败,请重试' },
      { status: 500 }
    );
  }
}
```

### 4.2 退出API完整代码

**文件**: `app/api/admin/logout/route.js`

```javascript
// ========== CUSTOM START ==========
// 定制说明: REQ-004 Keycloak鉴权功能 - 管理员退出API
// 修改日期: 2025-11-17
// 功能: 销毁管理员Session
// ========== CUSTOM END ==========

import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/custom/auth/session';

/**
 * 管理员退出API
 * POST /api/admin/logout
 * @param {Request} req - Next.js请求对象
 * @returns {NextResponse} - JSON响应
 */
export async function POST(req) {
  try {
    // 销毁Session
    await destroySession(req);

    console.log('[Admin] Admin logout successful');

    return NextResponse.json({
      success: true,
      message: '已退出登录',
    });
  } catch (error) {
    console.error('[Admin] Logout error:', error);

    return NextResponse.json(
      { error: '退出失败,请重试' },
      { status: 500 }
    );
  }
}
```

### 4.3 API接口定义

#### 登录API

**请求**:
```
POST /api/admin/login
Content-Type: application/json

{
  "password": "管理员密码"
}
```

**响应** (成功 200):
```json
{
  "success": true,
  "message": "登录成功"
}
```

**响应** (密码错误 401):
```json
{
  "error": "密码错误"
}
```

**响应** (空密码 400):
```json
{
  "error": "请输入密码"
}
```

**响应** (服务器错误 500):
```json
{
  "error": "登录失败,请重试"
}
```

#### 退出API

**请求**:
```
POST /api/admin/logout
```

**响应** (成功 200):
```json
{
  "success": true,
  "message": "已退出登录"
}
```

**响应** (服务器错误 500):
```json
{
  "error": "退出失败,请重试"
}
```

### 4.4 Session数据结构

**登录后Session数据**:
```javascript
{
  isAdmin: true,       // 管理员标识
  loginAt: 1700000000000, // 登录时间戳 (毫秒)
}
```

### 4.5 使用示例

**前端调用登录API**:
```javascript
// app/admin/login/page.js
const response = await fetch('/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ password }),
});

if (response.ok) {
  // 登录成功,跳转
  router.push('/');
} else {
  // 显示错误
  const data = await response.json();
  setError(data.error);
}
```

**前端调用退出API**:
```javascript
const response = await fetch('/api/admin/logout', {
  method: 'POST',
});

if (response.ok) {
  // 退出成功,跳转到登录页
  router.push('/admin/login');
}
```

---

## 五、验收标准

### 5.1 功能验收
- [ ] POST /api/admin/login 路由创建成功
- [ ] POST /api/admin/logout 路由创建成功
- [ ] 登录API密码验证正确
- [ ] 密码正确时设置Session (isAdmin=true)
- [ ] 密码错误返回401
- [ ] 空密码返回400
- [ ] 退出API销毁Session
- [ ] 日志记录登录和退出事件

### 5.2 质量验收
- [ ] 代码符合Next.js App Router规范
- [ ] CUSTOM标记清晰标注
- [ ] 错误处理完善 (try-catch)
- [ ] 日志记录关键操作 (成功、失败、错误)

### 5.3 测试验收
- [ ] 测试正确密码登录 (返回200, Session设置)
- [ ] 测试错误密码登录 (返回401)
- [ ] 测试空密码登录 (返回400)
- [ ] 测试服务器错误处理 (模拟saveSession抛出错误)
- [ ] 测试退出功能 (返回200, Session销毁)
- [ ] 测试登录后访问项目 (管理员Session验证通过)

---

## 六、产出物清单

### 6.1 代码产出
- [x] app/api/admin/login/route.js (新增文件,61行代码)
- [x] app/api/admin/logout/route.js (新增文件,36行代码)
- [x] lib/custom/auth/session.js (修改文件,移除req参数,使用cookies())

### 6.2 关键代码变更
| 文件路径 | 修改类型 | 修改说明 | 行数变化 |
|---------|---------|---------|---------|
| app/api/admin/login/route.js | 新增 | 管理员登录API,密码验证和Session设置 | +61 |
| app/api/admin/logout/route.js | 新增 | 管理员退出API,销毁Session | +36 |
| lib/custom/auth/session.js | 修改 | 修复App Router兼容性,使用cookies()函数 | +2/-6 |

---

## 七、风险与注意事项

### 7.1 风险点
| 风险 | 可能性 | 影响 | 应对措施 |
|------|-------|------|---------|
| 管理员密码泄露 | 低 | 高 | 强密码要求;定期更换;环境变量配置 |
| Session未正确设置 | 低 | 中 | 测试验证;检查iron-session配置 |
| 密码验证逻辑错误 | 低 | 高 | 严格测试;代码审查 |

### 7.2 注意事项
- ⚠️ **密码比对**: 使用严格相等 (===) 比对密码
- ⚠️ **环境变量**: 使用 `process.env.ADMIN_PASSWORD`,不要hardcode
- ⚠️ **Session配置**: 依赖iron-session正确配置 (httpOnly, secure, sameSite)
- ⚠️ **日志安全**: 不记录密码明文,仅记录成功/失败事件

### 7.3 安全建议
- ✅ 管理员密码通过环境变量配置
- ✅ 登录失败记录警告日志 (监控暴力破解)
- ✅ Session使用httpOnly Cookie (防XSS)
- ✅ 生产环境使用secure Cookie (HTTPS)
- ✅ Session有效期24小时 (在authConfig中配置)

### 7.4 未来改进 (V2.0)
- **登录限流**: 限制登录尝试次数 (防暴力破解)
- **双因素认证**: 支持OTP或短信验证码
- **登录日志**: 记录登录IP、时间、设备信息
- **Session持久化**: 使用Redis存储Session (支持分布式部署)

---

## 八、关键命令清单

```bash
# 1. 创建API目录
mkdir -p app/api/admin/login app/api/admin/logout

# 2. 测试登录API (使用curl)
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-password"}'

# 3. 测试退出API (使用curl)
curl -X POST http://localhost:3000/api/admin/logout

# 4. 启动开发服务器
npm run dev
```

---

## 九、后续任务
- **TASK-008**: 管理员登录页面 (依赖本任务的登录API)
- **TASK-007**: 三步验证中间件 (使用管理员Session验证)

---

## 十、关键决策记录

| 决策内容 | 决策原因 | 影响范围 | 决策日期 | 决策人 |
|---------|---------|---------|---------|--------|
| 修改session.js移除req参数,使用cookies() | Next.js App Router的iron-session需要使用cookies()函数而非Request对象 | lib/custom/auth/session.js及所有调用方 | 2025-11-18 | 执行Agent |
| Session数据包含loginAt时间戳 | 便于后续审计和Session管理 | Session数据结构 | 2025-11-18 | 执行Agent |

---

## 十一、重要问题记录

### 问题1: iron-session在App Router中的使用方式
- **问题描述**: 初始实现直接传入req参数给getIronSession(),导致"cookieHandler.get is not a function"错误
- **影响程度**: 🔴 高 (完全阻塞功能)
- **根本原因**: Next.js App Router的Route Handlers中,iron-session需要使用cookies()函数获取cookie store,而不是直接传入Request对象
- **解决方案**:
  1. 导入`cookies`函数: `import { cookies } from 'next/headers'`
  2. 修改getSession: `await getIronSession(await cookies(), options)`
  3. 移除所有函数的req参数
- **状态**: ✅ 已解决
- **经验教训**:
  - App Router与Pages Router的API有重大差异,需要查阅最新文档
  - iron-session在不同Next.js路由模式下的使用方式不同
  - Session管理模块需要适配当前项目的路由模式

---

## 十二、经验总结

### 12.1 做得好的地方 ✅
- 完善的错误处理,对空密码、错误密码、服务器错误都有明确处理
- 详细的日志记录,成功、失败、错误都有日志输出
- CUSTOM标记清晰,便于后续维护
- 全面的API测试,覆盖正常流程和异常情况
- 及时发现并修复session.js的App Router兼容性问题

### 12.2 需要改进的地方 ⚠️
- 初期对Next.js App Router的iron-session使用不熟悉,走了弯路
- 可以在实现前先阅读iron-session的App Router示例代码

### 12.3 可复用的方案 🔄
- **Session管理的cookies()模式**: 在App Router中使用iron-session的标准模式,可复用到其他需要Session的API
- **API错误处理模式**: try-catch + 详细错误响应 + 日志记录的模式可复用
- **密码验证逻辑**: 使用环境变量 + 严格相等比对的安全模式可复用

---

**最后更新**: 2025-11-18
**任务状态**: 已完成
