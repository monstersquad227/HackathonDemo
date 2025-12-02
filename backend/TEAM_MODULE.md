# 报名与队伍管理模块文档

## 概述

报名与队伍管理模块实现了完整的队伍创建、成员管理和活动报名功能，支持SBT（Soulbound Token）作为报名凭证。

## 功能特性

### 参与者功能
- 创建队伍
- 添加/移除队伍成员
- 填写队伍资料（成员名单、技能）
- 报名活动
- 签署报名 SBT（不能转让）

### 主办方功能
- 审核/拒绝队伍
- 管理队伍人数
- 查看队伍资料
- 审核/拒绝报名
- 查看报名列表

## 数据模型

### Team（队伍）
- `id`: 队伍ID
- `name`: 队伍名称
- `description`: 队伍描述
- `leader_id`: 队长ID
- `leader_address`: 队长钱包地址
- `max_members`: 最大成员数
- `status`: 状态（pending/approved/rejected）
- `skills`: 队伍技能（逗号分隔）
- `members`: 成员列表
- `registrations`: 报名记录

### TeamMember（队伍成员）
- `id`: 成员ID
- `team_id`: 所属队伍ID
- `address`: 钱包地址
- `name`: 姓名
- `email`: 邮箱
- `skills`: 技能
- `role`: 角色（如Developer、Designer等）

### Registration（报名）
- `id`: 报名ID
- `event_id`: 活动ID
- `team_id`: 队伍ID
- `status`: 状态（pending/approved/rejected/sbt_minted）
- `project_name`: 项目名称
- `project_description`: 项目描述
- `sbt_token_id`: SBT Token ID
- `sbt_tx_hash`: SBT铸造交易哈希

## API 端点

### 队伍管理

#### 创建队伍
```
POST /api/v1/teams
{
  "name": "队伍名称",
  "description": "队伍描述",
  "leader_address": "0x...",
  "max_members": 5,
  "skills": "React, Solidity",
  "members": [
    {
      "address": "0x...",
      "name": "成员姓名",
      "email": "email@example.com",
      "skills": "React",
      "role": "Developer"
    }
  ]
}
```

#### 获取所有队伍
```
GET /api/v1/teams
```

#### 获取队伍详情
```
GET /api/v1/teams/:id
```

#### 根据队长地址获取队伍
```
GET /api/v1/teams/leader/:address
```

#### 根据成员地址获取队伍
```
GET /api/v1/teams/member/:address
```

#### 更新队伍
```
PUT /api/v1/teams/:id
{
  "name": "新名称",
  "max_members": 6
}
```

#### 添加成员
```
POST /api/v1/teams/:id/members
{
  "address": "0x...",
  "name": "成员姓名",
  "email": "email@example.com",
  "skills": "React",
  "role": "Developer"
}
```

#### 移除成员
```
DELETE /api/v1/teams/:id/members/:memberId
```

#### 批准队伍（仅主办方）
```
PATCH /api/v1/teams/:id/approve
{
  "organizer_address": "0x..."
}
```

#### 拒绝队伍（仅主办方）
```
PATCH /api/v1/teams/:id/reject
{
  "organizer_address": "0x..."
}
```

### 报名管理

#### 创建报名
```
POST /api/v1/registrations
{
  "event_id": 1,
  "team_id": 1,
  "project_name": "项目名称",
  "project_description": "项目描述"
}
```

#### 获取活动的所有报名
```
GET /api/v1/registrations/event/:eventId
```

#### 获取报名详情
```
GET /api/v1/registrations/:id
```

#### 批准报名（仅主办方）
```
PATCH /api/v1/registrations/:id/approve
{
  "organizer_address": "0x..."
}
```

#### 拒绝报名（仅主办方）
```
PATCH /api/v1/registrations/:id/reject
{
  "organizer_address": "0x..."
}
```

#### 更新SBT状态
```
PATCH /api/v1/registrations/:id/sbt
{
  "token_id": 123,
  "tx_hash": "0x..."
}
```

## 智能合约

### RegistrationSBT.sol

报名SBT（Soulbound Token）智能合约，提供以下功能：

1. **铸造SBT**
   - `mintRegistration()`: 为已批准的报名铸造SBT
   - `batchMintRegistrations()`: 批量铸造SBT

2. **不可转让**
   - 重写所有transfer函数，防止SBT被转让
   - SBT只能铸造，不能转移

3. **查询功能**
   - `getEventTokens()`: 获取活动的所有SBT
   - `getRegistrationData()`: 获取SBT的注册数据
   - `hasRegistration()`: 检查地址是否有活动的报名SBT
   - `getRegistrationTokenId()`: 获取地址和活动的SBT Token ID

## 使用流程

1. **创建队伍**
   - 参与者创建队伍
   - 添加成员信息
   - 设置队伍技能和描述

2. **队伍审核**
   - 主办方审核队伍
   - 批准或拒绝

3. **报名活动**
   - 已批准的队伍报名活动
   - 填写项目信息（可选）

4. **报名审核**
   - 主办方审核报名
   - 批准或拒绝

5. **铸造SBT**
   - 已批准的报名可以铸造SBT
   - SBT作为报名凭证，不可转让

## 业务规则

1. **队伍创建**
   - 队伍创建后状态为pending
   - 只有已批准的队伍可以报名活动

2. **成员管理**
   - 队伍成员数不能超过max_members
   - 成员地址不能重复

3. **报名限制**
   - 只有已批准的队伍可以报名
   - 每个队伍只能为同一活动报名一次
   - 活动必须在registration阶段才能报名

4. **SBT铸造**
   - 只有已批准的报名可以铸造SBT
   - SBT一旦铸造，不可转让

## 安全注意事项

1. **权限控制**: 只有主办方可以审核队伍和报名
2. **状态验证**: 队伍必须批准后才能报名
3. **唯一性**: 每个队伍只能为同一活动报名一次
4. **SBT不可转让**: 智能合约层面防止SBT被转让

