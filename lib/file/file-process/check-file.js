import { FILE } from '@/constant';

/**
 * 检查文件大小
 */
export function checkMaxSize(files) {
  const oversizedFiles = files.filter(file => file.size > FILE.MAX_FILE_SIZE);
  if (oversizedFiles.length > 0) {
    throw new Error(`Max 50MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
  }
}

/**
 * 获取可以上传的文件
 * @param {*} files
 * @returns
 */
export function getvalidFiles(files) {
  return files.filter(
    file =>
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.epub') ||
      // ========== CUSTOM START ==========
      // 定制说明: REQ-003 - 添加JSON/JSONL格式支持
      // 修改日期: 2025-11-10 | 修改人: Claude Code
      file.name.endsWith('.json') ||
      file.name.endsWith('.jsonl')
      // ========== CUSTOM END ==========
  );
}

/**
 * 检查不能上传的文件
 * @param {*} files
 * @returns
 */
export function checkInvalidFiles(files) {
  const invalidFiles = files.filter(
    file =>
      !file.name.endsWith('.md') &&
      !file.name.endsWith('.txt') &&
      !file.name.endsWith('.docx') &&
      !file.name.endsWith('.pdf') &&
      !file.name.endsWith('.epub') &&
      // ========== CUSTOM START ==========
      // 定制说明: REQ-003 - 添加JSON/JSONL格式支持
      // 修改日期: 2025-11-10 | 修改人: Claude Code
      !file.name.endsWith('.json') &&
      !file.name.endsWith('.jsonl')
      // ========== CUSTOM END ==========
  );
  if (invalidFiles.length > 0) {
    throw new Error(`Unsupported File Format: ${invalidFiles.map(f => f.name).join(', ')}`);
  }
  return invalidFiles;
}
