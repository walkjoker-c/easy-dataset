// ========== CUSTOM FILE ==========
// 文件说明: 问题生成服务增强版,兼容多格式LLM输出,避免数据丢失
// 创建日期: 2025-01-XX | 创建人: @amx
// 关联需求: 修复 LLM 输出格式异常导致的数据丢失问题
// 基于文件: lib/services/questions/index.js
// 主要改进:
//   1. 使用增强版 extractJsonFromLLMOutput (支持多格式)
//   2. randomRemoveQuestionMark 兼容字符串和对象数组
//   3. 增加详细的错误日志
// ========== CUSTOM FILE ==========

import LLMClient from '@/lib/llm/core/index';
import { getQuestionPrompt } from '@/lib/llm/prompts/question';
import { getAddLabelPrompt } from '@/lib/llm/prompts/addLabel';
// ========== CUSTOM CHANGE ==========
// 修改说明: 使用增强版 util-enhanced.js 替代原 util.js
// 修改日期: 2025-01-XX | 修改人: @amx
import { extractJsonFromLLMOutput } from '@/lib/llm/common/util-enhanced';
// ========== CUSTOM CHANGE END ==========
import { getTaskConfig, getProject } from '@/lib/db/projects';
import { getTags } from '@/lib/db/tags';
import { getChunkById } from '@/lib/db/chunks';
// ========== CUSTOM CHANGE ==========
// 修改说明: 使用 questions-facade.js 统一入口（自动使用增强版函数）
// 修改日期: 2025-01-18 | 修改人: @amx
import { saveQuestions, saveQuestionsWithGaPair } from '@/lib/db/questions-facade';
// ========== CUSTOM CHANGE END ==========
import { getActiveGaPairsByFileId } from '@/lib/db/ga-pairs';
import logger from '@/lib/util/logger';

/**
 * 随机移除问题中的问号 (增强版)
 * 兼容字符串数组和对象数组
 * @param {Array} questions 问题列表
 * @param {Number} questionMaskRemovingProbability 移除概率(0-100)
 * @returns {Array} 处理后的问题列表
 */
function randomRemoveQuestionMark(questions, questionMaskRemovingProbability) {
  if (!questions || !Array.isArray(questions)) {
    logger.warn('randomRemoveQuestionMark: 输入不是数组:', questions);
    return [];
  }

  const processed = [];

  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];

    // 情况 1: 字符串
    if (typeof item === 'string') {
      let question = item.trimEnd();

      if (Math.random() * 100 < questionMaskRemovingProbability) {
        if (question.endsWith('?') || question.endsWith('？')) {
          question = question.slice(0, -1);
        }
      }

      processed.push(question);
      continue;
    }

    // 情况 2: 对象（有 question 字段）
    if (item && typeof item === 'object' && item.question) {
      let question = item.question;

      // 确保是字符串
      if (typeof question !== 'string') {
        logger.warn(`跳过非字符串问题 (index ${i}):`, item);
        continue;
      }

      question = question.trimEnd();

      if (Math.random() * 100 < questionMaskRemovingProbability) {
        if (question.endsWith('?') || question.endsWith('？')) {
          question = question.slice(0, -1);
        }
      }

      // 保留完整对象结构
      processed.push({
        question: question,
        label: item.label || '其他'
      });
      continue;
    }

    // 情况 3: 无效类型 - 跳过并警告
    logger.warn(`跳过无效元素 (index ${i}, type ${typeof item}):`, item);
  }

  logger.info(`问号处理完成: ${processed.length}/${questions.length} 个有效问题`);
  return processed;
}

/**
 * 为指定文本块生成问题
 * @param {String} projectId 项目ID
 * @param {String} chunkId 文本块ID
 * @param {Object} options 选项
 * @param {String} options.model 模型名称
 * @param {String} options.language 语言(中文/en)
 * @param {Number} options.number 问题数量(可选)
 * @returns {Promise<Object>} 生成结果
 */
export async function generateQuestionsForChunk(projectId, chunkId, options) {
  try {
    const { model, language = '中文', number } = options;

    if (!model) {
      throw new Error('模型名称不能为空');
    }

    // 并行获取文本块内容和项目配置
    const [chunk, taskConfig, project] = await Promise.all([
      getChunkById(chunkId),
      getTaskConfig(projectId),
      getProject(projectId)
    ]);

    if (!chunk) {
      throw new Error('文本块不存在');
    }

    // 获取项目配置信息
    const { questionGenerationLength, questionMaskRemovingProbability = 60 } = taskConfig;
    const { globalPrompt, questionPrompt } = project;
    // 创建LLM客户端
    const llmClient = new LLMClient(model);
    // 生成问题的数量，如果未指定，则根据文本长度自动计算
    const questionNumber = number || Math.floor(chunk.content.length / questionGenerationLength);

    // 生成问题提示词
    const prompt = await getQuestionPrompt(
      language,
      {
        text: chunk.content,
        number: questionNumber
      },
      projectId
    );
    const response = await llmClient.getResponse(prompt);

    // 从LLM输出中提取JSON格式的问题列表
    const originalQuestions = extractJsonFromLLMOutput(response);
    const questions = randomRemoveQuestionMark(originalQuestions, questionMaskRemovingProbability);
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error('生成问题失败');
    }

    const tags = await getTags(projectId);
    const simplifiedTags = extractLabels(tags);
    const labelPrompt = await getAddLabelPrompt(
      language,
      {
        label: JSON.stringify(simplifiedTags),
        question: JSON.stringify(questions)
      },
      projectId
    );

    const labelResponse = await llmClient.getResponse(labelPrompt);
    const labelQuestions = extractJsonFromLLMOutput(labelResponse);

    // 保存问题到数据库
    await saveQuestions(projectId, labelQuestions, chunkId);

    // 返回生成的问题
    return {
      chunkId,
      labelQuestions,
      total: labelQuestions.length
    };
  } catch (error) {
    logger.error('生成问题时出错:', error);
    throw error;
  }
}

function extractLabels(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => {
    const result = {
      label: item.label
    };

    if (Array.isArray(item.child) && item.child.length > 0) {
      result.child = extractLabels(item.child);
    }

    return result;
  });
}

/**
 * 为指定文本块生成问题（支持GA增强）
 * @param {String} projectId 项目ID
 * @param {String} chunkId 文本块ID
 * @param {Object} options 选项
 * @param {String} options.model 模型名称
 * @param {String} options.language 语言(中文/en)
 * @param {Number} options.number 问题数量(可选)
 * @param {Boolean} options.enableGaExpansion 是否启用GA扩展生成
 * @returns {Promise<Object>} 生成结果
 */
export async function generateQuestionsForChunkWithGA(projectId, chunkId, options) {
  try {
    const { model, language = '中文', number } = options;

    if (!model) {
      throw new Error('模型名称不能为空');
    }

    // 并行获取文本块内容和项目配置
    const [chunk, taskConfig] = await Promise.all([getChunkById(chunkId), getTaskConfig(projectId)]);

    if (!chunk) {
      throw new Error('文本块不存在');
    }

    // 获取项目配置信息
    const { questionGenerationLength, questionMaskRemovingProbability = 60 } = taskConfig;

    // 检查是否有可用的GA pairs并且启用GA扩展
    let activeGaPairs = [];
    let useGaExpansion = false;

    if (chunk.fileId) {
      try {
        activeGaPairs = await getActiveGaPairsByFileId(chunk.fileId);
        useGaExpansion = activeGaPairs.length > 0;
        logger.info(`检查到 ${activeGaPairs.length} 个激活的GA pairs，${useGaExpansion ? '启用' : '不启用'}GA扩展生成`);
      } catch (error) {
        logger.warn(`获取GA pairs失败，使用标准生成: ${error.message}`);
        useGaExpansion = false;
      }
    }

    // 创建LLM客户端
    const llmClient = new LLMClient(model);

    // 计算基础问题数量
    const baseQuestionNumber = number || Math.floor(chunk.content.length / questionGenerationLength);

    let allGeneratedQuestions = [];
    let totalExpectedQuestions = baseQuestionNumber;

    if (useGaExpansion) {
      // GA扩展模式：为每个GA pair生成基础数量的问题
      totalExpectedQuestions = baseQuestionNumber * activeGaPairs.length;
      logger.info(
        `GA扩展模式：将生成${baseQuestionNumber} 基础问题 × ${activeGaPairs.length} GA pairs = ${totalExpectedQuestions}个总问题`
      );

      // 为每个GA pair生成问题
      for (const gaPair of activeGaPairs) {
        const activeGaPair = {
          genre: `${gaPair.genreTitle}: ${gaPair.genreDesc}`,
          audience: `${gaPair.audienceTitle}: ${gaPair.audienceDesc}`,
          active: gaPair.isActive
        };

        // 生成问题提示词
        const prompt = await getQuestionPrompt(
          language,
          {
            text: chunk.content,
            number: baseQuestionNumber,
            activeGaPair: activeGaPair
          },
          projectId
        );

        const response = await llmClient.getResponse(prompt);
        const originalQuestions = extractJsonFromLLMOutput(response);
        const questions = randomRemoveQuestionMark(originalQuestions, questionMaskRemovingProbability);

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
          logger.warn(`GA pair ${gaPair.genreTitle}+${gaPair.audienceTitle} 生成问题失败，跳过`);
          continue;
        }

        // 为这批问题添加标签
        const tags = extractLabels(await getTags(projectId));
        const labelPrompt = await getAddLabelPrompt(
          language,
          {
            label: JSON.stringify(tags),
            question: JSON.stringify(questions)
          },
          projectId
        );
        const labelResponse = await llmClient.getResponse(labelPrompt);
        const labelQuestions = extractJsonFromLLMOutput(labelResponse);

        // ========== CUSTOM ENHANCEMENT ==========
        // 增强说明: 即使 labelQuestions 为空也继续,不中断整个流程
        if (!labelQuestions || labelQuestions.length === 0) {
          logger.warn(`GA pair ${gaPair.genreTitle}+${gaPair.audienceTitle} 标签添加失败，跳过`);
          continue;
        }
        // ========== CUSTOM ENHANCEMENT END ==========

        // 保存问题到数据库（关联GA pair）
        await saveQuestionsWithGaPair(projectId, labelQuestions, chunkId, gaPair.id);

        allGeneratedQuestions.push(
          ...labelQuestions.map(q => ({
            ...q,
            gaPairId: gaPair.id,
            gaPairInfo: `${gaPair.genreTitle}+${gaPair.audienceTitle}`
          }))
        );

        logger.info(`GA pair ${gaPair.genreTitle}+${gaPair.audienceTitle} 生成了 ${labelQuestions.length} 个问题`);
      }
    } else {
      // 标准模式：使用原有逻辑
      logger.info(`标准模式：生成 ${baseQuestionNumber} 个问题`);

      const prompt = await getQuestionPrompt(
        language,
        {
          text: chunk.content,
          number: baseQuestionNumber
        },
        projectId
      );

      const response = await llmClient.getResponse(prompt);
      const originalQuestions = extractJsonFromLLMOutput(response);
      const questions = randomRemoveQuestionMark(originalQuestions, questionMaskRemovingProbability);

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new Error('生成问题失败');
      }

      // 添加标签
      const tags = extractLabels(await getTags(projectId));
      const labelPrompt = await getAddLabelPrompt(
        language,
        {
          label: JSON.stringify(tags),
          question: JSON.stringify(questions)
        },
        projectId
      );
      const labelResponse = await llmClient.getResponse(labelPrompt);
      const labelQuestions = extractJsonFromLLMOutput(labelResponse);

      // 保存问题到数据库（不关联GA pair）
      await saveQuestions(projectId, labelQuestions, chunkId);

      allGeneratedQuestions = labelQuestions;
    }

    // 返回生成的问题
    return {
      chunkId,
      questions: allGeneratedQuestions,
      total: allGeneratedQuestions.length,
      expectedTotal: totalExpectedQuestions,
      gaExpansionUsed: useGaExpansion,
      gaPairsCount: activeGaPairs.length
    };
  } catch (error) {
    logger.error('GA增强问题生成时出错:', error);
    throw error;
  }
}

export default {
  generateQuestionsForChunk,
  generateQuestionsForChunkWithGA
};
