// ========== CUSTOM START ==========
// CUSTOM: 管理员登录API - REQ-004
// 定制说明: REQ-004 Keycloak鉴权功能 - 管理员登录API
// 修改日期: 2025-11-18
// 功能: 管理员密码验证和Session设置
// ========== CUSTOM END ==========

import { NextResponse } from 'next/server';
import { saveSession } from '@/lib/custom/auth/session';

/**
 * 管理员登录API
 * POST /api/admin/login
 * @param {Request} req - Next.js请求对象
 * @returns {NextResponse} - JSON响应
 */
export async function POST(req) {
  try {
    // 解析请求体
    const { password } = await req.json();

    // 验证密码不为空
    if (!password) {
      return NextResponse.json(
        { error: '请输入密码' },
        { status: 400 }
      );
    }

    // 验证密码
    if (password === process.env.ADMIN_PASSWORD) {
      // 密码正确,设置管理员Session
      await saveSession({
        isAdmin: true,
        loginAt: Date.now(),
      });

      console.log('[Admin] Admin login successful');

      return NextResponse.json({
        success: true,
        message: '登录成功',
      });
    } else {
      // 密码错误
      console.warn('[Admin] Admin login failed: incorrect password');

      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[Admin] Login error:', error);

    return NextResponse.json(
      { error: '登录失败,请重试' },
      { status: 500 }
    );
  }
}
