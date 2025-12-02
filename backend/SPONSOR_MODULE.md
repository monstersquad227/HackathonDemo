# 赞助商/奖金池模块文档

## 概述

赞助商/奖金池模块实现了完整的赞助商管理和奖金池功能，支持多种资产类型的赞助和自动化的奖金发放。

## 功能特性

### 赞助商功能
- 创建和管理赞助商信息
- 支持钱包地址唯一性验证
- 赞助商信息管理（名称、描述、Logo、网站）

### 赞助功能
- 支持多种资产类型：
  - ERC20 代币
  - 原生资产（ETH/SOL等）
  - NFT
- 赞助申请和审核流程
- 赞助状态跟踪（待审核、已批准、已拒绝、已存入）
- 投票权重配置
- 赞助权益管理

### 奖金池功能
- 多币种托管
- 奖励比例配置
- 锁仓机制（直到活动结束）
- 自动发奖（通过智能合约）

## 数据模型

### Sponsor（赞助商）
- `id`: 赞助商ID
- `name`: 名称
- `description`: 描述
- `logo_url`: Logo URL
- `website_url`: 网站URL
- `address`: 钱包地址（唯一）

### Sponsorship（赞助）
- `id`: 赞助ID
- `event_id`: 活动ID
- `sponsor_id`: 赞助商ID
- `asset_type`: 资产类型（erc20/native/nft）
- `token_address`: 代币地址
- `token_id`: NFT Token ID
- `amount`: 金额
- `amount_display`: 可读金额
- `status`: 状态（pending/approved/rejected/deposited）
- `deposit_tx_hash`: 存入交易哈希
- `voting_weight`: 投票权重
- `benefits`: 权益描述

### FundingPool（奖金池）
- `id`: 奖金池ID
- `event_id`: 活动ID（唯一）
- `contract_address`: 合约地址
- `total_amount`: 总金额
- `locked_until`: 锁定至时间
- `distributed`: 是否已发放

## API 端点

### 赞助商管理

#### 创建赞助商
```
POST /api/v1/sponsors
{
  "name": "赞助商名称",
  "description": "描述",
  "logo_url": "https://...",
  "website_url": "https://...",
  "address": "0x..."
}
```

#### 获取所有赞助商
```
GET /api/v1/sponsors
```

#### 获取赞助商详情
```
GET /api/v1/sponsors/:id
GET /api/v1/sponsors/address/:address
```

### 赞助管理

#### 创建赞助申请
```
POST /api/v1/sponsorships
{
  "event_id": 1,
  "sponsor_id": 1,
  "asset_type": "erc20",
  "token_address": "0x...",
  "amount": "1000000000000000000",
  "amount_display": "1 USDC",
  "voting_weight": "1 USDC = 1 vote",
  "benefits": "权益描述"
}
```

#### 获取活动的所有赞助
```
GET /api/v1/sponsorships/event/:eventId
```

#### 批准赞助（仅主办方）
```
PATCH /api/v1/sponsorships/:id/approve
{
  "organizer_address": "0x..."
}
```

#### 拒绝赞助（仅主办方）
```
PATCH /api/v1/sponsorships/:id/reject
{
  "organizer_address": "0x..."
}
```

#### 更新存入状态
```
PATCH /api/v1/sponsorships/:id/deposit
{
  "tx_hash": "0x..."
}
```

### 奖金池管理

#### 创建奖金池
```
POST /api/v1/funding-pools
{
  "event_id": 1,
  "contract_address": "0x..."
}
```

#### 获取活动的奖金池
```
GET /api/v1/funding-pools/event/:eventId
```

#### 设置锁定时间
```
PATCH /api/v1/funding-pools/event/:eventId/lock
{
  "locked_until": "2024-01-02T00:00:00Z"
}
```

#### 标记为已发放
```
PATCH /api/v1/funding-pools/event/:eventId/distribute
```

## 智能合约

### PrizePool.sol

奖金池智能合约提供以下功能：

1. **多币种存款**
   - `depositNative()`: 存入原生资产
   - `depositERC20()`: 存入ERC20代币
   - `depositERC721()`: 存入NFT

2. **奖金配置**
   - `setPrizeDistributions()`: 设置奖励比例

3. **锁仓机制**
   - `setLockedUntil()`: 设置锁定时间

4. **自动发奖**
   - `distributePrizes()`: 发放奖金给获胜者

## 使用流程

1. **创建赞助商**
   - 赞助商注册信息

2. **申请赞助**
   - 赞助商为活动申请赞助
   - 选择资产类型和金额

3. **审核赞助**
   - 主办方审核赞助申请
   - 批准或拒绝

4. **存入资金**
   - 赞助商将资金存入智能合约
   - 更新存入状态和交易哈希

5. **创建奖金池**
   - 主办方为活动创建奖金池合约

6. **配置奖励比例**
   - 设置各名次的奖励比例

7. **锁定奖金池**
   - 活动结束后锁定奖金池

8. **发放奖金**
   - 主办方触发自动发奖
   - 根据配置比例分配给获胜者

## 安全注意事项

1. **权限控制**: 只有主办方可以审核赞助和操作奖金池
2. **状态验证**: 赞助必须经过批准才能存入
3. **锁仓机制**: 奖金池在活动结束前锁定，防止提前提取
4. **防重入**: 智能合约使用ReentrancyGuard防止重入攻击

