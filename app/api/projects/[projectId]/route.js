// 获取项目详情
import { deleteProject, getProject, updateProject, getTaskConfig } from '@/lib/db/projects';

// ========== CUSTOM START ==========
// 定制说明: REQ-004 Keycloak鉴权功能 - 导入鉴权中间件
// 修改日期: 2025-11-18
// 变更说明: 集成authMiddleware实现项目访问权限验证
import { authMiddleware } from '@/lib/custom/auth/middleware';
// ========== CUSTOM END ==========

export async function GET(request, { params }) {
  // ========== CUSTOM START ==========
  // 定制说明: REQ-004 Keycloak鉴权功能 - 三步验证
  // 修改日期: 2025-11-18
  // 变更说明: 添加鉴权中间件验证用户权限,确保用户只能访问自己创建的项目
  const authResult = await authMiddleware(request, params.projectId);
  if (!authResult.authorized) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // ========== CUSTOM END ==========

  try {
    const { projectId } = params;
    const project = await getProject(projectId);
    const taskConfig = await getTaskConfig(projectId);
    if (!project) {
      return Response.json({ error: '项目不存在' }, { status: 404 });
    }
    return Response.json({ ...project, taskConfig });
  } catch (error) {
    console.error('获取项目详情出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// 更新项目
export async function PUT(request, { params }) {
  // ========== CUSTOM START ==========
  // 定制说明: REQ-004 Keycloak鉴权功能 - 三步验证
  // 修改日期: 2025-11-18
  // 变更说明: 添加鉴权中间件验证用户权限,确保用户只能更新自己创建的项目
  const authResult = await authMiddleware(request, params.projectId);
  if (!authResult.authorized) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // ========== CUSTOM END ==========

  try {
    const { projectId } = params;
    const projectData = await request.json();

    // 验证必要的字段
    if (!projectData.name && !projectData.defaultModelConfigId) {
      return Response.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    const updatedProject = await updateProject(projectId, projectData);

    if (!updatedProject) {
      return Response.json({ error: '项目不存在' }, { status: 404 });
    }

    return Response.json(updatedProject);
  } catch (error) {
    console.error('更新项目出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// 删除项目
export async function DELETE(request, { params }) {
  // ========== CUSTOM START ==========
  // 定制说明: REQ-004 Keycloak鉴权功能 - 三步验证
  // 修改日期: 2025-11-18
  // 变更说明: 添加鉴权中间件验证用户权限,确保用户只能删除自己创建的项目
  const authResult = await authMiddleware(request, params.projectId);
  if (!authResult.authorized) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // ========== CUSTOM END ==========

  try {
    const { projectId } = params;
    const success = await deleteProject(projectId);

    if (!success) {
      return Response.json({ error: '项目不存在' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('删除项目出错:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
