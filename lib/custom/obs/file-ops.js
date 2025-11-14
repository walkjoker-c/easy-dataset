/**
 * OBS文件操作封装模块
 * 提供listObjects, downloadFile, moveObject等文件操作
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-001 OBS SDK集成与配置
 */

import { createOBSClient, getOBSBucket } from './client.js';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

/**
 * 列出指定前缀下的所有对象
 *
 * @param {string} prefix - OBS对象前缀 (如: "env=test/messageType=conversation_data/agentType=xxx/pending/")
 * @param {Object} options - 可选参数
 * @param {number} options.maxKeys - 最多返回的对象数量 (默认1000)
 * @returns {Promise<Array>} 对象列表
 */
export async function listObjects(prefix, options = {}) {
  const client = createOBSClient();
  const bucket = getOBSBucket();

  const params = {
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: options.maxKeys || 1000,
  };

  try {
    console.log(`[OBS File-Ops] 列出对象: bucket=${bucket}, prefix=${prefix}`);

    const result = await client.listObjects(params);

    if (result.CommonMsg.Status < 300) {
      const objects = result.InterfaceResult.Contents || [];
      console.log(`[OBS File-Ops] 找到 ${objects.length} 个对象`);

      // 转换为统一格式
      return objects.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag,
      }));
    } else {
      throw new Error(`OBS listObjects failed: ${result.CommonMsg.Message}`);
    }
  } catch (error) {
    console.error('[OBS File-Ops] 列出对象失败:', error);
    throw new Error(`Failed to list OBS objects: ${error.message}`);
  }
}

/**
 * 下载单个文件到本地
 *
 * @param {string} key - OBS对象键名
 * @param {string} localPath - 本地保存路径
 * @returns {Promise<Object>} 下载结果 { success: true, localPath, size }
 */
export async function downloadFile(key, localPath) {
  const client = createOBSClient();
  const bucket = getOBSBucket();

  try {
    console.log(`[OBS File-Ops] 开始下载: ${key} -> ${localPath}`);

    // 确保本地目录存在
    await mkdir(dirname(localPath), { recursive: true });

    // 使用流式下载 (避免大文件内存溢出)
    const result = await client.getObject({
      Bucket: bucket,
      Key: key,
    });

    if (result.CommonMsg.Status < 300) {
      // 将OBS响应流写入本地文件
      return new Promise((resolve, reject) => {
        const writeStream = createWriteStream(localPath);

        result.InterfaceResult.Content.pipe(writeStream);

        writeStream.on('finish', () => {
          console.log(`[OBS File-Ops] 下载完成: ${localPath}`);
          resolve({
            success: true,
            localPath,
            size: result.InterfaceResult.Metadata.ContentLength,
          });
        });

        writeStream.on('error', error => {
          console.error(`[OBS File-Ops] 写入文件失败:`, error);
          reject(new Error(`Failed to write file: ${error.message}`));
        });

        result.InterfaceResult.Content.on('error', error => {
          console.error(`[OBS File-Ops] 读取OBS流失败:`, error);
          reject(new Error(`Failed to read OBS stream: ${error.message}`));
        });
      });
    } else {
      throw new Error(`OBS getObject failed: ${result.CommonMsg.Message}`);
    }
  } catch (error) {
    console.error('[OBS File-Ops] 下载文件失败:', error);
    throw new Error(`Failed to download file from OBS: ${error.message}`);
  }
}

/**
 * 移动对象 (通过复制+删除实现)
 *
 * @param {string} srcKey - 源对象键名
 * @param {string} dstKey - 目标对象键名
 * @returns {Promise<Object>} 移动结果 { success: true, dstKey }
 */
export async function moveObject(srcKey, dstKey) {
  const client = createOBSClient();
  const bucket = getOBSBucket();

  try {
    console.log(`[OBS File-Ops] 开始移动: ${srcKey} -> ${dstKey}`);

    // Step 1: 复制对象
    const copyResult = await client.copyObject({
      Bucket: bucket,
      Key: dstKey,
      CopySource: `${bucket}/${srcKey}`,
    });

    if (copyResult.CommonMsg.Status >= 300) {
      throw new Error(`OBS copyObject failed: ${copyResult.CommonMsg.Message}`);
    }

    console.log(`[OBS File-Ops] 复制成功: ${dstKey}`);

    // Step 2: 删除源对象
    const deleteResult = await client.deleteObject({
      Bucket: bucket,
      Key: srcKey,
    });

    if (deleteResult.CommonMsg.Status >= 300) {
      console.error(`[OBS File-Ops] 删除源对象失败: ${deleteResult.CommonMsg.Message}`);
      // 注意: 此时复制已成功,删除失败不影响主流程,只记录错误
      return {
        success: true,
        dstKey,
        warning: `Source object not deleted: ${deleteResult.CommonMsg.Message}`,
      };
    }

    console.log(`[OBS File-Ops] 移动完成: ${srcKey} -> ${dstKey}`);

    return {
      success: true,
      dstKey,
    };
  } catch (error) {
    console.error('[OBS File-Ops] 移动文件失败:', error);
    throw new Error(`Failed to move OBS object: ${error.message}`);
  }
}

/**
 * 批量下载文件 (控制并发数)
 *
 * @param {Array} files - 文件列表 [{ key, localPath }]
 * @param {number} concurrency - 并发数 (默认3)
 * @returns {Promise<Object>} 下载结果 { successes: [], failures: [] }
 */
export async function downloadFilesWithConcurrency(files, concurrency = 3) {
  const successes = [];
  const failures = [];

  console.log(`[OBS File-Ops] 开始批量下载: ${files.length} 个文件, 并发数=${concurrency}`);

  // 分批下载
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);

    const promises = batch.map(file =>
      downloadFile(file.key, file.localPath)
        .then(result => {
          successes.push({ ...file, ...result });
        })
        .catch(error => {
          console.error(`[OBS File-Ops] 下载失败: ${file.key}`, error);
          failures.push({ ...file, error: error.message });
        })
    );

    await Promise.allSettled(promises);
  }

  console.log(`[OBS File-Ops] 批量下载完成: 成功${successes.length}, 失败${failures.length}`);

  return { successes, failures };
}

/**
 * 批量移动文件
 *
 * @param {Array} moves - 移动列表 [{ srcKey, dstKey }]
 * @returns {Promise<Object>} 移动结果 { successes: [], failures: [] }
 */
export async function moveObjectsBatch(moves) {
  const successes = [];
  const failures = [];

  console.log(`[OBS File-Ops] 开始批量移动: ${moves.length} 个文件`);

  for (const move of moves) {
    try {
      const result = await moveObject(move.srcKey, move.dstKey);
      successes.push({ ...move, ...result });
    } catch (error) {
      console.error(`[OBS File-Ops] 移动失败: ${move.srcKey}`, error);
      failures.push({ ...move, error: error.message });
    }
  }

  console.log(`[OBS File-Ops] 批量移动完成: 成功${successes.length}, 失败${failures.length}`);

  return { successes, failures };
}
