# Smart Contracts - Event Management

## 概述

这是 Hackathon Platform 的智能合约部分，使用 Solidity 编写，实现活动管理的链上功能。

## 技术栈

- **语言**: Solidity ^0.8.19
- **部署链**: Ethereum, Polygon 等 EVM 兼容链

## 合约说明

### EventManagement.sol

活动管理智能合约，提供以下功能：

#### 主要功能

1. **创建活动**
   - 设置活动基本信息（名称、描述、地点）
   - 配置各阶段时间
   - 设置投票选项
   - 配置奖项信息

2. **查询活动**
   - 获取活动详情
   - 获取活动奖项列表
   - 检查活动是否存在

3. **更新活动**
   - 更新活动阶段（仅主办方）
   - 更新活动信息（仅主办方）

#### 数据结构

```solidity
struct Event {
    uint256 id;
    string name;
    string description;
    string location;
    uint256 startTime;
    uint256 endTime;
    EventStage currentStage;
    address organizer;
    bool allowSponsorVoting;
    bool allowPublicVoting;
    bool exists;
}

struct Prize {
    uint256 rank;
    string name;
    string description;
    string amount;
}

enum EventStage {
    Registration,
    CheckIn,
    Submission,
    Voting,
    Awards,
    Ended
}
```

#### 事件

- `EventCreated`: 活动创建时触发
- `EventStageUpdated`: 活动阶段更新时触发
- `EventUpdated`: 活动信息更新时触发

## 部署

### 使用 Hardhat

1. 安装 Hardhat：

```bash
npm install --save-dev hardhat
```

2. 创建 Hardhat 项目配置

3. 编译合约：

```bash
npx hardhat compile
```

4. 部署合约：

```bash
npx hardhat run scripts/deploy.js --network <network>
```

### 使用 Remix

1. 访问 [Remix IDE](https://remix.ethereum.org/)
2. 创建新文件 `EventManagement.sol`
3. 复制合约代码
4. 编译合约
5. 部署到目标网络

## 安全注意事项

1. **访问控制**: 只有活动主办方可以更新活动信息和阶段
2. **时间验证**: 确保结束时间晚于开始时间
3. **输入验证**: 验证活动名称等必填字段
4. **Gas 优化**: 考虑使用事件而非存储来记录历史数据

## 与后端集成

后端可以通过以下方式与智能合约集成：

1. **链上创建**: 当用户选择链上创建时，调用合约的 `createEvent` 方法
2. **同步状态**: 定期同步链上活动状态到数据库
3. **事件监听**: 监听合约事件，更新数据库状态

## 测试

建议编写完整的测试用例覆盖：

- 活动创建
- 阶段更新
- 权限控制
- 边界条件

## 未来扩展

- 添加活动暂停/恢复功能
- 实现活动取消机制
- 添加活动参与者限制
- 集成奖金池合约

