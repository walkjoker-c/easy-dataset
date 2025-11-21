// ========== CUSTOM START ==========
// CUSTOM: 管理员退出API - REQ-004
// 定制说明: REQ-004 Keycloak鉴权功能 - 管理员退出API
// 修改日期: 2025-11-18
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
    await destroySession();

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
