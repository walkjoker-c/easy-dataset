# [TASK-003] 员工API逻辑修改

## 任务元数据
- **任务ID**: TASK-003
- **所属需求**: [REQ-002] 员工ID映射优化
- **任务名称**: 员工API逻辑修改
- **优先级**: P0
- **状态**: ✅ 已完成
- **负责人**: Claude Code AI助手
- **实际开始**: 2025-11-08 12:10
- **实际完成**: 2025-11-08 13:10
- **预估工时**: 1.2 小时
- **实际工时**: 1.0 小时
- **最后更新**: 2025-11-08

---

## 一、任务目标 🎯

### 1.1 目标描述
修改员工API,添加POST方法,支持自定义name参数,移除name唯一性检查,实现完整的GET/POST双接口。

### 1.2 成功标准
- [x] 导入 lib/custom/employee-project.js 函数
- [x] 添加 POST 方法处理函数
- [x] GET 方法支持查询参数 name 和 description
- [x] POST 方法支持 JSON body
- [x] 支持更新已存在项目的名称
- [x] 替换 isExistByName() 为 getProjectByExternalId()
- [x] 替换 createProject() 为 createProjectWithExternalId()
- [x] 移除 app/api/projects/route.js 中的 name 唯一性检查
- [x] 添加 CUSTOM 标记注释

---

## 二、前置条件

### 2.1 依赖任务
- [x] TASK-001: 数据库Schema设计与迁移
- [x] TASK-002: 自定义代码层实现

---

## 三、执行计划

### 3.1 任务分解

#### 子任务1: 修改 GET 方法
- **预估工时**: 0.3 小时
- **输出物**: 支持查询参数的 GET 方法

#### 子任务2: 添加 POST 方法
- **预估工时**: 0.4 小时
- **输出物**: 支持 JSON body 的 POST 方法

#### 子任务3: 移除 name 唯一性检查
- **预估工时**: 0.2 小时
- **输出物**: 修改后的 app/api/projects/route.js

#### 子任务4: 添加 CUSTOM 标记
- **预估工时**: 0.1 小时
- **输出物**: 规范的注释标记

---

## 四、核心实现

### 4.1 文件1: app/api/projects/employee/[employeeId]/route.js

**变更类型**: 完全重写
**变更行数**: +126, -66
**变更内容**:

1. **导入自定义函数**:
```javascript
import {
  getProjectByExternalId,
  createProjectWithExternalId
} from '@/lib/custom/employee-project';
```

2. **GET 方法**:
- 提取查询参数: `request.nextUrl.searchParams.get('name')`
- 通过 externalId 查找项目
- 如果项目存在且传入 name,更新项目名称
- 重定向到 text-split 页面

3. **POST 方法**:
- 解析 JSON body: `await request.json()`
- 通过 externalId 查找项目
- 如果项目存在且传入 name,更新项目名称
- 重定向到 text-split 页面

### 4.2 文件2: app/api/projects/route.js

**变更类型**: 删除代码
**变更行数**: +13, -3
**变更内容**:

```javascript
// ========== CUSTOM START ==========
// 修改日期: 2025-11-08 | 需求: REQ-002
// 变更说明: 移除name唯一性检查,允许不同项目使用相同名称

// 旧逻辑 (已删除):
// if (await isExistByName(projectData.name)) {
//   return Response.json({ error: '项目名称已存在' }, { status: 400 });
// }

// 新逻辑: 不再检查name重复
// ========== CUSTOM END ==========
```

---

## 五、关键决策记录

| 决策内容 | 决策原因 | 影响范围 | 决策人 |
|---------|---------|---------|--------|
| GET和POST都支持 | GET兼容性,POST规范性 | API设计 | 用户 |
| 支持更新已存在项目名称 | 允许外部系统随时调整名称 | API功能 | 用户 |
| 移除name唯一性检查 | 允许不同用户使用相同名称 | API层逻辑 | 用户 |

---

## 六、产出物清单

### 6.1 代码产出
- [x] app/api/projects/employee/[employeeId]/route.js (重写,192行)
  - GET 方法: 114行
  - POST 方法: 73行
- [x] app/api/projects/route.js (修改,-3行逻辑,+13行注释)

---

## 七、经验总结

### 7.1 做得好的地方 ✅
1. **双接口设计**: GET保持兼容,POST符合规范
2. **CUSTOM标记规范**: 清晰说明变更原因和旧逻辑
3. **代码复用**: GET和POST逻辑高度相似,减少重复

### 7.2 可复用的方案 🔄
- **双接口模式**: 可复用到其他需要兼容性的API设计
- **注释旧逻辑**: 删除代码时保留注释,便于理解变更

---

**任务状态**: ✅ 已完成
**完成时间**: 2025-11-08 13:10
**实际工时**: 1.0 小时(节省 0.2h,效率 120%)
