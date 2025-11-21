// ========== CUSTOM START ==========
// 定制说明: ISS-006 SuperUser审核员角色 - 登出API
// 功能说明: 销毁super_user Session (复用admin登出逻辑)
// 访问路径: POST /api/super-user/logout
// 修改日期: 2025-11-18
// ========== CUSTOM END ==========

import { destroySession } from '@/lib/custom/auth/session';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 销毁Session (与admin共用逻辑)
    await destroySession();

    console.log('[Super User Logout] Session destroyed successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Super User Logout] Error:', error);
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    );
  }
}
