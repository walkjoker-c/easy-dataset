// ========== CUSTOM START ==========
// 定制说明: 员工项目自动创建API (迁移自1.4.0,REQ-002优化)
// 功能说明: 根据员工ID自动创建或重定向到对应项目
// 访问路径: /api/projects/employee/[employeeId]
// 业务场景: 数智员工通过employeeId快速创建训练项目
// 修改日期: 2025-11-08 | 需求: REQ-002
// 新增功能: 支持GET/POST双接口,支持自定义name参数,支持更新已存在项目名称
// ========== CUSTOM END ==========

import { NextResponse } from 'next/server';
import { updateProject } from '@/lib/db/projects';

// ========== CUSTOM START ==========
// 修改日期: 2025-11-08 | 需求: REQ-002
// 变更说明: 导入自定义员工项目业务逻辑函数
import {
  getProjectByExternalId,
  createProjectWithExternalId
} from '@/lib/custom/employee-project';
// ========== CUSTOM END ==========

/**
 * GET方法: 员工API访问端点 (兼容性)
 * 支持查询参数: ?name=xxx&description=xxx
 */
export async function GET(request, { params }) {
  try {
    const { employeeId } = params;

    if (!employeeId) {
      return NextResponse.json({ error: '员工ID不能为空' }, { status: 400 });
    }

    // ========== CUSTOM START ==========
    // 修改日期: 2025-11-08 | 需求: REQ-002
    // 变更说明: 提取查询参数,支持自定义name和description
    const { searchParams } = request.nextUrl;
    const customName = searchParams.get('name');
    const customDescription = searchParams.get('description');
    // ========== CUSTOM END ==========

    console.log(`处理员工ID: ${employeeId} 的项目请求 (GET)`);

    // ========== CUSTOM START ==========
    // 修改日期: 2025-11-08 | 需求: REQ-002
    // 变更说明: 改用 externalId 字段查找项目,替代原 name 字段

    // 旧逻辑 (删除):
    // const existingProject = await isExistByName(employeeId);

    // 新逻辑:
    const existingProject = await getProjectByExternalId(employeeId);
    // ========== CUSTOM END ==========

    if (existingProject) {
      console.log(`找到已存在的项目: ${existingProject.id}`);

      // ========== CUSTOM START ==========
      // 修改日期: 2025-11-08 | 需求: REQ-002
      // 新增功能: 如果传入了name参数,更新项目名称
      if (customName) {
        await updateProject(existingProject.id, { name: customName });
        console.log(`更新项目 ${existingProject.id} 名称为: ${customName}`);
      }
      if (customDescription) {
        await updateProject(existingProject.id, { description: customDescription });
        console.log(`更新项目 ${existingProject.id} 描述为: ${customDescription}`);
      }
      // ========== CUSTOM END ==========

      // 重定向到现有项目的text-split页面
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const baseUrl = `${protocol}://${host}`;
      return NextResponse.redirect(new URL(`/projects/${existingProject.id}/text-split`, baseUrl));
    }

    // ========== CUSTOM START ==========
    // 修改日期: 2025-11-08 | 需求: REQ-002
    // 变更说明: 使用自定义函数创建项目,支持name参数和externalId

    // 旧逻辑 (删除):
    // const newProject = await createProject({
    //   name: employeeId,
    //   description: `数智员工 ${employeeId} 的训练项目`
    // });
    // ... 创建默认模型配置 ...

    // 新逻辑:
    console.log(`创建新项目: ${employeeId}`);
    const newProject = await createProjectWithExternalId({
      externalId: employeeId,
      name: customName, // 如果传入了name,使用自定义名称;否则自动生成
      description: customDescription || `数智员工的训练项目`
    });
    console.log(`新项目创建成功: ${newProject.id}, externalId: ${employeeId}`);
    // ========== CUSTOM END ==========

    // 重定向到新项目的text-split页面
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;
    return NextResponse.redirect(new URL(`/projects/${newProject.id}/text-split`, baseUrl));
  } catch (error) {
    console.error('处理员工ID项目请求失败(GET):', String(error));
    return NextResponse.json(
      {
        error: '处理请求失败',
        details: String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST方法: 员工API访问端点 (推荐,符合RESTful规范)
 * 支持JSON body: { name: "xxx", description: "xxx" }
 */
export async function POST(request, { params }) {
  try {
    const { employeeId } = params;

    if (!employeeId) {
      return NextResponse.json({ error: '员工ID不能为空' }, { status: 400 });
    }

    // ========== CUSTOM START ==========
    // 修改日期: 2025-11-08 | 需求: REQ-002
    // 新增功能: 解析JSON body,支持自定义name和description
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // body为空或解析失败,使用默认值
      body = {};
    }

    const customName = body.name;
    const customDescription = body.description;
    // ========== CUSTOM END ==========

    console.log(`处理员工ID: ${employeeId} 的项目请求 (POST)`);

    // 通过 externalId 查找项目
    const existingProject = await getProjectByExternalId(employeeId);

    if (existingProject) {
      console.log(`找到已存在的项目: ${existingProject.id}`);

      // 如果传入了name或description参数,更新项目
      if (customName) {
        await updateProject(existingProject.id, { name: customName });
        console.log(`更新项目 ${existingProject.id} 名称为: ${customName}`);
      }
      if (customDescription) {
        await updateProject(existingProject.id, { description: customDescription });
        console.log(`更新项目 ${existingProject.id} 描述为: ${customDescription}`);
      }

      // 重定向到现有项目的text-split页面
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const baseUrl = `${protocol}://${host}`;
      return NextResponse.redirect(new URL(`/projects/${existingProject.id}/text-split`, baseUrl));
    }

    // 创建新项目
    console.log(`创建新项目: ${employeeId}`);
    const newProject = await createProjectWithExternalId({
      externalId: employeeId,
      name: customName, // 如果传入了name,使用自定义名称;否则自动生成
      description: customDescription || `数智员工的训练项目`
    });
    console.log(`新项目创建成功: ${newProject.id}, externalId: ${employeeId}`);

    // 重定向到新项目的text-split页面
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;
    return NextResponse.redirect(new URL(`/projects/${newProject.id}/text-split`, baseUrl));
  } catch (error) {
    console.error('处理员工ID项目请求失败(POST):', String(error));
    return NextResponse.json(
      {
        error: '处理请求失败',
        details: String(error)
      },
      { status: 500 }
    );
  }
}
