// ========== CUSTOM FILE ==========
// 文件说明: 问题数据库操作统一入口（Facade模式）
// 创建日期: 2025-01-18 | 创建人: @amx
// 功能: 合并官方API + 增强API,调用方无需关心实现细节
// 设计模式: Facade Pattern（外观模式）
// 迁移策略:
//   1. 删除此文件和 questions-enhanced.js
//   2. 批量替换: from '@/lib/db/questions-facade' → from '@/lib/db/questions'
//   3. 无需逐个检查函数来源
// ========== CUSTOM FILE ==========

// ========== 官方API（未修改）==========
// 从官方文件导入所有未修改的函数
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
// ========== 官方API END ==========

// ========== 增强API（容错处理）==========
// 从增强文件导入增强函数,并重命名为原函数名
// 这样调用方使用 saveQuestions 时会自动使用增强版（容错处理）
export {
  saveQuestionsEnhanced as saveQuestions,  // ← 用增强版替换原版
  saveQuestionsWithGaPairEnhanced as saveQuestionsWithGaPair
} from '@/lib/db/questions-enhanced';
// ========== 增强API END ==========
