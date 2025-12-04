import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

const WalletTest = () => {
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [provider, setProvider] = useState(null)

  // 检查 MetaMask 是否已安装
  const checkMetaMask = () => {
    // 检查多种可能的 ethereum provider
    if (typeof window.ethereum !== 'undefined') {
      // 检查是否是 MetaMask（MetaMask 有 isMetaMask 属性）
      if (window.ethereum.isMetaMask) {
        return true
      }
      // 即使没有 isMetaMask 属性，也认为可能是 MetaMask
      return true
    }
    // 检查是否有其他钱包注入
    if (window.web3) {
      return true
    }
    return false
  }

  // 获取 ethereum provider
  const getEthereumProvider = () => {
    if (typeof window.ethereum !== 'undefined') {
      // 优先使用 MetaMask
      if (window.ethereum.isMetaMask) {
        return window.ethereum
      }
      // 如果有多个 provider，尝试找到 MetaMask
      if (window.ethereum.providers) {
        const metamaskProvider = window.ethereum.providers.find(
          (p) => p.isMetaMask
        )
        if (metamaskProvider) {
          return metamaskProvider
        }
      }
      return window.ethereum
    }
    return null
  }

  // 检查 MetaMask 状态
  const checkMetaMaskStatus = async (ethereum) => {
    try {
      // 检查是否有已连接的账户（不触发弹窗）
      const accounts = await ethereum.request({
        method: 'eth_accounts',
      })
      return {
        hasAccounts: accounts && accounts.length > 0,
        accounts: accounts || [],
      }
    } catch (err) {
      console.warn('检查账户状态失败:', err)
      return { hasAccounts: false, accounts: [] }
    }
  }

  // 连接 MetaMask 钱包
  const connectWallet = async () => {
    try {
      setLoading(true)
      setError(null)

      // 添加调试信息
      console.log('开始连接钱包...')
      console.log('window.ethereum:', window.ethereum)
      console.log('window.ethereum.isMetaMask:', window.ethereum?.isMetaMask)

      const ethereum = getEthereumProvider()
      if (!ethereum) {
        setError('未检测到 MetaMask 扩展程序。请确保已安装并启用 MetaMask。')
        setLoading(false)
        return
      }

      console.log('找到 ethereum provider:', ethereum)
      console.log('isMetaMask:', ethereum.isMetaMask)

      // 先检查 MetaMask 状态
      const status = await checkMetaMaskStatus(ethereum)
      console.log('MetaMask 状态:', status)

      // if (!status.hasAccounts) {
      //   // 如果没有账户，给出明确的提示
      //   setError(
      //     'MetaMask 钱包中没有账户。请按照以下步骤操作：\n\n' +
      //     '1. 点击浏览器工具栏的 MetaMask 图标（🦊）\n' +
      //     '2. 如果 MetaMask 已锁定，请输入密码解锁\n' +
      //     '3. 如果 MetaMask 中没有账户，请点击"创建账户"或"导入账户"\n' +
      //     '4. 创建或导入账户后，再次点击"连接 MetaMask 钱包"按钮'
      //   )
      //   setLoading(false)
      //   return
      // }

      const Account = await ethereum.request({
        method: 'eth_requestAccounts',
      })

      // 如果有已连接的账户，直接使用
      if (Account.length > 0) {
        console.log('发现已连接的账户:', Account)
        const address = Account[0]
        
        // 创建 provider
        const provider = new ethers.BrowserProvider(ethereum)
        const signer = await provider.getSigner()
        const signerAddress = await signer.getAddress()

        if (signerAddress.toLowerCase() === address.toLowerCase()) {
          setProvider(provider)
          setAccount(signerAddress)

          // 获取余额
          try {
            const balance = await provider.getBalance(signerAddress)
            setBalance(ethers.formatEther(balance))
          } catch (balanceErr) {
            console.warn('获取余额失败:', balanceErr)
            setBalance('0')
          }

          // 获取网络信息
          try {
            const network = await provider.getNetwork()
            setChainId(network.chainId.toString())
          } catch (networkErr) {
            console.warn('获取网络信息失败:', networkErr)
            try {
              const chainId = await ethereum.request({ method: 'eth_chainId' })
              setChainId(parseInt(chainId, 16).toString())
            } catch (err) {
              setChainId('未知')
            }
          }

          setLoading(false)
          return
        }
      }

      // 如果没有已连接的账户，请求连接（这会触发弹窗）
      console.log('正在请求账户连接...')
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })
      console.log('收到账户:', accounts)

      if (!accounts || accounts.length === 0) {
        setError('未获取到账户信息，请检查 MetaMask 是否已解锁并包含账户')
        setLoading(false)
        return
      }

      const address = accounts[0]

      // 在账户连接成功后再创建 provider
      // 创建 provider，如果网络检测失败也会继续
      const provider = new ethers.BrowserProvider(ethereum)

      // 获取签名者
      const signer = await provider.getSigner()
      const signerAddress = await signer.getAddress()

      // 验证地址是否匹配
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        setError('账户地址不匹配，请重试')
        setLoading(false)
        return
      }

      setProvider(provider)
      setAccount(signerAddress)

      // 获取余额
      try {
        const balance = await provider.getBalance(signerAddress)
        setBalance(ethers.formatEther(balance))
      } catch (balanceErr) {
        console.warn('获取余额失败:', balanceErr)
        setBalance('0')
      }

      // 获取网络信息
      try {
        const network = await provider.getNetwork()
        setChainId(network.chainId.toString())
      } catch (networkErr) {
        console.warn('获取网络信息失败:', networkErr)
        // 尝试直接从 ethereum 获取 chainId
        try {
          const chainId = await ethereum.request({ method: 'eth_chainId' })
          setChainId(parseInt(chainId, 16).toString())
        } catch (err) {
          setChainId('未知')
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('连接钱包失败:', err)
      
      // 根据错误代码提供更友好的提示
      let errorMessage = '连接钱包失败'
      
      if (err.code === 4001) {
        if (err.message && err.message.includes('account')) {
          errorMessage = 
            'MetaMask 钱包中没有账户。请按照以下步骤操作：\n\n' +
            '1. 点击浏览器工具栏的 MetaMask 图标（🦊）\n' +
            '2. 如果 MetaMask 已锁定，请输入密码解锁\n' +
            '3. 如果 MetaMask 中没有账户，请点击"创建账户"或"导入账户"\n' +
            '4. 创建或导入账户后，再次点击"连接 MetaMask 钱包"按钮'
        } else {
          errorMessage = '用户拒绝了连接请求。请在 MetaMask 弹窗中点击"连接"或"下一步"。'
        }
      } else if (err.code === -32002) {
        errorMessage = '连接请求已提交，请检查 MetaMask 弹窗。'
      } else if (err.message) {
        if (err.message.includes('network') || err.message.includes('detect')) {
          errorMessage = '网络检测失败，但已连接到钱包。请检查 MetaMask 网络设置。'
        } else {
          errorMessage = '连接钱包失败: ' + err.message
        }
      } else {
        errorMessage = '连接钱包失败，请检查 MetaMask 是否已安装并解锁。'
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  // 断开连接
  const disconnectWallet = () => {
    setAccount(null)
    setBalance(null)
    setChainId(null)
    setProvider(null)
    setError(null)
  }

  // 监听账户变化
  useEffect(() => {
    const ethereum = getEthereumProvider()
    if (ethereum) {
      // 监听账户切换
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setAccount(accounts[0])
          if (provider) {
            provider.getBalance(accounts[0]).then((balance) => {
              setBalance(ethers.formatEther(balance))
            })
          }
        }
      }

      // 监听网络切换
      const handleChainChanged = () => {
        window.location.reload()
      }

      ethereum.on('accountsChanged', handleAccountsChanged)
      ethereum.on('chainChanged', handleChainChanged)

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged)
        ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [provider])

  // 检查是否已连接
  useEffect(() => {
    const checkConnection = async () => {
      const ethereum = getEthereumProvider()
      if (ethereum) {
        try {
          // 先检查是否有已连接的账户
          const accounts = await ethereum.request({
            method: 'eth_accounts',
          })

          if (accounts && accounts.length > 0) {
            const address = accounts[0]
            
            // 创建 provider
            const provider = new ethers.BrowserProvider(ethereum)

            try {
              const signer = await provider.getSigner()
              const signerAddress = await signer.getAddress()
              
              if (signerAddress.toLowerCase() === address.toLowerCase()) {
                setProvider(provider)
                setAccount(signerAddress)
                
                // 获取余额
                try {
                  const balance = await provider.getBalance(signerAddress)
                  setBalance(ethers.formatEther(balance))
                } catch (err) {
                  console.warn('获取余额失败:', err)
                }
                
                // 获取网络信息
                try {
                  const network = await provider.getNetwork()
                  setChainId(network.chainId.toString())
                } catch (err) {
                  // 尝试直接从 ethereum 获取
                  try {
                    const chainId = await ethereum.request({ method: 'eth_chainId' })
                    setChainId(parseInt(chainId, 16).toString())
                  } catch (err2) {
                    console.warn('获取链 ID 失败:', err2)
                  }
                }
              }
            } catch (err) {
              console.log('获取签名者失败，可能未连接:', err)
            }
          }
        } catch (err) {
          console.error('检查连接状态失败:', err)
        }
      }
    }
    checkConnection()
  }, [])

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          MetaMask 钱包测试页面
        </Typography>

        {!checkMetaMask() && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            未检测到 MetaMask 扩展程序。请先安装 MetaMask 浏览器扩展。
          </Alert>
        )}

        {checkMetaMask() && !account && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" component="div">
              <strong>重要提示：</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li><strong>必须先确保 MetaMask 中有账户！</strong>如果没有账户，请先点击浏览器工具栏的 MetaMask 图标（🦊），然后创建或导入账户</li>
                <li>确保 MetaMask 已解锁（如果已锁定，请先输入密码解锁）</li>
                <li>点击下方按钮连接钱包时，如果已有账户，会弹出 MetaMask 连接窗口，请在弹窗中点击"连接"或"下一步"</li>
                <li>如果未看到弹窗，请检查浏览器是否阻止了弹窗，或点击浏览器地址栏的弹窗阻止图标允许弹窗</li>
              </ul>
            </Typography>
          </Alert>
        )}

        {checkMetaMask() && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              ✓ 已检测到 MetaMask 扩展程序
              {window.ethereum?.isMetaMask && ' (已确认是 MetaMask)'}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
              调试信息: window.ethereum = {typeof window.ethereum !== 'undefined' ? '已定义' : '未定义'}
              {window.ethereum && `, isMetaMask = ${window.ethereum.isMetaMask ? 'true' : 'false'}`}
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
              {error}
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!account ? (
            <Box>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={connectWallet}
                disabled={loading || !checkMetaMask()}
                sx={{ py: 1.5 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    连接中...
                  </>
                ) : (
                  '连接 MetaMask 钱包'
                )}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => {
                  console.log('手动调试信息:')
                  console.log('window.ethereum:', window.ethereum)
                  console.log('window.ethereum?.isMetaMask:', window.ethereum?.isMetaMask)
                  console.log('window.ethereum?.providers:', window.ethereum?.providers)
                  alert('调试信息已输出到控制台，请按 F12 查看')
                }}
                sx={{ ml: 2 }}
              >
                调试信息
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  钱包信息
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>账户地址:</strong> {account}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>余额:</strong> {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '加载中...'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>链 ID:</strong> {chainId || '加载中...'}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                color="secondary"
                onClick={disconnectWallet}
                sx={{ alignSelf: 'flex-start' }}
              >
                断开连接
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default WalletTest

