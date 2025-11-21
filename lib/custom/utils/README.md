# 错误处理工具 (Error Handler)

> REQ-004 Keycloak鉴权功能 - 前端错误处理

## 📁 文件说明

- `errorHandler.js` - 可复用的错误处理工具函数
- `errorHandler.example.js` - 使用示例代码
- `README.md` - 本文档

## 🎯 功能特性

### 1. 自动错误处理
- ✅ 401错误: 显示"登录已过期",1.5秒后跳转登录页
- ✅ 403错误: 显示"无权访问此资源"
- ✅ 404错误: 显示"请求的资源不存在"
- ✅ 503错误: 显示"系统暂时不可用"
- ✅ 其他错误: 显示具体错误信息或通用提示

### 2. 灵活的错误展示方式
- **推荐**: 使用 `setError` 配合 MUI Alert 组件
- **可选**: 使用 `alert()` 弹窗 (快速测试)

### 3. 自动跳转
- 401错误自动跳转到登录页 (可配置路径和延迟)

## 📖 使用方法

### 方法1: 使用 handleApiError (推荐)

```javascript
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/custom/utils/errorHandler';
import { Alert } from '@mui/material';

function MyComponent() {
  const [error, setError] = useState('');
  const router = useRouter();

  async function fetchData() {
    const response = await fetch('/api/projects/123');
    const data = await handleApiError(response, { router, setError });

    if (data) {
      // 处理成功数据
      console.log(data);
    }
  }

  return (
    <div>
      {/* 显示错误 */}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {/* 其他内容 */}
    </div>
  );
}
```

### 方法2: 使用 checkAuthError (仅检查401/403)

```javascript
import { checkAuthError } from '@/lib/custom/utils/errorHandler';

async function fetchData() {
  const response = await fetch('/api/projects/123');
  const success = await checkAuthError(response);

  if (!success) {
    console.log('认证失败');
    return;
  }

  const data = await response.json();
  // 处理数据...
}
```

### 方法3: 自定义配置

```javascript
const data = await handleApiError(response, {
  router,              // Next.js路由对象
  setError,            // 设置错误状态的函数
  showAlert: false,    // 是否使用alert弹窗 (默认false)
  loginPath: '/admin/login',  // 登录页路径 (默认/admin/login)
  redirectDelay: 1500  // 跳转延迟(ms) (默认1500)
});
```

## 🔧 API参考

### handleApiError(response, options)

处理API响应错误,提供友好的错误提示和自动跳转。

**参数**:
- `response` (Response): fetch响应对象
- `options` (Object): 配置选项
  - `router` (Object): Next.js路由对象 (可选)
  - `setError` (Function): 设置错误状态的函数 (可选)
  - `showAlert` (boolean): 是否使用alert弹窗 (默认false)
  - `loginPath` (string): 登录页路径 (默认'/admin/login')
  - `redirectDelay` (number): 跳转延迟(ms) (默认1500)

**返回值**: Promise<Object|null>
- 成功: 返回JSON数据
- 错误: 返回null (错误信息已通过setError或alert显示)

### checkAuthError(response)

简化版错误处理,仅检查401/403错误并返回布尔值。

**参数**:
- `response` (Response): fetch响应对象

**返回值**: Promise<boolean>
- `true`: 请求成功
- `false`: 401或403错误

### getFriendlyErrorMessage(statusCode, defaultMessage)

获取友好的错误提示文本。

**参数**:
- `statusCode` (number): HTTP状态码
- `defaultMessage` (string): 默认错误信息 (可选)

**返回值**: string - 友好的错误提示

## 🌟 实际应用示例

### 示例1: 项目列表组件

参考: `app/projects/[projectId]/layout.js`

```javascript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);

    // 获取项目列表
    const projectsResponse = await fetch(`/api/projects`);
    const projectsData = await handleApiError(projectsResponse, { router, setError });
    if (!projectsData) return; // 错误时handleApiError已处理
    setProjects(projectsData);

    // 获取当前项目
    const projectResponse = await fetch(`/api/projects/${projectId}`);
    const projectData = await handleApiError(projectResponse, { router, setError });
    if (!projectData) return;
    setCurrentProject(projectData);
  } catch (error) {
    setError(error.message || '加载失败');
  } finally {
    setLoading(false);
  }
};
```

### 示例2: 错误显示UI

```javascript
if (error) {
  return (
    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
      <Typography variant="body1" fontWeight="600">
        {error}
      </Typography>
    </Alert>
  );
}
```

## 🚨 全局错误边界

文件: `app/error.js`

全局错误边界捕获React组件渲染错误,显示友好的错误页面。

**注意**:
- ✅ 捕获React组件错误 (如渲染错误、生命周期错误)
- ❌ 不捕获fetch API错误 (需使用 errorHandler.js)

**功能**:
- 显示错误图标和错误信息
- 提供"重新加载"和"返回首页"按钮
- 开发环境显示错误堆栈,生产环境隐藏

## 📝 错误类型处理说明

| 状态码 | 含义 | 错误提示 | 自动跳转 |
|-------|------|---------|---------|
| 401 | 未授权 (Token无效或已过期) | "登录已过期,请重新登录" | ✅ 是 (1.5秒后) |
| 403 | 禁止访问 (无权限) | "无权访问此资源" | ❌ 否 |
| 404 | 资源不存在 | "请求的资源不存在" | ❌ 否 |
| 503 | 服务不可用 (如Keycloak不可用) | "系统暂时不可用,请稍后重试" | ❌ 否 |
| 其他 | 其他错误 | 根据响应返回的error字段 | ❌ 否 |

## ⚠️ 注意事项

1. **推荐使用setError**: 比alert弹窗更友好,用户体验更好
2. **401自动跳转**: 默认1.5秒后跳转,给用户时间看到错误提示
3. **全局错误边界**: 仅捕获React错误,不捕获fetch错误
4. **错误信息来源**: 优先使用API返回的 `error` 字段,其次使用预定义的友好提示
5. **日志记录**: 所有错误都会在控制台输出,便于调试

## 🔗 相关文档

- [TASK-012任务卡片](../../../docs/requirements/REQ-004-Keycloak鉴权功能/tasks/TASK-012-前端错误处理.md)
- [REQ-004需求文档](../../../docs/requirements/REQ-004-Keycloak鉴权功能/需求文档.md)
- [技术方案设计](../../../docs/requirements/REQ-004-Keycloak鉴权功能/技术方案设计.md)

---

**创建日期**: 2025-11-18
**维护者**: 执行Agent
**版本**: v1.0
