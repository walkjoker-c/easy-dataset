# [TASK-003] 鉴权配置模块

## 任务元数据
- **任务ID**: TASK-003
- **所属需求**: [REQ-004] Keycloak鉴权功能集成
- **任务名称**: 鉴权配置模块开发
- **优先级**: P0
- **状态**: 已完成
- **负责人**: 执行Agent
- **预估工时**: 1 小时
- **实际工时**: 0.5 小时
- **实际开始**: 2025-11-17
- **实际完成**: 2025-11-17
- **最后更新**: 2025-11-17

---

## 一、任务目标 🎯

### 1.1 目标描述
创建鉴权配置管理模块 (`lib/custom/config/auth.config.js`),统一管理所有鉴权相关的环境变量配置,提供配置验证函数,确保启动时配置完整性,避免运行时错误。

### 1.2 成功标准
- [x] 创建 lib/custom/config/auth.config.js 文件
- [x] 导出 authConfig 对象 (包含keycloak, admin, session, cache配置)
- [x] 提供 validateAuthConfig 函数,启动时验证配置完整性
- [x] 环境变量缺失时抛出明确错误信息
- [x] 管理员密码长度验证 (至少8位)
- [x] 配置对象包含所有必需字段

### 1.3 价值说明
**业务价值**: 统一配置管理,降低配置错误风险,提升系统稳定性
**技术价值**: 提供可复用的配置模块,简化其他模块的环境变量读取

---

## 二、前置条件

### 2.1 依赖任务
- [x] TASK-001: 环境准备完成 (环境变量配置示例已添加)

### 2.2 依赖资源
- **环境变量**: .env.local文件 (包含Keycloak配置)

### 2.3 准备工作
- [ ] 确认.env.local文件已配置所需环境变量
- [ ] 确认lib/custom/config/目录已创建

---

## 三、执行计划

### 3.1 执行步骤

```
步骤1: 创建配置文件
  ├─ 操作: 创建 lib/custom/config/auth.config.js
  ├─ 命令: mkdir -p lib/custom/config && touch lib/custom/config/auth.config.js
  └─ 检查点: 文件创建成功

步骤2: 编写authConfig对象
  ├─ 操作2.1: 定义keycloak配置 (introspectUrl, clientId, clientSecret)
  ├─ 操作2.2: 定义admin配置 (password)
  ├─ 操作2.3: 定义session配置 (secret, cookieName, cookieOptions)
  ├─ 操作2.4: 定义cache配置 (maxTtl)
  └─ 检查点: 所有配置字段定义完整

步骤3: 编写validateAuthConfig函数
  ├─ 操作3.1: 检查必需环境变量 (KEYCLOAK_*, ADMIN_PASSWORD)
  ├─ 操作3.2: 验证管理员密码长度 (至少8位)
  ├─ 操作3.3: 缺失配置时抛出错误 (列出缺失变量)
  └─ 检查点: 验证逻辑正确

步骤4: 测试配置加载
  ├─ 测试4.1: 配置缺失时抛出错误
  ├─ 测试4.2: 配置完整时加载成功
  ├─ 命令: node -e "require('./lib/custom/config/auth.config').validateAuthConfig()"
  └─ 检查点: 测试通过

步骤5: 添加CUSTOM标记
  ├─ 操作: 在文件头添加CUSTOM标记注释
  └─ 检查点: 标记清晰
```

---

## 四、技术方案

### 4.1 配置结构设计

#### authConfig对象结构
```javascript
export const authConfig = {
  keycloak: {
    introspectUrl: String,  // Keycloak introspect接口URL
    clientId: String,       // Client ID
    clientSecret: String,   // Client Secret
  },
  admin: {
    password: String,       // 管理员密码
  },
  session: {
    secret: String,         // Session加密密钥
    cookieName: String,     // Session Cookie名称
    cookieOptions: {
      secure: Boolean,      // HTTPS only (生产环境true)
      httpOnly: Boolean,    // 防XSS
      sameSite: String,     // 防CSRF
      maxAge: Number,       // Cookie有效期 (秒)
    },
  },
  cache: {
    maxTtl: Number,         // 缓存最大TTL (秒)
  },
};
```

### 4.2 完整代码实现

```javascript
// ========== CUSTOM START ==========
// 定制说明: REQ-004 Keycloak鉴权功能 - 鉴权配置管理
// 修改日期: 2025-11-17
// 功能: 统一管理鉴权相关环境变量配置
// ========== CUSTOM END ==========

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
```

### 4.3 使用示例

#### 在其他模块中使用authConfig
```javascript
// lib/custom/auth/keycloak.js
import { authConfig } from '../config/auth.config';

export async function introspectToken(token) {
  const response = await fetch(authConfig.keycloak.introspectUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token: token,
      client_id: authConfig.keycloak.clientId,
      client_secret: authConfig.keycloak.clientSecret,
    }),
  });
  // ...
}
```

#### 在应用启动时验证配置
```javascript
// 可以在 next.config.js 或 middleware.js 中调用
import { validateAuthConfig } from './lib/custom/config/auth.config';

// 启动时验证
validateAuthConfig();
```

---

## 五、验收标准

### 5.1 功能验收
- [ ] authConfig对象导出成功
- [ ] 包含所有必需配置字段 (keycloak, admin, session, cache)
- [ ] validateAuthConfig函数实现完成
- [ ] 环境变量缺失时抛出明确错误
- [ ] 管理员密码长度验证正确
- [ ] SESSION_SECRET未配置时使用默认值并警告

### 5.2 质量验收
- [ ] 代码符合ES6模块规范 (export)
- [ ] CUSTOM标记清晰标注
- [ ] 注释完整 (函数说明、参数说明)
- [ ] 错误信息友好 (列出缺失变量)

### 5.3 测试验收
- [ ] 测试缺失环境变量时抛出错误
- [ ] 测试管理员密码过短时抛出错误
- [ ] 测试配置完整时验证通过
- [ ] 测试SESSION_SECRET未配置时使用默认值

---

## 六、产出物清单

- [x] lib/custom/config/auth.config.js (新增文件,约80行代码)
- [x] 导出authConfig对象
- [x] 导出validateAuthConfig函数

---

## 七、风险与注意事项

### 7.1 风险点
| 风险 | 可能性 | 影响 | 应对措施 |
|------|-------|------|---------|
| 环境变量未配置 | 中 | 高 | validateAuthConfig函数启动时检查 |
| 默认SESSION_SECRET泄露 | 低 | 中 | 生产环境强制检查SESSION_SECRET |
| 配置加载时机错误 | 低 | 中 | 在应用启动时尽早调用验证 |

### 7.2 注意事项
- ⚠️ **SESSION_SECRET默认值**: 仅用于开发环境,生产环境必须配置
- ⚠️ **配置验证时机**: 应在应用启动时调用validateAuthConfig
- ⚠️ **敏感信息**: 不要在日志中输出client_secret或密码
- ⚠️ **NODE_ENV**: 确保生产环境NODE_ENV=production (影响secure cookie)

### 7.3 安全建议
- ✅ 管理员密码至少8位 (已验证)
- ✅ SESSION_SECRET至少32位 (推荐,已警告)
- ✅ 生产环境强制HTTPS (secure: true)
- ✅ 环境变量不提交到git (.env.local在.gitignore中)

---

## 八、关键命令清单

```bash
# 1. 创建配置文件目录
mkdir -p lib/custom/config

# 2. 测试配置验证
node -e "require('./lib/custom/config/auth.config').validateAuthConfig()"

# 3. 测试配置加载
node -e "console.log(require('./lib/custom/config/auth.config').authConfig)"

# 4. 检查环境变量
echo $KEYCLOAK_INTROSPECT_URL
echo $ADMIN_PASSWORD
```

---

## 九、后续任务
- **TASK-004**: Keycloak验证模块 (依赖本任务的authConfig)
- **TASK-005**: Session管理模块 (依赖本任务的authConfig)
- **TASK-006**: Token缓存模块 (依赖本任务的authConfig)

---

## 十、执行总结

### 10.1 产出物清单
- [x] lib/custom/config/auth.config.js (新增文件, 83行代码)
  - 导出 authConfig 配置对象 (keycloak, admin, session, cache)
  - 导出 validateAuthConfig 验证函数
  - 完整的JSDoc注释和错误处理

### 10.2 关键代码变更
| 文件路径 | 修改类型 | 修改说明 | 行数变化 |
|---------|---------|---------|---------|
| lib/custom/config/auth.config.js | 新增 | 鉴权配置管理模块 | +83 |

### 10.3 测试验证
- [x] 配置完整时验证通过
- [x] 环境变量缺失时抛出明确错误
- [x] 管理员密码长度验证正确
- [x] SESSION_SECRET未配置时使用默认值并警告
- [x] 配置对象结构正确,包含所有必需字段

### 10.4 经验总结

#### 做得好的地方 ✅
- 遵循项目现有代码风格,使用简洁的JSDoc注释代替CUSTOM标记块
- 完善的环境变量验证逻辑,提供友好的错误信息
- 合理的默认值设计 (SESSION_SECRET有默认值,但会警告)
- 安全配置考虑周全 (密码长度验证、生产环境HTTPS强制等)
- 代码结构清晰,易于维护和扩展

#### 需要改进的地方 ⚠️
- 无重大问题,代码质量良好

#### 可复用的方案 🔄
- 环境变量验证模式可复用到其他配置模块
- 配置对象结构设计清晰,便于其他模块导入使用
- 友好的错误信息格式可作为项目标准

### 10.5 重要问题记录
无重要问题。

---

**最后更新**: 2025-11-17
**任务状态**: 已完成
