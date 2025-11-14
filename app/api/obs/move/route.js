/**
 * OBS文件移动API
 * 将文件从pending目录移动到completed目录
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-005 文件移动功能
 */

import { NextResponse } from 'next/server';
import { moveObjectsBatch } from '@/lib/custom/obs/file-ops';

/**
 * POST /api/obs/move
 * 批量移动文件from pending to completed
 */
export async function POST(request) {
  try {
    const { files } = await request.json();

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'files is required' }, { status: 400 });
    }

    console.log(`[OBS Move API] 准备移动 ${files.length} 个文件`);

    // 构建移动任务列表
    const moveTasks = files
      .filter(file => file.obsKey) // 确保有obsKey
      .map(file => {
        const srcKey = file.obsKey;
        // 将pending替换为completed
        const dstKey = srcKey.replace('/pending/', '/completed/');

        return { srcKey, dstKey, fileName: file.fileName };
      });

    if (moveTasks.length === 0) {
      console.log('[OBS Move API] 没有有效的移动任务');
      return NextResponse.json({
        success: true,
        successes: [],
        failures: [],
        message: 'No valid move tasks',
      });
    }

    console.log(`[OBS Move API] 开始移动 ${moveTasks.length} 个文件`);

    // 调用TASK-001的批量移动函数
    const result = await moveObjectsBatch(moveTasks);

    console.log(
      `[OBS Move API] 移动完成: 成功${result.successes.length}, 失败${result.failures.length}`
    );

    // 记录失败的文件
    if (result.failures.length > 0) {
      console.error('[OBS Move API] 以下文件移动失败:');
      result.failures.forEach(failure => {
        console.error(`  - ${failure.fileName || failure.srcKey}: ${failure.error}`);
      });
    }

    return NextResponse.json({
      success: true,
      successes: result.successes,
      failures: result.failures,
      summary: {
        total: moveTasks.length,
        succeeded: result.successes.length,
        failed: result.failures.length,
      },
    });
  } catch (error) {
    console.error('[OBS Move API] 移动文件失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
