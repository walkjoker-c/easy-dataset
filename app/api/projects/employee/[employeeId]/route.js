// CUSTOM: 员工项目自动创建API (迁移自1.4.0)
// 功能说明: 根据员工ID自动创建或重定向到对应项目
// 访问路径: /api/projects/employee/[employeeId]
// 业务场景: 数智员工通过employeeId快速创建训练项目
import { NextResponse } from 'next/server';
import { createProject, isExistByName, getProjects } from '@/lib/db/projects';
// CUSTOM: 导入模型配置相关 (批次3新增特性)
import { createInitModelConfig } from '@/lib/db/model-config';
import { MODEL_PROVIDERS, DEFAULT_PROJECT_MODEL_PROVIDER_ID } from '@/constant/model';
import { nanoid } from 'nanoid';

export async function GET(request, { params }) {
  try {
    const { employeeId } = params;

    if (!employeeId) {
      return NextResponse.json({ error: '员工ID不能为空' }, { status: 400 });
    }

    console.log(`处理员工ID: ${employeeId} 的项目请求`);

    // 检查是否已存在以该员工ID命名的项目
    const existingProject = await isExistByName(employeeId);

    if (existingProject) {
      // 如果项目已存在，查找项目ID
      const projects = await getProjects();
      const project = projects.find(p => p.name === employeeId);

      if (project) {
        console.log(`找到已存在的项目: ${project.id}`);
        // 重定向到现有项目的text-split页面
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const baseUrl = `${protocol}://${host}`;
        return NextResponse.redirect(new URL(`/projects/${project.id}/text-split`, baseUrl));
      }
    }

    // 创建新项目
    console.log(`创建新项目: ${employeeId}`);
    const newProject = await createProject({
      name: employeeId,
      description: `数智员工 ${employeeId} 的训练项目`
    });

    console.log(`新项目创建成功: ${newProject.id}`);

    // CUSTOM: 创建默认模型配置 (批次3新增特性)
    // 员工API创建的项目也应该有默认模型配置
    const defaultProvider = MODEL_PROVIDERS.find(p => p.id === DEFAULT_PROJECT_MODEL_PROVIDER_ID);
    if (defaultProvider) {
      const defaultModelConfig = {
        id: nanoid(12),
        projectId: newProject.id,
        providerId: defaultProvider.id,
        providerName: defaultProvider.name,
        endpoint: defaultProvider.defaultEndpoint,
        apiKey: defaultProvider.defaultApiKey || '',
        modelId: defaultProvider.defaultModels[0] || '',
        modelName: defaultProvider.defaultModels[0] || '',
        type: 'text',
        temperature: defaultProvider.defaultTemperature || 0.7,
        maxTokens: defaultProvider.defaultMaxTokens || 16384,
        topP: 1,
        topK: 0,
        status: 1
      };
      await createInitModelConfig([defaultModelConfig]);
      console.log(`为项目 ${newProject.id} 创建了默认模型配置`);
    }

    // 重定向到新项目的text-split页面
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;
    return NextResponse.redirect(new URL(`/projects/${newProject.id}/text-split`, baseUrl));

  } catch (error) {
    console.error('处理员工ID项目请求失败:', String(error));
    return NextResponse.json({
      error: '处理请求失败',
      details: String(error)
    }, { status: 500 });
  }
}
