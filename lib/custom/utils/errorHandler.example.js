// ========== CUSTOM START ==========
// 定制说明: REQ-004 Keycloak鉴权功能 - 错误处理工具使用示例
// 修改日期: 2025-11-18
// 文件说明: 本文件提供错误处理工具的使用示例,不会被实际执行
// ========== CUSTOM END ==========

/**
 * 示例1: 在React组件中使用 (推荐方式)
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/custom/utils/errorHandler';
import { Alert, Button } from '@mui/material';

function MyComponent() {
  const [error, setError] = useState('');
  const router = useRouter();

  async function fetchProject() {
    const response = await fetch('/api/projects/123');
    const data = await handleApiError(response, { router, setError });

    if (data) {
      // 处理成功数据
      console.log('项目数据:', data);
    }
    // 如果有错误,handleApiError已经设置了setError,组件会自动显示错误Alert
  }

  return (
    <div>
      {/* 显示错误提示 */}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Button onClick={fetchProject}>加载项目</Button>
    </div>
  );
}

/**
 * 示例2: 使用alert弹窗 (不推荐,但可用于快速测试)
 */
async function fetchWithAlert() {
  const router = { push: path => (window.location.href = path) }; // 简单router

  const response = await fetch('/api/projects/123');
  const data = await handleApiError(response, { router, showAlert: true });

  if (data) {
    console.log('数据:', data);
  }
}

/**
 * 示例3: 自定义登录页路径和跳转延迟
 */
async function fetchWithCustomOptions() {
  const response = await fetch('/api/projects/123');
  const data = await handleApiError(response, {
    router,
    setError,
    loginPath: '/custom-login', // 自定义登录页路径
    redirectDelay: 2000 // 2秒后跳转
  });
}

/**
 * 示例4: 仅检查401/403错误 (不处理其他错误)
 */
import { checkAuthError } from '@/lib/custom/utils/errorHandler';

async function simpleAuthCheck() {
  const response = await fetch('/api/projects/123');
  const success = await checkAuthError(response);

  if (!success) {
    console.log('认证失败,请检查登录状态');
    return;
  }

  const data = await response.json();
  console.log('数据:', data);
}

/**
 * 示例5: 获取友好错误信息
 */
import { getFriendlyErrorMessage } from '@/lib/custom/utils/errorHandler';

async function showFriendlyError() {
  const response = await fetch('/api/projects/123');

  if (!response.ok) {
    const message = getFriendlyErrorMessage(response.status, '请求失败');
    alert(message); // 如: "登录已过期,请重新登录" (401)
  }
}

/**
 * 示例6: 在项目layout中集成 (参考 app/projects/[projectId]/layout.js)
 */
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

/**
 * 注意事项:
 * 1. handleApiError会自动处理401/403/404/503等错误
 * 2. 401错误会在1.5秒后自动跳转到登录页(默认/admin/login)
 * 3. 错误信息通过setError设置后,组件中使用Alert显示
 * 4. 推荐使用setError而不是showAlert,UI更友好
 * 5. 全局错误边界(app/error.js)仅捕获React组件错误,不捕获fetch错误
 */
