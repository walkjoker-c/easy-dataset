/**
 * JSONL对话数据处理器
 * 从OBS下载的对话JSONL文件中提取user_input和assistant回复
 *
 * 创建日期: 2025-11-11
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-007 JSONL对话数据文件支持
 */

/**
 * 从单行JSONL数据中提取对话内容
 * @param {string} jsonLine - 单行JSON字符串
 * @returns {string} 格式化的对话文本
 */
export function extractConversationFromLine(jsonLine) {
  try {
    const data = JSON.parse(jsonLine);

    // 调试日志:打印数据结构
    console.log('[JSONL Processor] 数据结构检测:');
    console.log('  - hasPayload:', !!data?.payload);
    console.log('  - hasHistory:', !!data?.payload?.history);
    console.log('  - hasHistoryData:', !!data?.payload?.history?.data);
    if (data?.payload?.history) {
      console.log('  - history type:', Array.isArray(data.payload.history) ? 'array' : typeof data.payload.history);
      console.log('  - history sample:', JSON.stringify(data.payload.history).substring(0, 200));
    }

    // 尝试多种可能的路径
    let history = data?.payload?.history?.data;

    // 如果没有.data,直接使用history
    if (!history && data?.payload?.history) {
      history = Array.isArray(data.payload.history) ? data.payload.history : [data.payload.history];
      console.log('[JSONL Processor] 使用 payload.history 路径 (无.data)');
    } else if (history) {
      console.log('[JSONL Processor] 使用 payload.history.data 路径');
    }

    if (!history || !Array.isArray(history)) {
      console.warn('[JSONL Processor] 无效的history数据结构,跳过此行');
      return ''; // 无效数据,返回空
    }

    console.log(`[JSONL Processor] 找到 ${history.length} 条历史记录`);

    const conversations = [];

    // 遍历所有历史记录
    for (const record of history) {
      // 尝试多种路径: record.data.segments 或 record.segments
      const segments = record?.data?.segments || record?.segments;
      if (!Array.isArray(segments)) {
        console.log('[JSONL Processor] 此记录没有有效的segments,跳过');
        continue;
      }
      console.log(`[JSONL Processor] 处理segments,共${segments.length}个片段`);

      // 提取in-texts和out-texts
      for (const segment of segments) {
        if (segment.type === 'in-texts') {
          // 字段名是 'in-texts' (带连字符),值存储在同名字段中
          const content = segment['in-texts'] || segment.text || segment.content || '';
          if (content.trim()) {
            // 去除内容首尾的多余空白,保证格式一致
            conversations.push(`========== USER INPUT ==========\n${content.trim()}`);
            console.log(`[JSONL Processor] 提取用户输入: ${content.substring(0, 50)}...`);
          }
        } else if (segment.type === 'out-texts') {
          // 字段名是 'out-texts' (带连字符)
          const content = segment['out-texts'] || segment.text || segment.content || '';
          if (content.trim()) {
            // 去除内容首尾的多余空白,保证格式一致
            conversations.push(`========== ASSISTANT RESPONSE ==========\n${content.trim()}`);
            console.log(`[JSONL Processor] 提取助手回复: ${content.substring(0, 50)}...`);
          }
        }
      }
    }

    if (conversations.length === 0) {
      console.warn('[JSONL Processor] 未找到有效的对话内容,跳过此行');
      return '';
    }

    // 用单个空行分隔每个对话块
    return conversations.join('\n\n');
  } catch (error) {
    console.error('[JSONL Processor] JSON解析失败:', error.message);
    return ''; // 解析失败返回空
  }
}

/**
 * 处理完整的JSONL文件内容
 * @param {string} jsonlContent - 完整的JSONL文件内容
 * @returns {Array<{content: string, lineNumber: number}>} 提取的对话数组
 */
export function processJSONLContent(jsonlContent) {
  const lines = jsonlContent.split('\n').filter(line => line.trim());
  const results = [];

  console.log(`[JSONL Processor] 开始处理JSONL文件,共${lines.length}行`);

  lines.forEach((line, index) => {
    const conversation = extractConversationFromLine(line);
    if (conversation) {
      results.push({
        content: conversation,
        lineNumber: index + 1, // 从1开始编号
      });
    }
  });

  console.log(`[JSONL Processor] 处理完成: 从${lines.length}行中提取${results.length}条有效对话`);

  if (results.length === 0) {
    console.warn('[JSONL Processor] 警告:未提取到任何有效对话数据!');
  }

  return results;
}

/**
 * 验证JSONL文件是否符合预期格式
 * @param {string} jsonlContent - JSONL文件内容
 * @returns {Object} {valid: boolean, message: string, sampleData?: Object}
 */
export function validateJSONLFormat(jsonlContent) {
  const lines = jsonlContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return {
      valid: false,
      message: 'JSONL文件为空',
    };
  }

  try {
    // 尝试解析第一行
    const firstLine = JSON.parse(lines[0]);
    const hasPayload = firstLine?.payload;
    const hasHistory = firstLine?.payload?.history;

    return {
      valid: true,
      message: `JSONL格式有效,共${lines.length}行`,
      sampleData: {
        hasPayload,
        hasHistory,
        structure: hasHistory ? 'conversation' : 'unknown',
      },
    };
  } catch (error) {
    return {
      valid: false,
      message: `JSONL格式无效:${error.message}`,
    };
  }
}
