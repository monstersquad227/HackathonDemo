# 🚀 快速部署指南 - Sepolia

## 一键部署步骤

### 1. 安装依赖
```bash
cd contract
npm install
```

### 2. 配置环境变量
```bash
# 复制模板文件
cp .env.example .env

# 编辑 .env 文件，填入你的信息：
# - PRIVATE_KEY: 你的钱包私钥（不要0x前缀）
# - SEPOLIA_RPC_URL: Sepolia RPC地址（或使用INFURA_API_KEY）
# - ETHERSCAN_API_KEY: (可选) 用于合约验证
```

**获取测试币：** https://sepoliafaucet.com/

### 3. 编译合约
```bash
npm run compile
```

### 4. 部署到 Sepolia
```bash
npm run deploy -- --network sepolia
```

部署完成后会显示所有合约地址，**请保存这些地址！**

### 5. (可选) 验证合约
```bash
# 验证 EventManagement
npx hardhat verify --network sepolia <合约地址>

# 验证 RegistrationSBT (需要参数)
npx hardhat verify --network sepolia <合约地址> "Hackathon Registration SBT" "HACK-SBT"

# 验证 CheckIn
npx hardhat verify --network sepolia <合约地址>

# 验证 SubmissionRegistry
npx hardhat verify --network sepolia <合约地址>
```

## 📝 部署后的合约地址

部署完成后，你会得到类似这样的输出：

```
EventManagement:     0x1234...
RegistrationSBT:     0x5678...
CheckIn:             0x9abc...
SubmissionRegistry:  0xdef0...
```

**将这些地址保存到前端的 `.env` 文件中：**

```env
VITE_EVENT_MANAGEMENT_CONTRACT_SEPOLIA=0x1234...
VITE_REGISTRATION_SBT_CONTRACT_SEPOLIA=0x5678...
VITE_CHECKIN_CONTRACT_SEPOLIA=0x9abc...
VITE_SUBMISSION_REGISTRY_CONTRACT_SEPOLIA=0xdef0...
```

## ⚠️ 重要提示

1. **私钥安全**: 永远不要提交 `.env` 文件到 Git
2. **测试网**: 确保使用 Sepolia 测试网，不要误部署到主网
3. **Gas费用**: 部署需要一些 Sepolia ETH，确保账户有足够余额
4. **保存地址**: 部署后立即保存合约地址，避免丢失

## 🆘 遇到问题？

查看详细文档：`DEPLOY.md`

常见问题：
- **余额不足**: 去 https://sepoliafaucet.com/ 获取测试币
- **RPC错误**: 检查 `.env` 中的 RPC URL 是否正确
- **编译错误**: 运行 `npm run compile` 查看详细错误信息

## ✅ 完成！

部署成功后，你就可以：
1. 在前端使用这些合约地址
2. 创建第一个活动
3. 测试注册、签到、提交等功能

祝部署顺利！🎉

