/**
 * OBS连接测试脚本
 * 用于验证OBS配置是否正确
 *
 * 运行方式: node lib/custom/obs/test-connection.js
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { listObjects } from './file-ops.js';
import { createOBSClient, getOBSBucket } from './client.js';
import { isOBSConfigured } from './config.js';

// 加载.env.local配置
config({ path: resolve(process.cwd(), '.env.local') });

async function testOBSConnection() {
  console.log('==========================================');
  console.log('🧪 OBS连接测试');
  console.log('==========================================\n');

  try {
    // 1. 检查配置
    console.log('1️⃣ 检查OBS配置...');
    if (!isOBSConfigured()) {
      throw new Error('OBS配置不完整,请检查.env.local文件');
    }
    console.log('✅ OBS配置完整\n');

    // 2. 创建OBS客户端
    console.log('2️⃣ 创建OBS客户端...');
    const client = createOBSClient();
    const bucket = getOBSBucket();
    console.log(`✅ OBS客户端创建成功`);
    console.log(`   Bucket: ${bucket}\n`);

    // 3. 测试列出对象 (列出根目录)
    console.log('3️⃣ 测试列出对象...');
    console.log('   尝试列出bucket根目录的文件...');

    const objects = await listObjects('', { maxKeys: 10 });
    console.log(`✅ 列出对象成功`);
    console.log(`   找到 ${objects.length} 个对象 (最多显示10个)`);

    if (objects.length > 0) {
      console.log('\n   📁 前5个对象:');
      objects.slice(0, 5).forEach((obj, index) => {
        const sizeKB = (obj.size / 1024).toFixed(2);
        console.log(`   ${index + 1}. ${obj.key}`);
        console.log(`      大小: ${sizeKB} KB`);
        console.log(`      修改时间: ${obj.lastModified}`);
      });
    }

    console.log('\n==========================================');
    console.log('✅ OBS连接测试全部通过!');
    console.log('==========================================\n');

    console.log('💡 提示:');
    console.log('   - OBS配置正确,可以开始开发');
    console.log('   - 测试完成后可以删除本文件');
    console.log('   - 下一步: 开始TASK-002开发\n');
  } catch (error) {
    console.error('\n==========================================');
    console.error('❌ OBS连接测试失败!');
    console.error('==========================================\n');
    console.error('错误信息:', error.message);

    if (error.message.includes('credentials not configured')) {
      console.error('\n💡 解决方案:');
      console.error('   1. 检查.env.local文件是否存在');
      console.error('   2. 确认OBS_ACCESS_KEY和OBS_SECRET_KEY配置正确');
      console.error('   3. 确认OBS_ENDPOINT和OBS_BUCKET配置正确');
    } else if (error.message.includes('InvalidAccessKeyId')) {
      console.error('\n💡 解决方案:');
      console.error('   - AccessKey ID不正确,请检查OBS_ACCESS_KEY配置');
    } else if (error.message.includes('SignatureDoesNotMatch')) {
      console.error('\n💡 解决方案:');
      console.error('   - Secret Access Key不正确,请检查OBS_SECRET_KEY配置');
    } else if (error.message.includes('NoSuchBucket')) {
      console.error('\n💡 解决方案:');
      console.error('   - Bucket不存在,请检查OBS_BUCKET配置');
      console.error('   - 确认bucket名称拼写正确');
    } else {
      console.error('\n💡 请检查:');
      console.error('   - 网络连接是否正常');
      console.error('   - OBS服务是否可访问');
      console.error('   - 防火墙设置');
    }

    console.error('\n详细错误:', error);
    process.exit(1);
  }
}

// 运行测试
testOBSConnection();
