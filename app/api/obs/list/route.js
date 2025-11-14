/**
 * OBS文件列表API
 * 获取指定路径下的文件列表
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-003 OBS文件浏览器组件
 */

import { NextResponse } from 'next/server';
import { listObjects } from '@/lib/custom/obs/file-ops';

export async function POST(request) {
  try {
    const { prefix } = await request.json();

    if (!prefix) {
      return NextResponse.json(
        { error: 'prefix is required' },
        { status: 400 }
      );
    }

    console.log(`[OBS API] 列出文件: prefix=${prefix}`);

    const objects = await listObjects(prefix);

    console.log(`[OBS API] 找到 ${objects.length} 个文件`);

    return NextResponse.json({
      success: true,
      files: objects,
      count: objects.length,
    });
  } catch (error) {
    console.error('[OBS API] 列出文件失败:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
