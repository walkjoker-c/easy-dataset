/**
 * Session管理模块
 * 封装iron-session库,提供Session操作工具函数
 *
 * 创建日期: 2025-11-17
 * 所属需求: REQ-004 Keycloak鉴权功能集成
 * 所属任务: TASK-004 Session管理模块开发
 *
 * 功能:
 * - getSession: 获取Session对象
 * - saveSession: 保存Session数据
 * - destroySession: 销毁Session (退出登录)
 */

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { authConfig } from '../config/auth.config.js';

/**
 * 获取Session对象
 * @returns {Promise<IronSession>} Session对象
 * @example
 * const session = await getSession();
 * console.log(session.isAdmin); // true/false
 */
export async function getSession() {
  try {
    const session = await getIronSession(await cookies(), {
      cookieName: authConfig.session.cookieName,
      password: authConfig.session.secret,
      cookieOptions: authConfig.session.cookieOptions,
    });

    return session;
  } catch (error) {
    console.error('[Session] Error getting session:', error);
    throw new Error(`Failed to get session: ${error.message}`);
  }
}

/**
 * 保存Session数据
 * @param {Object} data - 要保存的Session数据 (如 { isAdmin: true })
 * @returns {Promise<void>}
 * @example
 * await saveSession({ isAdmin: true, loginAt: Date.now() });
 */
export async function saveSession(data) {
  try {
    const session = await getSession();

    // 合并数据到Session
    Object.assign(session, data);

    // 保存Session (iron-session会自动加密并设置Cookie)
    await session.save();

    console.log('[Session] Session data saved:', Object.keys(data));
  } catch (error) {
    console.error('[Session] Error saving session:', error);
    throw new Error(`Failed to save session: ${error.message}`);
  }
}

/**
 * 销毁Session (退出登录)
 * @returns {Promise<void>}
 * @example
 * await destroySession();
 */
export async function destroySession() {
  try {
    const session = await getSession();

    // 销毁Session (清空Cookie)
    session.destroy();

    console.log('[Session] Session destroyed');
  } catch (error) {
    console.error('[Session] Error destroying session:', error);
    throw new Error(`Failed to destroy session: ${error.message}`);
  }
}
