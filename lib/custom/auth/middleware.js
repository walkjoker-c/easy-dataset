/**
 * 三步验证中间件
 * 协调Session管理、Keycloak验证、Token缓存等模块,执行完整的鉴权流程
 *
 * 创建日期: 2025-11-17
 * 所属需求: REQ-004 Keycloak鉴权功能集成
 * 所属任务: TASK-007 三步验证中间件开发
 *
 * 核心逻辑:
 * 步骤1: 管理员Session验证 - 检查是否是管理员,如果是则直接通过,bypass后续步骤
 * 步骤2: Token合法性验证 - 从Cookie提取Token,调用introspect验证,使用缓存优化性能
 * 步骤3: 权限验证 - 比对 createdByUserId 和 Token 的 sub 字段,验证是否有权访问
 */

import { createHash } from 'crypto';
import { introspectToken } from './keycloak.js';
import { getSession } from './session.js';
import { getCachedToken, setCachedToken } from './cache.js';
import { db } from '@/lib/db/index';

/**
 * AuthResult类型定义
 * @typedef {Object} AuthResult
 * @property {boolean} authorized - 是否授权通过
 * @property {string|null} userId - 用户ID (授权通过时返回)
 * @property {number|null} status - HTTP状态码 (授权失败时返回: 401/403/404/503)
 * @property {string|null} error - 错误信息 (授权失败时返回)
 * @property {boolean} [bypass] - 是否bypass后续验证 (管理员Session时为true)
 */

/**
 * 三步验证中间件
 * @param {Request} req - Next.js请求对象 (App Router)
 * @param {string|null} projectId - 项目ID (可选,用于权限验证)
 * @returns {Promise<AuthResult>}
 * @example
 * // 场景1: 项目API鉴权 (需要权限验证)
 * const authResult = await authMiddleware(req, projectId);
 * if (!authResult.authorized) {
 *   return NextResponse.json({ error: authResult.error }, { status: authResult.status });
 * }
 *
 * // 场景2: 员工API鉴权 (无需权限验证)
 * const authResult = await authMiddleware(req, null);
 * if (!authResult.authorized) {
 *   return NextResponse.json({ error: authResult.error }, { status: authResult.status });
 * }
 */
export async function authMiddleware(req, projectId = null) {
  const startTime = Date.now();

  // ========== 步骤1: 管理员Session验证 ==========
  try {
    const session = await getSession(req);
    if (session?.isAdmin === true) {
      const duration = Date.now() - startTime;
      console.log(`[Auth Middleware] ✓ Admin session detected, bypassing token verification (${duration}ms)`);
      return {
        authorized: true,
        userId: 'admin',
        role: 'admin',
        status: null,
        error: null,
        bypass: true,
      };
    }

    // ========== CUSTOM START ==========
    // ISS-006: Super User Session验证
    // 定制说明: 检查super_user Session,根据项目类型决定是否允许访问
    // 修改日期: 2025-11-18
    if (session?.isSuperUser === true) {
      // 如果有projectId,需要检查项目类型
      if (projectId) {
        const project = await db.projects.findUnique({
          where: { id: projectId },
          select: { createdByUserId: true, externalId: true },
        });

        if (!project) {
          return {
            authorized: false,
            userId: null,
            status: 404,
            error: '项目不存在',
          };
        }

        // 公司项目 (有externalId) - super_user不能访问
        if (project.externalId) {
          console.warn(
            `[Auth Middleware] ✗ Super user tried to access company project: ${projectId}`
          );
          return {
            authorized: false,
            userId: null,
            status: 403,
            error: '审核员仅能访问管理员创建的项目',
          };
        }

        // 管理员项目 - super_user可以访问
        if (project.createdByUserId === 'admin') {
          const duration = Date.now() - startTime;
          console.log(
            `[Auth Middleware] ✓ Super user accessing admin project: ${projectId} (${duration}ms)`
          );
          return {
            authorized: true,
            userId: 'super_user',
            role: 'super_user',
            status: null,
            error: null,
            bypass: false,
          };
        }

        // 其他项目 - super_user不能访问
        console.warn(
          `[Auth Middleware] ✗ Super user tried to access non-admin project: ${projectId}`
        );
        return {
          authorized: false,
          userId: null,
          status: 403,
          error: '您无权访问此项目',
        };
      }

      // 没有projectId (访问首页等) - 允许
      const duration = Date.now() - startTime;
      console.log(`[Auth Middleware] ✓ Super user session detected (${duration}ms)`);
      return {
        authorized: true,
        userId: 'super_user',
        role: 'super_user',
        status: null,
        error: null,
        bypass: false,
      };
    }
    // ========== CUSTOM END ==========
  } catch (error) {
    // Session获取失败不影响后续验证流程 (可能是普通用户无Session)
    console.warn('[Auth Middleware] Failed to get session, continuing with token verification');
  }

  // ========== 步骤2: Token合法性验证 ==========
  // 2.1 从Cookie提取Token
  const token = req.cookies.get('Authorization')?.value;
  if (!token) {
    console.warn('[Auth Middleware] ✗ No token found in Cookie');

    // ========== CUSTOM START ==========
    // ISS-006: 未登录用户访问管理员项目时,返回特殊错误提示super_user登录
    // 定制说明: 检查是否是管理员项目,如果是则返回带登录提示的错误消息
    // 修改日期: 2025-11-18
    if (projectId) {
      try {
        const project = await db.projects.findUnique({
          where: { id: projectId },
          select: { createdByUserId: true },
        });

        // 如果是管理员项目,返回特殊错误消息
        if (project?.createdByUserId === 'admin') {
          console.warn('[Auth Middleware] ✗ Unauthenticated user accessing admin project');
          return {
            authorized: false,
            userId: null,
            status: 401,
            error: '此项目仅管理员和审核员可访问',
          };
        }
      } catch (error) {
        console.warn('[Auth Middleware] Failed to check project type, returning generic error');
      }
    }
    // ========== CUSTOM END ==========

    return {
      authorized: false,
      userId: null,
      status: 401,
      error: '未授权访问,请重新登录',
    };
  }

  // 2.2 计算Token哈希 (用于缓存Key)
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const tokenPrefix = tokenHash.substring(0, 8);

  // 2.3 检查缓存
  const cached = getCachedToken(tokenHash);
  let userId;
  let cacheHit = false;

  if (cached) {
    // 缓存命中,直接使用缓存结果
    userId = cached.userId;
    cacheHit = true;
    console.log(`[Auth Middleware] ✓ Token cache hit for ${tokenPrefix}...`);
  } else {
    // 2.4 缓存未命中,调用Keycloak introspect
    console.log(`[Auth Middleware] ✗ Token cache miss for ${tokenPrefix}..., calling Keycloak introspect`);

    try {
      const introspectResult = await introspectToken(token);

      // 检查Token是否有效
      if (!introspectResult.active) {
        console.warn(`[Auth Middleware] ✗ Token is not active: ${tokenPrefix}...`);
        return {
          authorized: false,
          userId: null,
          status: 401,
          error: 'Token无效或已过期,请重新登录',
        };
      }

      // 提取用户ID
      userId = introspectResult.sub;

      // 2.5 缓存结果
      const now = Math.floor(Date.now() / 1000); // 当前时间戳 (秒)
      const ttl = Math.min((introspectResult.exp - now), 30 * 60); // 最长30分钟

      if (ttl > 0) {
        setCachedToken(tokenHash, {
          userId: userId,
          exp: introspectResult.exp,
          cachedAt: Date.now(),
        }, ttl);
        console.log(`[Auth Middleware] ✓ Token cached for ${ttl}s (user: ${userId})`);
      } else {
        console.warn(`[Auth Middleware] ⚠ Token will expire soon (ttl: ${ttl}s), not caching`);
      }

    } catch (error) {
      // Keycloak introspect调用失败
      console.error('[Auth Middleware] ✗ Keycloak introspect failed:', error.message);
      return {
        authorized: false,
        userId: null,
        status: 503,
        error: '鉴权服务不可用,请稍后重试',
      };
    }
  }

  // ========== 步骤3: 权限验证 ==========
  if (!projectId) {
    // 无需权限验证 (如创建项目API、员工API)
    const duration = Date.now() - startTime;
    console.log(
      `[Auth Middleware] ✓ Token verified (user: ${userId}), ` +
      `no permission check required (${duration}ms, cache hit: ${cacheHit ? 'yes' : 'no'})`
    );
    return {
      authorized: true,
      userId,
      status: null,
      error: null,
    };
  }

  // 3.1 查询项目创建者
  try {
    const project = await db.projects.findUnique({
      where: { id: projectId },
      select: { createdByUserId: true },
    });

    if (!project) {
      console.warn(`[Auth Middleware] ✗ Project not found: ${projectId}`);
      return {
        authorized: false,
        userId: null,
        status: 404,
        error: '项目不存在',
      };
    }

    // 3.2 权限判断
    const createdBy = project.createdByUserId;

    // 场景1: 现有项目 (createdByUserId = NULL) - 允许所有用户访问 (向后兼容)
    if (createdBy === null) {
      const duration = Date.now() - startTime;
      console.log(
        `[Auth Middleware] ✓ Legacy project (createdByUserId=NULL), access granted ` +
        `(user: ${userId}, ${duration}ms, cache hit: ${cacheHit ? 'yes' : 'no'})`
      );
      return {
        authorized: true,
        userId,
        status: null,
        error: null,
      };
    }

    // ========== CUSTOM START ==========
    // ISS-006: 管理员项目支持super_user访问
    // 定制说明: 管理员创建的项目允许super_user访问,但JWT Token用户不能访问
    // 修改日期: 2025-11-18

    // 场景2: 管理员专属项目 (createdByUserId = 'admin')
    if (createdBy === 'admin') {
      // JWT Token用户尝试访问管理员项目 - 拒绝
      console.warn(
        `[Auth Middleware] ✗ Admin-only project, user ${userId} tried to access project ${projectId}`
      );
      return {
        authorized: false,
        userId: null,
        status: 403,
        error: '此项目仅管理员和审核员可访问',
      };
    }
    // ========== CUSTOM END ==========

    // 场景3: 用户访问自己的项目
    if (createdBy === userId) {
      const duration = Date.now() - startTime;
      console.log(
        `[Auth Middleware] ✓ User accessing own project ` +
        `(user: ${userId}, project: ${projectId}, ${duration}ms, cache hit: ${cacheHit ? 'yes' : 'no'})`
      );
      return {
        authorized: true,
        userId,
        status: null,
        error: null,
      };
    }

    // 场景4: 用户尝试访问他人项目 - 拒绝访问
    console.warn(
      `[Auth Middleware] ✗ Permission denied: user ${userId} tried to access ` +
      `project ${projectId} owned by ${createdBy}`
    );
    return {
      authorized: false,
      userId: null,
      status: 403,
      error: '无权访问此项目',
    };

  } catch (error) {
    // 数据库查询失败
    console.error('[Auth Middleware] ✗ Database query failed:', error.message);
    return {
      authorized: false,
      userId: null,
      status: 503,
      error: '系统错误,请稍后重试',
    };
  }
}
