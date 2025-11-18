// ========== CUSTOM START ==========
// 定制说明: REQ-004 Keycloak鉴权功能 - 可复用错误处理工具
// 修改日期: 2025-11-18
// ========== CUSTOM END ==========

/**
 * 处理API响应错误,提供友好的错误提示和自动跳转
 * @param {Response} response - fetch响应对象
 * @param {Object} options - 选项
 *   - router: Next.js路由对象 (用于跳转,可选)
 *   - setError: 设置错误状态的函数 (可选)
 *   - showAlert: 是否显示alert弹窗 (默认false,推荐使用setError)
 *   - loginPath: 登录页面路径 (默认'/admin/login')
 *   - redirectDelay: 跳转延迟时间(ms) (默认1500)
 *   - allowLoginRedirect: 是否允许401错误时跳转到登录页 (默认true,ISS-002)
 * @returns {Promise<Object|null>} - 返回JSON数据或null(错误时)
 *
 * @example
 * // 使用示例1: 设置错误状态
 * const response = await fetch('/api/projects/123');
 * const data = await handleApiError(response, { router, setError });
 * if (data) {
 *   // 处理成功数据
 * }
 *
 * @example
 * // 使用示例2: 使用alert弹窗
 * const response = await fetch('/api/projects/123');
 * const data = await handleApiError(response, { router, showAlert: true });
 *
 * @example
 * // 使用示例3: 禁止跳转到登录页 (ISS-002安全优化)
 * const response = await fetch('/api/projects/123');
 * const data = await handleApiError(response, { router, setError, allowLoginRedirect: false });
 */
export async function handleApiError(response, options = {}) {
  const {
    router = null,
    setError = null,
    showAlert = false,
    loginPath = '/admin/login',
    redirectDelay = 1500,
    // ========== CUSTOM START ==========
    // ISS-002: 安全优化 - 允许控制401错误是否跳转到登录页
    // 定制说明: 添加allowLoginRedirect参数,默认true(向后兼容)
    // 修改日期: 2025-11-18
    allowLoginRedirect = true  // 默认true,保持原有行为
    // ========== CUSTOM END ==========
  } = options;

  // 如果响应成功,直接返回JSON数据
  if (response.ok) {
    try {
      return await response.json();
    } catch (error) {
      console.error('[ErrorHandler] Failed to parse JSON:', error);
      const errorMsg = '响应数据解析失败';
      displayError(errorMsg, setError, showAlert);
      return null;
    }
  }

  // ========== 错误处理 ==========

  // 尝试获取错误信息
  let errorData;
  try {
    errorData = await response.json();
  } catch (error) {
    errorData = { error: `HTTP ${response.status}` };
  }

  const errorMsg = errorData.error || errorData.message || `请求失败 (${response.status})`;

  // 401错误: 未授权 (Token无效或已过期)
  if (response.status === 401) {
    // ========== CUSTOM START ==========
    // ISS-002: 安全优化 - 区分场景处理401错误
    // 定制说明: 如果不允许跳转到登录页(如项目详情页),仅显示通用错误
    // 修改日期: 2025-11-18

    if (!allowLoginRedirect) {
      // 不允许跳转的场景: 显示通用错误,不暴露"需要登录"信息
      const msg = '无权访问此项目';
      console.log('[ErrorHandler] 401 Unauthorized, login redirect disabled');
      displayError(msg, setError, showAlert);
      return null;
    }
    // ========== CUSTOM END ==========

    // 允许跳转的场景: 显示登录提示并跳转到登录页
    const msg = errorMsg || '登录已过期,请重新登录';
    displayError(msg, setError, showAlert);

    // 延迟跳转到登录页 (给用户时间看到错误提示)
    if (router) {
      console.log(`[ErrorHandler] 401 Unauthorized, redirecting to ${loginPath} in ${redirectDelay}ms`);
      setTimeout(() => {
        router.push(loginPath);
      }, redirectDelay);
    }

    return null;
  }

  // 403错误: 禁止访问 (无权限)
  if (response.status === 403) {
    const msg = errorMsg || '无权访问此资源';
    console.warn('[ErrorHandler] 403 Forbidden:', msg);
    displayError(msg, setError, showAlert);
    return null;
  }

  // 404错误: 资源不存在
  if (response.status === 404) {
    const msg = errorMsg || '请求的资源不存在';
    console.warn('[ErrorHandler] 404 Not Found:', msg);
    displayError(msg, setError, showAlert);
    return null;
  }

  // 503错误: 系统错误 (如Keycloak服务不可用)
  if (response.status === 503) {
    const msg = errorMsg || '系统暂时不可用,请稍后重试';
    console.error('[ErrorHandler] 503 Service Unavailable:', msg);
    displayError(msg, setError, showAlert);
    return null;
  }

  // 其他错误
  console.error(`[ErrorHandler] HTTP ${response.status}:`, errorMsg);
  displayError(errorMsg, setError, showAlert);
  return null;
}

/**
 * 显示错误信息 (通过setError或alert)
 * @param {string} message - 错误信息
 * @param {Function|null} setError - 设置错误状态的函数
 * @param {boolean} showAlert - 是否显示alert弹窗
 */
function displayError(message, setError, showAlert) {
  if (setError && typeof setError === 'function') {
    setError(message);
  } else if (showAlert) {
    alert(message);
  } else {
    // 如果没有提供setError也没有showAlert,仅在控制台输出
    console.error('[ErrorHandler] Error:', message);
  }
}

/**
 * 简化版错误处理函数 - 仅用于检查401/403并返回布尔值
 * @param {Response} response - fetch响应对象
 * @returns {Promise<boolean>} - 是否成功 (true=成功, false=错误)
 *
 * @example
 * const response = await fetch('/api/projects/123');
 * const success = await checkAuthError(response);
 * if (!success) {
 *   console.log('请求失败');
 *   return;
 * }
 * const data = await response.json();
 */
export async function checkAuthError(response) {
  if (response.ok) {
    return true;
  }

  if (response.status === 401 || response.status === 403) {
    try {
      const data = await response.json();
      console.error(`[Auth Error] ${response.status}:`, data.error || 'Unauthorized');
    } catch (e) {
      console.error(`[Auth Error] ${response.status}`);
    }
    return false;
  }

  return response.ok;
}

/**
 * 获取友好的错误提示文本 (根据状态码)
 * @param {number} statusCode - HTTP状态码
 * @param {string} defaultMessage - 默认错误信息
 * @returns {string} - 友好的错误提示
 */
export function getFriendlyErrorMessage(statusCode, defaultMessage = '') {
  const errorMessages = {
    400: '请求参数错误',
    401: '登录已过期,请重新登录',
    403: '无权访问此资源',
    404: '请求的资源不存在',
    500: '服务器内部错误',
    503: '系统暂时不可用,请稍后重试'
  };

  return errorMessages[statusCode] || defaultMessage || `请求失败 (${statusCode})`;
}
