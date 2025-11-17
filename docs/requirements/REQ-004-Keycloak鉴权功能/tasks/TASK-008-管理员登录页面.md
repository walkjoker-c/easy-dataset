# [TASK-008] 管理员登录页面

## 任务元数据
- **任务ID**: TASK-008
- **所属需求**: [REQ-004] Keycloak鉴权功能集成
- **任务名称**: 管理员登录页面UI实现
- **优先级**: P0
- **状态**: 待开始
- **负责人**: 待分配
- **预估工时**: 2 小时
- **实际工时**: -
- **最后更新**: 2025-11-17

---

## 一、任务目标 🎯

### 1.1 目标描述
创建管理员登录页面 (`app/admin/login/page.js`),实现密码输入UI和前端登录逻辑,调用管理员登录API,登录成功后跳转到项目列表页,为管理员提供友好的登录入口。

### 1.2 成功标准
- [ ] 创建 app/admin/login/page.js 文件
- [ ] 登录页面UI实现完成 (密码输入框 + 登录按钮)
- [ ] 调用 /api/admin/login API (POST请求)
- [ ] 登录成功跳转到项目列表页 (/)
- [ ] 密码错误显示错误提示
- [ ] 使用项目现有样式 (Material-UI)
- [ ] 支持Enter键提交

### 1.3 价值说明
**业务价值**: 为管理员提供登录入口,支持管理员免Token访问所有项目
**技术价值**: 完成管理员鉴权流程的前端部分,配合Session管理实现管理员登录

---

## 二、前置条件

### 2.1 依赖任务
- [x] TASK-009: 管理员登录API完成 (POST /api/admin/login)
- [x] TASK-004: Session管理模块完成 (保存Session)

### 2.2 依赖资源
- **UI组件库**: Material-UI (项目已使用)
- **路由**: Next.js App Router
- **API**: /api/admin/login

### 2.3 准备工作
- [ ] 确认管理员登录API已完成
- [ ] 确认项目使用Material-UI版本

---

## 三、执行计划

### 3.1 执行步骤

```
步骤1: 创建管理员登录页面文件
  ├─ 操作: 创建 app/admin/login/page.js
  ├─ 命令: mkdir -p app/admin/login && touch app/admin/login/page.js
  └─ 检查点: 文件创建成功

步骤2: 编写页面组件结构
  ├─ 操作2.1: 使用"use client"声明客户端组件
  ├─ 操作2.2: 导入React和Material-UI组件
  ├─ 操作2.3: 创建AdminLoginPage组件
  ├─ 代码:
  │   'use client';
  │
  │   import { useState } from 'react';
  │   import { useRouter } from 'next/navigation';
  │   import { Box, TextField, Button, Typography, Alert } from '@mui/material';
  │
  │   export default function AdminLoginPage() {
  │     // ...
  │   }
  └─ 检查点: 组件结构正确

步骤3: 实现状态管理
  ├─ 操作: 使用useState管理密码、错误、加载状态
  ├─ 代码:
  │   const [password, setPassword] = useState('');
  │   const [error, setError] = useState('');
  │   const [loading, setLoading] = useState(false);
  │   const router = useRouter();
  └─ 检查点: 状态定义正确

步骤4: 实现登录逻辑函数
  ├─ 操作: 编写handleLogin函数,调用登录API
  ├─ 代码:
  │   const handleLogin = async (e) => {
  │     e.preventDefault();
  │     setError('');
  │     setLoading(true);
  │
  │     try {
  │       const response = await fetch('/api/admin/login', {
  │         method: 'POST',
  │         headers: { 'Content-Type': 'application/json' },
  │         body: JSON.stringify({ password }),
  │       });
  │
  │       if (response.ok) {
  │         router.push('/'); // 跳转到项目列表
  │       } else {
  │         const data = await response.json();
  │         setError(data.error || '登录失败');
  │       }
  │     } catch (err) {
  │       setError('登录失败,请重试');
  │     } finally {
  │       setLoading(false);
  │     }
  │   };
  └─ 检查点: 登录逻辑正确

步骤5: 编写UI布局
  ├─ 操作5.1: 使用Material-UI组件搭建UI
  ├─ 操作5.2: 居中布局,响应式设计
  ├─ 操作5.3: 错误提示使用Alert组件
  └─ 检查点: UI美观,符合项目风格

步骤6: 添加键盘交互
  ├─ 操作: 支持Enter键提交表单
  ├─ 代码: <form onSubmit={handleLogin}>
  └─ 检查点: Enter键可触发登录

步骤7: 测试登录页面
  ├─ 测试7.1: 访问 /admin/login
  ├─ 测试7.2: 输入正确密码,登录成功,跳转到 /
  ├─ 测试7.3: 输入错误密码,显示错误提示
  ├─ 测试7.4: 测试Enter键提交
  └─ 检查点: 所有测试通过
```

---

## 四、技术方案

### 4.1 完整代码实现

```javascript
// ========== CUSTOM START ==========
// 定制说明: REQ-004 Keycloak鉴权功能 - 管理员登录页面
// 修改日期: 2025-11-17
// 功能: 管理员密码登录UI
// ========== CUSTOM END ==========

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * 处理登录提交
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // 验证密码不为空
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // 登录成功,跳转到项目列表页
        router.push('/');
      } else {
        const data = await response.json();
        setError(data.error || '登录失败,请重试');
      }
    } catch (err) {
      console.error('[Admin Login] Login error:', err);
      setError('登录失败,请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>

          <Typography component="h1" variant="h5">
            管理员登录
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 3, width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="管理员密码"
              type="password"
              id="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              提示: 管理员登录后可访问所有项目
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
```

### 4.2 UI设计说明

**布局结构**:
- 居中布局 (Container + maxWidth="xs")
- Paper卡片包裹 (elevation=3)
- 头部图标 (Avatar + LockOutlinedIcon)
- 标题 (管理员登录)
- 错误提示 (Alert,仅在有错误时显示)
- 密码输入框 (TextField,type="password")
- 登录按钮 (Button,type="submit")
- 提示文字 (Typography)

**交互状态**:
- 加载中: 按钮禁用,文字变为"登录中..."
- 错误状态: 显示红色Alert错误提示
- 成功状态: 自动跳转到 / (项目列表页)

### 4.3 Material-UI组件使用

**导入组件**:
```javascript
import {
  Box,          // 布局容器
  TextField,    // 密码输入框
  Button,       // 登录按钮
  Typography,   // 文字
  Alert,        // 错误提示
  Container,    // 页面容器
  Paper,        // 卡片
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; // 图标
import Avatar from '@mui/material/Avatar'; // 头像容器
```

### 4.4 路由跳转

**使用Next.js App Router**:
```javascript
import { useRouter } from 'next/navigation'; // 注意: App Router使用 'next/navigation'

const router = useRouter();

// 登录成功后跳转
router.push('/');
```

---

## 五、验收标准

### 5.1 功能验收
- [ ] 登录页面UI实现完成
- [ ] 密码输入框正常工作
- [ ] 登录按钮可点击
- [ ] 调用 /api/admin/login API
- [ ] 登录成功跳转到 /
- [ ] 密码错误显示错误提示
- [ ] 网络错误显示错误提示
- [ ] 支持Enter键提交

### 5.2 质量验收
- [ ] 使用Material-UI组件 (符合项目风格)
- [ ] 响应式设计 (移动端兼容)
- [ ] 加载状态反馈 (按钮禁用,文字变化)
- [ ] 错误提示友好 (Alert组件)
- [ ] CUSTOM标记清晰

### 5.3 测试验收
- [ ] 测试正确密码登录成功
- [ ] 测试错误密码显示错误提示
- [ ] 测试空密码提示"请输入密码"
- [ ] 测试Enter键提交
- [ ] 测试加载状态 (按钮禁用)
- [ ] 测试跳转功能 (登录成功跳转到 /)

---

## 六、产出物清单

- [x] app/admin/login/page.js (新增文件,约130行代码)

---

## 七、风险与注意事项

### 7.1 风险点
| 风险 | 可能性 | 影响 | 应对措施 |
|------|-------|------|---------|
| Material-UI版本不兼容 | 低 | 中 | 查看项目使用的MUI版本,使用对应API |
| 路由跳转失败 | 低 | 中 | 使用 'next/navigation' (App Router) |
| Session未正确设置 | 低 | 高 | 依赖TASK-009登录API正确实现 |

### 7.2 注意事项
- ⚠️ **"use client"声明**: 必须声明客户端组件 (使用useState和useRouter)
- ⚠️ **路由导入**: App Router使用 `'next/navigation'`,不是 `'next/router'`
- ⚠️ **Material-UI版本**: 确认项目使用的MUI版本 (v5或v6)
- ⚠️ **密码安全**: type="password",自动隐藏输入内容

### 7.3 UI/UX建议
- ✅ 居中布局,视觉聚焦
- ✅ 错误提示明确 (使用Alert组件)
- ✅ 加载状态反馈 (按钮禁用,文字变化)
- ✅ 支持Enter键提交 (form onSubmit)
- ✅ 自动聚焦密码输入框 (autoFocus)

---

## 八、关键命令清单

```bash
# 1. 创建管理员登录页面目录
mkdir -p app/admin/login

# 2. 启动开发服务器
npm run dev

# 3. 访问登录页面
open http://localhost:3000/admin/login

# 4. 检查Material-UI版本
npm list @mui/material
```

---

## 九、后续任务
- **TASK-009**: 管理员登录/退出API (依赖关系: 本任务依赖TASK-009)
- **TASK-007**: 三步验证中间件 (使用管理员Session验证)

---

**最后更新**: 2025-11-17
**任务状态**: 待开始
