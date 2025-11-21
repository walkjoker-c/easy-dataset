/**
 * 鉴权配置管理模块
 * 统一管理所有鉴权相关的环境变量配置
 *
 * 创建日期: 2025-11-17
 * 所属需求: REQ-004 Keycloak鉴权功能集成
 * 所属任务: TASK-003 鉴权配置模块开发
 */

/**
 * 鉴权配置对象
 */
export const authConfig = {
  // Keycloak配置
  keycloak: {
    introspectUrl: process.env.KEYCLOAK_INTROSPECT_URL,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  },

  // 管理员配置
  admin: {
    password: process.env.ADMIN_PASSWORD,
  },

  // Session配置
  session: {
    secret: process.env.SESSION_SECRET || 'default-secret-change-me-in-production',
    cookieName: 'easy-dataset-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true,                                // 防XSS攻击
      sameSite: 'strict',                            // 防CSRF攻击
      maxAge: 24 * 60 * 60,                          // 24小时 (秒)
    },
  },

  // 缓存配置
  cache: {
    maxTtl: 30 * 60, // 30分钟 (秒)
  },
};

/**
 * 验证鉴权配置完整性
 * 在应用启动时调用,确保所有必需的环境变量已配置
 * @throws {Error} 配置缺失时抛出错误
 */
export function validateAuthConfig() {
  // 必需的环境变量列表
  const requiredEnvVars = [
    'KEYCLOAK_INTROSPECT_URL',
    'KEYCLOAK_CLIENT_ID',
    'KEYCLOAK_CLIENT_SECRET',
    'ADMIN_PASSWORD',
  ];

  // 检查缺失的环境变量
  const missingVars = requiredEnvVars.filter(key => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `[Auth Config] Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all variables are set.'
    );
  }

  // 验证管理员密码长度
  if (process.env.ADMIN_PASSWORD.length < 8) {
    throw new Error(
      '[Auth Config] ADMIN_PASSWORD must be at least 8 characters long for security.'
    );
  }

  // 可选: 验证SESSION_SECRET长度
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    console.warn(
      '[Auth Config] Warning: SESSION_SECRET should be at least 32 characters for better security.'
    );
  }

  console.log('[Auth Config] ✅ All required environment variables are configured');
}
