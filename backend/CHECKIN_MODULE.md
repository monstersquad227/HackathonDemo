# 现场签到模块文档

## 概述

现场签到模块实现了基于链下签名验证的签到系统，成本低且安全性高。用户通过扫描二维码、签名消息完成签到，签到记录可以同步到链上。

## 功能特性

### 链下签名验证（推荐）
- 用户扫描二维码获取签名消息
- 使用钱包对消息进行签名
- 后端验证签名有效性
- 可选择同步到链上记录

### 主办方功能
- 生成签到二维码
- 查看签到人数统计
- 查看签到记录列表
- 导出签到记录（CSV格式）
- 防止重复签到

### 安全特性
- 签名验证确保用户身份
- IP地址和设备信息记录
- 防止重复签到
- 二维码有时效性（30分钟）

## 数据模型

### CheckIn（签到记录）
- `id`: 签到ID
- `event_id`: 活动ID
- `user_address`: 用户钱包地址
- `team_id`: 队伍ID（可选）
- `signature`: 签名
- `message`: 签名的消息
- `tx_hash`: 链上交易哈希（如果同步到链上）
- `check_in_time`: 签到时间
- `ip_address`: IP地址
- `device_info`: 设备信息

## API 端点

### 生成签到二维码
```
GET /api/v1/check-ins/event/:eventId/qrcode
```

返回：
```json
{
  "event_id": 1,
  "message": "Check-in for event 1\nEvent: Hackathon 2024\nSecret: abc123...\nTimestamp: 1234567890",
  "qr_code": "event:1|message:...|expires:1234567890",
  "expires_at": "2024-01-01T12:00:00Z"
}
```

### 签到
```
POST /api/v1/check-ins
{
  "event_id": 1,
  "user_address": "0x...",
  "signature": "0x...",
  "message": "Check-in for event 1\n...",
  "team_id": 1,
  "ip_address": "192.168.1.1",
  "device_info": "Chrome on Windows"
}
```

### 获取活动的所有签到记录
```
GET /api/v1/check-ins/event/:eventId
```

### 获取签到人数
```
GET /api/v1/check-ins/event/:eventId/count
```

返回：
```json
{
  "count": 50
}
```

### 获取用户的签到记录
```
GET /api/v1/check-ins/event/:eventId/user/:address
```

### 更新交易哈希
```
PATCH /api/v1/check-ins/:id/tx
{
  "tx_hash": "0x..."
}
```

## 智能合约

### CheckIn.sol

链上签到记录智能合约，提供以下功能：

1. **记录签到**
   - `recordCheckIn()`: 记录单个签到
   - `batchRecordCheckIn()`: 批量记录签到

2. **查询功能**
   - `hasCheckedIn()`: 检查用户是否已签到
   - `getCheckIn()`: 获取签到记录
   - `getCheckInCount()`: 获取签到人数
   - `getEventCheckInUsers()`: 获取所有签到用户

## 使用流程

1. **主办方生成二维码**
   - 在签到管理页面生成二维码
   - 二维码包含签名消息和有效期

2. **用户扫描二维码**
   - 用户使用手机扫描二维码
   - 获取签名消息

3. **用户签名**
   - 使用钱包（如MetaMask）对消息进行签名
   - 签名证明用户身份

4. **提交签到**
   - 用户提交签名完成签到
   - 后端验证签名有效性

5. **记录签到**
   - 签到记录保存到数据库
   - 可选择同步到链上

## 签名验证流程

1. **消息格式**
   ```
   Check-in for event {eventId}
   Event: {eventName}
   Secret: {secret}
   Timestamp: {timestamp}
   ```

2. **签名验证**
   - 使用Ethereum消息签名格式
   - 添加Ethereum消息前缀：`\x19Ethereum Signed Message:\n{length}{message}`
   - 使用Keccak256哈希
   - 恢复公钥并验证地址

3. **安全措施**
   - 签名必须匹配用户地址
   - 防止签名重放攻击
   - 二维码有时效性

## 业务规则

1. **签到限制**
   - 活动必须在checkin阶段才能签到
   - 每个用户只能签到一次
   - 二维码30分钟后过期

2. **团队签到**
   - 可以关联队伍进行签到
   - 验证用户是否为队伍成员

3. **链上同步**
   - 签到记录可以同步到链上
   - 更新交易哈希记录

## 安全注意事项

1. **签名验证**: 严格验证签名，确保签名来自正确的地址
2. **防重放**: 使用时间戳和随机secret防止重放攻击
3. **IP记录**: 记录IP地址和设备信息用于安全审计
4. **时效性**: 二维码有时效性，过期后需要重新生成

## 前端功能

1. **签到管理页面**（主办方）
   - 生成二维码
   - 查看签到统计
   - 查看签到记录
   - 导出CSV

2. **用户签到页面**
   - 连接钱包
   - 扫描二维码
   - 签名消息
   - 提交签到

