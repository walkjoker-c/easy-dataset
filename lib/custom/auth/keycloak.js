/**
 * Keycloak Token验证模块
 * 封装Keycloak introspect接口调用,验证Token合法性,提取用户信息
 *
 * 创建日期: 2025-11-17
 * 所属需求: REQ-004 Keycloak鉴权功能集成
 * 所属任务: TASK-006 Keycloak验证模块开发
 */

import { authConfig } from '../config/auth.config.js';

/**
 * 调用Keycloak introspect接口验证Token
 * @param {string} token - JWT Token字符串
 * @returns {Promise<Object>} - introspect响应对象
 *   - active: boolean - Token是否有效
 *   - sub: string - 用户ID (Keycloak UUID)
 *   - exp: number - Token过期时间戳 (秒)
 *   - iat: number - Token签发时间戳 (秒)
 *   - jti: string - Token唯一标识符
 *   - iss: string - Token签发者
 *   - aud: string[] - Token受众
 *   - preferred_username: string - 用户名
 *   - email: string - 用户邮箱
 *   - ... 其他Keycloak返回字段
 * @throws {Error} - 调用失败或超时时抛出错误
 *   - 'Keycloak introspect timeout' - 超时错误
 *   - 'Keycloak introspect failed: HTTP xxx' - HTTP错误
 *   - 网络错误或其他异常
 */
export async function introspectToken(token) {
  // 日志脱敏: 仅记录Token前8位
  const tokenPrefix = token.substring(0, 8);
  console.log(`[Keycloak] Introspecting token: ${tokenPrefix}...`);

  // 设置5秒超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(authConfig.keycloak.introspectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: token,
        client_id: authConfig.keycloak.clientId,
        client_secret: authConfig.keycloak.clientSecret,
      }),
      signal: controller.signal, // 支持超时中断
    });

    // 清除超时定时器
    clearTimeout(timeoutId);

    // 检查HTTP状态码
    if (!response.ok) {
      throw new Error(
        `Keycloak introspect failed: HTTP ${response.status} ${response.statusText}`
      );
    }

    // 解析响应JSON
    const data = await response.json();

    // 日志记录结果
    if (data.active) {
      console.log(
        `[Keycloak] Token is active, user: ${data.sub}, exp: ${data.exp}`
      );
    } else {
      console.warn(`[Keycloak] Token is not active: ${tokenPrefix}...`);
    }

    return data;
  } catch (error) {
    // 清除超时定时器
    clearTimeout(timeoutId);

    // 处理超时错误
    if (error.name === 'AbortError') {
      console.error('[Keycloak] Introspect timeout (5s)');
      throw new Error('Keycloak introspect timeout');
    }

    // 处理其他错误
    console.error('[Keycloak] Introspect error:', error.message);
    throw error;
  }
}
