# Backend API - Event Management Module

## 概述

这是 Hackathon Platform 的后端 API，使用 Go 语言和 Gin 框架实现活动管理模块。

## 技术栈

- **语言**: Go 1.21+
- **Web 框架**: Gin
- **ORM**: GORM
- **数据库**: PostgreSQL

## 项目结构

```
backend/
├── config/          # 配置文件
├── controllers/     # API 控制器层
├── services/        # 业务逻辑层
├── repositories/    # 数据访问层
├── models/          # 数据模型
├── database/        # 数据库配置和迁移
├── test/           # 测试文件
├── main.go         # 应用入口
└── go.mod          # Go 模块依赖
```

## 环境要求

- Go 1.21 或更高版本
- PostgreSQL 12 或更高版本

## 安装和运行

### 1. 安装依赖

```bash
cd backend
go mod download
```

### 2. 配置数据库

创建 PostgreSQL 数据库：

```sql
CREATE DATABASE hackathon_db;
```

设置环境变量（可选，默认值已配置）：

```bash
export DATABASE_URL="host=localhost user=postgres password=postgres dbname=hackathon_db port=5432 sslmode=disable"
export PORT=8080
```

### 3. 运行应用

```bash
go run main.go
```

应用将在 `http://localhost:8080` 启动。

## API 端点

### 活动管理

#### 创建活动
```
POST /api/v1/events
Content-Type: application/json

{
  "name": "活动名称",
  "description": "活动描述",
  "location": "活动地点",
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-02T00:00:00Z",
  "organizer_address": "0x...",
  "allow_sponsor_voting": true,
  "allow_public_voting": false,
  "prizes": [
    {
      "rank": 1,
      "name": "一等奖",
      "description": "一等奖描述",
      "amount": "1000 USDC"
    }
  ]
}
```

#### 获取所有活动
```
GET /api/v1/events
```

#### 获取活动详情
```
GET /api/v1/events/:id
```

#### 更新活动
```
PUT /api/v1/events/:id
Content-Type: application/json

{
  "name": "更新后的活动名称",
  ...
}
```

#### 删除活动
```
DELETE /api/v1/events/:id
```

#### 更新活动阶段
```
PATCH /api/v1/events/:id/stage
Content-Type: application/json

{
  "stage": "voting"
}
```

可用阶段值：
- `registration` - 报名中
- `checkin` - 签到
- `submission` - 提交作品
- `voting` - 投票中
- `awards` - 颁奖
- `ended` - 已结束

## 数据模型

### Event (活动)
- `id`: 活动ID
- `name`: 活动名称
- `description`: 活动描述
- `location`: 活动地点
- `start_time`: 开始时间
- `end_time`: 结束时间
- `current_stage`: 当前阶段
- `organizer_address`: 主办方钱包地址
- `allow_sponsor_voting`: 是否允许赞助商投票
- `allow_public_voting`: 是否允许公众投票
- `on_chain`: 是否链上创建
- `contract_address`: 合约地址（如果链上创建）
- `prizes`: 奖项列表

### Prize (奖项)
- `id`: 奖项ID
- `event_id`: 所属活动ID
- `rank`: 排名（1=第一名）
- `name`: 奖项名称
- `description`: 奖项描述
- `amount`: 奖金金额

## 开发

### 运行测试

```bash
go test ./...
```

### 代码格式化

```bash
go fmt ./...
```

### 代码检查

```bash
go vet ./...
```

