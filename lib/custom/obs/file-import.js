/**
 * OBS文件导入模块 (客户端)
 * 将OBS文件内容转换为File对象
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-004 OBS文件下载与处理
 */

/**
 * 将base64字符串转换为Blob
 * @param {string} base64 - base64编码的文件内容
 * @param {string} mimeType - MIME类型
 * @returns {Blob} Blob对象
 */
function base64ToBlob(base64, mimeType = 'application/octet-stream') {
  // 解码base64
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * 根据文件扩展名推断MIME类型
 * @param {string} fileName - 文件名
 * @returns {string} MIME类型
 */
function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();

  const mimeTypes = {
    txt: 'text/plain',
    md: 'text/markdown',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    epub: 'application/epub+zip',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    htm: 'text/html',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 将OBS文件内容转换为File对象
 * @param {string} base64Content - base64编码的文件内容
 * @param {string} fileName - 文件名
 * @param {Object} options - 可选参数
 * @param {string} options.mimeType - MIME类型(可选,自动推断)
 * @param {string} options.key - OBS对象key(可选,用于追踪来源)
 * @returns {File} File对象
 */
export function createFileFromBase64(base64Content, fileName, options = {}) {
  const mimeType = options.mimeType || getMimeType(fileName);
  const blob = base64ToBlob(base64Content, mimeType);

  const file = new File([blob], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  });

  // 添加自定义属性标记来源
  Object.defineProperty(file, '_fromOBS', {
    value: true,
    writable: false,
    enumerable: false,
  });

  if (options.key) {
    Object.defineProperty(file, '_obsKey', {
      value: options.key,
      writable: false,
      enumerable: false,
    });
  }

  console.log(`[OBS File Import] 创建File对象: ${fileName}, 大小: ${file.size}, MIME: ${mimeType}`);

  return file;
}

/**
 * 批量下载OBS文件并转换为File对象
 * @param {Array} files - 文件列表 [{ key, fileName?, ... }]
 * @param {Function} onProgress - 进度回调 (current, total)
 * @returns {Promise<Array>} File对象数组
 */
export async function downloadAndConvertFiles(files, onProgress) {
  const results = [];
  const total = files.length;

  console.log(`[OBS File Import] 开始批量下载: ${total} 个文件`);

  for (let i = 0; i < files.length; i++) {
    const fileInfo = files[i];
    const fileName = fileInfo.fileName || fileInfo.key.split('/').pop();

    try {
      // 调用下载API
      const response = await fetch('/api/obs/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: fileInfo.key,
          fileName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 转换为File对象
        const file = createFileFromBase64(data.content, data.fileName, {
          key: data.key,
        });

        results.push({
          success: true,
          file,
          key: fileInfo.key,
          fileName: data.fileName,
        });
      } else {
        throw new Error(data.error || 'Download failed');
      }

      // 进度回调
      if (onProgress) {
        onProgress(i + 1, total);
      }
    } catch (error) {
      console.error(`[OBS File Import] 下载失败: ${fileName}`, error);
      results.push({
        success: false,
        key: fileInfo.key,
        fileName,
        error: error.message,
      });

      // 进度回调(即使失败也要更新)
      if (onProgress) {
        onProgress(i + 1, total);
      }
    }
  }

  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);

  console.log(`[OBS File Import] 批量下载完成: 成功${successes.length}, 失败${failures.length}`);

  return {
    successes,
    failures,
    files: successes.map(r => r.file), // 返回File对象数组
  };
}
