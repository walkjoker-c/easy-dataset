import { createProject, getProjects, isExistByName, updateProject } from '@/lib/db/projects';
import { createInitModelConfig, getModelConfigByProjectId } from '@/lib/db/model-config';
// CUSTOM: 导入默认模型配置 (修复批次3测试问题1-正确版)
import { MODEL_PROVIDERS, DEFAULT_PROJECT_MODEL_PROVIDER_ID } from '@/constant/model';
import { nanoid } from 'nanoid';

export async function POST(request) {
  try {
    const projectData = await request.json();
    // 验证必要的字段
    if (!projectData.name) {
      return Response.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    // 验证项目名称是否已存在
    if (await isExistByName(projectData.name)) {
      return Response.json({ error: '项目名称已存在' }, { status: 400 });
    }
    // 创建项目
    const newProject = await createProject(projectData);
    // 如果指定了要复用的项目配置
    if (projectData.reuseConfigFrom) {
      let data = await getModelConfigByProjectId(projectData.reuseConfigFrom);

      let newData = data.map(item => {
        delete item.id;
        return {
          ...item,
          projectId: newProject.id
        };
      });
      const createdConfigs = await createInitModelConfig(newData);

      // CUSTOM: 设置默认模型配置ID (修复GA生成"No active model"错误)
      // 将第一个创建的模型配置设为项目默认配置
      if (createdConfigs && createdConfigs.length > 0) {
        newProject.defaultModelConfigId = createdConfigs[0].id;
        await updateProject(newProject.id, newProject);
      }
      // END CUSTOM
    } else {
      // CUSTOM: 创建默认模型配置 (修复批次3测试问题1-正确版)
      // 如果没有复用配置,则创建默认的openai-custom模型配置
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

        // CUSTOM: 设置默认模型配置ID (修复GA生成"No active model"错误)
        // 将创建的模型配置设为项目默认配置
        newProject.defaultModelConfigId = defaultModelConfig.id;
        await updateProject(newProject.id, newProject);
        // END CUSTOM
      }
    }
    return Response.json(newProject, { status: 201 });
  } catch (error) {
    console.error('创建项目出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // 获取所有项目
    const projects = await getProjects();
    return Response.json(projects);
  } catch (error) {
    console.error('获取项目列表出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
