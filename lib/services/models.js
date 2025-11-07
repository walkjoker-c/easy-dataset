import { getModelConfigById, getModelConfigByProjectId } from '@/lib/db/model-config';
import { getProject } from '@/lib/db/projects';
import logger from '@/lib/util/logger';

/**
 * Get the active model configuration for a project
 * @param {string} projectId - Optional project ID to get the default model for
 * @returns {Promise<Object|null>} - Active model configuration or null
 */
export async function getActiveModel(projectId = null) {
  try {
    // If projectId is provided, get the default model for that project
    if (projectId) {
      const project = await getProject(projectId);
      if (project && project.defaultModelConfigId) {
        const modelConfig = await getModelConfigById(project.defaultModelConfigId);
        if (modelConfig) {
          logger.info(`Using default model for project ${projectId}: ${modelConfig.modelName}`);
          return modelConfig;
        }
      }

      // CUSTOM: 防御性fallback - 如果defaultModelConfigId未设置,尝试查找第一个活跃模型
      // 用途: 兼容旧项目和修复期间创建的项目
      if (project && !project.defaultModelConfigId) {
        logger.warn(`Project ${projectId} has no defaultModelConfigId, attempting fallback`);
        const projectModels = await getModelConfigByProjectId(projectId);
        if (projectModels && projectModels.length > 0) {
          // 优先查找状态为active(1)的模型
          const activeModel = projectModels.find(m => m.status === 1);
          if (activeModel) {
            logger.info(`Using fallback active model for project ${projectId}: ${activeModel.modelName}`);
            return activeModel;
          }
          // 如果没有active模型,使用第一个模型
          logger.info(`Using fallback first model for project ${projectId}: ${projectModels[0].modelName}`);
          return projectModels[0];
        }
      }
      // END CUSTOM
    }

    // If no specific project model found, try to get from localStorage context
    // This is a fallback for when the function is called without context
    logger.warn('No active model found');
    return null;
  } catch (error) {
    logger.error('Failed to get active model:', error);
    return null;
  }
}

/**
 * Get active model by ID
 * @param {string} modelConfigId - Model configuration ID
 * @returns {Promise<Object|null>} - Model configuration or null
 */
export async function getModelById(modelConfigId) {
  try {
    if (!modelConfigId) {
      logger.warn('No model ID provided');
      return null;
    }

    const modelConfig = await getModelConfigById(modelConfigId);
    if (modelConfig) {
      logger.info(`Retrieved model: ${modelConfig.modelName}`);
      return modelConfig;
    }

    logger.warn(`Model not found with ID: ${modelConfigId}`);
    return null;
  } catch (error) {
    logger.error('Failed to get model by ID:', error);
    return null;
  }
}
