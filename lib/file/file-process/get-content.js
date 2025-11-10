import TurndownService from 'turndown';
import mammoth from 'mammoth';
import { processEpub } from './epub';

/**
 * 获取文件内容
 * @param {*} file
 */
export async function getContent(file) {
  let fileContent;
  let fileName = file.name;

  // 如果是 docx 文件，先转换为 markdown
  if (file.name.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const htmlResult = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: image => {
          return mammoth.docx.paragraph({
            children: [
              mammoth.docx.textRun({
                text: ''
              })
            ]
          });
        }
      }
    );
    const turndownService = new TurndownService();
    fileContent = turndownService.turndown(htmlResult.value);
    fileName = file.name.replace('.docx', '.md');
  } else if (file.name.endsWith('.epub')) {
    // 如果是 epub 文件，转换为 markdown
    const arrayBuffer = await file.arrayBuffer();
    fileContent = await processEpub(arrayBuffer);
    fileName = file.name.replace('.epub', '.md');
  }
  // ========== CUSTOM START ==========
  // 定制说明: REQ-003 - 添加JSON/JSONL格式处理
  // 修改日期: 2025-11-10 | 修改人: Claude Code
  else if (file.name.endsWith('.json') || file.name.endsWith('.jsonl')) {
    // JSON/JSONL 文件直接读取为文本
    const reader = new FileReader();
    fileContent = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file, 'utf-8');
    });
    // 保持原始文件名，不转换为 .md
    fileName = file.name;
  }
  // ========== CUSTOM END ==========
  else {
    // 对于 md 和 txt 文件，直接读取内容
    const reader = new FileReader();
    fileContent = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
    fileName = file.name.replace('.txt', '.md');
  }
  return { fileContent, fileName };
}
