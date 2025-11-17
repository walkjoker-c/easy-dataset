# Easy Dataset 定制版本开发工作流程手册

> 版本：v1.1
> 更新日期：2025-11-14
> 适用于：基于开源项目的定制开发与官方贡献并行的工作流程

---

## 📋 目录

- [仓库配置](#仓库配置)
- [分支策略](#分支策略)
- [工作流程](#工作流程)
  - [场景1: 官方更新同步](#场景1-官方更新同步)
  - [场景2: 新功能定制开发](#场景2-新功能定制开发)
  - [场景3: 修复官方 Bug](#场景3-修复官方-bug)
  - [场景4: 紧急修复生产问题](#场景4-紧急修复生产问题)
  - [场景5: 并行提交多个 PR](#场景5-并行提交多个-pr)
  - [场景6: 处理 PR 冲突](#场景6-处理-pr-冲突)
- [快速命令参考](#快速命令参考)
- [关键原则](#关键原则)
- [常见问题](#常见问题)

---

## 🏗️ 仓库配置

### 远程仓库

| 名称 | 仓库地址 | 用途 |
|------|---------|------|
| **upstream** | ConardLi/easy-dataset (官方) | 拉取官方最新代码 |
| **origin** | walkjoker-c/easy-dataset (你的 Fork) | 推送 PR 分支，贡献官方 |
| **huawei** | 华为云代码仓 | 推送定制版本 |

### 查看当前配置

```bash
git remote -v

# 输出示例：
# upstream  git@github.com:ConardLi/easy-dataset.git (fetch/push)
# origin    git@github.com:walkjoker-c/easy-dataset.git (fetch/push)
# huawei    git@codehub-cn-south-1.devcloud...git (fetch/push)
```

### 初始配置（仅首次）

```bash
# 1. Clone 官方仓库
git clone git@github.com:ConardLi/easy-dataset.git

# 2. 重命名 origin 为 upstream
git remote rename origin upstream

# 3. 添加你的 Fork
git remote add origin git@github.com:walkjoker-c/easy-dataset.git

# 4. 添加华为云仓库
git remote add huawei git@codehub-cn-south-1.devcloud...git

# 5. 拉取所有远程分支
git fetch --all
```

---

## 🌿 分支策略

### 本地分支

| 分支名 | 跟踪 | 用途 | 是否长期存在 |
|--------|------|------|------------|
| **main** | upstream/main | 官方正式版 | ✅ 是 |
| **dev** | upstream/dev | 官方开发版 | ✅ 是 |
| **custom-production** | huawei/custom-production | 定制开发版（主工作分支） | ✅ 是 |
| **feature/REQ-XXX** | 无或 huawei/feature/XXX | 功能开发分支 | ❌ 否（合并后删除） |
| **bugfix/XXX** | origin/bugfix/XXX | 官方 Bug 修复 | ❌ 否（PR 后删除） |
| **hotfix/XXX** | huawei/hotfix/XXX | 紧急修复 | ❌ 否（修复后删除） |

### 华为云分支

| 分支名 | 用途 | 保护级别 |
|--------|------|---------|
| **master** | 定制正式版（生产环境） | 🔒 受保护（只能通过 MR） |
| **custom-production** | 定制开发版（集成分支） | 🔓 可直接推送 |
| **feature/REQ-XXX** | 功能分支（可选，用于协作） | 🔓 可直接推送 |
| **hotfix/XXX** | 紧急修复分支 | 🔓 可直接推送 |

### 分支流程图

```
官方代码同步:
upstream/dev → local/dev → local/custom-production → huawei/custom-production → [MR] → huawei/master

定制功能开发:
feature/REQ-XXX → local/custom-production → huawei/custom-production → [MR] → huawei/master

贡献官方:
bugfix/xxx → origin/bugfix/xxx → [PR] → upstream/dev
```

---

## 🔄 工作流程

### 场景1: 官方更新同步

当官方仓库有新版本时，同步到定制版本。

#### 步骤详解

```bash
# 1. 拉取官方最新代码
git checkout dev
git pull upstream dev

# 2. 合并到定制开发分支（可能有冲突需要解决）
git checkout custom-production
git merge dev
# 如果有冲突：
# - 利用代码隔离标记 (CUSTOM: REQ-XXX) 来识别定制代码
# - 保留定制功能，更新官方代码
# - 解决冲突后：git add . && git commit

# 3. 推送到华为云开发分支
git push huawei custom-production

# 4. 在华为云 DevCloud 网页上创建 MR (Merge Request)
#    From: custom-production
#    To: master
#    标题：Sync official v1.X.X to master
#    描述：同步官方 v1.X.X 版本更新

# 5. 经过测试和审核后，在华为云网页上合并 MR 到 master

# 6. 合并后，拉取最新的 master 并打标签
git fetch huawei
git checkout -b temp-master huawei/master
git tag -a v1.6.0-custom-1.X -m "Release v1.6.0-custom-1.X"
git push huawei v1.6.0-custom-1.X
git checkout custom-production
git branch -D temp-master
```

#### 处理合并冲突

如果出现冲突，按以下原则处理：

1. **查找代码隔离标记**：
   ```javascript
   // ===== CUSTOM: REQ-003 OBS Integration Start =====
   // 定制代码
   // ===== CUSTOM: REQ-003 OBS Integration End =====
   ```

2. **冲突解决策略**：
   - 官方代码的 bug 修复和优化 → 接受官方版本
   - 定制功能代码 → 保留定制版本
   - 同一处修改 → 手动合并，保留两者优点

3. **解决后验证**：
   ```bash
   npm install
   npm run dev
   # 测试关键功能是否正常
   ```

---

### 场景2: 新功能定制开发

开发新的定制功能。

#### 步骤详解

```bash
# 1. 从 custom-production 创建功能分支
git checkout custom-production
git pull huawei custom-production  # 确保是最新的
git checkout -b feature/REQ-004-new-feature

# 2. 开发功能、提交代码
# 编写代码，添加代码隔离标记
git add .
git commit -m "feat(REQ-004): 新功能描述

详细说明：
- 实现了 XXX 功能
- 修改了 YYY 模块
- 添加了 ZZZ 组件

相关需求：REQ-004"

# 3. 推送功能分支到华为云（可选，用于备份或协作）
git push huawei feature/REQ-004-new-feature

# 4. 在本地合并到 custom-production
git checkout custom-production
git merge feature/REQ-004-new-feature --no-ff
# --no-ff 保留分支历史，便于追踪

# 5. 推送到华为云
git push huawei custom-production

# 6. 在华为云创建 MR
#    From: custom-production
#    To: master
#    标题：feat(REQ-004): 新功能名称
#    描述：功能说明、测试情况、影响范围
#    (或者积累多个功能后再一起发版)

# 7. MR 合并后，删除功能分支
git branch -d feature/REQ-004-new-feature
git push huawei --delete feature/REQ-004-new-feature  # 如果推送过
```

#### 代码隔离最佳实践

```javascript
// ===== CUSTOM: REQ-004 Feature Name Start =====
// 定制功能代码
// 修改原因：满足特定业务需求
// 修改人：你的名字
// 修改日期：2025-11-14
const customFeature = () => {
  // 实现代码
};
// ===== CUSTOM: REQ-004 Feature Name End =====
```

---

### 场景3: 修复官方 Bug

发现官方 bug，贡献修复代码。

#### 步骤详解

```bash
# 1. 从官方 dev 创建 bugfix 分支
git checkout dev
git pull upstream dev
git checkout -b bugfix/594-fix-pagination-state

# 2. 修复 bug、提交
git add .
git commit -m "fix: persist pagination state in dataset list (#594)

- Add page and rowsPerPage to useDatasetFilters hook
- Save pagination state to localStorage
- Fix pagination reset issue when navigating back

Fixes #594"

# 3. 推送到你的 GitHub Fork
git push origin bugfix/594-fix-pagination-state

# 4. 在 GitHub 网页上创建 PR
#    访问：https://github.com/ConardLi/easy-dataset/compare/dev...walkjoker-c:easy-dataset:bugfix/594-fix-pagination-state
#    Base: ConardLi:dev
#    Compare: walkjoker-c:bugfix/594-fix-pagination-state
#    标题：fix: bug 描述 (#issue编号)
#    描述：参考 PR 模板填写

# 5. PR 合并后，同步到定制版本
#    参考 [场景1: 官方更新同步]

# 6. 删除本地和远程的 bugfix 分支
git checkout dev
git branch -d bugfix/594-fix-pagination-state
git push origin --delete bugfix/594-fix-pagination-state
```

#### PR 描述模板

```markdown
## Description
简要描述修复的问题和解决方案。

## Changes
- 修改项 1
- 修改项 2
- 修改项 3

## Testing
- 测试步骤 1
- 测试步骤 2
- 验证结果

## Related Issue
Fixes #594

## Type of Change
- [x] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)

## Checklist
- [x] My code follows the style guidelines of this project
- [x] I have performed a self-review of my code
- [x] I have tested my changes locally
- [x] The changes fix the issue described in #XXX
```

---

### 场景4: 紧急修复生产问题

生产环境出现严重 bug，需要紧急修复。

#### 步骤详解

```bash
# 1. 从华为云 master 创建 hotfix 分支
git fetch huawei
git checkout -b hotfix/critical-bug huawei/master

# 2. 快速修复、提交
git add .
git commit -m "fix: 紧急修复生产环境 XXX 问题

问题描述：XXX
影响范围：XXX
修复方案：XXX
验证步骤：XXX"

# 3. 推送到华为云
git push huawei hotfix/critical-bug

# 4. 在华为云创建紧急 MR
#    From: hotfix/critical-bug
#    To: master
#    标记为：紧急修复
#    快速审核和测试后立即合并

# 5. MR 合并后，同步回 custom-production（重要！）
git fetch huawei
git checkout custom-production
git merge huawei/master
git push huawei custom-production

# 6. 清理 hotfix 分支
git branch -d hotfix/critical-bug
git push huawei --delete hotfix/critical-bug
```

#### 紧急修复注意事项

- ⚠️ **快速验证**：修复后立即在测试环境验证
- ⚠️ **通知团队**：通知相关人员紧急修复情况
- ⚠️ **同步回 dev**：修复后务必同步回 custom-production，避免下次发版丢失
- ⚠️ **记录文档**：在需求文档中记录此次紧急修复

---

### 场景5: 并行提交多个 PR

同时修复多个不相关的 Bug，并行提交多个 PR。

#### 核心原则

**一个分支一个问题，每个分支都从最新的 dev 创建**

```
upstream/dev (官方最新代码)
    │
    ├─── bugfix/594-fix-pagination ──→ PR #600 (独立)
    │
    ├─── bugfix/595-fix-export     ──→ PR #601 (独立)
    │
    └─── bugfix/596-fix-search     ──→ PR #602 (独立)

每个分支互不影响，可以并行审核和合并
```

#### 步骤详解

```bash
# Bug 1: 修复翻页问题
git checkout dev
git pull upstream dev
git checkout -b bugfix/594-fix-pagination
# 修改代码、测试
git add .
git commit -m "fix: persist pagination state in dataset list (#594)"
git push origin bugfix/594-fix-pagination
# 在 GitHub 创建 PR #600

# Bug 2: 修复导出问题（不等 Bug 1 合并）
git checkout dev              # ← 关键：回到 dev，不是从 bugfix/594 创建
git pull upstream dev         # ← 确保是最新的
git checkout -b bugfix/595-fix-export-dialog
# 修改代码、测试
git add .
git commit -m "fix: resolve export dialog issue (#595)"
git push origin bugfix/595-fix-export-dialog
# 在 GitHub 创建 PR #601

# Bug 3: 修复搜索问题
git checkout dev
git pull upstream dev
git checkout -b bugfix/596-fix-search-filter
# 修改代码、测试
git add .
git commit -m "fix: improve search filter logic (#596)"
git push origin bugfix/596-fix-search-filter
# 在 GitHub 创建 PR #602

# 结果：同时有 3 个 PR 在审核中，互不阻塞
```

#### 为什么要这样做？

| 错误做法 | 正确做法 |
|---------|---------|
| ❌ 从 bugfix/594 创建 bugfix/595 | ✅ 从 dev 创建所有 bugfix 分支 |
| ❌ 在同一个分支修复多个 Bug | ✅ 每个 Bug 单独一个分支 |
| ❌ 等 PR #600 合并后再提 PR #601 | ✅ 并行提交，不相互等待 |

#### 避免冲突的技巧

1. **修改不同的文件**（最理想）
   ```bash
   # PR #600: 修改 useDatasetFilters.js 和 page.js
   # PR #601: 修改 ExportDatasetDialog.js
   # 结果：完全不会冲突 ✅
   ```

2. **修改同一文件的不同部分**
   ```bash
   # PR #600: 修改 page.js 第 37-70 行
   # PR #601: 修改 page.js 第 450-460 行
   # 结果：Git 可以自动合并 ✅
   ```

3. **如果确实有依赖关系**
   ```bash
   # 从依赖的分支创建（不推荐，除非必要）
   git checkout bugfix/594-fix-pagination
   git checkout -b bugfix/595-depends-on-594
   # PR #601 会包含 PR #600 的提交
   # 等 PR #600 合并后，PR #601 会自动更新
   ```

#### 实际时间线示例

```
2025-11-14 10:00 ✅ 提交 PR #600 (修复翻页)
2025-11-14 11:00 ✅ 提交 PR #601 (修复导出)
2025-11-14 14:00 ✅ 提交 PR #602 (修复搜索)
                  ↓
2025-11-15 09:00 ✅ 维护者合并 PR #600
2025-11-15 10:00 ⚠️ PR #601 显示冲突（如果有）
2025-11-15 11:00 ✅ 你解决 PR #601 的冲突
2025-11-15 15:00 ✅ 维护者合并 PR #601
2025-11-15 16:00 ✅ 维护者合并 PR #602
```

---

### 场景6: 处理 PR 冲突

当你的 PR 与已合并的 PR 产生冲突时如何处理。

#### 冲突是如何发生的

```
┌─────────────────────────────────────────────────┐
│  PR 冲突发生的典型流程                              │
└─────────────────────────────────────────────────┘

1. 你提交 PR #600 (修改 page.js 第 37 行)
   状态: 等待审核

2. 你提交 PR #601 (修改 page.js 第 40 行)
   状态: 等待审核

3. 维护者合并 PR #600 → dev 分支更新
   ├─ page.js 第 37 行已改变
   └─ PR #601 基于旧的 dev，第 40 行可能受影响

4. GitHub 自动检测 PR #601
   ❌ This branch has conflicts that must be resolved

5. 维护者在 PR #601 留言
   "Please resolve conflicts with the latest dev branch"

6. 你需要解决冲突并更新 PR
```

#### 谁来解决冲突？

**答案：贡献者（你）负责解决冲突**

维护者**不会**：
- ❌ 不会帮你解决冲突
- ❌ 不会修改你的代码
- ❌ 不会在你的分支上提交

维护者**会**：
- ✅ 在 PR 中留言提醒你有冲突
- ✅ 等待你解决冲突后更新 PR
- ✅ 重新审核解决冲突后的代码
- ✅ 如果冲突太复杂，可能建议你重新提交

#### 解决冲突步骤

**方法A: Rebase（推荐，保持历史清晰）**

```bash
# 1. 切换到有冲突的分支
git checkout bugfix/601-fix-export-dialog

# 2. 拉取最新的官方 dev 分支（已包含 PR #600）
git fetch upstream

# 3. Rebase 到最新的 dev
git rebase upstream/dev

# 4. 如果有冲突，Git 会提示：
# CONFLICT (content): Merge conflict in app/projects/.../page.js
# Resolve all conflicts manually, then run "git rebase --continue"

# 5. 打开冲突文件，手动解决冲突
# 文件中会显示：
<<<<<<< HEAD (upstream/dev 的内容，包含 PR #600)
const [page, setPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);
=======
// 你的代码（PR #601 的内容）
const [currentPage, setCurrentPage] = useState(1);
>>>>>>> bugfix/601-fix-export-dialog

# 6. 手动编辑文件，决定保留哪个版本或合并两者
# 删除冲突标记 <<<<<<<, =======, >>>>>>>

# 7. 标记冲突已解决
git add app/projects/.../page.js

# 8. 继续 rebase
git rebase --continue

# 9. 强制推送（因为历史被改写了）
git push origin bugfix/601-fix-export-dialog --force

# 10. 在 PR 中留言
# "Conflicts resolved by rebasing on latest dev. Ready for review."
```

**方法B: Merge（简单，但会产生合并提交）**

```bash
# 1. 切换到有冲突的分支
git checkout bugfix/601-fix-export-dialog

# 2. 拉取最新的官方 dev
git fetch upstream

# 3. 合并最新的 dev
git merge upstream/dev

# 4. 解决冲突（同 rebase 的步骤 5-6）

# 5. 提交合并
git add .
git commit -m "Merge upstream/dev to resolve conflicts"

# 6. 推送
git push origin bugfix/601-fix-export-dialog

# 7. 在 PR 中留言
# "Conflicts resolved. Ready for review."
```

#### 冲突解决示例

**示例1: 简单冲突**

```javascript
// 冲突文件: page.js
<<<<<<< HEAD (最新的 dev，包含 PR #600)
const {
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  searchQuery,
  setSearchQuery
} = useDatasetFilters(projectId);
=======
const {
  searchQuery,
  setSearchQuery,
  exportFormat,
  setExportFormat
} = useDatasetFilters(projectId);
>>>>>>> bugfix/601-fix-export-dialog
```

**解决方案：合并两者的改动**

```javascript
// 解决后的代码（包含两个 PR 的改动）
const {
  page,              // 来自 PR #600
  setPage,           // 来自 PR #600
  rowsPerPage,       // 来自 PR #600
  setRowsPerPage,    // 来自 PR #600
  searchQuery,       // 两个 PR 都有
  setSearchQuery,    // 两个 PR 都有
  exportFormat,      // 来自 PR #601
  setExportFormat    // 来自 PR #601
} = useDatasetFilters(projectId);
```

**示例2: 复杂冲突**

如果冲突太复杂（比如重构了同一个函数），可以：

1. **在 PR 中说明情况**：
   ```markdown
   The conflicts are complex due to #600 refactoring the same function.
   I'll wait for #600 to be merged, then rebase and update this PR.
   ```

2. **或者先关闭 PR，等 #600 合并后重新提交**：
   ```markdown
   Closing this PR temporarily. Will resubmit after #600 is merged
   to avoid complex merge conflicts.
   ```

#### GitHub 冲突提示示例

当 PR 有冲突时，GitHub 会显示：

```
⚠️ This branch has conflicts that must be resolved

Conflicting files:
- app/projects/[projectId]/datasets/page.js
- app/projects/[projectId]/datasets/hooks/useDatasetFilters.js

Use the command line to resolve conflicts before continuing.
```

维护者可能的评论：

```
@walkjoker-c There are merge conflicts after merging #600.
Could you please rebase your branch on the latest dev and resolve the conflicts?
Thanks!
```

#### 冲突解决后的检查清单

- [ ] 冲突已完全解决（没有遗留 `<<<<<<<`, `=======`, `>>>>>>>` 标记）
- [ ] 代码可以正常编译运行
- [ ] 测试通过（如果有自动化测试）
- [ ] 功能正常（手动测试你修复的 Bug）
- [ ] 提交信息清晰
- [ ] 在 PR 中留言说明冲突已解决

#### 避免冲突的最佳实践

1. **及时更新你的分支**
   ```bash
   # 定期将最新的 dev 合并到你的分支
   git checkout bugfix/601-fix-export
   git fetch upstream
   git merge upstream/dev
   ```

2. **尽快完成 PR**
   - PR 开得越久，越容易产生冲突
   - 尽量保持 PR 小而专注，快速合并

3. **关注相关 PR**
   - 如果有其他人在修改同一个文件，及时沟通
   - 可以在 PR 中提及相关的其他 PR

4. **先合并最重要的 PR**
   - 如果有多个相关的 PR，先提交最核心的
   - 其他 PR 基于已合并的 PR 创建

---

## 🚀 快速命令参考

### 日常操作

```bash
# 查看当前分支和状态
git status
git branch -vv

# 查看远程仓库
git remote -v

# 查看远程分支
git branch -r

# 拉取所有远程更新
git fetch --all

# 切换分支
git checkout branch-name

# 查看最近提交
git log --oneline -10
git log --graph --oneline --all -10
```

### 同步官方更新

```bash
# 同步官方 dev 到定制版本（一行命令）
git checkout dev && git pull upstream dev && \
git checkout custom-production && git merge dev && \
git push huawei custom-production
```

### 新功能开发

```bash
# 创建功能分支并开发（一行命令）
git checkout custom-production && git pull huawei custom-production && \
git checkout -b feature/REQ-XXX-name

# 开发完成后合并（一行命令）
git checkout custom-production && \
git merge feature/REQ-XXX-name --no-ff && \
git push huawei custom-production
```

### 修复官方 Bug

```bash
# 创建 bugfix 分支（一行命令）
git checkout dev && git pull upstream dev && \
git checkout -b bugfix/issue-number-description

# 修复完成后推送到 Fork（一行命令）
git add . && git commit -m "fix: description" && \
git push origin bugfix/issue-number-description
```

### 查看差异

```bash
# 查看两个分支的差异
git diff branch1..branch2

# 查看即将合并的内容
git diff custom-production..dev

# 查看文件差异
git diff branch1:path/to/file branch2:path/to/file

# 查看已暂存的更改
git diff --staged
```

### 标签管理

```bash
# 创建标签
git tag -a v1.6.0-custom-1.3 -m "Release v1.6.0-custom-1.3"

# 推送标签到华为云
git push huawei v1.6.0-custom-1.3

# 查看所有标签
git tag -l

# 查看标签详情
git show v1.6.0-custom-1.3

# 删除本地标签
git tag -d v1.6.0-custom-1.3

# 删除远程标签
git push huawei --delete v1.6.0-custom-1.3
```

---

## 💡 关键原则

### 1. 分支保护原则

- ✅ **custom-production** 是主工作分支，保持稳定
- ✅ **master** 是生产分支，只能通过 MR 更新
- ✅ **feature/hotfix 分支** 完成后及时删除
- ❌ **永远不要** 直接在 master 上开发

### 2. 代码隔离原则

```javascript
// 所有定制代码都要添加隔离标记
// ===== CUSTOM: REQ-XXX Feature Name Start =====
// 定制代码
// ===== CUSTOM: REQ-XXX Feature Name End =====
```

**好处**：
- 方便识别定制代码
- 合并官方更新时减少冲突
- 代码审查时清晰可见
- 必要时可以快速移除

### 3. 提交信息规范

```bash
# 格式：<type>(<scope>): <subject>
# type: feat, fix, docs, style, refactor, test, chore
# scope: REQ-XXX, 模块名
# subject: 简短描述

# 示例：
git commit -m "feat(REQ-003): 添加 OBS 文件上传功能"
git commit -m "fix(datasets): 修复翻页状态丢失问题"
git commit -m "docs(README): 更新部署文档"
```

### 4. 合并策略

```bash
# 功能分支合并：使用 --no-ff 保留分支历史
git merge feature/REQ-XXX --no-ff

# 官方更新合并：直接合并（保留官方提交历史）
git merge dev

# 紧急修复：快速合并
git merge hotfix/critical-bug --no-ff
```

### 5. MR/PR 最佳实践

**华为云 MR（内部）**：
- 标题清晰：feat/fix/chore + 功能描述
- 描述完整：变更内容、测试情况、影响范围
- 关联需求：REQ-XXX
- 审核流程：至少一人审核

**GitHub PR（官方）**：
- 标题规范：符合官方规范
- 描述详细：问题描述、解决方案、测试步骤
- 关联 Issue：Fixes #XXX
- 响应及时：及时回复维护者的评论

---

## ❓ 常见问题

### Q1: 合并官方更新时出现大量冲突怎么办？

**A**:
1. 不要慌，冲突是正常的
2. 使用代码隔离标记快速定位定制代码
3. 优先保留定制功能，然后手动合并官方改进
4. 如果冲突太多，可以考虑：
   ```bash
   # 取消合并
   git merge --abort

   # 分批处理：先合并特定文件
   git checkout dev -- path/to/specific/file
   ```
5. 使用可视化工具：VSCode、GitKraken 等

### Q2: 如何回滚错误的合并？

**A**:
```bash
# 方法1: 使用 revert（推荐，保留历史）
git revert -m 1 commit-hash

# 方法2: 使用 reset（慎用，会丢失历史）
git reset --hard HEAD~1
git push huawei custom-production --force  # 慎用！
```

### Q3: 忘记在功能分支开发，直接在 custom-production 改了怎么办？

**A**:
```bash
# 方法1: 创建功能分支，将当前改动移过去
git checkout -b feature/REQ-XXX-forgot
git checkout custom-production
git reset --hard huawei/custom-production

# 方法2: 如果已经提交，使用 cherry-pick
git log --oneline -5  # 找到要移动的 commit
git checkout -b feature/REQ-XXX
git cherry-pick commit-hash
git checkout custom-production
git reset --hard HEAD~1
```

### Q4: 如何保持 Fork 仓库与官方同步？

**A**:
```bash
# 定期同步官方到你的 Fork
git checkout dev
git pull upstream dev
git push origin dev

git checkout main
git pull upstream main
git push origin main
```

### Q5: MR 被拒绝或需要修改怎么办？

**A**:
```bash
# 在原分支继续修改
git checkout feature/REQ-XXX
# 修改代码
git add .
git commit -m "fix: 根据 review 意见修改"
git push huawei feature/REQ-XXX

# MR 会自动更新，不需要重新创建
```

### Q6: 如何查看某个需求的所有相关提交？

**A**:
```bash
# 按提交信息搜索
git log --all --grep="REQ-003" --oneline

# 按文件路径搜索
git log --all -- path/to/custom/file

# 查看详细的改动
git log -p --grep="REQ-003"
```

### Q7: 本地分支太多，如何清理？

**A**:
```bash
# 查看已合并的分支
git branch --merged custom-production

# 批量删除已合并的分支（排除主分支）
git branch --merged custom-production | \
  grep -v "custom-production\|main\|dev" | \
  xargs git branch -d

# 清理远程已删除的分支引用
git fetch --prune
```

### Q8: 如何并行提交多个 Bug 修复的 PR？

**A**: 每个 Bug 都从最新的 dev 创建独立分支，详见 [场景5](#场景5-并行提交多个-pr)

```bash
# 关键：每个 bugfix 都从 dev 创建，不要从其他 bugfix 创建
git checkout dev && git pull upstream dev
git checkout -b bugfix/594-fix-pagination
# 修复、提交、推送

git checkout dev && git pull upstream dev  # 再次从 dev 创建
git checkout -b bugfix/595-fix-export
# 修复、提交、推送

# 两个 PR 互不影响，可以并行审核
```

### Q9: PR 有冲突，维护者会帮我解决吗？

**A**: 不会。冲突由贡献者（你）负责解决，详见 [场景6](#场景6-处理-pr-冲突)

**流程**：
1. 维护者合并其他 PR → 你的 PR 显示冲突
2. 维护者留言提醒你有冲突
3. **你在本地解决冲突并推送更新**
4. 维护者重新审核解决冲突后的代码
5. 维护者合并你的 PR

### Q10: 已经在 bugfix/594 上开始修复第二个 Bug 怎么办？

**A**: 可以"移动"提交到新分支

```bash
# 假设在 bugfix/594 上错误地提交了 Bug 2 的修复
git log --oneline -3
# abc123 fix: bug 2 修复  ← 这个应该在新分支
# def456 fix: bug 1 修复

# 使用 cherry-pick 移动提交
git checkout dev
git checkout -b bugfix/595-fix-another
git cherry-pick abc123
git push origin bugfix/595-fix-another

# 从 bugfix/594 移除错误的提交
git checkout bugfix/594-fix-pagination
git reset --hard def456
git push origin bugfix/594-fix-pagination --force
```

### Q11: PR 合并后如何同步到定制版本？

**A**: 按照 [场景1](#场景1-官方更新同步) 同步官方更新

```bash
# PR 被合并到官方 dev 后
git checkout dev
git pull upstream dev
git checkout custom-production
git merge dev
# 解决冲突（如果有）
git push huawei custom-production
```

---

## 📚 相关文档

- [项目需求管理中心](./docs/requirements/README.md)
- [定制改动说明](./CUSTOM_CHANGES.md)
- [架构文档](./ARCHITECTURE.md)
- [贡献指南](./CONTRIBUTING.md) - 官方仓库

---

## 📞 获取帮助

- **华为云 DevCloud**: https://devcloud.huaweicloud.com
- **官方仓库 Issues**: https://github.com/ConardLi/easy-dataset/issues
- **文档站点**: https://docs.easy-dataset.com

---

**手册版本**: v1.1
**最后更新**: 2025-11-14
**维护者**: walkjoker-c
**更新内容**:
- v1.1: 新增场景5（并行提交多个PR）和场景6（处理PR冲突）
- v1.0: 初始版本

---

> 💡 **提示**: 建议将此文件添加到 `.gitignore` 或放在项目外部，因为它包含内部工作流程信息。
