import { ethers } from 'ethers'

// 网络配置
export const NETWORKS = {
  sepolia: {
    chainId: '0xaa36a7', // 11155111
    chainName: 'Sepolia Test Network',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  goerli: {
    chainId: '0x5', // 5
    chainName: 'Goerli Test Network',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://goerli.infura.io/v3/'],
    blockExplorerUrls: ['https://goerli.etherscan.io'],
  },
  mumbai: {
    chainId: '0x13881', // 80001
    chainName: 'Mumbai Test Network',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://matic-mumbai.chainstacklabs.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
  },
  polygon: {
    chainId: '0x89', // 137
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  ethereum: {
    chainId: '0x1', // 1
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  bsc: {
    chainId: '0x38', // 56
    chainName: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
  },
  bscTestnet: {
    chainId: '0x61', // 97
    chainName: 'BNB Smart Chain Testnet',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
  },
}

// EventManagement 合约 ABI（简化版，包含主要函数）
export const EVENT_MANAGEMENT_ABI = [
  'function createEvent(string memory _name, string memory _description, string memory _location, uint256 _startTime, uint256 _endTime, uint256 _registrationStartTime, uint256 _registrationEndTime, uint256 _checkInStartTime, uint256 _checkInEndTime, uint256 _submissionStartTime, uint256 _submissionEndTime, uint256 _votingStartTime, uint256 _votingEndTime, bool _allowSponsorVoting, bool _allowPublicVoting, tuple(uint256 rank, string name, string description, string amount)[] memory _prizes) public returns (uint256)',
  'function getEvent(uint256 _eventId) public view returns (tuple(uint256 id, string name, string description, string location, uint256 startTime, uint256 endTime, uint256 registrationStartTime, uint256 registrationEndTime, uint256 checkInStartTime, uint256 checkInEndTime, uint256 submissionStartTime, uint256 submissionEndTime, uint256 votingStartTime, uint256 votingEndTime, uint8 currentStage, address organizer, bool allowSponsorVoting, bool allowPublicVoting, bool exists))',
  'function eventExists(uint256 _eventId) public view returns (bool)',
  'event EventCreated(uint256 indexed eventId, string name, address indexed organizer, uint256 startTime, uint256 endTime)',
]

// 默认合约地址（需要根据实际部署情况配置）
// 这些地址应该从环境变量或配置文件中读取
// 注意：在实际部署时，需要将合约地址配置到环境变量中
const CONTRACT_ADDRESSES = {
  sepolia: import.meta.env.VITE_EVENT_MANAGEMENT_CONTRACT_SEPOLIA || '',
  goerli: import.meta.env.VITE_EVENT_MANAGEMENT_CONTRACT_GOERLI || '',
  mumbai: import.meta.env.VITE_EVENT_MANAGEMENT_CONTRACT_MUMBAI || '',
  polygon: import.meta.env.VITE_EVENT_MANAGEMENT_CONTRACT_POLYGON || '',
  ethereum: import.meta.env.VITE_EVENT_MANAGEMENT_CONTRACT_ETHEREUM || '',
  bsc: import.meta.env.VITE_EVENT_MANAGEMENT_CONTRACT_BSC || '',
  bscTestnet: import.meta.env.VITE_EVENT_MANAGEMENT_CONTRACT_BSC_TESTNET || '',
}

/**
 * 切换到指定网络
 * @param {string} networkKey - 网络键名（如 'sepolia', 'mumbai' 等）
 * @returns {Promise<void>}
 */
export const switchNetwork = async (networkKey) => {
  const network = NETWORKS[networkKey]
  if (!network) {
    throw new Error(`不支持的网络: ${networkKey}`)
  }

  if (!window.ethereum) {
    throw new Error('未检测到 MetaMask 扩展程序')
  }

  try {
    // 尝试切换到网络
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainId }],
    })
  } catch (switchError) {
    // 如果网络不存在，尝试添加网络
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [network],
        })
      } catch (addError) {
        throw new Error(`添加网络失败: ${addError.message}`)
      }
    } else {
      throw new Error(`切换网络失败: ${switchError.message}`)
    }
  }
}

/**
 * 获取当前网络
 * @returns {Promise<string|null>} 返回网络键名或null
 */
export const getCurrentNetwork = async () => {
  if (!window.ethereum) {
    return null
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    })

    // 查找匹配的网络
    for (const [key, network] of Object.entries(NETWORKS)) {
      if (network.chainId.toLowerCase() === chainId.toLowerCase()) {
        return key
      }
    }

    return null
  } catch (error) {
    console.error('获取当前网络失败:', error)
    return null
  }
}

/**
 * 获取合约实例
 * @param {string} contractAddress - 合约地址
 * @param {string} networkKey - 网络键名
 * @returns {Promise<ethers.Contract>}
 */
export const getContract = async (contractAddress, networkKey) => {
  if (!window.ethereum) {
    throw new Error('未检测到 MetaMask 扩展程序')
  }

  // 确保在正确的网络上
  const currentNetwork = await getCurrentNetwork()
  if (currentNetwork !== networkKey) {
    await switchNetwork(networkKey)
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(contractAddress, EVENT_MANAGEMENT_ABI, signer)

  return contract
}

/**
 * 在链上创建活动
 * @param {object} eventData - 活动数据
 * @param {string} networkKey - 网络键名
 * @param {string} contractAddress - 合约地址（可选，如果不提供则使用默认地址）
 * @returns {Promise<{eventId: number, txHash: string}>}
 */
export const createEventOnChain = async (eventData, networkKey, contractAddress = null) => {
  if (!window.ethereum) {
    throw new Error('未检测到 MetaMask 扩展程序，请先连接钱包')
  }

  // 获取合约地址
  const address = contractAddress || CONTRACT_ADDRESSES[networkKey]
  if (!address) {
    throw new Error(`网络 ${networkKey} 的合约地址未配置，请联系管理员`)
  }

  // 获取合约实例
  const contract = await getContract(address, networkKey)

  // 转换时间戳（从ISO字符串转换为Unix时间戳）
  const toTimestamp = (dateString) => {
    if (!dateString) return 0
    return Math.floor(new Date(dateString).getTime() / 1000)
  }

  // 转换奖项数据
  const prizes = eventData.prizes.map((prize) => ({
    rank: prize.rank,
    name: prize.name,
    description: prize.description || '',
    amount: prize.amount || '',
  }))

  try {
    // 调用合约创建活动
    const tx = await contract.createEvent(
      eventData.name,
      eventData.description,
      eventData.location,
      toTimestamp(eventData.start_time),
      toTimestamp(eventData.end_time),
      toTimestamp(eventData.registration_start_time),
      toTimestamp(eventData.registration_end_time),
      toTimestamp(eventData.checkin_start_time),
      toTimestamp(eventData.checkin_end_time),
      toTimestamp(eventData.submission_start_time),
      toTimestamp(eventData.submission_end_time),
      toTimestamp(eventData.voting_start_time),
      toTimestamp(eventData.voting_end_time),
      eventData.allow_sponsor_voting || false,
      eventData.allow_public_voting || false,
      prizes
    )

    // 等待交易确认
    const receipt = await tx.wait()

    // 从事件中获取活动ID
    const eventCreatedEvent = receipt.logs.find(
      (log) => {
        try {
          const parsedLog = contract.interface.parseLog(log)
          return parsedLog && parsedLog.name === 'EventCreated'
        } catch {
          return false
        }
      }
    )

    let eventId = null
    if (eventCreatedEvent) {
      const parsedLog = contract.interface.parseLog(eventCreatedEvent)
      eventId = parsedLog.args.eventId.toString()
    }

    return {
      eventId: eventId || null,
      txHash: receipt.hash,
      contractAddress: address,
    }
  } catch (error) {
    console.error('链上创建活动失败:', error)
    if (error.code === 4001) {
      throw new Error('用户拒绝了交易请求')
    } else if (error.reason) {
      throw new Error(`交易失败: ${error.reason}`)
    } else {
      throw new Error(`链上创建活动失败: ${error.message}`)
    }
  }
}

/**
 * 获取网络显示名称
 * @param {string} networkKey - 网络键名
 * @returns {string}
 */
export const getNetworkDisplayName = (networkKey) => {
  return NETWORKS[networkKey]?.chainName || networkKey
}

/**
 * 获取网络选项列表（用于下拉选择）
 * @returns {Array<{value: string, label: string}>}
 */
export const getNetworkOptions = () => {
  return Object.entries(NETWORKS).map(([key, network]) => ({
    value: key,
    label: network.chainName,
  }))
}

