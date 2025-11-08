# [TASK-002] 制定功能迁移计划

## 任务元数据
- **任务ID**: TASK-002
- **所属需求**: [REQ-001] 版本迁移
- **任务名称**: 制定功能迁移计划
- **优先级**: P0
- **状态**: 已完成
- **负责人**: Claude AI
- **创建日期**: 2025-11-06
- **计划开始**: 2025-11-06
- **计划完成**: 2025-11-06
- **实际开始**: 2025-11-06
- **实际完成**: 2025-11-06
- **预估工时**: 3 小时
- **实际工时**: 2.5 小时
- **最后更新**: 2025-11-06

---

## 一、任务目标 🎯

### 1.1 目标描述
基于TASK-001的分析结果,对33个改动文件进行迁移必要性评估,确定优先级和难度等级,制定详细的迁移时间表和验收标准,为TASK-003的实际迁移工作提供完整的行动指南。

### 1.2 成功标准
- [x] 完成1.6.0架构和兼容性分析
- [x] 完成功能迁移必要性评估表 (33个改动)
- [x] 确定迁移优先级(P0/P1/P2/P3)
- [x] 评估迁移难度(简单/中等/困难)
- [x] 制定详细时间表和里程碑
- [x] 为每个功能设计代码隔离策略
- [x] 识别风险并制定应对措施
- [x] 生成完整的迁移计划文档

### 1.3 价值说明
**业务价值**: 通过详细规划确保迁移工作有序进行,优先保障核心业务功能,降低迁移风险,避免功能遗漏

**技术价值**: 提前识别架构不兼容问题,设计合理的代码隔离策略,为后续持续升级奠定基础

---

## 二、前置条件

### 2.1 依赖任务
- [x] [TASK-001] 分析1.4.0定制改动 - 提供了33个改动文件的详细分析

### 2.2 依赖资源
- **技术资源**: 1.6.0代码仓库、1.4.0分析报告、技术方案设计文档
- **数据资源**: TASK-001的分析报告和改动文件清单
- **其他资源**: 代码隔离最佳实践指南

### 2.3 准备工作
- [x] 确认TASK-001已完成
- [x] 读取1.6.0的关键代码文件
- [x] 了解1.6.0的架构变化

---

## 三、1.6.0架构分析与兼容性评估 🔍

### 3.1 版本对比概况

| 项目 | 1.4.0 (定制版) | 1.6.0 (官方) | 差异分析 |
|-----|---------------|--------------|---------|
| 版本号 | 1.3.9 | 1.6.0 | 跨越3个小版本 |
| Next.js | ^14.2.29 | ^14.2.29 | ✅ 版本相同,兼容性好 |
| React | ^18.2.0 | ^18.2.0 | ✅ 版本相同 |
| @ai-sdk/openai | ^1.3.9 | ^1.3.9 | ✅ 版本相同 |
| ai (Vercel AI SDK) | ^4.3.4 | ^4.3.4 | ✅ 版本相同 |
| Prisma | ^6.6.0 | ^6.6.0 | ✅ 版本相同 |
| @mui/material | 5.16.14 | 5.16.14 | ✅ 版本相同 |
| langchain | ^0.3.24 | ^0.3.24 | ✅ 版本相同 |
| 1.6.0新增依赖 | - | @ai-sdk/openai-compatible ^1.0.22<br>github-markdown-css ^5.8.1<br>image-size ^2.0.2<br>jsonrepair ^3.13.1<br>jszip ^3.10.1<br>xmldom ^0.6.0<br>zod ^3.25.76 | 1.6.0新增7个依赖 |
| 1.4.0独有依赖 | pdf2md-js ^1.0.8 | - | 1.4.0使用旧版PDF解析 |
| 模型提供商 | 5个 (需查看代码) | 11个预置提供商 | 架构扩展了6个新提供商 |

**关键发现**:
- ✅ **核心依赖版本完全一致**: Next.js、React、Prisma、MUI、AI SDK等核心依赖版本相同
- ✅ **迁移兼容性极高**: 不存在依赖版本冲突的风险
- 📦 **1.6.0新增依赖**: 主要是功能增强(markdown渲染、JSON修复、ZIP处理等),不影响现有功能
- 🔄 **唯一差异**: 1.4.0使用pdf2md-js,1.6.0使用@opendocsg/pdf2md,需验证PDF处理兼容性

### 3.2 关键架构变化

#### 3.2.1 API路由结构
**1.6.0结构**:
```
app/api/projects/
├── [projectId]/          # 项目相关API
├── delete-directory/     # 删除目录
├── migrate/              # 数据迁移
├── open-directory/       # 打开目录
├── unmigrated/           # 未迁移数据
└── route.js              # 项目列表API
```

**兼容性评估**:
- ✅ `employee/[employeeId]/route.js` 可直接添加到 `app/api/projects/` 下
- ✅ API路由结构保持一致,无破坏性变化
- ⚠️ 需要验证数据库schema是否兼容

#### 3.2.2 数据集组件结构
**1.6.0组件**:
```
components/datasets/
├── DatasetMetadata.js         # 元数据展示 (简化版)
├── EditableField.js           # 可编辑字段组件 (新增)
├── TagSelector.js             # 标签选择器 (新增)
├── DatasetRatingSection.js    # 评分组件
├── StarRating.js              # 星级评分
├── NoteInput.js               # 笔记输入
└── OptimizeDialog.js          # 优化对话框
```

**关键发现**:
- 🔴 **DatasetMetadata.js已被简化**: 1.6.0版本只有78行,功能精简
- ✅ **EditableField.js组件存在**: 这是一个通用的可编辑字段组件
- ✅ **TagSelector.js组件存在**: 专门的标签选择器组件
- 💡 **迁移策略**: 应使用EditableField + TagSelector实现标签编辑功能,而不是直接修改DatasetMetadata

#### 3.2.3 模型配置架构
**1.6.0模型提供商列表**:
1. Ollama (本地)
2. OpenAI (官方)
3. 硅基流动
4. DeepSeek
5. 302.AI
6. 智谱AI
7. 火山引擎
8. Groq
9. Grok
10. OpenRouter
11. 阿里云百炼

**兼容性评估**:
- ✅ 模型提供商采用插件式架构,易于扩展
- ✅ 可直接添加 `openai-custom` 到 MODEL_PROVIDERS 数组
- ✅ 环境变量机制保持一致

### 3.3 兼容性总结

| 改动类型 | 兼容性 | 风险等级 | 迁移策略 |
|---------|--------|---------|---------|
| 新增独立API | ✅ 高度兼容 | 低 | 直接复制文件 |
| 配置文件修改 | ✅ 高度兼容 | 低 | 添加配置项 |
| 组件修改(标签编辑) | ⚠️ 需适配 | 中 | 使用新组件重构 |
| 品牌定制 | ✅ 兼容 | 低 | 标记修改点 |
| Wujie集成 | ⚠️ 待评估 | 中-高 | 暂缓迁移 |

---

## 四、功能迁移必要性评估 📋

### 4.1 核心业务功能 (4个)

#### 功能1: 员工项目自动创建 API ⭐⭐⭐
| 评估项 | 结果 |
|-------|------|
| **文件** | `app/api/projects/employee/[employeeId]/route.js` |
| **业务必要性** | 极高 - 数智员工训练项目的核心功能 |
| **优先级** | **P0** (必须迁移) |
| **迁移难度** | 简单 |
| **预估工时** | 2小时 |
| **迁移方式** | 直接复制文件 + 测试 |
| **验收标准** | API正常响应,能创建项目并重定向 |
| **依赖** | 数据库schema需包含项目表 |
| **风险** | 低 - 独立文件,无外部依赖 |

---

#### 功能2: 数据集标签可编辑 ⭐⭐⭐
| 评估项 | 结果 |
|-------|------|
| **文件** | `components/datasets/DatasetMetadata.js` (+128/-36行) |
| **业务必要性** | 极高 - 提升标签管理效率 |
| **优先级** | **P0** (必须迁移) |
| **迁移难度** | 中等 |
| **预估工时** | 4小时 |
| **迁移方式** | 使用1.6.0的EditableField + TagSelector组件重构 |
| **验收标准** | 能选择标签、保存成功、UI美观 |
| **依赖** | 项目标签API正常工作 |
| **风险** | 中 - 需要适配新组件架构 |
| **代码隔离策略** | 创建EnhancedDatasetMetadata包装组件 |

---

#### 功能3: 自定义 OpenAI 配置 ⭐⭐⭐
| 评估项 | 结果 |
|-------|------|
| **文件** | `constant/model.js` (+12行配置) |
| **业务必要性** | 极高 - 使用自建大模型服务 |
| **优先级** | **P0** (必须迁移) |
| **迁移难度** | 简单 |
| **预估工时** | 1小时 |
| **迁移方式** | 添加配置项到MODEL_PROVIDERS数组 |
| **验收标准** | 环境变量配置生效,模型调用正常 |
| **依赖** | 环境变量(.env文件) |
| **风险** | 低 - 纯配置修改 |
| **代码隔离策略** | 添加注释标记"// CUSTOM:"  |

---

#### 功能4: 品牌定制化 (Logo + 文案) ⭐⭐
| 评估项 | 结果 |
|-------|------|
| **文件** | `components/Navbar.js`, Logo图片 |
| **业务必要性** | 高 - 品牌识别 |
| **优先级** | **P1** (重要) |
| **迁移难度** | 简单 |
| **预估工时** | 1小时 |
| **迁移方式** | 替换Logo文件 + 修改Navbar文案 |
| **验收标准** | Logo和品牌名显示正确 |
| **依赖** | 无 |
| **风险** | 低 - UI修改 |
| **代码隔离策略** | 使用环境变量控制 + 标记注释 |

---

### 4.2 UI优化和功能增强 (17个文件)

这部分包含对现有组件的小幅优化和样式调整。

#### 评估矩阵

| 文件 | 业务必要性 | 优先级 | 迁移难度 | 预估工时 | 迁移建议 |
|-----|-----------|--------|---------|---------|---------|
| `components/CreateProjectDialog.js` | 中 | P2 | 简单 | 0.5h | 可选迁移 |
| `components/Navbar.js` (其他改动) | 低 | P2 | 简单 | 0.5h | 与品牌定制一起迁移 |
| `components/FileUploader.js` | 中 | P2 | 简单 | 0.5h | 可选迁移 |
| `components/HomePage.js` | 低 | P3 | 简单 | 0.5h | 暂不迁移 |
| `components/projects/*` 多个文件 | 低-中 | P2-P3 | 简单-中等 | 0.5-1h/个 | 逐个评估 |

**总体策略**:
- P2功能: 在核心功能迁移完成后,根据实际需要选择性迁移
- P3功能: 暂不迁移,待1.6.0稳定运行后再评估

---

### 4.3 API接口改动 (6个文件)

| 文件 | 业务必要性 | 优先级 | 迁移建议 |
|-----|-----------|--------|---------|
| `app/api/projects/employee/[employeeId]/route.js` | 极高 | P0 | 必须迁移 ✅ |
| `app/api/projects/[projectId]/datasets/route.js` | 中 | P2 | 按需迁移 |
| 其他API文件 | 低-中 | P2-P3 | 待评估 |

---

### 4.4 配置和环境 (7个文件)

| 文件 | 业务必要性 | 优先级 | 迁移策略 |
|-----|-----------|--------|---------|
| `constant/model.js` | 极高 | P0 | 必须迁移 ✅ |
| `.env.example` | 高 | P1 | 添加自定义配置项 |
| `package.json` | 中 | P2 | 谨慎合并依赖 |
| `Dockerfile` | 中 | P2 | 根据部署需求决定 |
| `.dockerignore` | 低 | P3 | 暂不迁移 |
| `.gitignore` | 低 | P3 | 保持1.6.0版本 |
| `.npmrc` | 低 | P3 | 根据需要决定 |

**策略**:
- **环境变量**: 添加自定义OpenAI配置到`.env.example`
- **依赖包**: 保持1.6.0的依赖,仅在必要时添加新依赖
- **Docker**: 如需容器化部署,参考1.4.0的Dockerfile适配到1.6.0

---

### 4.5 国际化和静态资源 (5个文件)

| 文件 | 业务必要性 | 优先级 | 迁移策略 |
|-----|-----------|--------|---------|
| `public/imgs/logo.png` | 高 | P1 | 替换文件 ✅ |
| `public/imgs/logo.svg` | 高 | P1 | 替换文件 ✅ |
| `public/imgs/logo.ico` | 中 | P1 | 替换文件 ✅ |
| `locales/zh-CN/translation.json` | 中 | P2 | 合并翻译条目 |
| `locales/en/translation.json` | 中 | P2 | 合并翻译条目 |

**策略**:
- **Logo文件**: 直接替换到1.6.0的`public/imgs/`目录
- **国际化**: 将定制的翻译条目合并到1.6.0的翻译文件中

---

### 4.6 文档和特殊功能 (2个文件)

| 文件 | 业务必要性 | 优先级 | 迁移建议 |
|-----|-----------|--------|---------|
| `WUJIE_INTEGRATION.md` | 待定 | P3 | 暂不迁移,待评估必要性 |
| `README.md` | 低 | P3 | 保持官方README |

**Wujie集成评估**:
- **功能**: 微前端集成框架
- **复杂度**: 高
- **建议**: 暂缓迁移,先完成核心功能,后续根据业务需要决定

---

## 五、迁移优先级汇总 🎯

### 5.1 优先级定义

| 优先级 | 定义 | 迁移时机 | 数量 |
|-------|------|---------|------|
| **P0** | 核心业务功能,必须迁移 | 立即执行 | 3个功能 |
| **P1** | 重要功能,应该迁移 | 核心功能完成后 | 4个功能 |
| **P2** | 可选功能,按需迁移 | 系统稳定后 | 15个功能 |
| **P3** | 暂不迁移,待评估 | 长期规划 | 11个功能 |

### 5.2 P0功能清单 (3个) - 里程碑1

| 序号 | 功能 | 预估工时 | 验收标准 |
|-----|------|---------|---------|
| 1 | 员工项目自动创建API | 2h | API正常响应,能创建并重定向 |
| 2 | 自定义OpenAI配置 | 1h | 环境变量配置生效 |
| 3 | 数据集标签可编辑 | 4h | 能选择、保存标签,UI美观 |

**小计**: 7小时

### 5.3 P1功能清单 (4个) - 里程碑2

| 序号 | 功能 | 预估工时 | 验收标准 |
|-----|------|---------|---------|
| 1 | 品牌Logo替换 | 0.5h | Logo显示正确 |
| 2 | 品牌文案定制 | 0.5h | Navbar文案正确 |
| 3 | 环境变量文档 | 0.5h | .env.example完整 |
| 4 | 国际化翻译合并 | 1h | 翻译条目完整 |

**小计**: 2.5小时

### 5.4 P2功能清单 (15个) - 按需迁移

**UI优化类** (8个):
- CreateProjectDialog改动
- FileUploader优化
- 多个项目组件改动
- ...

**API改动类** (3个):
- datasets路由优化
- 其他API改动
- ...

**配置类** (4个):
- Docker配置
- package.json依赖
- .npmrc
- ...

**预估总工时**: 8-12小时 (按需执行)

### 5.5 P3功能清单 (11个) - 暂不迁移

- Wujie微前端集成
- 部分UI细微调整
- 非关键文档
- ...

---

## 六、详细迁移时间表 📅

### 6.1 整体时间规划

```
阶段1: 核心功能迁移 (P0)  ━━━━━━━━━ 7小时
  ├─ 批次1: 环境准备          1小时
  ├─ 批次2: 简单功能迁移      3小时
  └─ 批次3: 复杂功能迁移      3小时

阶段2: 重要功能迁移 (P1)  ━━━━ 2.5小时
  └─ 批次4: 品牌定制和配置    2.5小时

阶段3: 测试与验证          ━━━━━━ 6小时
  └─ 全面功能测试和集成测试   6小时

总计: 15.5小时 (不含P2/P3功能)
```

### 6.2 批次1: 环境准备 (1小时)

**目标**: 准备1.6.0的开发和测试环境

| 任务 | 预估工时 | 成功标准 |
|-----|---------|---------|
| 检查1.6.0项目可运行 | 0.3h | npm run dev正常启动 |
| 准备测试数据库 | 0.2h | Prisma schema正常 |
| 创建feature分支 | 0.1h | 基于custom-production创建分支 |
| 准备环境变量 | 0.2h | .env文件配置完整 |
| 验证API可访问 | 0.2h | 基础API正常响应 |

---

### 6.3 批次2: 简单功能迁移 (3小时)

**目标**: 迁移独立文件和配置类功能

#### 2.1 自定义OpenAI配置 (1小时)

**操作步骤**:
1. 修改 `constant/model.js`
   ```javascript
   // 在 MODEL_PROVIDERS 数组末尾添加:
   {
     id: 'openai-custom',
     name: process.env.OPENAI_CUSTOM_NAME || '自定义OpenAI',
     defaultEndpoint: process.env.OPENAI_CUSTOM_ENDPOINT || '',
     defaultModels: [process.env.OPENAI_CUSTOM_MODEL_NAME || 'gpt-4o']
   }

   // 在文件顶部添加:
   // CUSTOM: 自定义OpenAI配置 - 从环境变量读取
   export const DEFAULT_PROJECT_MODEL_PROVIDER_ID =
     process.env.DEFAULT_MODEL_PROVIDER || 'openai-custom';
   ```

2. 修改 `.env.example`
   ```env
   # CUSTOM: 自定义OpenAI配置
   OPENAI_CUSTOM_NAME=自定义OpenAI
   OPENAI_CUSTOM_ENDPOINT=https://your-api-endpoint.com/v1/
   OPENAI_CUSTOM_MODEL_NAME=gpt-4o
   OPENAI_CUSTOM_API_KEY=your-api-key
   OPENAI_CUSTOM_TEMPERATURE=0.7
   OPENAI_CUSTOM_MAX_TOKENS=4000
   DEFAULT_MODEL_PROVIDER=openai-custom
   ```

3. 测试验证
   - 启动项目,检查模型提供商列表
   - 创建项目,验证默认模型是否为自定义OpenAI
   - 测试模型调用是否正常

**验收标准**:
- ✅ 自定义OpenAI出现在模型提供商列表
- ✅ 默认选中自定义OpenAI
- ✅ 模型调用正常响应

---

#### 2.2 员工项目自动创建API (2小时)

**操作步骤**:
1. 复制API文件
   ```bash
   # 从1.4.0复制到1.6.0
   cp easy-dataset-1.4.0/app/api/projects/employee \
      easy-dataset-1.6.0/app/api/projects/employee -r
   ```

2. 检查依赖
   - 验证 `lib/prisma.js` 或类似数据库工具存在
   - 验证项目数据库schema包含必要字段

3. 适配代码(如需要)
   - 检查import路径是否正确
   - 检查数据库操作方法是否兼容

4. 测试验证
   - 测试GET `/api/projects/employee/test-001`
   - 验证首次访问创建项目
   - 验证重复访问重定向到已有项目
   - 检查数据库记录正确

**验收标准**:
- ✅ API端点正常响应
- ✅ 能够创建新项目
- ✅ 重复访问重定向正确
- ✅ 数据库记录完整

---

### 6.4 批次3: 复杂功能迁移 (3小时)

#### 3.1 数据集标签可编辑 (3小时)

**迁移策略**: 使用1.6.0的EditableField和TagSelector组件重构

**操作步骤**:

1. 分析现有组件 (0.5h)
   - 研究 `components/datasets/EditableField.js`
   - 研究 `components/datasets/TagSelector.js`
   - 确定集成方案

2. 创建增强组件 (1.5h)

   创建 `components/datasets/EnhancedDatasetMetadata.js`:
   ```javascript
   'use client';

   import { Box, Typography, Chip } from '@mui/material';
   import { useState, useEffect } from 'react';
   import { useTranslation } from 'react-i18next';
   import EditableField from './EditableField';
   import TagSelector from './TagSelector';
   import DatasetMetadata from './DatasetMetadata';

   /**
    * CUSTOM: 增强的数据集元数据组件,支持标签编辑
    */
   export default function EnhancedDatasetMetadata({
     currentDataset,
     onViewChunk,
     onLabelUpdate  // 新增: 标签更新回调
   }) {
     const { t } = useTranslation();
     const [availableLabels, setAvailableLabels] = useState([]);
     const [isEditingLabel, setIsEditingLabel] = useState(false);

     // 加载可用标签列表
     useEffect(() => {
       async function loadLabels() {
         try {
           const response = await fetch(
             `/api/projects/${currentDataset.projectId}/tags`
           );
           const tags = await response.json();

           // 递归提取所有标签
           const extractLabels = (tags) => {
             let labels = [];
             tags.forEach(tag => {
               labels.push(tag.label);
               if (tag.child && Array.isArray(tag.child)) {
                 labels = labels.concat(extractLabels(tag.child));
               }
             });
             return labels;
           };

           setAvailableLabels(extractLabels(tags));
         } catch (error) {
           console.error('加载标签失败:', error);
         }
       }
       loadLabels();
     }, [currentDataset.projectId]);

     // 保存标签
     const handleLabelSave = async (newLabel) => {
       try {
         const response = await fetch(
           `/api/projects/${currentDataset.projectId}/datasets/${currentDataset.id}`,
           {
             method: 'PATCH',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ questionLabel: newLabel })
           }
         );

         if (!response.ok) throw new Error('保存失败');

         // 调用父组件回调
         if (onLabelUpdate) {
           onLabelUpdate(currentDataset.id, newLabel);
         }

         setIsEditingLabel(false);
       } catch (error) {
         console.error('保存标签失败:', error);
         alert('保存失败,请重试');
       }
     };

     return (
       <Box sx={{ mb: 3 }}>
         <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
           {t('datasets.metadata')}
         </Typography>
         <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
           <Chip
             label={`${t('datasets.model')}: ${currentDataset.model}`}
             variant="outlined"
           />

           {/* CUSTOM: 可编辑的标签字段 */}
           {currentDataset.questionLabel ? (
             isEditingLabel ? (
               <TagSelector
                 value={currentDataset.questionLabel}
                 options={availableLabels}
                 onSave={handleLabelSave}
                 onCancel={() => setIsEditingLabel(false)}
               />
             ) : (
               <Chip
                 label={`${t('common.label')}: ${currentDataset.questionLabel}`}
                 color="primary"
                 variant="outlined"
                 onClick={() => setIsEditingLabel(true)}
                 sx={{ cursor: 'pointer' }}
               />
             )
           ) : (
             <Chip
               label={t('common.addLabel')}
               variant="outlined"
               onClick={() => setIsEditingLabel(true)}
               sx={{ cursor: 'pointer' }}
             />
           )}

           {/* 其他元数据使用原始组件 */}
           <Chip
             label={`${t('datasets.createdAt')}: ${new Date(currentDataset.createAt).toLocaleString('zh-CN')}`}
             variant="outlined"
           />
           <Chip
             label={`${t('datasets.chunkId')}: ${currentDataset.chunkName}`}
             variant="outlined"
             color="info"
             onClick={() => onViewChunk(currentDataset)}
             sx={{ cursor: 'pointer' }}
           />
           {currentDataset.confirmed && (
             <Chip label={t('datasets.confirmed')} color="success" />
           )}
         </Box>
       </Box>
     );
   }
   ```

3. 修改使用组件的页面 (0.5h)
   - 找到使用DatasetMetadata的页面
   - 替换为EnhancedDatasetMetadata
   - 添加onLabelUpdate回调

4. 测试验证 (0.5h)
   - 测试点击标签进入编辑模式
   - 测试标签选择器显示所有可用标签
   - 测试保存标签成功
   - 测试取消编辑
   - 测试UI样式是否美观

**验收标准**:
- ✅ 标签可点击编辑
- ✅ 显示项目所有可用标签
- ✅ 能够选择并保存标签
- ✅ 取消编辑功能正常
- ✅ UI与原生组件风格一致

---

### 6.5 批次4: 品牌定制和配置 (2.5小时)

#### 4.1 品牌Logo替换 (0.5h)

**操作步骤**:
```bash
# 从1.4.0复制Logo文件到1.6.0
cp easy-dataset-1.4.0/public/imgs/logo.png \
   easy-dataset-1.6.0/public/imgs/logo.png

cp easy-dataset-1.4.0/public/imgs/logo.svg \
   easy-dataset-1.6.0/public/imgs/logo.svg

cp easy-dataset-1.4.0/public/imgs/logo.ico \
   easy-dataset-1.6.0/public/imgs/logo.ico
```

**验收标准**:
- ✅ Logo文件成功替换
- ✅ 页面显示新Logo
- ✅ 浏览器favicon显示正确

---

#### 4.2 品牌文案定制 (0.5h)

**操作步骤**:
1. 修改 `components/Navbar.js`
   - 找到品牌名称显示位置
   - 使用环境变量或直接修改
   - 添加注释标记 `// CUSTOM: 品牌定制`

2. 添加到 `.env.example`
   ```env
   # CUSTOM: 品牌配置
   BRAND_NAME=您的品牌名称
   ```

**验收标准**:
- ✅ 导航栏显示自定义品牌名
- ✅ 代码有清晰标记

---

#### 4.3 环境变量文档完善 (0.5h)

**操作步骤**:
1. 整理所有自定义环境变量
2. 更新 `.env.example`
3. 添加注释说明每个变量的用途

**验收标准**:
- ✅ .env.example包含所有自定义配置
- ✅ 每个配置有清晰注释

---

#### 4.4 国际化翻译合并 (1h)

**操作步骤**:
1. 对比1.4.0和1.6.0的翻译文件差异
2. 提取1.4.0新增的翻译条目
3. 合并到1.6.0的翻译文件
4. 添加注释标记 `// CUSTOM: 自定义翻译`

**验收标准**:
- ✅ 所有自定义文案有翻译
- ✅ 中英文翻译完整

---

### 6.6 迁移进度甘特图

```
任务                     天1    天2    天3
批次1: 环境准备          ██
批次2: 简单功能迁移      ███████
批次3: 复杂功能迁移             ████████
批次4: 品牌定制和配置                    ██████
TASK-004: 测试与验证                           ████████████

关键路径: 批次1 → 批次2 → 批次3 → 测试验证
```

---

## 七、代码隔离策略详解 🛡️

### 7.1 代码隔离原则

1. **新增优于修改**: 优先使用新文件、新组件、新API
2. **扩展优于侵入**: 使用wrapper、HOC、plugin模式
3. **标记优于混合**: 必须修改官方代码时,添加清晰标记
4. **配置优于硬编码**: 使用环境变量控制定制功能
5. **文档优于记忆**: 所有定制点都要有文档记录

### 7.2 标记规范

**代码注释标记**:
```javascript
// CUSTOM: [功能描述] - [修改原因]
// CUSTOM START: [功能描述]
//   ... 定制代码 ...
// CUSTOM END

// 示例:
// CUSTOM: 自定义OpenAI配置 - 支持私有部署的大模型服务
const customProvider = { ... };
```

**Git提交规范**:
```bash
feat(custom): 添加员工项目自动创建API
fix(custom): 修复数据集标签编辑保存问题
style(custom): 替换品牌Logo和文案
```

### 7.3 分类策略

#### 策略1: 独立文件 (最佳)
**适用**: 新增API、新组件、新工具函数

**示例**:
```
app/api/projects/employee/[employeeId]/route.js  # 完全独立
components/datasets/EnhancedDatasetMetadata.js   # 增强组件
lib/custom-utils.js                              # 自定义工具
```

**优点**:
- ✅ 完全隔离,官方更新无冲突
- ✅ 易于识别和维护
- ✅ 可独立测试

---

#### 策略2: 配置扩展
**适用**: 模型配置、环境变量、常量定义

**示例**:
```javascript
// constant/model.js
export const MODEL_PROVIDERS = [
  ...官方提供商,
  // CUSTOM: 自定义提供商
  {
    id: 'openai-custom',
    name: process.env.OPENAI_CUSTOM_NAME,
    ...
  }
];
```

**优点**:
- ✅ 侵入性小
- ✅ 易于环境切换
- ✅ 升级时易于合并

---

#### 策略3: 组件包装 (Wrapper Pattern)
**适用**: 需要增强现有组件功能

**示例**:
```javascript
// components/datasets/EnhancedDatasetMetadata.js
import DatasetMetadata from './DatasetMetadata';

export default function EnhancedDatasetMetadata(props) {
  // 添加额外功能
  const [editing, setEditing] = useState(false);

  return (
    <>
      {editing ? <TagSelector /> : <DatasetMetadata {...props} />}
    </>
  );
}
```

**优点**:
- ✅ 不修改原组件
- ✅ 功能可选
- ✅ 升级时原组件可直接替换

---

#### 策略4: 条件渲染
**适用**: UI定制、可选功能

**示例**:
```javascript
// components/Navbar.js
{process.env.CUSTOM_BRAND ? (
  // CUSTOM: 自定义品牌
  <img src="/imgs/custom-logo.png" />
) : (
  // 官方Logo
  <img src="/imgs/logo.png" />
)}
```

**优点**:
- ✅ 环境控制
- ✅ 易于A/B测试
- ✅ 回退简单

---

#### 策略5: 标记修改 (最后手段)
**适用**: 必须修改官方代码时

**示例**:
```javascript
// components/SomeComponent.js
function SomeComponent() {
  // 官方代码
  const data = fetchData();

  // CUSTOM START: 添加数据过滤逻辑 - 因为需要隐藏测试数据
  const filteredData = data.filter(item => !item.isTest);
  // CUSTOM END

  return <div>{filteredData.map(...)}</div>;
}
```

**要求**:
- ⚠️ 必须添加清晰注释
- ⚠️ 说明修改原因
- ⚠️ 记录到CUSTOM_CHANGES.md文档

---

### 7.4 定制点追踪文档

创建 `CUSTOM_CHANGES.md` 记录所有定制点:

```markdown
# 定制改动追踪文档

## 新增文件
- `app/api/projects/employee/[employeeId]/route.js` - 员工项目API
- `components/datasets/EnhancedDatasetMetadata.js` - 增强元数据组件

## 修改的官方文件
- `constant/model.js`
  - 行号: 77-88
  - 改动: 添加openai-custom配置
  - 标记: // CUSTOM: 自定义OpenAI配置

- `components/Navbar.js`
  - 行号: 45
  - 改动: 品牌名称
  - 标记: // CUSTOM: 品牌定制

## 替换的资源文件
- `public/imgs/logo.png`
- `public/imgs/logo.svg`
- `public/imgs/logo.ico`

## 环境变量
- OPENAI_CUSTOM_ENDPOINT
- OPENAI_CUSTOM_API_KEY
- BRAND_NAME
```

---

## 八、验收标准清单 ✅

### 8.1 功能验收

| 功能 | 验收标准 | 测试方法 |
|-----|---------|---------|
| 员工项目API | API正常响应,能创建项目并重定向 | 访问 `/api/projects/employee/test-001` |
| 自定义OpenAI | 模型提供商列表包含自定义配置 | 创建项目,查看模型选项 |
| 标签编辑 | 能选择、保存、取消标签编辑 | 数据集详情页点击标签 |
| 品牌Logo | Logo和favicon显示正确 | 查看页面和浏览器标签 |
| 品牌文案 | 导航栏显示自定义品牌名 | 查看导航栏 |

### 8.2 代码质量验收

- [ ] 所有定制代码有 `// CUSTOM:` 标记
- [ ] 所有新增文件有文档注释
- [ ] 修改的官方文件记录在 `CUSTOM_CHANGES.md`
- [ ] 环境变量在 `.env.example` 中有说明
- [ ] Git提交信息遵循规范
- [ ] 代码通过 `npm run lint` 检查

### 8.3 兼容性验收

- [ ] 项目可正常启动 (`npm run dev`)
- [ ] 无编译错误和警告
- [ ] 数据库迁移正常 (`prisma db push`)
- [ ] 原有官方功能不受影响
- [ ] 自定义功能可通过环境变量禁用

### 8.4 文档验收

- [ ] `CUSTOM_CHANGES.md` 记录完整
- [ ] `.env.example` 包含所有自定义配置
- [ ] README中说明如何启用自定义功能
- [ ] 迁移记录更新到 `执行记录.md`

---

## 九、风险评估与应对措施 ⚠️

### 9.1 技术风险

#### 风险1: 组件架构不兼容
**风险描述**: 1.4.0的组件修改在1.6.0的新架构中无法直接使用

**影响**:
- 数据集标签编辑功能无法迁移
- 需要重新设计实现方案

**可能性**: 中 (30%)

**应对措施**:
1. ✅ **已实施**: 分析1.6.0的EditableField和TagSelector组件
2. ✅ **已计划**: 使用wrapper组件模式重构,而非直接修改
3. **备选方案**: 如组件不可用,参考1.4.0逻辑自行实现简化版

**责任人**: 开发团队

---

#### 风险2: API接口变化
**风险描述**: 1.6.0的API路由结构或数据库schema有破坏性变化

**影响**:
- 员工项目API无法正常工作
- 标签保存API不兼容

**可能性**: 低 (15%)

**应对措施**:
1. **迁移前验证**: 检查1.6.0的数据库schema
2. **适配代码**: 根据schema调整API实现
3. **测试覆盖**: 编写API测试用例确保兼容

**责任人**: 开发团队

---

#### 风险3: 依赖包冲突
**风险描述**: 1.4.0和1.6.0的npm依赖版本不兼容

**影响**:
- 编译错误
- 运行时错误

**可能性**: 低 (10%)

**应对措施**:
1. **策略**: 优先使用1.6.0的依赖版本
2. **仅在必要时**添加新依赖
3. **测试**: 完整的功能测试和集成测试

**责任人**: 开发团队

---

### 9.2 业务风险

#### 风险4: 功能遗漏
**风险描述**: 迁移过程中遗漏某些定制功能

**影响**:
- 业务流程不完整
- 用户体验下降

**可能性**: 中 (25%)

**应对措施**:
1. ✅ **已实施**: TASK-001完整分析了33个改动
2. ✅ **已计划**: 制定详细的迁移清单和验收标准
3. **验收流程**: 逐项验收,确保所有P0功能都已迁移
4. **用户验收**: 邀请业务方参与功能验收

**责任人**: 项目经理 + 业务方

---

#### 风险5: 测试不充分
**风险描述**: 迁移后的测试覆盖不全面,生产环境出现问题

**影响**:
- 生产故障
- 业务中断

**可能性**: 中 (20%)

**应对措施**:
1. **测试计划**: TASK-004制定详细测试用例
2. **分阶段部署**: 先测试环境,再小范围试运行,最后全面切换
3. **回退方案**: 保留1.4.0环境,随时可回退
4. **监控**: 部署后密切监控日志和性能

**责任人**: 测试团队 + 运维团队

---

### 9.3 时间风险

#### 风险6: 工时估算偏差
**风险描述**: 实际迁移时间超过预估

**影响**:
- 项目延期
- 资源紧张

**可能性**: 中 (30%)

**应对措施**:
1. **预留缓冲**: 预估工时 × 1.2 系数
2. **优先级管理**: 确保P0功能优先完成
3. **灵活调整**: P2/P3功能可延后迁移
4. **及时沟通**: 每日更新进度,问题及时上报

**责任人**: 项目经理

---

### 9.4 风险矩阵

| 风险 | 可能性 | 影响程度 | 风险等级 | 优先级 |
|-----|-------|---------|---------|--------|
| 组件架构不兼容 | 中 | 高 | 🔴 高 | P1 |
| 功能遗漏 | 中 | 高 | 🔴 高 | P1 |
| 测试不充分 | 中 | 高 | 🔴 高 | P1 |
| 工时估算偏差 | 中 | 中 | 🟡 中 | P2 |
| API接口变化 | 低 | 中 | 🟡 中 | P2 |
| 依赖包冲突 | 低 | 低 | 🟢 低 | P3 |

**风险应对优先级**:
1. 首先解决高风险项(组件架构、功能遗漏、测试)
2. 监控中风险项(工时、API)
3. 低风险项按需处理

---

## 十、后续任务规划 📋

### 10.1 与TASK-003的衔接

**TASK-003输入**:
- ✅ 功能迁移优先级清单 (P0/P1/P2/P3)
- ✅ 详细的迁移步骤和代码示例
- ✅ 验收标准清单
- ✅ 代码隔离策略
- ✅ 风险应对措施

**TASK-003应做的事**:
1. 按照本文档的批次顺序执行迁移
2. 每完成一个功能立即测试验收
3. 遇到问题参考风险应对措施
4. 记录实际工时和遇到的问题
5. 更新 `CUSTOM_CHANGES.md` 文档

---

### 10.2 需要业务方确认的事项

在开始TASK-003之前,需要与业务方确认:

1. **功能优先级确认**
   - [ ] P0功能列表是否完整?
   - [ ] P1功能是否都需要迁移?
   - [ ] P2/P3功能是否可以暂缓?

2. **Wujie微前端集成**
   - [ ] 是否必须迁移Wujie功能?
   - [ ] 如需迁移,预算多少工时?

3. **验收标准确认**
   - [ ] 验收标准是否符合业务要求?
   - [ ] 是否需要额外的验收项?

4. **时间安排**
   - [ ] 期望的迁移完成时间?
   - [ ] 测试环境何时可用?
   - [ ] 生产环境切换时间窗口?

---

### 10.3 待补充的分析

以下内容需要在TASK-003执行过程中补充:

1. **实际迁移中的问题**
   - 遇到的技术难点
   - 解决方案
   - 经验教训

2. **性能测试结果**
   - API响应时间
   - 页面加载速度
   - 资源占用情况

3. **兼容性测试结果**
   - 不同浏览器
   - 不同操作系统
   - 不同数据规模

---

## 十一、执行记录 📝

### 11.1 执行时间线

| 时间 | 阶段 | 状态 | 备注 |
|-----|------|------|------|
| 2025-11-06 08:00 | 任务启动 | ✅ 完成 | 创建TASK-002文档 |
| 2025-11-06 08:30 | 1.6.0架构分析 | ✅ 完成 | 分析package.json、API结构、组件 |
| 2025-11-06 09:30 | 功能评估 | 🔄 进行中 | 正在制定评估表 |
| - | 时间表制定 | ⏳ 待开始 | - |
| - | 代码隔离策略 | ⏳ 待开始 | - |
| - | 风险识别 | ⏳ 待开始 | - |
| - | 文档完成 | ⏳ 待开始 | - |

### 11.2 问题与解决

#### 问题1: DatasetMetadata组件在1.6.0中已简化
**发现时间**: 2025-11-06 09:00

**问题描述**:
1.6.0的DatasetMetadata.js只有78行,相比1.4.0的164行大幅简化,原有的标签编辑逻辑已被移除

**影响分析**:
- 不能直接复制1.4.0的改动
- 需要重新设计实现方案

**解决方案**:
1. ✅ 分析1.6.0的组件架构,发现了EditableField和TagSelector组件
2. ✅ 设计wrapper组件模式: EnhancedDatasetMetadata
3. ✅ 在迁移计划中详细说明了实现步骤

**结果**: 问题已解决,提供了更好的代码隔离方案

---

#### 问题2: 模型配置架构变化
**发现时间**: 2025-11-06 09:15

**问题描述**:
1.6.0的模型配置架构大幅扩展,从原有的几个提供商扩展到11个

**影响分析**:
- 自定义OpenAI配置需要适配新架构
- 环境变量读取方式可能需要调整

**解决方案**:
1. ✅ 分析MODEL_PROVIDERS数组结构
2. ✅ 设计兼容的配置方案
3. ✅ 在迁移计划中提供了详细代码示例

**结果**: 问题已解决,配置方案更加灵活

---

### 11.3 经验总结

#### 成功经验 ✅

1. **提前架构分析很重要**
   - 通过分析1.6.0的代码,发现了新的组件和架构
   - 避免了直接复制导致的不兼容

2. **wrapper模式是最佳实践**
   - 不修改官方组件,通过包装增强功能
   - 代码隔离良好,升级友好

3. **详细的代码示例减少风险**
   - 在计划中提供完整代码示例
   - TASK-003执行时可直接参考

#### 注意事项 ⚠️

1. **不要假设架构不变**
   - 跨版本迁移,架构可能有较大变化
   - 务必先分析目标版本

2. **优先使用新版本的特性**
   - 如果新版本提供了更好的组件,优先使用
   - 不要固守旧版本的实现方式

3. **保持灵活性**
   - 计划要详细,但也要留有调整空间
   - 实际执行中可能遇到新问题

---

## 十二、总结 📊

### 12.1 核心输出

本任务完成了以下核心产出:

1. ✅ **1.6.0架构分析**: 详细分析了package.json、API结构、组件架构、模型配置
2. ✅ **功能评估表**: 对33个改动进行了详细的必要性评估和优先级划分
3. ✅ **迁移时间表**: 制定了分4个批次的详细时间表,总工时15.5小时
4. ✅ **代码隔离策略**: 提供了5种代码隔离模式和详细的实施指南
5. ✅ **验收标准**: 制定了功能、代码质量、兼容性、文档四个维度的验收标准
6. ✅ **风险评估**: 识别了6大风险并提供了应对措施

### 12.2 关键决策

1. **组件改动**: 使用wrapper模式而非直接修改
2. **迁移策略**: 优先P0功能,P2/P3可选
3. **代码隔离**: 新增优于修改,标记优于混合
4. **时间安排**: 分4批次执行,总工时15.5小时(不含P2/P3)

### 12.3 下一步行动

- [ ] 与业务方确认功能优先级
- [ ] 准备1.6.0开发环境
- [ ] 开始TASK-003: 执行核心功能迁移
- [ ] 按照本文档的批次计划逐步迁移

---

**文档状态**: ✅ 已完成
**完成度**: 100%
**下一步**: 开始TASK-003执行核心功能迁移
