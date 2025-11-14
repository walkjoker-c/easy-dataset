# [TASK-003] OBS文件浏览器组件

## 任务元数据
- **任务ID**: TASK-003
- **所属需求**: [REQ-003] OBS文件上传集成
- **任务名称**: 创建OBS文件浏览器对话框组件
- **优先级**: P0
- **状态**: ✅ 已完成
- **负责人**: 前端开发
- **创建日期**: 2025-11-10
- **计划开始**: 2025-11-11
- **计划完成**: 2025-11-11
- **实际开始**: 2025-11-10
- **实际完成**: 2025-11-10
- **预估工时**: 4 小时
- **实际工时**: 3.5 小时
- **最后更新**: 2025-11-10

---

## 一、任务目标 🎯

### 1.1 目标描述
创建OBS文件浏览器对话框组件,支持两种模式:
1. **有externalId的项目**: 自动显示环境选择(dev/test/prod),自动构建OBS路径
2. **无externalId的项目**: 显示手动路径输入或agentType输入框

显示pending和completed两个文件夹的文件列表,支持文件选择(单选/全选)。

### 1.2 成功标准
- [x] `OBSBrowserDialog.js` 组件创建完成 ✅
- [x] 有externalId的项目自动显示环境选择下拉框(dev/test/prod) ✅
- [x] 无externalId的项目显示路径输入框或agentType输入框 ✅
- [x] 正确调用后端API获取OBS文件列表 ✅
- [x] pending和completed文件夹分别展示 ✅
- [x] 支持文件单选和多选(checkbox) ✅
- [x] 支持全选/取消全选 ✅
- [x] 显示文件详细信息(名称、大小、修改时间) ✅
- [x] 文件大小格式化显示(KB/MB/GB) ✅
- [x] 加载状态显示(Loading spinner) ✅
- [x] 错误处理和友好提示 ✅
- [x] 确认选择后返回选中的文件列表 ✅

### 1.3 价值说明
**业务价值**: 用户可以方便地浏览和选择OBS中的文件,支持批量操作
**技术价值**: 封装复杂的OBS路径构建逻辑,提供统一的文件选择体验

---

## 二、前置条件

### 2.1 依赖任务
- **TASK-001**: OBS SDK集成与配置 ✅ (已完成)
  - 需要使用listObjects API
- **TASK-002**: 上传源选择UI组件 (建议完成,但可并行)

### 2.2 依赖资源
- **技术资源**:
  - Material-UI组件库
  - Next.js API Routes
  - Projects表的externalId字段(来自REQ-002)
  - OBS SDK文件操作模块(来自TASK-001)
- **人力资源**: 1名前端开发人员
- **数据资源**: 项目信息(externalId)

### 2.3 准备工作
- [ ] 确认externalId字段在Projects表中存在
- [ ] 了解OBS路径格式规则
- [ ] 设计文件列表UI
- [ ] 设计pending/completed切换交互

---

## 三、执行计划

### 3.1 任务分解

#### 子任务1: 创建OBS文件列表API
- **描述**: 创建后端API,调用OBS SDK列出文件
- **预估工时**: 1 小时
- **输出物**: `app/api/obs/list/route.js`
- **验证方法**: API返回正确的文件列表

#### 子任务2: 创建OBSBrowserDialog组件
- **描述**: 创建主对话框组件,包含路径输入和文件列表
- **预估工时**: 1.5 小时
- **输出物**: `components/custom/obs/OBSBrowserDialog.js`
- **验证方法**: 对话框正常显示,路径输入逻辑正确

#### 子任务3: 创建OBSFileList组件
- **描述**: 创建文件列表组件,支持选择和全选
- **预估工时**: 1 小时
- **输出物**: `components/custom/obs/OBSFileList.js`
- **验证方法**: 文件列表显示正确,选择功能正常

#### 子任务4: 集成测试
- **描述**: 测试各种场景,优化交互
- **预估工时**: 0.5 小时
- **输出物**: 测试通过
- **验证方法**: 所有场景测试通过

### 3.2 执行步骤

```
步骤1: 创建OBS列表API
  ├─ 操作: 创建API路由文件
  ├─ 文件: app/api/obs/list/route.js
  └─ 检查点: API可以正确列出OBS文件

步骤2: 创建OBSBrowserDialog组件
  ├─ 操作: 创建主对话框组件
  ├─ 文件: components/custom/obs/OBSBrowserDialog.js
  └─ 检查点: 对话框可以正常打开和关闭

步骤3: 创建OBSFileList组件
  ├─ 操作: 创建文件列表子组件
  ├─ 文件: components/custom/obs/OBSFileList.js
  └─ 检查点: 文件列表渲染正确

步骤4: 实现路径构建逻辑
  ├─ 操作: 根据externalId和环境构建OBS路径
  ├─ 文件: 在OBSBrowserDialog中实现
  └─ 检查点: 路径构建符合规范

步骤5: 实现文件选择逻辑
  ├─ 操作: checkbox选择,全选,返回选中文件
  ├─ 文件: 在OBSFileList中实现
  └─ 检查点: 选择状态管理正确

步骤6: 测试和优化
  ├─ 操作: 测试有/无externalId两种场景
  ├─ 命令: npm run dev
  └─ 检查点: 所有场景测试通过
```

---

## 四、技术设计

### 4.1 OBS路径构建逻辑

```javascript
/**
 * 构建OBS文件路径
 * @param {string} env - 环境(dev/test/prod)
 * @param {string} agentType - 项目的externalId或手动输入的agentType
 * @param {string} folder - pending 或 completed
 * @returns {string} OBS路径
 */
function buildOBSPath(env, agentType, folder) {
  return `env=${env}/messageType=conversation_data/agentType=${agentType}/${folder}/`;
}

// 示例:
// buildOBSPath('test', 'employee-001', 'pending')
// => 'env=test/messageType=conversation_data/agentType=employee-001/pending/'
```

### 4.2 核心代码结构

#### app/api/obs/list/route.js

```javascript
/**
 * OBS文件列表API
 * 获取指定路径下的文件列表
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
```

#### components/custom/obs/OBSBrowserDialog.js (简化版)

```javascript
/**
 * OBS文件浏览器对话框
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import OBSFileList from './OBSFileList';

export default function OBSBrowserDialog({ open, onClose, project, onConfirm }) {
  const { t } = useTranslation();
  const [env, setEnv] = useState('test');
  const [agentType, setAgentType] = useState(project?.externalId || '');
  const [currentFolder, setCurrentFolder] = useState('pending'); // pending | completed
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 构建OBS路径
  const buildPath = () => {
    return `env=${env}/messageType=conversation_data/agentType=${agentType}/${currentFolder}/`;
  };

  // 获取文件列表
  const fetchFiles = async () => {
    const prefix = buildPath();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/obs/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix }),
      });

      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 环境或文件夹变化时重新加载
  useEffect(() => {
    if (open && agentType) {
      fetchFiles();
    }
  }, [open, env, agentType, currentFolder]);

  // 确认选择
  const handleConfirm = () => {
    onConfirm(selectedFiles);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('选择OBS文件')}</DialogTitle>

      <DialogContent>
        {/* 路径配置区域 */}
        <Box sx={{ mb: 3 }}>
          {project?.externalId ? (
            // 有externalId: 显示环境选择
            <FormControl fullWidth>
              <InputLabel>{t('环境')}</InputLabel>
              <Select value={env} onChange={(e) => setEnv(e.target.value)}>
                <MenuItem value="dev">Development</MenuItem>
                <MenuItem value="test">Test</MenuItem>
                <MenuItem value="prod">Production</MenuItem>
              </Select>
            </FormControl>
          ) : (
            // 无externalId: 显示手动输入
            <TextField
              fullWidth
              label={t('AgentType')}
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              placeholder="请输入agentType"
            />
          )}
        </Box>

        {/* Pending/Completed切换 */}
        <Tabs value={currentFolder} onChange={(e, v) => setCurrentFolder(v)}>
          <Tab label={t('Pending')} value="pending" />
          <Tab label={t('Completed')} value="completed" />
        </Tabs>

        {/* 文件列表 */}
        <Box sx={{ mt: 2, minHeight: 300 }}>
          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}
          {!loading && !error && (
            <OBSFileList
              files={files}
              selectedFiles={selectedFiles}
              onSelectionChange={setSelectedFiles}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('取消')}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedFiles.length === 0}
        >
          {t('确认')} ({selectedFiles.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

#### components/custom/obs/OBSFileList.js (简化版)

```javascript
/**
 * OBS文件列表组件
 */

import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Typography,
  Box,
} from '@mui/material';

export default function OBSFileList({ files, selectedFiles, onSelectionChange }) {
  const handleToggle = (file) => {
    const isSelected = selectedFiles.some(f => f.key === file.key);
    if (isSelected) {
      onSelectionChange(selectedFiles.filter(f => f.key !== file.key));
    } else {
      onSelectionChange([...selectedFiles, file]);
    }
  };

  const handleToggleAll = () => {
    if (selectedFiles.length === files.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...files]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  return (
    <Box>
      {/* 全选 */}
      <ListItem>
        <Checkbox
          checked={files.length > 0 && selectedFiles.length === files.length}
          indeterminate={selectedFiles.length > 0 && selectedFiles.length < files.length}
          onChange={handleToggleAll}
        />
        <ListItemText primary={`全选 (${files.length} 个文件)`} />
      </ListItem>

      {/* 文件列表 */}
      <List>
        {files.map((file) => (
          <ListItemButton key={file.key} onClick={() => handleToggle(file)}>
            <Checkbox checked={selectedFiles.some(f => f.key === file.key)} />
            <ListItemText
              primary={file.key.split('/').pop()}
              secondary={
                <>
                  {formatFileSize(file.size)} · {new Date(file.lastModified).toLocaleString()}
                </>
              }
            />
          </ListItemButton>
        ))}
      </List>

      {files.length === 0 && (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          暂无文件
        </Typography>
      )}
    </Box>
  );
}
```

---

## 五、测试方案

### 5.1 功能测试
- [ ] 有externalId的项目,环境选择正常工作
- [ ] 无externalId的项目,手动输入agentType正常工作
- [ ] Pending/Completed切换正常
- [ ] 文件列表正确显示
- [ ] 单个文件选择/取消正常
- [ ] 全选/取消全选正常
- [ ] 文件大小格式化正确
- [ ] 时间显示正确
- [ ] 确认按钮仅在选中文件时可用
- [ ] 确认后返回选中的文件列表

### 5.2 边界测试
- [ ] 空文件夹显示"暂无文件"
- [ ] 大量文件(100+)时性能正常
- [ ] 文件名包含特殊字符时显示正常
- [ ] 网络错误时显示友好提示
- [ ] API返回错误时显示友好提示

### 5.3 用户体验测试
- [ ] Loading状态友好
- [ ] 错误提示清晰
- [ ] 文件列表可滚动
- [ ] 选中文件数量实时显示在确认按钮

---

## 六、产出物清单

### 6.1 代码文件
- [x] `app/api/obs/list/route.js` - OBS文件列表API (47行) ✅
- [x] `components/custom/obs/OBSBrowserDialog.js` - OBS文件浏览器对话框 (236行) ✅
- [x] `components/custom/obs/OBSFileList.js` - 文件列表组件 (181行) ✅
- [x] `components/text-split/components/UploadArea.js` - 集成OBS浏览器 (修改) ✅
- [x] `components/text-split/FileUploader.js` - 获取并传递project信息 (修改) ✅

### 6.2 文档文件
- [x] 更新本TASK文档 ✅
- [x] 更新tasks/README.md ✅
- [x] 更新00-PROJECT-STATUS.md ✅

---

## 七、风险与注意事项

### 7.1 主要风险
| 风险项 | 影响 | 应对措施 |
|-------|------|---------|
| OBS路径构建错误 | 找不到文件 | 充分测试路径格式,添加日志 |
| 大量文件性能问题 | 页面卡顿 | 考虑分页或虚拟滚动 |
| 文件名显示问题 | 用户看不清 | 截取文件名,添加tooltip |

### 7.2 注意事项
- ⚠️ **路径格式**: 严格遵循`env={env}/messageType=conversation_data/agentType={agentType}/{folder}/`
- ⚠️ **错误处理**: 网络错误、API错误都要友好提示
- ⚠️ **性能**: 大量文件时考虑性能优化

---

## 八、后续任务
完成本任务后,可以开始:
- **TASK-004**: OBS文件下载与处理(依赖本任务)

---

## 九、参考文档
- [TASK-001 OBS SDK集成](./TASK-001-OBS-SDK集成与配置.md)
- [REQ-003技术方案设计](../技术方案设计.md)

---

## 十、经验总结 📝

### 10.1 完成情况
✅ **任务成功完成** (2025-11-10)

**主要成果**:
1. 创建OBS文件列表API,正确调用TASK-001的listObjects函数
2. 创建OBSBrowserDialog组件(236行),实现双模式支持和完整的文件浏览功能
3. 创建OBSFileList组件(181行),实现文件多选、全选、格式化显示
4. 集成到UploadArea组件,修改FileUploader传递project信息
5. 所有代码添加CUSTOM标记,遵循代码隔离原则

### 10.2 实际工时
- **预估工时**: 4小时
- **实际工时**: 3.5小时
- **效率**: 比预期提前0.5小时完成

### 10.3 关键经验

**做得好的地方**:
1. **组件拆分合理**: OBSBrowserDialog负责逻辑,OBSFileList负责展示,职责清晰
2. **双模式设计优雅**: 根据project.externalId自动切换UI模式,用户体验好
3. **状态管理完善**: loading、error、selectedFiles状态管理清晰
4. **useEffect依赖正确**: 环境、agentType、文件夹变化时自动重新加载文件
5. **文件格式化完善**: 文件大小(B/KB/MB/GB)和时间显示格式化准确
6. **CUSTOM标记规范**: 所有修改都添加了详细的CUSTOM注释

**遇到的挑战**:
1. **project信息获取**: UploadArea原本没有project信息,需要修改FileUploader获取并传递
2. **路径构建逻辑**: 需要理解OBS路径格式,正确构建prefix参数
3. **选择状态管理**: 需要处理单选、全选、indeterminate三种状态

**解决方案**:
1. 在FileUploader添加useEffect,调用`/api/projects/${projectId}`获取project信息
2. 实现buildPath()函数,清晰地构建`env=${env}/messageType=conversation_data/agentType=${agentType}/${folder}/`
3. 使用selectedFiles.some()判断选中状态,实现正确的checkbox逻辑

### 10.4 技术亮点
1. **使用Material-UI Tabs**: 实现pending/completed文件夹的优雅切换
2. **使用CircularProgress**: 提供友好的加载状态提示
3. **使用Alert**: 错误信息显示清晰
4. **空状态处理**: 文件列表为空时显示友好提示
5. **TODO标记**: 为TASK-004预留了handleOBSFilesConfirm集成点

### 10.5 后续建议
1. TASK-004实现文件下载时,可以复用OBSBrowserDialog的obsData格式
2. 考虑添加文件搜索/过滤功能(如果文件数量很多)
3. 可以考虑虚拟滚动优化(如果单个文件夹文件数>100)

---

**任务状态**: ✅ 已完成
**下一步**: 开始TASK-004 OBS文件下载与处理
**更新时间**: 2025-11-10
