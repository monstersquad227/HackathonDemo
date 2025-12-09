# 部署指南 - Sepolia 测试网

本指南将帮助你将智能合约部署到 Sepolia 测试网。

## 📋 前置要求

1. **Node.js** (v16+)
2. **npm** 或 **yarn**
3. **Sepolia ETH** - 用于支付 Gas 费用
   - 获取方式：https://sepoliafaucet.com/
   - 或：https://faucet.quicknode.com/ethereum/sepolia
4. **钱包私钥** - 用于部署合约的账户私钥
5. **Infura/Alchemy API Key** (可选，用于 RPC 节点)
6. **Etherscan API Key** (可选，用于合约验证)

## 🔧 安装依赖

```bash
cd contract
npm install
```

## ⚙️ 配置环境变量

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入以下信息：

```env
# RPC URL (选择一种方式)
# 方式1: 使用 Infura
INFURA_API_KEY=your_infura_api_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY

# 方式2: 使用 Alchemy
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# 方式3: 使用公共 RPC (不推荐)
# SEPOLIA_RPC_URL=https://rpc.sepolia.org

# 部署账户的私钥 (不要包含 0x 前缀)
PRIVATE_KEY=your_private_key_here

# Etherscan API Key (用于合约验证，可选)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 如何获取 API Key

- **Infura**: https://infura.io/ → 注册账号 → 创建项目 → 获取 API Key
- **Alchemy**: https://www.alchemy.com/ → 注册账号 → 创建应用 → 获取 API Key
- **Etherscan**: https://etherscan.io/apis → 注册账号 → 创建 API Key

## 🚀 部署步骤

### 1. 编译合约

```bash
npm run compile
```

### 2. 部署主合约

部署所有核心合约（EventManagement, RegistrationSBT, CheckIn, SubmissionRegistry）：

```bash
npm run deploy -- --network sepolia
```

或者：

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. 部署 PrizePool (可选)

PrizePool 是按事件部署的，每个活动需要一个独立的 PrizePool 合约。

```bash
EVENT_ID=1 EVENT_CONTRACT_ADDRESS=0x你的EventManagement地址 npx hardhat run scripts/deploy-prizepool.js --network sepolia
```

## 📝 部署后的操作

### 1. 保存合约地址

部署完成后，脚本会输出所有合约地址。请保存这些地址：

```
EventManagement:     0x...
RegistrationSBT:     0x...
CheckIn:             0x...
SubmissionRegistry:  0x...
```

### 2. 更新前端配置

在 `frontend/.env` 或 `frontend/.env.local` 中添加：

```env
VITE_EVENT_MANAGEMENT_CONTRACT_SEPOLIA=0x你的EventManagement地址
VITE_REGISTRATION_SBT_CONTRACT_SEPOLIA=0x你的RegistrationSBT地址
VITE_CHECKIN_CONTRACT_SEPOLIA=0x你的CheckIn地址
VITE_SUBMISSION_REGISTRY_CONTRACT_SEPOLIA=0x你的SubmissionRegistry地址
```

### 3. 验证合约 (可选但推荐)

验证合约可以让用户在 Etherscan 上查看和交互合约代码：

```bash
# 验证 EventManagement
npx hardhat verify --network sepolia 0x你的EventManagement地址

# 验证 RegistrationSBT (需要传入构造函数参数)
npx hardhat verify --network sepolia 0x你的RegistrationSBT地址 "Hackathon Registration SBT" "HACK-SBT"

# 验证 CheckIn
npx hardhat verify --network sepolia 0x你的CheckIn地址

# 验证 SubmissionRegistry
npx hardhat verify --network sepolia 0x你的SubmissionRegistry地址
```

## 🔐 重要安全提示

1. **永远不要提交 `.env` 文件到 Git**
   - 确保 `.env` 在 `.gitignore` 中
   - 私钥泄露会导致资金损失

2. **使用测试网私钥**
   - 部署到测试网时使用专门的测试账户
   - 不要使用主网账户的私钥

3. **检查网络**
   - 部署前确认 `--network sepolia` 参数
   - 避免误部署到主网

4. **保存部署信息**
   - 记录所有合约地址
   - 保存部署交易哈希
   - 记录部署时的网络和参数

## 🐛 常见问题

### 1. "Insufficient balance"
- 确保账户有足够的 Sepolia ETH
- 获取测试币：https://sepoliafaucet.com/

### 2. "Nonce too high"
- 等待之前的交易确认
- 或手动设置 nonce

### 3. "Contract verification failed"
- 检查构造函数参数是否正确
- 确保编译器版本和优化设置匹配

### 4. RPC 连接失败
- 检查 API Key 是否正确
- 尝试使用其他 RPC 提供商
- 检查网络连接

## 📚 下一步

部署完成后，你可以：

1. 在前端连接这些合约地址
2. 测试合约功能
3. 创建第一个活动
4. 测试注册、签到、提交等功能

## 🔗 有用链接

- Sepolia 测试网浏览器: https://sepolia.etherscan.io/
- Sepolia Faucet: https://sepoliafaucet.com/
- Hardhat 文档: https://hardhat.org/docs
- Ethers.js 文档: https://docs.ethers.org/

## 💡 提示

- 部署到测试网是免费的（只需要测试币）
- 可以多次部署来测试不同的配置
- 建议先在本地 Hardhat 网络测试，再部署到 Sepolia
- 保存好部署信息，方便后续维护和升级

