# OBS文件上传功能 - 配置指南

> **文档版本**: v1.0
> **最后更新**: 2025-11-10
> **适用版本**: Easy Dataset v1.6.0+

---

## 📋 目录

1. [环境变量配置](#1-环境变量配置)
2. [获取OBS访问凭证](#2-获取obs访问凭证)
3. [配置Bucket权限](#3-配置bucket权限)
4. [验证配置](#4-验证配置)
5. [常见问题](#5-常见问题)

---

## 1. 环境变量配置

### 1.1 创建配置文件

在项目根目录创建`.env.local`文件(如果已存在则直接修改):

```bash
cd /path/to/easy-dataset
touch .env.local  # 如果文件不存在
```

### 1.2 添加OBS配置

在`.env.local`文件中添加以下配置:

```bash
# ===========================================
# OBS对象存储配置
# ===========================================

# OBS访问密钥(必填)
OBS_ACCESS_KEY=your-access-key-here
OBS_SECRET_KEY=your-secret-key-here

# OBS服务配置(必填)
OBS_ENDPOINT=https://obs.cn-south-1.myhuaweicloud.com
OBS_BUCKET=your-bucket-name

# OBS区域(可选,默认为endpoint中的区域)
# OBS_REGION=cn-south-1
```

### 1.3 配置说明

| 配置项 | 说明 | 示例值 | 是否必填 |
|-------|------|--------|---------|
| `OBS_ACCESS_KEY` | 华为云访问密钥ID | `ABCD1234EFGH5678IJKL` | ✅ 必填 |
| `OBS_SECRET_KEY` | 华为云访问密钥密钥 | `xyz123abc456def789...` | ✅ 必填 |
| `OBS_ENDPOINT` | OBS服务终端节点 | `https://obs.cn-south-1.myhuaweicloud.com` | ✅ 必填 |
| `OBS_BUCKET` | 对象存储桶名称 | `my-company-bucket` | ✅ 必填 |
| `OBS_REGION` | OBS区域代码 | `cn-south-1` | ❌ 可选 |

### 1.4 Endpoint选择指南

根据您的Bucket所在区域选择对应的Endpoint:

| 区域 | Endpoint |
|------|----------|
| 华南-广州 | `https://obs.cn-south-1.myhuaweicloud.com` |
| 华北-北京四 | `https://obs.cn-north-4.myhuaweicloud.com` |
| 华东-上海一 | `https://obs.cn-east-3.myhuaweicloud.com` |
| 华北-北京一 | `https://obs.cn-north-1.myhuaweicloud.com` |

完整区域列表请参考: [华为云OBS区域和终端节点](https://developer.huaweicloud.com/endpoint?OBS)

---

## 2. 获取OBS访问凭证

### 2.1 登录华为云控制台

1. 访问 [华为云控制台](https://console.huaweicloud.com/)
2. 使用您的账号登录

### 2.2 创建访问密钥

1. 点击右上角用户名,选择"我的凭证"
2. 在左侧导航栏选择"访问密钥"
3. 点击"新增访问密钥"按钮
4. 输入登录密码和验证码
5. 下载或记录AccessKey和SecretKey

⚠️ **安全提示**:
- SecretKey仅在创建时显示一次,请妥善保管
- 不要将访问密钥提交到代码仓库
- 建议为不同环境使用不同的访问密钥

### 2.3 使用子用户(推荐)

为了安全考虑,建议创建IAM子用户并授予最小权限:

1. 进入"统一身份认证服务IAM"
2. 创建新的IAM用户
3. 仅授予OBS相关权限(见下节)
4. 为该用户创建访问密钥
5. 使用子用户的密钥配置系统

---

## 3. 配置Bucket权限

### 3.1 必需权限列表

确保您的访问密钥对应的用户拥有以下权限:

| 权限 | 说明 | 用途 |
|------|------|------|
| `obs:bucket:ListBucket` | 列出桶中对象 | 浏览文件列表 |
| `obs:object:GetObject` | 读取对象 | 下载文件 |
| `obs:object:PutObject` | 上传对象 | 移动文件(复制) |
| `obs:object:DeleteObject` | 删除对象 | 移动文件(删除源) |

### 3.2 创建自定义策略(推荐)

#### 方法1: 使用控制台创建

1. 进入"统一身份认证服务IAM"
2. 选择"权限" > "创建自定义策略"
3. 策略名称: `EasyDataset-OBS-Access`
4. 策略内容:

```json
{
  "Version": "1.1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "obs:bucket:ListBucket",
        "obs:object:GetObject",
        "obs:object:PutObject",
        "obs:object:DeleteObject"
      ],
      "Resource": [
        "obs:*:*:bucket:your-bucket-name",
        "obs:*:*:object:your-bucket-name/*"
      ]
    }
  ]
}
```

5. 将此策略授予您的IAM用户

#### 方法2: 使用Bucket策略

在OBS控制台为Bucket配置桶策略:

```json
{
  "Statement": [
    {
      "Sid": "EasyDatasetAccess",
      "Effect": "Allow",
      "Principal": {
        "ID": ["domain/your-domain-id:user/your-user-id"]
      },
      "Action": [
        "ListBucket",
        "GetObject",
        "PutObject",
        "DeleteObject"
      ],
      "Resource": [
        "your-bucket-name",
        "your-bucket-name/*"
      ]
    }
  ]
}
```

### 3.3 路径权限(可选)

如果只想授予特定路径的权限,可以限制Resource:

```json
"Resource": [
  "obs:*:*:object:your-bucket-name/env=*/messageType=conversation_data/*"
]
```

---

## 4. 验证配置

### 4.1 使用测试脚本验证

项目提供了OBS连接测试脚本,运行以下命令验证配置:

```bash
node lib/custom/obs/test-connection.js
```

**预期输出** (配置正确):
```
[OBS Test] ========================================
[OBS Test] OBS连接测试开始
[OBS Test] ========================================

[OBS Test] 配置信息:
[OBS Test]   AccessKey: ABCD****IJKL
[OBS Test]   Endpoint: https://obs.cn-south-1.myhuaweicloud.com
[OBS Test]   Bucket: my-company-bucket

[OBS Test] ✅ 测试1: 列出对象 - 通过
[OBS Test] ✅ 测试2: 上传对象 - 通过
[OBS Test] ✅ 测试3: 下载对象 - 通过
[OBS Test] ✅ 测试4: 删除对象 - 通过

[OBS Test] ========================================
[OBS Test] ✅ OBS连接测试全部通过!
[OBS Test] ========================================
```

### 4.2 常见错误排查

#### 错误1: `AccessDenied - Access Denied`
- **原因**: 访问密钥错误或权限不足
- **解决**: 检查AccessKey和SecretKey是否正确,确认权限配置

#### 错误2: `NoSuchBucket - The specified bucket does not exist`
- **原因**: Bucket名称错误或Bucket不存在
- **解决**: 检查OBS_BUCKET配置,确认Bucket已创建

#### 错误3: `SignatureDoesNotMatch - The request signature we calculated does not match`
- **原因**: SecretKey错误或系统时间不同步
- **解决**: 检查SecretKey,同步系统时间

#### 错误4: `Connection timeout`
- **原因**: 网络问题或Endpoint错误
- **解决**: 检查网络连接,确认Endpoint是否正确

### 4.3 在应用中验证

1. 启动开发服务器:
```bash
npm run dev
```

2. 访问 `http://localhost:1717`

3. 进入任意项目的"文本切分"页面

4. 点击"选择文件" → "OBS文件"

5. 如果配置正确:
   - 对话框正常打开
   - 文件列表可以加载
   - 无错误提示

---

## 5. 常见问题

### Q1: 配置后重启服务器了吗?

**A**: 修改`.env.local`后必须重启开发服务器(Ctrl+C后重新运行`npm run dev`)

### Q2: 可以使用主账号的访问密钥吗?

**A**: 可以,但不推荐。建议创建IAM子用户并授予最小权限,更安全。

### Q3: 多个环境如何配置?

**A**:
- 开发环境: 使用`.env.local`
- 生产环境: 使用环境变量或`.env.production`
- Docker部署: 在docker-compose.yml中配置环境变量

### Q4: AccessKey泄露了怎么办?

**A**:
1. 立即在华为云控制台删除该访问密钥
2. 创建新的访问密钥
3. 更新配置文件
4. 检查是否有未授权的访问记录

### Q5: 如何限制只能访问特定文件夹?

**A**: 在IAM策略中限制Resource范围,例如:
```json
"Resource": [
  "obs:*:*:object:bucket-name/project-files/*"
]
```

### Q6: 支持阿里云OSS或AWS S3吗?

**A**: 当前版本仅支持华为云OBS。如需支持其他对象存储,需要开发相应的适配器。

### Q7: Endpoint配置错误会怎样?

**A**: 请求会超时或返回连接错误。确保Endpoint与Bucket所在区域匹配。

### Q8: 能否使用临时访问密钥?

**A**: 当前版本不支持临时凭证(STS Token),仅支持永久访问密钥。

---

## 附录A: 配置文件示例

### 开发环境 (.env.local)

```bash
# OBS配置
OBS_ACCESS_KEY=ABCD1234EFGH5678IJKL
OBS_SECRET_KEY=xyz123abc456def789ghi012jkl345mno678pqr901stu
OBS_ENDPOINT=https://obs.cn-south-1.myhuaweicloud.com
OBS_BUCKET=easy-dataset-dev

# 数据库配置
DATABASE_URL=file:./prisma/db.sqlite

# 其他配置...
```

### 生产环境 (.env.production)

```bash
# OBS配置(使用生产环境密钥)
OBS_ACCESS_KEY=${PROD_OBS_ACCESS_KEY}
OBS_SECRET_KEY=${PROD_OBS_SECRET_KEY}
OBS_ENDPOINT=https://obs.cn-south-1.myhuaweicloud.com
OBS_BUCKET=easy-dataset-prod

# 数据库配置
DATABASE_URL=${PROD_DATABASE_URL}
```

---

## 附录B: Docker部署配置

### docker-compose.yml

```yaml
version: '3.8'

services:
  easy-dataset:
    image: easy-dataset:latest
    ports:
      - "1717:1717"
    environment:
      # OBS配置
      - OBS_ACCESS_KEY=${OBS_ACCESS_KEY}
      - OBS_SECRET_KEY=${OBS_SECRET_KEY}
      - OBS_ENDPOINT=${OBS_ENDPOINT}
      - OBS_BUCKET=${OBS_BUCKET}
      # 数据库配置
      - DATABASE_URL=file:/app/data/db.sqlite
    volumes:
      - ./local-db:/app/local-db
      - ./data:/app/data
```

### .env (for docker-compose)

```bash
OBS_ACCESS_KEY=your-access-key
OBS_SECRET_KEY=your-secret-key
OBS_ENDPOINT=https://obs.cn-south-1.myhuaweicloud.com
OBS_BUCKET=your-bucket-name
```

---

## 技术支持

- **文档问题**: 请提issue到项目仓库
- **华为云OBS问题**: 参考[华为云OBS官方文档](https://support.huaweicloud.com/obs/index.html)
- **权限配置问题**: 参考[华为云IAM文档](https://support.huaweicloud.com/iam/index.html)

---

**文档版本**: v1.0
**最后更新**: 2025-11-10
**贡献者**: Claude Code
