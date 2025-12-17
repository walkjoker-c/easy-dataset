// ========== CUSTOM FILE ==========
// 文件说明: 问题数据库操作增强版,兼容字符串和对象数组,过滤无效数据
// 创建日期: 2025-01-XX | 创建人: @amx
// 关联需求: 修复 LLM 输出格式异常导致的数据丢失问题
// 基于文件: lib/db/questions.js
// 主要改进:
//   1. saveQuestions 兼容字符串和对象格式
//   2. saveQuestionsWithGaPair 兼容字符串和对象格式
//   3. 逐个验证数据,过滤无效元素而非全部丢弃
//   4. 详细的警告日志,便于追踪数据质量
// ========== CUSTOM FILE ==========

'use server';

// ========== CUSTOM CHANGE ==========
// 修改说明: 导入原 questions.js 的所有其他函数
// 修改日期: 2025-01-XX | 修改人: @amx
export {
  getQuestions,
  getQuestionsForTree,
  getQuestionsByTag,
  getAllQuestionsByProjectId,
  getQuestionsIds,
  getQuestionsByTagName,
  getQuestionById,
  isExistByQuestion,
  getQuestionsCount,
  updateQuestion,
  updateQuestionAnsweredStatus,
  getQuestionsForChunk,
  deleteQuestion,
  batchDeleteQuestions,
  getQuestionTemplateById
} from '@/lib/db/questions';
// ========== CUSTOM CHANGE END ==========

import { db } from '@/lib/db/index';

/**
 * 保存项目的问题列表 (增强版)
 * 兼容字符串数组和对象数组,过滤无效数据
 * @param {string} projectId - 项目ID
 * @param {Array} questions - 问题列表
 * @param chunkId
 * @returns {Promise<Array>} - 保存后的问题列表
 */
export async function saveQuestions(projectId, questions, chunkId) {
  try {
    if (!questions || !Array.isArray(questions)) {
      console.warn('saveQuestions: 输入不是数组');
      return { count: 0 };
    }

    let data = questions
      .map((item, index) => {
        // ✅ 兼容字符串和对象两种格式
        let question, label;

        if (typeof item === 'string') {
          // 字符串格式
          question = item;
          label = '其他'; // 默认标签
        } else if (item && typeof item === 'object') {
          // 对象格式
          question = item.question;
          label = item.label;
        } else {
          console.warn(`跳过无效元素 (index ${index}, type ${typeof item}):`, item);
          return null;
        }

        // ✅ 验证必填字段
        if (!question || typeof question !== 'string' || question.trim().length === 0) {
          console.warn(`跳过无效问题 (index ${index}):`, { question, label });
          return null;
        }

        if (!label || typeof label !== 'string' || label.trim().length === 0) {
          console.warn(`问题缺少有效标签，使用默认值 (index ${index}):`, question);
          label = '其他';
        }

        return {
          projectId,
          chunkId: chunkId ? chunkId : item.chunkId,
          question: question.trim(),
          label: label.trim(),
          imageId: item.imageId,
          imageName: item.imageName,
          templateId: item.templateId
        };
      })
      .filter(item => item !== null); // ✅ 过滤掉无效数据

    if (data.length === 0) {
      console.warn('没有有效的问题可以保存');
      return { count: 0 };
    }

    console.log(`准备保存 ${data.length}/${questions.length} 个有效问题到数据库`);
    const result = await db.questions.createMany({ data: data });
    console.log(`✅ 成功保存 ${result.count} 个问题`);

    return result;
  } catch (error) {
    console.error('Failed to create questions in database');
    throw error;
  }
}

/**
 * 保存项目的问题列表（支持GA配对）(增强版)
 * 兼容字符串数组和对象数组,过滤无效数据
 * @param {string} projectId - 项目ID
 * @param {Array} questions - 问题列表
 * @param {string} chunkId - 文本块ID
 * @param {string} gaPairId - GA配对ID（可选）
 * @returns {Promise<Array>} - 保存后的问题列表
 */
export async function saveQuestionsWithGaPair(projectId, questions, chunkId, gaPairId = null) {
  try {
    if (!questions || !Array.isArray(questions)) {
      console.warn('saveQuestionsWithGaPair: 输入不是数组');
      return { count: 0 };
    }

    let data = questions
      .map((item, index) => {
        // ✅ 兼容字符串和对象两种格式
        let question, label;

        if (typeof item === 'string') {
          question = item;
          label = '其他';
        } else if (item && typeof item === 'object') {
          question = item.question;
          label = item.label;
        } else {
          console.warn(`跳过无效元素 (index ${index}, type ${typeof item}):`, item);
          return null;
        }

        // ✅ 验证必填字段
        if (!question || typeof question !== 'string' || question.trim().length === 0) {
          console.warn(`跳过无效问题 (index ${index}):`, { question, label });
          return null;
        }

        if (!label || typeof label !== 'string' || label.trim().length === 0) {
          console.warn(`问题缺少有效标签，使用默认值 (index ${index}):`, question);
          label = '其他';
        }

        return {
          projectId,
          chunkId: chunkId ? chunkId : item.chunkId,
          question: question.trim(),
          label: label.trim(),
          gaPairId: gaPairId
        };
      })
      .filter(item => item !== null);

    if (data.length === 0) {
      console.warn('没有有效的问题可以保存');
      return { count: 0 };
    }

    console.log(`准备保存 ${data.length}/${questions.length} 个有效问题（含 GA pair）到数据库`);
    const result = await db.questions.createMany({ data: data });
    console.log(`✅ 成功保存 ${result.count} 个问题（含 GA pair）`);

    return result;
  } catch (error) {
    console.error('Failed to create questions with GA pair in database');
    throw error;
  }
}
