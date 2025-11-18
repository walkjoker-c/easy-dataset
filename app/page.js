// ========== CUSTOM START ==========
// CUSTOM: 页面级登录保护 - REQ-004 补充需求
// 定制说明: 根目录页面登录保护,未登录自动跳转到管理员登录页
// 修改日期: 2025-11-18
// 功能: 检查管理员Session,未登录重定向到/admin/login
// ========== CUSTOM END ==========

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/custom/auth/session';
import HomeClient from '@/components/home/HomeClient';

// 告诉Next.js此页面需要动态渲染(因为使用了cookies)
export const dynamic = 'force-dynamic';

/**
 * 项目列表页 - 服务端组件
 * 功能:
 * 1. 检查管理员Session
 * 2. 未登录时重定向到/admin/login
 * 3. 登录后渲染客户端组件
 */
export default async function Home() {
  // ========== CUSTOM: 登录检查逻辑 - REQ-004 补充需求 ==========
  // ========== ISS-006: 支持super_user访问 ==========
  // 检查Session (支持admin和super_user)
  const session = await getSession();

  // 如果未登录,重定向到登录页
  if (!session.isAdmin && !session.isSuperUser) {
    console.log('[Home Page] User not logged in, redirecting to /admin/login');
    redirect('/admin/login');
  }

  // 确定用户角色
  const role = session.isAdmin ? 'admin' : 'super_user';
  console.log(`[Home Page] User logged in as ${role}, rendering page`);
  // ========== CUSTOM END ==========

  // 渲染客户端组件,传递角色信息
  return <HomeClient role={role} />;
}
