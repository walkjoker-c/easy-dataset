/**
 * OBS客户端创建模块
 * 使用华为云OBS SDK连接OBS服务
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-001 OBS SDK集成与配置
 */

import ObsClient from 'esdk-obs-nodejs';
import { getOBSConfig, getOBSBucket } from './config.js';

// 缓存的OBS客户端实例 (避免重复创建)
let cachedClient = null;

/**
 * 创建OBS客户端
 * 使用单例模式,避免重复创建客户端
 *
 * @returns {ObsClient} OBS客户端实例
 * @throws {Error} 如果OBS配置不完整
 */
export function createOBSClient() {
  // 如果已有缓存的客户端,直接返回
  if (cachedClient) {
    return cachedClient;
  }

  // 获取OBS配置
  const config = getOBSConfig();

  // 创建华为云OBS客户端
  cachedClient = new ObsClient({
    access_key_id: config.accessKeyId,
    secret_access_key: config.secretAccessKey,
    server: config.server,
  });

  console.log('[OBS Client] OBS客户端创建成功');

  return cachedClient;
}

/**
 * 关闭OBS客户端连接
 * 释放资源
 */
export function closeOBSClient() {
  if (cachedClient) {
    // 华为云OBS SDK没有显式的close方法,只需要清除缓存
    cachedClient = null;
    console.log('[OBS Client] OBS客户端已关闭');
  }
}

/**
 * 重置OBS客户端
 * 清除缓存,下次调用createOBSClient时会重新创建
 */
export function resetOBSClient() {
  closeOBSClient();
}

// 导出getOBSBucket以便其他模块使用
export { getOBSBucket };
