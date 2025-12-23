// ========== CUSTOM FILE ==========
// 文件说明: LLM 输出解析增强版,支持多格式容错,避免数据丢失
// 创建日期: 2025-01-XX | 创建人: @amx
// 关联需求: 修复 LLM 输出格式异常导致的数据丢失问题
// 基于文件: lib/llm/common/util.js
// ========== CUSTOM FILE ==========

import { jsonrepair } from 'jsonrepair';

/**
 * 增强版 LLM 输出解析函数
 * 支持多种格式,最大限度避免数据丢失
 *
 * 支持的格式:
 * 1. 纯 JSON: ["问题1", "问题2"]
 * 2. 对象数组: [{"question": "...", "label": "..."}]
 * 3. 混合数组: ["问题1", {"question": "问题2"}]
 * 4. markdown 代码块: ```json\n[...]\n```
 * 5. 语法错误的 JSON (尝试修复)
 * 6. 逐行提取 (最后的救命稻草)
 */
export function extractJsonFromLLMOutput(output) {
  console.log('开始解析 LLM 输出，长度:', output.length);

  // 处理思考链
  if (output.trim().startsWith('<think')) {
    output = extractAnswer(output);
  }

  // ====== 尝试 1: 直接解析 JSON ======
  try {
    const json = JSON.parse(output);
    console.log('✅ 直接解析成功，类型:', Array.isArray(json) ? 'array' : typeof json);
    return normalizeQuestions(json);
  } catch (error) {
    console.log('直接解析失败:', error.message);
  }

  // ====== 尝试 2: 提取 ```json 代码块 ======
  const jsonStart = output.indexOf('```json');
  const jsonEnd = output.lastIndexOf('```');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    const regex = /```json\s*([\s\S]*?)```/;
    const match = regex.exec(output);

    if (match && match[1]) {
      const jsonString = match[1].trim();
      try {
        const json = JSON.parse(jsonString);
        console.log('✅ 从 ```json 代码块解析成功');
        return normalizeQuestions(json);
      } catch (error) {
        console.warn('```json 代码块解析失败，尝试修复:', error.message);
        const repaired = attemptRepair(jsonString);
        if (repaired) {
          console.log('✅ 修复后解析成功');
          return normalizeQuestions(repaired);
        }
      }
    } else {
      console.warn('正则匹配失败，未找到有效的 JSON 代码块');
    }
  }

  // ====== 尝试 3: 提取普通代码块 ``` (不带 json 标识) ======
  const codeBlockRegex = /```\s*([\s\S]*?)```/;
  const codeBlockMatch = codeBlockRegex.exec(output);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const jsonString = codeBlockMatch[1].trim();
    try {
      const json = JSON.parse(jsonString);
      console.log('✅ 从普通代码块解析成功');
      return normalizeQuestions(json);
    } catch (error) {
      console.warn('普通代码块解析失败，尝试修复:', error.message);
      const repaired = attemptRepair(jsonString);
      if (repaired) {
        console.log('✅ 修复后解析成功');
        return normalizeQuestions(repaired);
      }
    }
  }

  // ====== 尝试 4: 查找 JSON 数组模式 [...]  ======
  const arrayRegex = /\[[\s\S]*\]/;
  const arrayMatch = arrayRegex.exec(output);
  if (arrayMatch) {
    try {
      const json = JSON.parse(arrayMatch[0]);
      console.log('✅ 从输出中提取 JSON 数组成功');
      return normalizeQuestions(json);
    } catch (error) {
      console.warn('提取的 JSON 数组解析失败，尝试修复:', error.message);
      const repaired = attemptRepair(arrayMatch[0]);
      if (repaired) {
        console.log('✅ 修复后解析成功');
        return normalizeQuestions(repaired);
      }
    }
  }

  // ====== 尝试 5: 逐行提取 JSON 对象（最后的救命稻草）======
  console.warn('所有标准解析方法失败，尝试逐行提取...');
  const extracted = extractQuestionsLineByLine(output);
  if (extracted && extracted.length > 0) {
    console.log(`✅ 逐行提取成功，挽救了 ${extracted.length} 个问题`);
    return extracted;
  }

  // ====== 尝试 6: 使用 jsonrepair 修复整个输出 ======
  try {
    const json = JSON.parse(jsonrepair(output));
    console.log('✅ 通过 jsonrepair 修复整个输出成功');
    return normalizeQuestions(json);
  } catch (error) {
    console.error('❌ 所有解析尝试均失败');
    console.error('原始输出（前 500 字符）:', output.substring(0, 500));
    return undefined;
  }
}

/**
 * 尝试修复 JSON
 */
function attemptRepair(jsonString) {
  try {
    return JSON.parse(jsonrepair(jsonString));
  } catch (error) {
    console.error('JSON 修复失败:', error.message);
    return null;
  }
}

/**
 * 标准化问题格式
 * 将不同格式的 LLM 输出标准化为统一格式
 *
 * 支持：
 * 1. 字符串数组: ["问题1", "问题2"]
 * 2. 对象数组: [{"question": "...", "label": "..."}]
 * 3. 混合数组: ["问题1", {"question": "问题2"}]
 */
function normalizeQuestions(json) {
  if (!json || !Array.isArray(json)) {
    console.warn('输入不是数组，尝试包装:', typeof json);
    // 如果是单个对象，包装成数组
    if (json && typeof json === 'object') {
      json = [json];
    } else {
      return undefined;
    }
  }

  const normalized = [];
  const skipped = [];

  for (let i = 0; i < json.length; i++) {
    const item = json[i];

    // 情况 1: 字符串 - 包装成对象格式
    if (typeof item === 'string') {
      if (item.trim().length > 0) {
        normalized.push({
          question: item,
          label: '其他' // 字符串无标签，默认为"其他"
        });
      } else {
        skipped.push({ index: i, reason: '空字符串', value: item });
      }
      continue;
    }

    // 情况 2: 对象 - 提取 question 字段
    if (item && typeof item === 'object') {
      // 有 question 字段
      if (item.question && typeof item.question === 'string') {
        // 保留完整对象结构（包含 label）
        normalized.push({
          question: item.question,
          label: item.label || '其他' // 如果没有 label，默认为"其他"
        });
        continue;
      }

      // 尝试其他可能的字段名
      const possibleFields = ['q', 'text', 'content', 'title'];
      let found = false;
      for (const field of possibleFields) {
        if (item[field] && typeof item[field] === 'string') {
          normalized.push({
            question: item[field],
            label: item.label || '其他'
          });
          found = true;
          console.warn(`使用非标准字段 "${field}" 作为问题:`, item[field]);
          break;
        }
      }
      if (found) continue;

      // 如果对象没有可用字段，跳过
      skipped.push({ index: i, reason: '对象缺少有效字段', value: item });
      continue;
    }

    // 情况 3: 其他类型 - 跳过
    skipped.push({ index: i, reason: `无效类型: ${typeof item}`, value: item });
  }

  // 报告跳过的元素
  if (skipped.length > 0) {
    console.warn(`⚠️ 跳过了 ${skipped.length} 个无效元素:`, skipped);
  }

  console.log(`✅ 标准化完成: ${normalized.length} 个有效问题`);

  return normalized.length > 0 ? normalized : undefined;
}

/**
 * 逐行提取 JSON 对象（救命稻草）
 * 当整体 JSON 解析失败时，尝试逐行提取有效的 JSON 对象
 */
function extractQuestionsLineByLine(output) {
  console.log('开始逐行提取...');
  const results = [];

  // 尝试 1: 提取所有完整的 JSON 对象 {...}
  const objectRegex = /\{[^{}]*"question"\s*:\s*"([^"]*)"[^{}]*(?:"label"\s*:\s*"([^"]*)")?[^{}]*\}/g;
  let match;
  while ((match = objectRegex.exec(output)) !== null) {
    const question = match[1];
    const label = match[2] || '其他';
    if (question && question.trim().length > 0) {
      results.push({ question, label });
      console.log(`提取到对象: question="${question}", label="${label}"`);
    }
  }

  // 尝试 2: 提取独立的 "question": "..." 行
  const questionLineRegex = /"question"\s*:\s*"([^"]*)"/g;
  const labelLineRegex = /"label"\s*:\s*"([^"]*)"/g;

  const questions = [];
  const labels = [];

  while ((match = questionLineRegex.exec(output)) !== null) {
    questions.push(match[1]);
  }

  while ((match = labelLineRegex.exec(output)) !== null) {
    labels.push(match[1]);
  }

  // 配对 question 和 label
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const label = labels[i] || '其他'; // 如果 label 数量不够，用默认值

    // 避免重复添加
    const isDuplicate = results.some(r => r.question === question);
    if (!isDuplicate && question.trim().length > 0) {
      results.push({ question, label });
      console.log(`提取到独立行: question="${question}", label="${label}"`);
    }
  }

  console.log(`逐行提取完成，共提取 ${results.length} 个问题`);
  return results.length > 0 ? results : null;
}

// ========== 以下函数保持与原文件一致 ==========

export function safeParseJSON(output) {
  // console.log('LLM 输出:', output);
  if (output.trim().startsWith('<think')) {
    output = extractAnswer(output);
  }
  try {
    const json = JSON.parse(output);
    return json;
  } catch {}
  const jsonStart = output.indexOf('```json');
  const jsonEnd = output.lastIndexOf('```');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    const regex = /```json\s*([\s\S]*?)```/;
    const match = regex.exec(output);

    if (match && match[1]) {
      const jsonString = match[1].trim();
      try {
        const json = JSON.parse(jsonString);
        return json;
      } catch (error) {
        try {
          const json = JSON.parse(jsonrepair(output));
          return json;
        } catch (error) {
          return output;
        }
      }
    } else {
      console.error('safeParseJSON: 正则匹配失败:', output);
      return output;
    }
  } else {
    try {
      const json = JSON.parse(jsonrepair(output));
      return json;
    } catch (error) {
      return output;
    }
  }
}

export function extractThinkChain(text) {
  const startTags = ['<think>', '<thinking>'];
  const endTags = ['</think>', '</thinking>'];
  let startIndex = -1;
  let endIndex = -1;
  let usedStartTag = '';
  let usedEndTag = '';

  for (let i = 0; i < startTags.length; i++) {
    const currentStartIndex = text.indexOf(startTags[i]);
    if (currentStartIndex !== -1) {
      startIndex = currentStartIndex;
      usedStartTag = startTags[i];
      usedEndTag = endTags[i];
      break;
    }
  }

  if (startIndex === -1) {
    return '';
  }

  endIndex = text.indexOf(usedEndTag, startIndex + usedStartTag.length);

  if (endIndex === -1) {
    return '';
  }

  return text.slice(startIndex + usedStartTag.length, endIndex).trim();
}

export function extractAnswer(text) {
  const startTags = ['<think>', '<thinking>'];
  const endTags = ['</think>', '</thinking>'];
  for (let i = 0; i < startTags.length; i++) {
    const start = startTags[i];
    const end = endTags[i];
    if (text.includes(start) && text.includes(end)) {
      const partsBefore = text.split(start);
      const partsAfter = partsBefore[1].split(end);
      return (partsBefore[0].trim() + ' ' + partsAfter[1].trim()).trim();
    }
  }
  return text;
}

export function removeLeadingNumber(label) {
  const numberPrefixRegex = /^\d+(?:\.\d+)*\s+/;
  return label.replace(numberPrefixRegex, '');
}
