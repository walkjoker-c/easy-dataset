// ========== CUSTOM START ==========
// 定制说明: ISS-006 SuperUser审核员角色 - 登录API
// 功能说明: 验证super_user密码并创建Session
// 访问路径: POST /api/super-user/login
// 修改日期: 2025-11-18
// ========== CUSTOM END ==========

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/custom/auth/session';

export async function POST(request) {
  try {
    const { password } = await request.json();

    // ========== CUSTOM START ==========
    // ISS-006: 验证super_user密码
    // 定制说明: 从环境变量读取密码
    // 修改日期: 2025-11-18

    if (!password) {
      return NextResponse.json(
        { error: '密码不能为空' },
        { status: 400 }
      );
    }

    // 验证密码
    const superUserPassword = process.env.SUPER_USER_PASSWORD;

    if (!superUserPassword) {
      console.error('[Super User Login] SUPER_USER_PASSWORD not set in environment');
      return NextResponse.json(
        { error: '系统配置错误,请联系管理员' },
        { status: 500 }
      );
    }

    if (password !== superUserPassword) {
      console.log('[Super User Login] Invalid password attempt');
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    // 创建Super User Session
    const session = await getSession();
    session.isSuperUser = true;
    session.userId = 'super_user';
    await session.save();

    console.log('[Super User Login] Session created successfully');

    return NextResponse.json({ success: true });
    // ========== CUSTOM END ==========

  } catch (error) {
    console.error('[Super User Login] Error:', error);
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    );
  }
}
