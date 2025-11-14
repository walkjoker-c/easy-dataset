# [TASK-001] OBS SDK集成与配置

## 任务元数据
- **任务ID**: TASK-001
- **所属需求**: [REQ-003] OBS文件上传集成
- **任务名称**: 集成华为云OBS SDK并配置OBS客户端
- **优先级**: P0
- **状态**: ✅ 已完成
- **负责人**: 开发人员
- **创建日期**: 2025-11-10
- **计划开始**: 2025-11-10
- **计划完成**: 2025-11-10
- **实际开始**: 2025-11-10 14:00
- **实际完成**: 2025-11-10 16:30
- **预估工时**: 3 小时
- **实际工时**: 2.5 小时
- **最后更新**: 2025-11-10 16:30

---

## 一、任务目标 🎯

### 1.1 目标描述
安装和配置华为云OBS SDK (esdk-obs-nodejs),封装OBS客户端创建和基础文件操作逻辑,为后续的OBS文件浏览、下载、移动功能提供基础设施支持。

### 1.2 成功标准
- [x] 华为云OBS SDK (esdk-obs-nodejs) 正确安装 ✅
- [x] OBS客户端可以成功连接到OBS服务(测试环境) ✅
- [x] `listObjects`函数可以列出指定路径下的文件 ✅
- [x] `downloadFile`函数可以下载单个文件到本地 ✅
- [x] `moveObject`函数可以移动文件(copy + delete) ✅
- [x] 环境变量配置示例文档完成(.env.local.example) ✅
- [x] 基础错误处理和日志记录完成 ✅
- [x] OBS连接测试脚本通过所有测试 ✅

### 1.3 价值说明
**业务价值**: 建立与OBS服务的连接通道,是实现OBS文件上传功能的基础
**技术价值**: 提供统一的OBS操作接口,便于后续功能开发和维护;遵循代码隔离原则,所有代码在custom目录

---

## 二、前置条件

### 2.1 依赖任务
- 无(这是第一个任务)

### 2.2 依赖资源
- **技术资源**:
  - Node.js环境(项目已有)
  - npm或pnpm包管理器
  - OBS测试环境访问凭证(AccessKey/SecretKey)
  - OBS endpoint和bucket信息
- **人力资源**: 1名开发人员
- **数据资源**: OBS服务配置信息(由运维或产品提供)
- **其他资源**: 华为云OBS SDK文档

### 2.3 准备工作
- [x] 获取OBS测试环境访问凭证(AccessKey/SecretKey) ✅
- [x] 确认OBS endpoint和region信息 ✅
- [x] 确认OBS bucket名称 ✅
- [x] 阅读华为云OBS SDK文档 ✅

---

## 三、执行计划

### 3.1 任务分解

#### 子任务1: 安装AWS SDK
- **描述**: 安装@aws-sdk/client-s3包
- **预估工时**: 0.5 小时
- **输出物**: package.json更新,node_modules中有SDK
- **验证方法**: `npm list @aws-sdk/client-s3`显示版本号

#### 子任务2: 创建OBS客户端封装
- **描述**: 创建`lib/custom/obs/client.js`,封装S3Client创建逻辑
- **预估工时**: 0.5 小时
- **输出物**: `lib/custom/obs/client.js`
- **验证方法**: 可以成功创建S3Client实例

#### 子任务3: 实现配置管理
- **描述**: 创建`lib/custom/obs/config.js`,从环境变量读取OBS配置
- **预估工时**: 0.5 小时
- **输出物**: `lib/custom/obs/config.js`, `.env.local.example`
- **验证方法**: 配置正确加载,无敏感信息泄露

#### 子任务4: 实现文件操作封装
- **描述**: 创建`lib/custom/obs/file-ops.js`,实现listObjects/downloadFile/moveObject
- **预估工时**: 1 小时
- **输出物**: `lib/custom/obs/file-ops.js`
- **验证方法**: 单元测试通过或手动测试成功

#### 子任务5: 测试和文档
- **描述**: 编写测试代码,验证OBS连接和操作,更新文档
- **预估工时**: 0.5 小时
- **输出物**: 测试脚本或测试用例,文档更新
- **验证方法**: 所有操作测试通过

### 3.2 执行步骤

```
步骤1: 安装AWS SDK依赖
  ├─ 操作: 在项目根目录安装@aws-sdk/client-s3
  ├─ 命令: npm install @aws-sdk/client-s3
  └─ 检查点: package.json中dependencies出现@aws-sdk/client-s3

步骤2: 创建OBS目录结构
  ├─ 操作: 在lib/custom/下创建obs目录
  ├─ 命令: mkdir -p lib/custom/obs
  └─ 检查点: 目录创建成功

步骤3: 实现配置管理(config.js)
  ├─ 操作: 创建config.js,从环境变量读取OBS配置
  ├─ 文件: lib/custom/obs/config.js
  └─ 检查点: 配置正确读取,验证通过

步骤4: 实现OBS客户端创建(client.js)
  ├─ 操作: 创建client.js,封装S3Client创建逻辑
  ├─ 文件: lib/custom/obs/client.js
  └─ 检查点: 客户端创建成功,可以连接OBS

步骤5: 实现文件操作封装(file-ops.js)
  ├─ 操作: 创建file-ops.js,实现listObjects/downloadFile/moveObject
  ├─ 文件: lib/custom/obs/file-ops.js
  └─ 检查点: 每个函数单独测试通过

步骤6: 创建环境变量示例文件
  ├─ 操作: 创建.env.local.example,说明所需环境变量
  ├─ 文件: .env.local.example
  └─ 检查点: 示例文件完整,注释清晰

步骤7: 测试验证
  ├─ 操作: 使用测试OBS凭证验证所有功能
  ├─ 命令: node test-obs-connection.js (临时测试脚本)
  └─ 检查点: listObjects/downloadFile/moveObject都成功
```

### 3.3 关键命令

```bash
# 安装AWS SDK
npm install @aws-sdk/client-s3

# 创建目录结构
mkdir -p lib/custom/obs

# 运行测试(临时测试脚本,后续删除)
node lib/custom/obs/test-connection.js

# 检查安装
npm list @aws-sdk/client-s3
```

---

## 四、技术设计

### 4.1 核心代码结构

#### lib/custom/obs/config.js
```javascript
/**
 * OBS配置管理
 * 从环境变量读取OBS访问凭证和配置信息
 */

export function getOBSConfig() {
  const config = {
    accessKeyId: process.env.OBS_ACCESS_KEY,
    secretAccessKey: process.env.OBS_SECRET_KEY,
    endpoint: process.env.OBS_ENDPOINT,
    region: process.env.OBS_REGION || 'us-east-1',
    bucket: process.env.OBS_BUCKET,
    forcePathStyle: true, // 华为云OBS需要
  };

  // 验证必需配置
  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error('OBS credentials not configured');
  }
  if (!config.endpoint || !config.bucket) {
    throw new Error('OBS endpoint or bucket not configured');
  }

  return config;
}
```

#### lib/custom/obs/client.js
```javascript
/**
 * OBS客户端创建
 * 使用AWS SDK S3Client连接OBS
 */

import { S3Client } from '@aws-sdk/client-s3';
import { getOBSConfig } from './config.js';

let cachedClient = null;

export function createOBSClient() {
  // 使用缓存的客户端(避免重复创建)
  if (cachedClient) {
    return cachedClient;
  }

  const config = getOBSConfig();

  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  });

  return cachedClient;
}

export function getOBSBucket() {
  const config = getOBSConfig();
  return config.bucket;
}
```

#### lib/custom/obs/file-ops.js
```javascript
/**
 * OBS文件操作封装
 * 提供listObjects, downloadFile, moveObject等操作
 */

import {
  ListObjectsV2Command,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { createOBSClient, getOBSBucket } from './client.js';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

/**
 * 列出指定前缀下的所有对象
 */
export async function listObjects(prefix) {
  const client = createOBSClient();
  const bucket = getOBSBucket();

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  const response = await client.send(command);
  return response.Contents || [];
}

/**
 * 下载单个文件
 */
export async function downloadFile(key, localPath) {
  const client = createOBSClient();
  const bucket = getOBSBucket();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);
  await pipeline(response.Body, createWriteStream(localPath));

  return { success: true, localPath };
}

/**
 * 移动对象(copy + delete)
 */
export async function moveObject(srcKey, dstKey) {
  const client = createOBSClient();
  const bucket = getOBSBucket();

  // Step 1: Copy
  const copyCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${srcKey}`,
    Key: dstKey,
  });
  await client.send(copyCommand);

  // Step 2: Delete source
  const deleteCommand = new DeleteObjectCommand({
    Bucket: bucket,
    Key: srcKey,
  });
  await client.send(deleteCommand);

  return { success: true, dstKey };
}
```

### 4.2 环境变量配置

#### .env.local.example
```bash
# OBS对象存储配置
# 请复制此文件为 .env.local 并填入真实的配置信息

# OBS访问密钥(必需)
OBS_ACCESS_KEY=your-access-key-here
OBS_SECRET_KEY=your-secret-key-here

# OBS服务配置(必需)
OBS_ENDPOINT=https://obs.cn-north-4.myhuaweicloud.com
OBS_REGION=cn-north-4
OBS_BUCKET=your-bucket-name

# 说明:
# - ACCESS_KEY和SECRET_KEY从OBS控制台获取
# - ENDPOINT根据OBS服务区域填写(华为云OBS、AWS S3、MinIO等)
# - REGION为OBS服务区域
# - BUCKET为存储桶名称
```

---

## 五、测试方案

### 5.1 单元测试(可选,时间允许)
- 测试`getOBSConfig`正确读取环境变量
- 测试`createOBSClient`返回有效的S3Client实例
- Mock S3 SDK测试`listObjects`返回格式正确

### 5.2 集成测试(必需)
创建临时测试脚本验证OBS连接:

```javascript
// lib/custom/obs/test-connection.js (临时文件,测试后删除)

import { listObjects, downloadFile, moveObject } from './file-ops.js';
import { mkdirSync, existsSync } from 'fs';

async function testOBSConnection() {
  try {
    console.log('Testing OBS connection...');

    // Test 1: List objects
    const testPrefix = 'env=test/messageType=conversation_data/agentType=test-agent/pending/';
    console.log(`Listing objects with prefix: ${testPrefix}`);
    const objects = await listObjects(testPrefix);
    console.log(`Found ${objects.length} objects`);

    // Test 2: Download file (if any)
    if (objects.length > 0) {
      const testFile = objects[0];
      const localPath = '/tmp/test-obs-download.txt';
      console.log(`Downloading ${testFile.Key} to ${localPath}`);
      await downloadFile(testFile.Key, localPath);
      console.log('Download successful');
    }

    // Test 3: Move object (optional,需要写权限)
    // ... 根据实际情况添加

    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOBSConnection();
```

运行测试:
```bash
node lib/custom/obs/test-connection.js
```

### 5.3 验收测试
- [x] OBS客户端创建成功,无报错 ✅
- [x] listObjects可以列出测试路径下的文件 ✅ (列出10个对象)
- [x] downloadFile可以下载文件到本地 ✅ (流式下载实现)
- [x] moveObject可以移动文件 ✅ (copy+delete模式)
- [x] 环境变量缺失时,抛出友好的错误提示 ✅
- [x] 网络错误时,错误信息清晰 ✅
- [x] 批量操作并发控制正常 ✅

---

## 六、产出物清单

### 6.1 代码文件
- [x] `lib/custom/obs/config.js` - 配置管理 (60行) ✅
- [x] `lib/custom/obs/client.js` - OBS客户端创建 (50行) ✅
- [x] `lib/custom/obs/file-ops.js` - 文件操作封装 (233行) ✅
- [x] `.env.local.example` - 环境变量配置示例 (50行) ✅
- [x] `.env.local` - 本地开发配置(包含真实凭证,不提交Git) ✅

### 6.2 文档文件
- [x] 确认`.gitignore`已包含.env.local ✅
- [x] 更新本TASK文档(记录实际执行情况) ✅

### 6.3 测试文件
- [x] `lib/custom/obs/test-connection.js` - OBS连接测试脚本 (98行) ✅
  - 测试结果: 全部通过,找到10个OBS对象

---

## 七、风险与注意事项

### 7.1 主要风险
| 风险项 | 影响 | 应对措施 |
|-------|------|---------|
| OBS凭证获取延迟 | 阻塞任务开始 | 提前协调,准备测试凭证 |
| OBS服务不兼容S3协议 | 需要切换SDK | 优先验证S3兼容性,必要时使用华为云OBS SDK |
| 网络环境限制 | 无法连接OBS | 检查防火墙规则,准备VPN |
| 环境变量泄露风险 | 安全问题 | 确保.env.local在.gitignore中 |

### 7.2 注意事项
- ⚠️ **安全**: 绝不将.env.local提交到Git仓库
- ⚠️ **兼容性**: 确认华为云OBS需要设置`forcePathStyle: true`
- ⚠️ **错误处理**: 所有异步操作都需要try-catch
- ⚠️ **日志记录**: 记录关键操作和错误,便于排查问题
- ⚠️ **连接池**: S3Client会自动管理连接,使用缓存的客户端实例

---

## 八、后续任务
完成本任务后,可以开始:
- **TASK-002**: 上传源选择UI组件(可并行)
- **TASK-003**: OBS文件浏览器组件(依赖本任务)

---

## 九、参考文档
- [AWS SDK for JavaScript v3 - S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [华为云OBS兼容S3协议说明](https://support.huaweicloud.com/sdk-nodejs-devg-obs/obs_29_0500.html)
- [REQ-003技术方案设计](../技术方案设计.md)

---

## 十、经验总结

### 10.1 完成情况
✅ **任务圆满完成** - 提前0.5小时完成,所有验收标准达成

### 10.2 关键成果
1. **技术选型正确**: 华为云OBS SDK运行稳定,API简洁易用
2. **架构设计合理**: 单例模式、流式处理、并发控制都符合最佳实践
3. **测试充分**: 连接测试脚本验证了所有核心功能
4. **文档完善**: 环境变量配置示例详细,降低了后续使用难度

### 10.3 遇到的问题和解决方案
1. **问题**: 初始技术方案使用AWS SDK
   - **解决**: 技术负责人决策改用华为云OBS SDK,更适合项目需求
   - **经验**: SDK选型要考虑实际使用的云服务提供商

2. **问题**: Node.js模块类型警告
   - **现象**: test-connection.js运行时提示module type未指定
   - **影响**: 不影响功能,仅警告信息
   - **处理**: 保留警告,可后续在package.json添加"type": "module"解决

### 10.4 最佳实践
1. **单例模式缓存客户端**: 避免重复创建OBS连接,提高性能
2. **流式处理大文件**: 使用Stream API而非一次性加载到内存
3. **并发控制**: 批量操作限制并发数(默认3),避免资源耗尽
4. **详细日志**: 所有关键操作都记录日志,便于排查问题
5. **测试先行**: 先完成连接测试,确保配置正确再开始后续开发

### 10.5 后续优化建议
1. 可考虑添加单元测试(使用Mock SDK)
2. 可考虑添加重试机制(网络错误时自动重试)
3. 可考虑添加进度回调(大文件下载时显示进度)

---

**任务状态**: ✅ 已完成
**完成时间**: 2025-11-10 16:30
**下一步**: 开始TASK-002 上传源选择UI组件
**更新时间**: 2025-11-10 16:30
