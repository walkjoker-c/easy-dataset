/**
 * OBS配置管理模块
 * 从环境变量读取华为云OBS访问凭证和配置信息
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-001 OBS SDK集成与配置
 */

/**
 * 获取OBS配置
 * @returns {Object} OBS配置对象
 * @throws {Error} 如果必需配置缺失
 */
export function getOBSConfig() {
  const config = {
    accessKeyId: process.env.OBS_ACCESS_KEY,
    secretAccessKey: process.env.OBS_SECRET_KEY,
    server: process.env.OBS_ENDPOINT || 'https://obs.cn-north-4.myhuaweicloud.com',
    bucket: process.env.OBS_BUCKET,
  };

  // 验证必需配置
  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error(
      'OBS credentials not configured. Please set OBS_ACCESS_KEY and OBS_SECRET_KEY in environment variables.'
    );
  }

  if (!config.bucket) {
    throw new Error(
      'OBS bucket not configured. Please set OBS_BUCKET in environment variables.'
    );
  }

  return config;
}

/**
 * 检查OBS配置是否完整
 * @returns {boolean} 配置是否完整
 */
export function isOBSConfigured() {
  try {
    getOBSConfig();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取OBS bucket名称
 * @returns {string} bucket名称
 */
export function getOBSBucket() {
  const config = getOBSConfig();
  return config.bucket;
}
