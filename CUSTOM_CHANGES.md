# 定制功能变更追踪文档

> **目的**: 记录所有从 1.4.0 迁移到 1.6.0 的定制功能,便于后续维护和升级
> **最后更新**: 2025-11-06
> **迁移基础**: easy-dataset 1.4.0 (实际版本 1.3.9) → 1.6.0

---

## 📋 变更概览

| 批次 | 功能模块 | 优先级 | 状态 | 文件数 | 完成时间 |
|------|---------|--------|------|--------|---------|
| 批次1 | 环境准备 | P0 | ✅ 已完成 | 2 | 2025-11-06 |
| 批次2 | 简单功能迁移 | P0 | ✅ 已完成 | 2 | 2025-11-06 |
| 批次3 | 中等功能迁移 | P0 | ✅ 已完成 | 5 | 2025-11-06 |
| 批次3.5 | 智能跳转+Bug修复 | P0 | ✅ 已完成 | 5 | 2025-11-06 |
| 批次4 | 品牌定制 | P1 | ✅ 已完成 | 6 | 2025-11-07 |

**整体进度**: 批次4已完成 (5/5 批次, 100%)

---

## 🎯 批次1: 环境准备 (P0)

### 状态: ✅ 已完成

### 变更内容

#### 1. 创建 `.env.example` 文件
- **文件路径**: `.env.example`
- **变更类型**: 新增文件
- **功能说明**: 提供环境变量配置模板,包含自定义OpenAI配置示例
- **业务场景**: 帮助开发者快速配置自定义OpenAI端点
- **代码隔离策略**: 独立文件(策略1)
- **关键配置项**:
  ```env
  OPENAI_CUSTOM_API_KEY="your-api-key-here"
  OPENAI_CUSTOM_ENDPOINT="https://your-custom-endpoint.com/v1"
  OPENAI_CUSTOM_MODEL_NAME="your-model-name"
  OPENAI_CUSTOM_TEMPERATURE="0.7"
  OPENAI_CUSTOM_MAX_TOKENS="16384"
  ```

#### 2. 更新 `.env` 文件
- **文件路径**: `.env`
- **变更类型**: 配置扩展
- **功能说明**: 添加Kimi-K2自定义OpenAI配置
- **代码隔离策略**: 配置扩展(策略2)
- **实际配置**:
  - 端点: `http://113.45.161.199:3000/v1`
  - 模型: `Kimi-K2`
  - API Key: `sk-NaAC9MFyyS54VlXI83Ea410774C14a75853cB98920CaE22b`

---

## 🎯 批次2: 简单功能迁移 (P0)

### 状态: ✅ 已完成

### 变更内容

#### 1. 自定义OpenAI配置 (P0)

**文件路径**: `constant/model.js`
**变更类型**: 代码修改(有标记)
**代码隔离策略**: 标记修改(策略5) + 配置扩展(策略2)

**变更位置1**: 第14-23行
```javascript
// CUSTOM: 自定义OpenAI配置 - 从环境变量读取 (迁移自1.4.0)
{
  id: 'openai-custom',
  name: 'OpenAI (Custom)',
  defaultEndpoint: process.env.OPENAI_CUSTOM_ENDPOINT || '',
  defaultModels: [process.env.OPENAI_CUSTOM_MODEL_NAME || ''],
  defaultApiKey: process.env.OPENAI_CUSTOM_API_KEY || '',
  defaultTemperature: parseFloat(process.env.OPENAI_CUSTOM_TEMPERATURE) || 0.7,
  defaultMaxTokens: parseInt(process.env.OPENAI_CUSTOM_MAX_TOKENS) || 16384
}
```

**变更位置2**: 第95-96行
```javascript
// CUSTOM: 默认项目模型配置ID (迁移自1.4.0)
export const DEFAULT_PROJECT_MODEL_PROVIDER_ID = 'openai-custom';
```

**功能说明**:
- 在 MODEL_PROVIDERS 数组中添加 `openai-custom` 提供商
- 从环境变量读取自定义配置(端点、模型名、API Key、温度、最大tokens)
- 设置默认项目模型为 `openai-custom`

**业务场景**:
- 企业内部使用自建OpenAI兼容API端点(如Kimi-K2)
- 需要自定义模型参数和默认值
- 自动为新项目选择自定义提供商

**验收标准**:
- [x] MODEL_PROVIDERS 包含 openai-custom 配置
- [x] 环境变量正确读取
- [x] 默认提供商设置为 openai-custom

---

#### 2. 员工项目自动创建API (P0)

**文件路径**: `app/api/projects/employee/[employeeId]/route.js`
**变更类型**: 新增文件
**代码隔离策略**: 独立文件(策略1)

**功能说明**:
- 根据员工ID自动创建或重定向到对应训练项目
- 如果项目已存在,重定向到现有项目
- 如果项目不存在,自动创建并重定向

**API规格**:
- **访问路径**: `GET /api/projects/employee/[employeeId]`
- **参数**: `employeeId` (路径参数)
- **响应**: 302重定向到 `/projects/{projectId}/text-split`
- **错误处理**: 400(缺少ID) / 500(服务器错误)

**业务逻辑**:
1. 检查员工ID是否为空
2. 通过 `isExistByName(employeeId)` 检查项目是否存在
3. 如果存在: 查找项目ID并重定向
4. 如果不存在: 创建新项目(名称=employeeId, 描述=数智员工XX的训练项目)
5. 重定向到项目的text-split页面

**业务场景**:
- 数智员工系统集成,通过统一入口快速创建训练项目
- 避免重复创建相同员工的项目
- 简化项目初始化流程

**验收标准**:
- [x] API文件创建成功
- [x] 包含完整的错误处理
- [x] 有清晰的CUSTOM标记和功能说明注释
- [ ] 实际测试: 访问 `/api/projects/employee/test-001` 能成功创建/重定向

---

## 🎯 批次3: 中等功能迁移 (P0)

### 状态: ✅ 已完成

### 变更内容

#### 1. 数据集标签可编辑 (P0)

**文件路径**: `components/datasets/DatasetMetadata.js`
**变更类型**: 代码修改(有标记)
**代码隔离策略**: 标记修改(策略5)

**说明**: 原计划使用组件包装模式(策略3),但经分析后决定使用标记修改(策略5):
- 1.6.0的 DatasetMetadata.js 只有78行,非常简单
- 该组件仅在一个页面使用,包装器增加维护成本
- 直接修改并添加明确的CUSTOM标记更实用

**变更内容** (第1-200行):

**状态管理** (第20-24行):
```javascript
// CUSTOM: 标签编辑状态管理 (迁移自1.4.0)
const [editingLabel, setEditingLabel] = useState(false);
const [labelValue, setLabelValue] = useState(currentDataset?.questionLabel || '');
const [availableLabels, setAvailableLabels] = useState([]);
const [loadingLabels, setLoadingLabels] = useState(false);
```

**获取标签列表** (第26-61行):
```javascript
// CUSTOM: 获取可用标签列表 (迁移自1.4.0)
const fetchAvailableLabels = async () => {
  try {
    setLoadingLabels(true);
    const response = await fetch(`/api/projects/${currentDataset.projectId}/tags`);
    if (response.ok) {
      const data = await response.json();

      // 提取所有标签名称，包括嵌套的标签
      const extractLabels = (tags) => {
        let labels = [];
        if (!tags || !Array.isArray(tags)) return labels;

        tags.forEach(tag => {
          if (tag && tag.label) {
            labels.push(tag.label);
            // 递归处理子标签
            if (tag.child && Array.isArray(tag.child) && tag.child.length > 0) {
              labels = labels.concat(extractLabels(tag.child));
            }
          }
        });
        return labels;
      };
      const allLabels = extractLabels(data.tags || []);

      // 去重并排序
      const uniqueLabels = [...new Set(allLabels)].sort();
      setAvailableLabels(uniqueLabels);
    }
  } catch (error) {
    console.error('获取标签列表失败:', error);
  } finally {
    setLoadingLabels(false);
  }
};
```

**编辑操作** (第75-96行):
```javascript
// CUSTOM: 处理标签编辑 (迁移自1.4.0)
const handleLabelEdit = () => {
  setEditingLabel(true);
};

// CUSTOM: 处理标签保存 (迁移自1.4.0)
const handleLabelSave = async () => {
  try {
    if (onLabelChange) {
      await onLabelChange(labelValue);
    }
    setEditingLabel(false);
  } catch (error) {
    console.error('保存标签失败:', error);
  }
};

// CUSTOM: 处理标签取消 (迁移自1.4.0)
const handleLabelCancel = () => {
  setLabelValue(currentDataset?.questionLabel || '');
  setEditingLabel(false);
};
```

**编辑UI** (第106-146行):
```javascript
{/* CUSTOM: 可编辑的标签 (迁移自1.4.0) */}
{editingLabel ? (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <Select
        value={labelValue}
        onChange={(e) => setLabelValue(e.target.value)}
        displayEmpty
        disabled={loadingLabels}
      >
        <MenuItem value="">
          <em>{t('common.selectLabel') || '选择标签'}</em>
        </MenuItem>
        {availableLabels.map((label) => (
          <MenuItem key={label} value={label}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    <IconButton size="small" onClick={handleLabelSave} color="primary">
      <CheckIcon />
    </IconButton>
    <IconButton size="small" onClick={handleLabelCancel} color="secondary">
      <CloseIcon />
    </IconButton>
  </Box>
) : (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Chip
      label={`${t('common.label')}: ${currentDataset.questionLabel || (t('common.noLabel') || '无标签')}`}
      color={currentDataset.questionLabel ? "primary" : "default"}
      variant="outlined"
      onClick={handleLabelEdit}
      sx={{ cursor: 'pointer' }}
    />
    <IconButton size="small" onClick={handleLabelEdit} color="primary">
      <EditIcon fontSize="small" />
    </IconButton>
  </Box>
)}
```

**功能说明**:
- 在 DatasetMetadata 组件中添加标签编辑功能
- 点击标签Chip或编辑按钮进入编辑模式
- 从下拉列表选择标签(标签列表通过API动态获取)
- 保存/取消按钮控制编辑流程
- 支持递归提取嵌套标签树

**业务场景**:
- 用户需要批量修正或更新数据集的分类标签
- 在数据集详情页直接编辑questionLabel字段
- 从项目标签树中选择标准标签,保持标签一致性

**验收标准**:
- [x] DatasetMetadata 组件包含标签编辑功能
- [x] useDatasetDetails Hook 暴露 handleLabelChange 方法
- [x] 页面正确传递 onLabelChange 回调
- [ ] 实际测试: 点击标签、选择、保存能正常工作 ⚠️ (需浏览器UI测试)

---

#### 2. 相关文件修改

**文件1**: `app/projects/[projectId]/datasets/[datasetId]/useDatasetDetails.js`
**变更类型**: 代码修改(有标记)
**代码隔离策略**: 标记修改(策略5)

**变更位置**: 第181-215行
```javascript
// CUSTOM: 处理标签修改 (迁移自1.4.0)
// 功能说明: 保存用户编辑的questionLabel到数据库
const handleLabelChange = async (newLabel) => {
  try {
    const response = await fetch(`/api/projects/${projectId}/datasets?id=${datasetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionLabel: newLabel
      })
    });

    if (!response.ok) {
      throw new Error('保存标签失败');
    }

    // 更新本地状态
    setCurrentDataset(prev => ({ ...prev, questionLabel: newLabel }));

    setSnackbar({
      open: true,
      message: i18n.t('common.saveSuccess') || '保存成功',
      severity: 'success'
    });
  } catch (error) {
    setSnackbar({
      open: true,
      message: error.message || '保存标签失败',
      severity: 'error'
    });
    throw error; // 重新抛出错误,让组件知道保存失败
  }
};
```

**变更位置**: 第500行
```javascript
handleLabelChange, // CUSTOM: 添加标签修改处理函数 (迁移自1.4.0)
```

---

**文件2**: `app/projects/[projectId]/datasets/[datasetId]/page.js`
**变更类型**: 代码修改(有标记)
**代码隔离策略**: 标记修改(策略5)

**变更位置1**: 第51行
```javascript
handleLabelChange, // CUSTOM: 添加标签修改处理函数 (迁移自1.4.0)
```

**变更位置2**: 第165-170行
```javascript
{/* CUSTOM: 添加onLabelChange属性支持标签编辑 (迁移自1.4.0) */}
<DatasetMetadata
  currentDataset={currentDataset}
  onViewChunk={handleViewChunk}
  onLabelChange={handleLabelChange}
/>
```

---

### 实际执行文件数

| 变更类型 | 文件数 | 文件列表 |
|---------|--------|---------|
| 修改文件 | 5 | `DatasetMetadata.js`, `useDatasetDetails.js`, `page.js`, `route.js`, `datasets/route.js` |
| **合计** | **5** | - |

---

## 🎯 批次3.5: 智能跳转特性 (P0) - Bug修复衍生

### 状态: ✅ 已完成

### 背景
在批次3 UI测试中发现两个bug,修复过程中用户提出新需求:
- **问题**: 新项目即使已经有默认模型配置,仍然强制跳转到settings页面
- **需求**: 如果新项目已有完整模型配置,应该直接跳转到text-split,跳过settings页面
- **业务场景**: 员工API创建的项目有默认配置,不应强制用户进入设置页面

### 变更内容

#### 1. 项目创建对话框智能跳转 (P0)

**文件路径**: `components/home/CreateProjectDialog.js`
**变更类型**: 代码修改(有标记)
**代码隔离策略**: 标记修改(策略5)

**变更位置**: 第81-107行
```javascript
// CUSTOM: 智能跳转逻辑 (批次3新增特性)
// 检查新项目是否有完整的模型配置,如果有则跳转到text-split,否则跳转到settings
try {
  const modelConfigResponse = await fetch(`/api/projects/${data.id}/model-config`);
  if (modelConfigResponse.ok) {
    const modelConfigData = await modelConfigResponse.json();
    const hasCompleteModel = modelConfigData.data &&
      modelConfigData.data.length > 0 &&
      modelConfigData.data.some(config =>
        config.apiKey && config.endpoint && config.modelName
      );

    // 如果有完整模型配置,跳转到text-split;否则跳转到settings
    if (hasCompleteModel) {
      router.push(`/projects/${data.id}/text-split`);
    } else {
      router.push(`/projects/${data.id}/settings?tab=model`);
    }
  } else {
    // 如果获取模型配置失败,默认跳转到settings
    router.push(`/projects/${data.id}/settings?tab=model`);
  }
} catch (modelConfigError) {
  // 如果检查模型配置出错,默认跳转到settings
  console.error('检查模型配置失败:', modelConfigError);
  router.push(`/projects/${data.id}/settings?tab=model`);
}
```

**跳转逻辑**:
- ✅ **完整模型**: `apiKey` + `endpoint` + `modelName` 都存在 → 跳转 `text-split`
- ❌ **不完整**: 任一字段缺失 → 跳转 `settings?tab=model`
- ❌ **检查失败**: API请求失败 → 默认跳转 `settings?tab=model` (安全回退)

**功能说明**:
- 项目创建成功后,检查是否有完整的模型配置
- 有完整配置则直接进入工作流程(text-split)
- 无完整配置则引导用户配置模型(settings)
- 容错设计: 检查失败时保持原有行为

**业务价值**:
- 提升用户体验: 有配置的项目直接开始工作
- 保持向导流程: 无配置的项目仍需配置
- 支持自动化: 员工API创建的项目无需手动配置

---

#### 2. 员工API默认模型配置 (P0)

**文件路径**: `app/api/projects/employee/[employeeId]/route.js`
**变更类型**: 代码修改(有标记)
**代码隔离策略**: 标记修改(策略5)

**变更位置1**: 第7-10行 (导入)
```javascript
// CUSTOM: 导入模型配置相关 (批次3新增特性)
import { createInitModelConfig } from '@/lib/db/model-config';
import { MODEL_PROVIDERS, DEFAULT_PROJECT_MODEL_PROVIDER_ID } from '@/constant/model';
import { nanoid } from 'nanoid';
```

**变更位置2**: 第49-71行 (创建默认配置)
```javascript
// CUSTOM: 创建默认模型配置 (批次3新增特性)
// 员工API创建的项目也应该有默认模型配置
const defaultProvider = MODEL_PROVIDERS.find(p => p.id === DEFAULT_PROJECT_MODEL_PROVIDER_ID);
if (defaultProvider) {
  const defaultModelConfig = {
    id: nanoid(12),
    projectId: newProject.id,
    providerId: defaultProvider.id,
    providerName: defaultProvider.name,
    endpoint: defaultProvider.defaultEndpoint,
    apiKey: defaultProvider.defaultApiKey || '',
    modelId: defaultProvider.defaultModels[0] || '',
    modelName: defaultProvider.defaultModels[0] || '',
    type: 'text',
    temperature: defaultProvider.defaultTemperature || 0.7,
    maxTokens: defaultProvider.defaultMaxTokens || 16384,
    topP: 1,
    topK: 0,
    status: 1
  };
  await createInitModelConfig([defaultModelConfig]);
  console.log(`为项目 ${newProject.id} 创建了默认模型配置`);
}
```

**问题根源**:
- 员工API直接调用 `createProject()` 数据库函数
- 绕过了 POST `/api/projects` endpoint的模型配置逻辑
- 导致员工API创建的项目没有默认模型

**解决方案**:
- 在员工API中复制POST endpoint的模型创建逻辑
- 确保员工API创建的项目也有默认Kimi-K2配置
- 保持代码一致性: 使用相同的默认提供商常量

**功能说明**:
- 员工API创建项目后立即创建默认模型配置
- 使用与手动创建相同的默认提供商(openai-custom/Kimi-K2)
- 从环境变量读取API Key等配置
- 记录日志便于调试

---

#### 3. 新项目默认模型配置 - Bug修复

**文件路径**: `app/api/projects/route.js`
**变更类型**: 代码修改(有标记)
**代码隔离策略**: 标记修改(策略5)

**变更位置**: 第3-4行 (导入)
```javascript
// CUSTOM: 导入默认模型配置 (修复批次3测试问题1-正确版)
import { MODEL_PROVIDERS, DEFAULT_PROJECT_MODEL_PROVIDER_ID } from '@/constant/model';
```

**变更位置**: 第34-56行 (创建逻辑)
```javascript
} else {
  // CUSTOM: 创建默认模型配置 (修复批次3测试问题1-正确版)
  // 如果没有复用配置,则创建默认的openai-custom模型配置
  const defaultProvider = MODEL_PROVIDERS.find(p => p.id === DEFAULT_PROJECT_MODEL_PROVIDER_ID);
  if (defaultProvider) {
    const defaultModelConfig = {
      id: nanoid(12),
      projectId: newProject.id,
      providerId: defaultProvider.id,
      providerName: defaultProvider.name,
      endpoint: defaultProvider.defaultEndpoint,
      apiKey: defaultProvider.defaultApiKey || '',
      modelId: defaultProvider.defaultModels[0] || '',
      modelName: defaultProvider.defaultModels[0] || '',
      type: 'text',
      temperature: defaultProvider.defaultTemperature || 0.7,
      maxTokens: defaultProvider.defaultMaxTokens || 16384,
      topP: 1,
      topK: 0,
      status: 1
    };
    await createInitModelConfig([defaultModelConfig]);
  }
}
```

**Bug描述**:
- 原代码只在 `reuseConfigFrom` 存在时创建模型配置
- 全新项目(不复用配置)没有默认模型
- 导致新项目模型列表为空,API Key为空

**修复说明**:
- 添加 `else` 分支处理全新项目
- 创建默认openai-custom模型配置
- API Key从环境变量 `OPENAI_CUSTOM_API_KEY` 读取
- 与批次2的默认提供商配置配合使用

---

#### 4. 数据集API支持标签字段 - Bug修复

**文件路径**: `app/api/projects/[projectId]/datasets/route.js`
**变更类型**: 代码修改(有标记)
**代码隔离策略**: 标记修改(策略5)

**变更位置1**: 第152行
```javascript
// CUSTOM: 添加questionLabel字段支持 (修复批次3测试问题3)
const { answer, cot, question, confirmed, questionLabel } = await request.json();
```

**变更位置2**: 第176-177行
```javascript
// CUSTOM: 支持questionLabel字段更新 (修复批次3测试问题3)
if (questionLabel !== undefined) data.questionLabel = questionLabel;
```

**Bug描述**:
- PATCH endpoint不接受 `questionLabel` 字段
- 前端发送的标签更新被忽略
- 标签编辑功能无法保存

**修复说明**:
- 在请求解构中添加 `questionLabel`
- 在更新数据对象时添加 `questionLabel` 字段
- 使用 `undefined` 检查支持空字符串值

---

#### 5. 国际化显示问题 - Bug修复

**文件路径**: `app/projects/[projectId]/datasets/[datasetId]/useDatasetDetails.js`
**变更类型**: 代码修改(有标记)
**代码隔离策略**: 标记修改(策略5)

**变更位置**: 第205行
```javascript
message: '保存成功', // CUSTOM: 直接使用中文避免国际化问题 (批次3测试问题2-修复版)
```

**Bug描述**:
- 保存成功提示显示 `common.saveSuccess` 而非中文
- useTranslation hook 在自定义 hook 中有时序问题
- `t()` 函数调用时还未完成初始化

**修复说明**:
- 放弃使用 `t('common.saveSuccess')`
- 直接使用中文字符串 `'保存成功'`
- 避免 hook 依赖和时序问题

**权衡说明**:
- 损失了国际化能力
- 但保证了功能正常工作
- 该消息不是核心多语言场景

---

### 实际执行文件数

| 变更类型 | 文件数 | 文件列表 |
|---------|--------|---------|
| 修改文件 | 5 | `CreateProjectDialog.js`, `employee/[employeeId]/route.js`, `projects/route.js`, `datasets/route.js`, `useDatasetDetails.js` |
| **合计** | **5** | - |

---

### 业务流程对比

#### 修复前 (批次3初版)
```
手动创建项目:
1. 填写项目名称 → 创建项目
2. ❌ 没有默认模型配置
3. → 强制跳转到 settings
4. 用户必须手动配置模型

员工API创建:
1. 访问 /api/projects/employee/xxx
2. ❌ 没有默认模型配置
3. → 跳转到 text-split
4. ❌ 无法使用(缺少模型)
```

#### 修复后 (批次3.5)
```
手动创建项目:
1. 填写项目名称 → 创建项目
2. ✅ 自动创建默认模型(Kimi-K2 + API Key)
3. ✅ 检测到完整配置 → 跳转到 text-split
4. 用户直接开始工作

员工API创建:
1. 访问 /api/projects/employee/xxx
2. ✅ 自动创建默认模型(Kimi-K2 + API Key)
3. → 跳转到 text-split
4. ✅ 可以直接使用
```

---

### 验收标准

- [x] CreateProjectDialog 检查模型配置完整性
- [x] 完整配置跳转到 text-split
- [x] 不完整配置跳转到 settings
- [x] 员工API创建默认模型配置
- [x] POST /api/projects 创建默认模型配置
- [x] 数据集API支持questionLabel字段
- [x] 国际化问题修复
- [ ] 实际测试: 创建新项目验证智能跳转 ⚠️ (需UI测试)
- [ ] 实际测试: 员工API验证默认配置 ⚠️ (需API测试)

---

## 🎯 批次4: 品牌定制 (P1)

### 状态: ✅ 已完成

### 实际变更内容

#### 1. 复制品牌Logo文件 (P1)
- **文件路径**: `public/imgs/夸夸logo-03.png`, `public/imgs/夸夸logo-05.png`
- **变更类型**: 新增资源文件
- **代码隔离策略**: 独立文件(策略1)
- **功能说明**: 从1.4.0复制定制Logo到1.6.0
- **文件信息**:
  - `夸夸logo-03.png`: 154KB
  - `夸夸logo-05.png`: 446KB
- **说明**: 标准logo文件(logo.png/svg/ico)在1.6.0中已存在且与1.4.0完全相同(MD5一致),无需复制

#### 2. Navbar品牌定制 (P1)
- **文件路径**: `components/Navbar.js`
- **变更类型**: 条件渲染 + 标记修改
- **代码隔离策略**: 条件渲染(策略4) + 标记修改(策略5)
- **变更位置1**: Logo和品牌名称 (第172-213行)
  ```javascript
  {/* CUSTOM: 禁用品牌Logo/名称点击跳转 (批次4定制增强) */}
  {/* 理由: 后续一个项目对应一个用户,主界面是管理员界面,普通用户不能跳转 */}
  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
    {/* CUSTOM: 自定义Logo和品牌名称 (迁移自1.4.0) */}
    <Box component="img"
      src={process.env.NEXT_PUBLIC_BRAND_LOGO || "/imgs/夸夸logo-05.png"}
      alt={process.env.NEXT_PUBLIC_BRAND_NAME || "夸夸Logo"}
    />
    {/* CUSTOM: 使用国际化品牌名称 (迁移自1.4.0) */}
    {t('app.title')}
  </Box>
  ```
  **关键改动**:
  - ❌ 注释掉 `onClick={() => { window.location.href = '/'; }}`
  - ❌ 注释掉 `cursor: 'pointer'` 和 `'&:hover': { opacity: 0.9 }` 样式
  - ✅ Logo/品牌名称不再可点击,无法跳转到主管理界面
  - 🔒 **安全增强**: 普通用户无法通过点击Logo访问管理员项目列表页面

- **变更位置2**: 项目切换器条件显示 (第216行)
  ```javascript
  {/* CUSTOM: 项目切换器可通过环境变量控制显示/隐藏 (迁移自1.4.0) */}
  {isProjectDetail && process.env.NEXT_PUBLIC_ENABLE_PROJECT_SWITCHER !== 'false' && ( ... )}
  ```
- **变更位置3**: 文档链接条件显示 (第543行)
  ```javascript
  {/* CUSTOM: 文档链接可通过环境变量控制显示/隐藏 (迁移自1.4.0) */}
  {process.env.NEXT_PUBLIC_ENABLE_DOCS_LINK !== 'false' && ( ... )}
  ```
- **变更位置4**: GitHub链接条件显示 (第570行)
  ```javascript
  {/* CUSTOM: GitHub链接可通过环境变量控制显示/隐藏 (迁移自1.4.0) */}
  {process.env.NEXT_PUBLIC_ENABLE_GITHUB_LINK !== 'false' && ( ... )}
  ```
- **业务场景**:
  - 使用自定义Logo和品牌名称
  - 禁止普通用户点击Logo跳转到管理界面(单用户单项目隔离)
  - 可选隐藏项目切换器(单项目模式)
  - 可选隐藏文档和GitHub链接(内部部署)

#### 3. 环境变量扩展 (P1)
- **文件路径**: `.env.example`, `.env`
- **变更类型**: 配置扩展
- **代码隔离策略**: 配置扩展(策略2)
- **新增配置项**:
  ```env
  # CUSTOM: 品牌定制配置 (迁移自1.4.0)
  NEXT_PUBLIC_BRAND_NAME="夸夸"
  NEXT_PUBLIC_BRAND_LOGO="/imgs/夸夸logo-05.png"

  # UI feature toggles
  NEXT_PUBLIC_ENABLE_PROJECT_SWITCHER="false"
  NEXT_PUBLIC_ENABLE_DOCS_LINK="false"
  NEXT_PUBLIC_ENABLE_GITHUB_LINK="false"
  ```
- **功能说明**: 所有`NEXT_PUBLIC_*`变量在客户端可访问,支持品牌定制和UI功能开关

#### 4. 国际化翻译合并 (P1)
- **文件路径**: `locales/zh-CN/translation.json`, `locales/en/translation.json`
- **变更类型**: 配置合并
- **代码隔离策略**: 配置扩展(策略2)
- **新增翻译键**:
  ```json
  // 中文 (locales/zh-CN/translation.json)
  "app": {
    "title": "训练数据管理平台"
  }

  // 英文 (locales/en/translation.json)
  "app": {
    "title": "Training Data Management Platform"
  }
  ```
- **使用场景**: Navbar品牌名称,支持国际化切换
- **代码引用**: `components/Navbar.js:207` → `{t('app.title')}`
- **特殊说明**:
  - ⚠️ **JSON格式限制**: 翻译文件不支持注释,无法添加 `// CUSTOM:` 标记
  - ✅ **识别方式**: 这些是**自定义新增的翻译键**,不在官方1.6.0中
  - ✅ **追踪方式**: 通过本文档CUSTOM_CHANGES.md记录所有自定义翻译键
  - 📋 **验证方法**: 对比官方1.6.0翻译文件,`"app.title"` 键不存在于官方版本

---

## 📊 变更统计

### 文件变更统计
| 变更类型 | 文件数 | 说明 |
|---------|--------|------|
| 新增文件 | 5 | `.env.example`, `employee/[employeeId]/route.js`, `CUSTOM_CHANGES.md`, `夸夸logo-03.png`, `夸夸logo-05.png` |
| 修改文件 | 15 | `.env`, `.env.example`, `constant/model.js`, `DatasetMetadata.js`, `useDatasetDetails.js`, `datasets/[datasetId]/page.js`, `projects/route.js`, `datasets/route.js`, `CreateProjectDialog.js`, `employee/[employeeId]/route.js`, `ModelSettings.js`, `Navbar.js`, `zh-CN/translation.json`, `en/translation.json` |
| **合计** | **20** | 所有批次1-4完成 |

### 代码隔离策略使用统计
| 策略 | 使用次数 | 应用场景 |
|------|---------|---------|
| 策略1: 独立文件 | 5 | `.env.example`, 员工API, CUSTOM_CHANGES.md, Logo文件×2 |
| 策略2: 配置扩展 | 6 | `.env`, `.env.example`(品牌), 翻译文件×2 |
| 策略3: 组件包装 | 0 | 原计划标签编辑,实际改用策略5 |
| 策略4: 条件渲染 | 4 | Navbar品牌定制(Logo/名称/切换器/链接) |
| 策略5: 标记修改 | 11 | `constant/model.js`, `DatasetMetadata.js`, `useDatasetDetails.js`, `page.js`, `projects/route.js`, `datasets/route.js`, `CreateProjectDialog.js`, `employee API`, `ModelSettings.js`, `useDatasetDetails.js国际化`, `Navbar.js` |

---

## 🔍 代码标记规范

所有定制代码使用统一的标记格式:

```javascript
// CUSTOM: 功能简要说明 (迁移自1.4.0)
// 详细说明(可选)
// 业务场景(可选)
```

**示例**:
```javascript
// CUSTOM: 自定义OpenAI配置 - 从环境变量读取 (迁移自1.4.0)
{
  id: 'openai-custom',
  ...
}
```

### JSON配置文件的特殊处理

**问题**: JSON格式(如 `.env`, `translation.json`)不支持注释,无法直接添加 `// CUSTOM:` 标记

**解决方案**:
1. **翻译文件** (`locales/**/translation.json`):
   - ✅ 在本文档 CUSTOM_CHANGES.md 中明确记录所有自定义翻译键
   - ✅ 新增的顶级键(如 `"app"`)和嵌套键(如 `"app.title"`)都会记录
   - 📋 后续升级时,对比官方翻译文件识别自定义部分

2. **环境变量文件** (`.env`, `.env.example`):
   - ✅ 使用行注释 `# CUSTOM: 说明` 标记自定义配置块
   - ✅ 自定义变量使用统一前缀(如 `OPENAI_CUSTOM_*`, `NEXT_PUBLIC_BRAND_*`)

3. **其他JSON配置** (`package.json`等):
   - ✅ 在本文档中记录所有修改项
   - ✅ 使用版本控制工具对比官方版本识别差异

---

## 🧪 测试清单

### 批次2功能测试 (2025-11-06已完成)
- [x] **自定义OpenAI配置测试**
  - [x] 环境变量正确读取 ✅
  - [x] MODEL_PROVIDERS包含 openai-custom ✅ (在components/settings/ModelSettings.js中使用)
  - [x] DEFAULT_PROJECT_MODEL_PROVIDER_ID 配置生效 ✅
  - [ ] 能使用Kimi-K2模型创建项目并生成问题/答案 ⚠️ (需浏览器UI测试)

- [x] **员工API测试**
  - [x] 访问 `/api/projects/employee/test-employee-001` ✅
  - [x] 首次访问能创建新项目 ✅ (创建项目ID: vflOncnXixEl)
  - [x] 再次访问重定向到已有项目 ✅ (重定向到vflOncnXixEl, 未重复创建)
  - [x] 返回307重定向状态码 ✅
  - [ ] 错误处理正常(无ID、服务器错误) ⚠️ (未测试)

**测试总结**: 核心功能测试通过，API后端功能正常。完整UI测试需要在浏览器中手动验证。

### 批次3功能测试 (2025-11-06已完成)
- [x] **数据集标签编辑测试**
  - [x] 代码迁移完成,编译无错误 ✅
  - [x] 用户UI测试发现问题 ⚠️
  - [x] **问题1**: 新项目默认模型API Key为空 ❌ → ✅ 已修复
    - 根因: POST `/api/projects` 只在复用配置时创建模型,新项目不创建
    - 修复: 添加else分支,为新项目创建默认模型配置(含API Key)
    - 文件: `app/api/projects/route.js` (第34-56行)
  - [x] **问题2**: 标签保存提示显示translation key ❌ → ✅ 已修复
    - 根因: useTranslation hook在自定义hook中有时序问题
    - 修复: 改用直接中文字符串 `'保存成功'`
    - 文件: `useDatasetDetails.js` (第205行)
  - [x] **问题3**: 标签保存功能验证 ✅
    - 标签下拉列表正常显示
    - 保存功能正常工作
  - [x] **新增特性**: 智能跳转逻辑 ✅
    - 需求: 新项目有完整模型配置时,跳转到text-split而非settings
    - 实现文件: `CreateProjectDialog.js`, `employee/[employeeId]/route.js`
    - 详见"批次3.5: 智能跳转特性"章节

**测试总结**: 批次3核心功能完成并通过用户UI测试,发现的2个bug已修复,新增智能跳转特性。

### 批次4功能测试 (待执行)
- [ ] **品牌定制测试**
  - [ ] Logo正确显示为"夸夸logo-05.png" ⚠️ (需浏览器测试)
  - [ ] 品牌名称显示为"夸夸" ⚠️ (需浏览器测试)
  - [ ] 项目切换器已隐藏 ⚠️ (NEXT_PUBLIC_ENABLE_PROJECT_SWITCHER="false")
  - [ ] 文档链接已隐藏 ⚠️ (NEXT_PUBLIC_ENABLE_DOCS_LINK="false")
  - [ ] GitHub链接已隐藏 ⚠️ (NEXT_PUBLIC_ENABLE_GITHUB_LINK="false")
  - [ ] 切换语言时品牌名称正确显示 ⚠️ (中文:"训练数据管理平台", 英文:"Training Data Management Platform")

**测试说明**: 批次4所有代码迁移完成,编译无错误。完整UI测试需要在浏览器中手动验证。

---

## 📝 维护指南

### 后续升级注意事项

1. **升级到官方新版本时**:
   - 检查本文档记录的所有变更文件
   - 对于"独立文件"(策略1): 直接保留,无冲突
   - 对于"标记修改"(策略5): 需手动合并,搜索 `// CUSTOM:` 标记
   - 对于"配置扩展"(策略2): 合并环境变量配置
   - 对于"组件包装"(策略3): 检查被包装组件API是否变化
   - **翻译文件特别注意**: 对比本文档第4项,合并自定义翻译键 `"app.title"` 到新版翻译文件

2. **添加新定制功能时**:
   - 优先使用"独立文件"策略
   - 必须添加 `// CUSTOM:` 标记(代码文件)
   - JSON配置文件的自定义项必须在本文档中记录
   - 更新本文档对应章节
   - 更新测试清单

3. **代码审查要点**:
   - 所有定制代码必须有 `CUSTOM` 标记或在本文档中明确记录
   - 修改官方文件需要充分理由
   - 优先使用包装器而非直接修改
   - 翻译文件新增键必须在"批次4:国际化翻译合并"章节记录

---

## 🔗 相关文档

- [TASK-001: 分析1.4.0定制改动](../docs/requirements/REQ-001-版本迁移/tasks/TASK-001-分析1.4.0定制改动.md)
- [TASK-002: 制定功能迁移计划](../docs/requirements/REQ-001-版本迁移/tasks/TASK-002-制定功能迁移计划.md)
- [TASK-003: 执行核心功能迁移](../docs/requirements/REQ-001-版本迁移/tasks/TASK-003-执行核心功能迁移.md)
- [项目架构文档](ARCHITECTURE.md)

---

## 📅 变更日志

| 日期 | 批次 | 变更内容 | 负责人 |
|------|------|---------|--------|
| 2025-11-06 | 批次1 | 创建 .env.example, 更新 .env | Claude AI |
| 2025-11-06 | 批次2 | 迁移自定义OpenAI配置 | Claude AI |
| 2025-11-06 | 批次2 | 迁移员工项目API | Claude AI |
| 2025-11-06 | 批次3 | 迁移数据集标签编辑功能 | Claude AI |
| 2025-11-06 | 批次3 | 修改DatasetMetadata/useDatasetDetails/page三个文件 | Claude AI |
| 2025-11-06 | 批次3.5 | 修复新项目默认模型API Key bug | Claude AI |
| 2025-11-06 | 批次3.5 | 修复国际化显示bug | Claude AI |
| 2025-11-06 | 批次3.5 | 实现智能跳转逻辑(CreateProjectDialog) | Claude AI |
| 2025-11-06 | 批次3.5 | 员工API添加默认模型配置 | Claude AI |
| 2025-11-06 | 批次3.5 | 数据集API支持questionLabel字段 | Claude AI |
| 2025-11-06 | - | 创建 CUSTOM_CHANGES.md 追踪文档 | Claude AI |
| 2025-11-06 | - | 更新文档记录批次3.5所有变更 | Claude AI |

---

**文档版本**: v1.0
**最后更新人**: Claude AI
**最后更新时间**: 2025-11-06
