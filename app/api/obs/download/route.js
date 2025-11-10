/**
 * OBS文件下载API
 * 读取OBS文件内容并返回给客户端
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-004 OBS文件下载与处理
 */

import { NextResponse } from 'next/server';
import { createOBSClient, getOBSBucket } from '@/lib/custom/obs/client';

/**
 * 下载单个OBS文件内容
 * @param {string} key - OBS对象key
 * @returns {Promise<Buffer>} 文件内容buffer
 */
async function downloadFileContent(key) {
  const client = createOBSClient();
  const bucket = getOBSBucket();

  try {
    console.log(`[OBS Download API] 下载文件: ${key}`);

    const result = await client.getObject({
      Bucket: bucket,
      Key: key,
    });

    if (result.CommonMsg.Status < 300) {
      // 读取流内容到Buffer
      return new Promise((resolve, reject) => {
        const chunks = [];

        result.InterfaceResult.Content.on('data', chunk => {
          chunks.push(chunk);
        });

        result.InterfaceResult.Content.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`[OBS Download API] 下载完成: ${key}, 大小: ${buffer.length}`);
          resolve(buffer);
        });

        result.InterfaceResult.Content.on('error', error => {
          console.error(`[OBS Download API] 读取流失败:`, error);
          reject(new Error(`Failed to read stream: ${error.message}`));
        });
      });
    } else {
      throw new Error(`OBS getObject failed: ${result.CommonMsg.Message}`);
    }
  } catch (error) {
    console.error('[OBS Download API] 下载文件失败:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

/**
 * POST /api/obs/download
 * 下载单个文件并返回内容
 */
export async function POST(request) {
  try {
    const { key, fileName } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    console.log(`[OBS Download API] 请求下载: ${key}`);

    // 下载文件内容
    const buffer = await downloadFileContent(key);

    // 返回文件内容
    // 使用base64编码传输二进制数据
    const base64Content = buffer.toString('base64');

    return NextResponse.json({
      success: true,
      key,
      fileName: fileName || key.split('/').pop(),
      content: base64Content,
      size: buffer.length,
    });
  } catch (error) {
    console.error('[OBS Download API] 处理请求失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
