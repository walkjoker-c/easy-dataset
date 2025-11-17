// ========== CUSTOM START ==========
// CUSTOM: 管理员Session验证API - 测试工具
// 定制说明: 用于测试Session是否有效
// 修改日期: 2025-11-18
// 功能: 检查当前Session的管理员状态
// ========== CUSTOM END ==========

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/custom/auth/session';

/**
 * 管理员Session验证API (仅用于测试)
 * GET /api/admin/check
 * @returns {NextResponse} - JSON响应包含isAdmin状态
 */
export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      isAdmin: session.isAdmin === true,
      loginAt: session.loginAt || null,
    });
  } catch (error) {
    console.error('[Admin Check] Error:', error);

    return NextResponse.json(
      { error: '检查Session失败' },
      { status: 500 }
    );
  }
}
