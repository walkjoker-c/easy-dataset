import { createProject, getProjects, isExistByName, updateProject } from '@/lib/db/projects';
import { createInitModelConfig, getModelConfigByProjectId } from '@/lib/db/model-config';
// CUSTOM: 导入默认模型配置 (修复批次3测试问题1-正确版)
import { MODEL_PROVIDERS, DEFAULT_PROJECT_MODEL_PROVIDER_ID } from '@/constant/model';
import { nanoid } from 'nanoid';
// ========== CUSTOM START ==========
// 定制说明: 修复全新环境模型列表为空问题 - 预填充默认模型列表和Provider
// 修改日期: 2025-11-26 | 修改人: @amx
import { createLlmModels, getLlmModelsByProviderId } from '@/lib/db/llm-models';
import { db } from '@/lib/db/index';
// ========== CUSTOM END ==========
// ========== CUSTOM START ==========
// ISS-006: 导入Session管理 - 支持super_user项目过滤
// 修改日期: 2025-11-18
import { getSession } from '@/lib/custom/auth/session';
// ========== CUSTOM END ==========

export async function POST(request) {
  try {
    // ========== CUSTOM START ==========
    // ISS-006: Super User不能创建项目
    // 定制说明: super_user仅有查看权限,不允许创建项目
    // 修改日期: 2025-11-18

    const session = await getSession();

    // 检查是否是super_user,如果是则拒绝创建
    if (session?.isSuperUser === true) {
      console.warn('[Projects API POST] Super user tried to create project, rejected');
      return Response.json(
        { error: '审核员没有权限创建项目' },
        { status: 403 }
      );
    }
    // ========== CUSTOM END ==========

    const projectData = await request.json();
    // 验证必要的字段
    if (!projectData.name) {
      return Response.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    // ========== CUSTOM START ==========
    // 修改日期: 2025-11-08 | 需求: REQ-002
    // 变更说明: 移除name唯一性检查,允许不同项目使用相同名称
    // 原因: name字段职责变更为展示用途,不再用于映射外部系统
    //       外部系统映射改用externalId字段,因此name可以重复

    // 旧逻辑 (已删除):
    // if (await isExistByName(projectData.name)) {
    //   return Response.json({ error: '项目名称已存在' }, { status: 400 });
    // }

    // 新逻辑: 不再检查name重复
    // ========== CUSTOM END ==========

    // ========== CUSTOM START ==========
    // ISS-006: admin创建项目时设置createdByUserId
    // 定制说明: admin通过UI创建的项目需要标记为admin所有,用于权限控制
    // 修改日期: 2025-11-18

    // 如果是admin登录,设置createdByUserId为'admin'
    if (session?.isAdmin === true) {
      projectData.createdByUserId = 'admin';
      console.log('[Projects API POST] Admin creating project, set createdByUserId=admin');
    }
    // ========== CUSTOM END ==========

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

        // ========== CUSTOM START ==========
        // 定制说明: 预填充默认Provider和模型列表
        // 问题: 全新环境下,LlmProviders和llmModels表为空,导致前端models列表为null,用户必须手动点击刷新
        // 解决: 创建ModelConfig时,先创建Provider记录,再预填充defaultModels到数据库
        // 修改日期: 2025-11-26 | 修改人: @amx
        try {
          // Step 1: 检查并创建 LlmProvider 记录 (外键依赖)
          const existingProvider = await db.llmProviders.findUnique({
            where: { id: defaultProvider.id }
          });

          if (!existingProvider) {
            await db.llmProviders.create({
              data: {
                id: defaultProvider.id,
                name: defaultProvider.name,
                apiUrl: defaultProvider.defaultEndpoint
              }
            });
            console.log(`[Projects API POST] Created LlmProvider: ${defaultProvider.id}`);
          }

          // Step 2: 检查并创建默认模型列表
          const existingModels = await getLlmModelsByProviderId(defaultProvider.id);

          if (!existingModels || existingModels.length === 0) {
            const defaultModels = defaultProvider.defaultModels
              .filter(modelName => modelName) // 过滤空值
              .map(modelName => ({
                id: nanoid(12),
                providerId: defaultProvider.id,
                modelId: modelName,
                modelName: modelName
                // 注意: LlmModels表只有id, modelId, modelName, providerId, createAt, updateAt字段
                // 没有status字段, createAt/updateAt由数据库自动生成
              }));

            if (defaultModels.length > 0) {
              await createLlmModels(defaultModels);
              console.log(`[Projects API POST] Initialized ${defaultModels.length} default models for provider ${defaultProvider.id}`);
            }
          }
        } catch (modelError) {
          // 不阻塞项目创建,仅记录错误
          console.error('[Projects API POST] Failed to initialize default models:', modelError);
        }
        // ========== CUSTOM END ==========
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
    // ========== CUSTOM START ==========
    // ISS-006: super_user项目过滤
    // 定制说明: super_user仅能查看管理员创建的项目
    // 修改日期: 2025-11-18

    // 获取Session
    const session = await getSession();

    // 获取所有项目
    let projects = await getProjects();

    // 如果是super_user,仅返回管理员创建的项目
    if (session?.isSuperUser === true) {
      projects = projects.filter(project => project.createdByUserId === 'admin');
      console.log(`[Projects API GET] Super user filtered ${projects.length} admin projects`);
    } else if (session?.isAdmin === true) {
      console.log(`[Projects API GET] Admin accessing all ${projects.length} projects`);
    } else {
      console.log(`[Projects API GET] Guest/JWT user accessing all ${projects.length} projects`);
    }
    // ========== CUSTOM END ==========

    return Response.json(projects);
  } catch (error) {
    console.error('获取项目列表出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
