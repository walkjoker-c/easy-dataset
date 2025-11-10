# [TASK-005] 文件移动功能(pending→completed)

## 任务元数据
- **任务ID**: TASK-005
- **所属需求**: [REQ-003] OBS文件上传集成
- **任务名称**: 实现文件处理完成后自动移动功能
- **优先级**: P1
- **状态**: 待开始
- **负责人**: 开发人员
- **创建日期**: 2025-11-10
- **计划开始**: 2025-11-13
- **计划完成**: 2025-11-13
- **实际开始**: -
- **实际完成**: -
- **预估工时**: 3 小时
- **实际工时**: -
- **最后更新**: 2025-11-10

---

## 一、任务目标 🎯

### 1.1 目标描述
实现文件处理完成后自动将OBS文件从pending目录移动到completed目录的功能,支持批量移动,错误处理和详细日志记录。

### 1.2 成功标准
- [ ] 文件移动API正确实现
- [ ] 文件处理完成后自动调用移动API
- [ ] 移动操作使用copy+delete模式(TASK-001已实现)
- [ ] 支持批量移动
- [ ] 移动失败不影响文件处理结果(仅记录日志)
- [ ] 详细的错误日志记录
- [ ] 移动状态可追踪
- [ ] 仅移动来自OBS的文件(本地文件不移动)

### 1.3 价值说明
**业务价值**: 自动化文件管理,已处理的文件归档到completed目录,pending目录保持整洁
**技术价值**: 实现OBS文件生命周期管理,便于追踪文件处理状态

---

## 二、前置条件

### 2.1 依赖任务
- **TASK-001**: OBS SDK集成与配置 ✅ (已完成)
  - 需要使用moveObject和moveObjectsBatch
- **TASK-004**: OBS文件下载与处理 (必须完成)
  - 需要知道哪些文件来自OBS

### 2.2 依赖资源
- **技术资源**:
  - OBS SDK移动模块(来自TASK-001)
  - 文件处理完成回调机制
- **人力资源**: 1名开发人员

### 2.3 准备工作
- [ ] 了解文件处理完成的回调机制
- [ ] 确认如何标识OBS来源的文件
- [ ] 设计移动失败的处理策略

---

## 三、执行计划

### 3.1 任务分解

#### 子任务1: 创建文件移动API
- **描述**: 创建移动API,支持单个和批量移动
- **预估工时**: 1 小时
- **输出物**: `app/api/obs/move/route.js`
- **验证方法**: API可以正确移动文件

#### 子任务2: 实现自动移动逻辑
- **描述**: 在文件处理完成回调中添加移动逻辑
- **预估工时**: 1 小时
- **输出物**: 修改文件处理完成回调
- **验证方法**: 文件处理完成后自动移动

#### 子任务3: 添加日志和错误处理
- **描述**: 详细记录移动操作和失败原因
- **预估工时**: 0.5 小时
- **输出物**: 完善的日志系统
- **验证方法**: 日志清晰,错误易排查

#### 子任务4: 测试和优化
- **描述**: 测试各种场景,优化性能
- **预估工时**: 0.5 小时
- **输出物**: 测试通过
- **验证方法**: 所有场景测试通过

### 3.2 执行步骤

```
步骤1: 创建移动API
  ├─ 操作: 创建app/api/obs/move/route.js
  ├─ 文件: app/api/obs/move/route.js
  └─ 检查点: API可以移动文件

步骤2: 标识OBS文件
  ├─ 操作: 在文件导入时添加OBS标记
  ├─ 文件: lib/custom/obs/file-import.js
  └─ 检查点: 可以区分OBS文件和本地文件

步骤3: 实现自动移动
  ├─ 操作: 在文件处理完成回调中调用移动API
  ├─ 文件: 文件处理回调逻辑
  └─ 检查点: 处理完成后自动移动

步骤4: 添加日志
  ├─ 操作: 记录移动操作和结果
  ├─ 文件: 日志模块
  └─ 检查点: 日志详细清晰

步骤5: 测试
  ├─ 操作: 测试单个、批量、失败场景
  ├─ 命令: npm run dev
  └─ 检查点: 所有场景测试通过
```

---

## 四、技术设计

### 4.1 核心代码结构

#### app/api/obs/move/route.js

```javascript
/**
 * OBS文件移动API
 * 将文件从pending移动到completed
 */

import { NextResponse } from 'next/server';
import { moveObjectsBatch } from '@/lib/custom/obs/file-ops';

export async function POST(request) {
  try {
    const { files, env, agentType } = await request.json();

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'files is required' },
        { status: 400 }
      );
    }

    console.log(`[OBS API] 移动 ${files.length} 个文件`);

    // 构建移动任务列表
    const moveTasks = files.map(file => {
      // 从pending路径构建completed路径
      const srcKey = file.obsKey; // env=test/.../pending/file.txt
      const dstKey = srcKey.replace('/pending/', '/completed/');

      return { srcKey, dstKey };
    });

    // 批量移动
    const result = await moveObjectsBatch(moveTasks);

    console.log(
      `[OBS API] 移动完成: 成功${result.successes.length}, 失败${result.failures.length}`
    );

    return NextResponse.json({
      success: true,
      successes: result.successes,
      failures: result.failures,
    });
  } catch (error) {
    console.error('[OBS API] 移动文件失败:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

#### 修改文件处理完成回调

```javascript
// 在文件处理完成回调中添加移动逻辑

async function onFileProcessingComplete(processedFiles) {
  // 筛选出来自OBS的文件
  const obsFiles = processedFiles.filter(file => file._fromOBS);

  if (obsFiles.length === 0) {
    console.log('[File Processing] 无OBS文件需要移动');
    return;
  }

  console.log(`[File Processing] ${obsFiles.length} 个OBS文件需要移动到completed`);

  try {
    // 调用移动API
    const response = await fetch('/api/obs/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: obsFiles,
        env: obsFiles[0]._obsEnv,
        agentType: obsFiles[0]._obsAgentType,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(
        `[File Processing] 文件移动完成: 成功${result.successes.length}, 失败${result.failures.length}`
      );

      // 记录失败的文件
      if (result.failures.length > 0) {
        console.error('[File Processing] 以下文件移动失败:');
        result.failures.forEach(failure => {
          console.error(`  - ${failure.srcKey}: ${failure.error}`);
        });
      }
    } else {
      console.error('[File Processing] 文件移动失败:', result.error);
    }
  } catch (error) {
    console.error('[File Processing] 调用移动API失败:', error);
    // 移动失败不影响主流程,仅记录日志
  }
}
```

#### 修改 lib/custom/obs/file-import.js

```javascript
// 在文件导入时添加OBS标记和元信息

export function convertToFileObject(localPath, originalName, obsMetadata) {
  try {
    const buffer = readFileSync(localPath);
    const blob = new Blob([buffer]);
    const file = new File([blob], originalName, {
      type: 'application/octet-stream',
    });

    // 添加OBS元信息
    file._fromOBS = true;
    file._localPath = localPath;
    file._obsKey = obsMetadata.key; // 原始OBS路径
    file._obsEnv = obsMetadata.env;
    file._obsAgentType = obsMetadata.agentType;

    return file;
  } catch (error) {
    console.error('[OBS Import] 文件转换失败:', error);
    throw error;
  }
}
```

### 4.2 流程图

```
用户从OBS导入文件
    ↓
文件下载到本地,标记_fromOBS=true
    ↓
文件显示在待上传区域
    ↓
用户点击"上传"
    ↓
文件处理开始(切分、生成问题等)
    ↓
文件处理完成 ✅
    ↓
触发完成回调 onFileProcessingComplete
    ↓
检查是否有OBS文件(_fromOBS=true)
    ↓
调用 /api/obs/move
    ↓
批量移动 pending → completed
    ↓
记录移动结果日志
    ↓
(移动失败不影响主流程)
```

---

## 五、测试方案

### 5.1 功能测试
- [ ] 单个OBS文件处理完成后自动移动
- [ ] 批量OBS文件处理完成后自动移动
- [ ] 本地文件处理完成后不移动
- [ ] 混合文件(OBS+本地)仅移动OBS文件
- [ ] 移动成功后文件在completed目录可见
- [ ] 移动成功后pending目录文件已删除

### 5.2 异常测试
- [ ] 移动API失败时不影响文件处理结果
- [ ] 部分文件移动失败时其他文件正常移动
- [ ] 网络错误时有友好提示
- [ ] 权限不足时有友好提示
- [ ] 日志清晰记录所有错误

### 5.3 边界测试
- [ ] 移动100个文件性能正常
- [ ] 文件名包含特殊字符时移动正常
- [ ] 重复移动同一文件时正确处理

---

## 六、产出物清单

### 6.1 代码文件
- [ ] `app/api/obs/move/route.js` - OBS文件移动API
- [ ] 修改文件处理完成回调逻辑
- [ ] 修改`lib/custom/obs/file-import.js` - 添加OBS元信息

### 6.2 文档文件
- [ ] 更新本TASK文档
- [ ] 更新tasks/README.md
- [ ] 更新00-PROJECT-STATUS.md

---

## 七、风险与注意事项

### 7.1 主要风险
| 风险项 | 影响 | 应对措施 |
|-------|------|---------|
| 移动失败导致文件丢失 | 数据丢失 | 使用copy+delete,确保copy成功再删除 |
| 移动失败阻塞主流程 | 用户无法继续 | 移动失败仅记录日志,不抛出异常 |
| 批量移动性能问题 | 处理慢 | 串行移动,可考虑异步队列 |

### 7.2 注意事项
- ⚠️ **数据安全**: 使用copy+delete模式,确保copy成功再删除源文件
- ⚠️ **不阻塞主流程**: 移动失败仅记录日志,不影响文件处理结果
- ⚠️ **详细日志**: 记录每个文件的移动结果,便于排查问题
- ⚠️ **仅移动OBS文件**: 通过_fromOBS标记区分,本地文件不移动

---

## 八、后续任务
完成本任务后,可以开始:
- **TASK-006**: 集成测试与优化

---

## 九、参考文档
- [TASK-001 OBS SDK集成](./TASK-001-OBS-SDK集成与配置.md)
- [TASK-004 OBS文件下载与处理](./TASK-004-OBS文件下载与处理.md)
- [REQ-003技术方案设计](../技术方案设计.md)

---

**任务状态**: 待开始
**下一步**: 创建OBS移动API
**更新时间**: 2025-11-10
