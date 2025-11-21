/**
 * Token缓存模块
 * 使用 node-cache 实现内存缓存,减少对 Keycloak introspect 的重复调用
 *
 * 创建日期: 2025-11-17
 * 所属需求: REQ-004 Keycloak鉴权功能集成
 * 所属任务: TASK-005 Token缓存模块开发
 */

import NodeCache from 'node-cache';
import { authConfig } from '../config/auth.config.js';

/**
 * 创建Token缓存实例
 * - stdTTL: 默认TTL 10分钟 (会被setCachedToken的ttl参数覆盖)
 * - checkperiod: 每2分钟检查一次过期键
 * - useClones: false (不克隆对象,提升性能)
 */
const tokenCache = new NodeCache({
  stdTTL: 600,        // 默认10分钟 (秒)
  checkperiod: 120,   // 每2分钟检查过期 (秒)
  useClones: false,   // 不克隆对象,提升性能
});

/**
 * 获取缓存的Token验证结果
 * @param {string} tokenHash - Token的SHA256哈希值
 * @returns {Object|null} - 缓存数据 { userId, exp, cachedAt } 或 null
 */
export function getCachedToken(tokenHash) {
  try {
    const cached = tokenCache.get(tokenHash);

    if (cached) {
      console.log(`[Token Cache] ✓ Cache hit for token: ${tokenHash.substring(0, 8)}...`);
    } else {
      console.log(`[Token Cache] ✗ Cache miss for token: ${tokenHash.substring(0, 8)}...`);
    }

    return cached || null;
  } catch (error) {
    console.error('[Token Cache] Error getting cached token:', error);
    return null;
  }
}

/**
 * 缓存Token验证结果
 * @param {string} tokenHash - Token的SHA256哈希值
 * @param {Object} data - 缓存数据 { userId, exp, cachedAt }
 * @param {number} ttl - 缓存时间 (秒)
 */
export function setCachedToken(tokenHash, data, ttl) {
  try {
    // 确保TTL不超过配置的最大值
    const actualTtl = Math.min(ttl, authConfig.cache.maxTtl);

    // 确保TTL > 0
    if (actualTtl <= 0) {
      console.warn(`[Token Cache] Invalid TTL (${ttl}s), skipping cache`);
      return;
    }

    tokenCache.set(tokenHash, data, actualTtl);

    console.log(
      `[Token Cache] ✓ Cached token: ${tokenHash.substring(0, 8)}... ` +
      `for ${actualTtl}s (user: ${data.userId})`
    );
  } catch (error) {
    console.error('[Token Cache] Error setting cached token:', error);
  }
}

/**
 * 清空所有缓存
 * 用于测试或配置变更时清空缓存
 */
export function clearCache() {
  try {
    tokenCache.flushAll();
    console.log('[Token Cache] ✓ Cache cleared');
  } catch (error) {
    console.error('[Token Cache] Error clearing cache:', error);
  }
}

/**
 * 获取缓存统计信息
 * @returns {Object} - 统计信息
 *   - keys: 当前缓存键数量
 *   - hits: 缓存命中次数
 *   - misses: 缓存未命中次数
 *   - ksize: 键大小
 *   - vsize: 值大小
 */
export function getCacheStats() {
  try {
    return tokenCache.getStats();
  } catch (error) {
    console.error('[Token Cache] Error getting cache stats:', error);
    return {
      keys: 0,
      hits: 0,
      misses: 0,
      ksize: 0,
      vsize: 0,
    };
  }
}

/**
 * 打印缓存统计信息 (可选,用于监控)
 */
export function logCacheStats() {
  try {
    const stats = getCacheStats();
    const total = stats.hits + stats.misses;
    const hitRate = total > 0
      ? ((stats.hits / total) * 100).toFixed(2)
      : '0.00';

    console.log('[Token Cache] 📊 Stats:', {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: `${hitRate}%`,
    });
  } catch (error) {
    console.error('[Token Cache] Error logging cache stats:', error);
  }
}
