// ========== CUSTOM START ==========
// 定制说明: 员工项目专用业务逻辑封装
// 修改日期: 2025-11-08 | 需求: REQ-002
// 功能: 通过externalId管理员工项目,支持自定义名称,自动生成友好名称
// 注意: 这是服务器端工具函数,不是React Server Actions,因此不使用'use server'
// ========== CUSTOM END ==========

import { db } from '@/lib/db/index';
import { createProject, updateProject } from '@/lib/db/projects';
import { createInitModelConfig } from '@/lib/db/model-config';
import { MODEL_PROVIDERS, DEFAULT_PROJECT_MODEL_PROVIDER_ID } from '@/constant/model';
import { nanoid } from 'nanoid';

/**
 * 通过外部系统ID查找项目
 * @param {string} externalId - 外部系统ID (如employeeId)
 * @returns {Promise<Project|null>}
 */
export async function getProjectByExternalId(externalId) {
  try {
    return await db.projects.findUnique({
      where: { externalId: externalId }
    });
  } catch (error) {
    console.error('Failed to get project by externalId:', error);
    return null;
  }
}

/**
 * 生成友好的项目名称
 * 格式: 员工项目-{后8位ID}-{日期YYYYMMDD}
 * @param {string} employeeId - 员工ID
 * @returns {string}
 * @example
 *   generateFriendlyProjectName("employee-123e4567-e89b-12d3-a456-426614174000")
 *   // => "员工项目-14174000-20251108"
 */
export function generateFriendlyProjectName(employeeId) {
  // 提取employeeId后8位(如果长度不足8位,则使用全部)
  const idSuffix = employeeId.slice(-8);

  // 生成日期时间戳 (YYYYMMDD)
  const timestamp = new Date()
    .toISOString()
    .slice(0, 10) // "2025-11-08"
    .replace(/-/g, ''); // "20251108"

  return `员工项目-${idSuffix}-${timestamp}`;
}

/**
 * 创建带外部ID的项目
 * @param {Object} data - 项目数据
 * @param {string} data.externalId - 外部系统ID (必需)
 * @param {string} [data.name] - 项目名称(可选,如不提供则自动生成)
 * @param {string} [data.description] - 项目描述(可选)
 * @returns {Promise<Project>}
 */
export async function createProjectWithExternalId(data) {
  const { externalId, name, description } = data;

  // 确定项目名称: 优先使用传入的name,否则自动生成
  const projectName = name || generateFriendlyProjectName(externalId);
  const projectDescription = description || `数智员工的训练项目`;

  // 创建项目 (先不设置externalId,因为createProject不支持该字段)
  const project = await createProject({
    name: projectName,
    description: projectDescription
  });

  // 更新项目,设置 externalId
  const updatedProject = await db.projects.update({
    where: { id: project.id },
    data: { externalId: externalId }
  });

  // 创建默认模型配置 (复用现有逻辑)
  const defaultProvider = MODEL_PROVIDERS.find(p => p.id === DEFAULT_PROJECT_MODEL_PROVIDER_ID);
  if (defaultProvider) {
    const defaultModelConfig = {
      id: nanoid(12),
      projectId: updatedProject.id,
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

    // 设置默认模型配置ID
    await updateProject(updatedProject.id, {
      defaultModelConfigId: defaultModelConfig.id
    });
  }

  return updatedProject;
}
