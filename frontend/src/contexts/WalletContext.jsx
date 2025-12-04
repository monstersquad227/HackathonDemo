import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 获取 ethereum provider
  const getEthereumProvider = () => {
    if (typeof window.ethereum !== 'undefined') {
      if (window.ethereum.isMetaMask) {
        return window.ethereum
      }
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

  // 检查是否已连接
  const checkConnection = async () => {
    const ethereum = getEthereumProvider()
    if (!ethereum) {
      return
    }

    try {
      const accounts = await ethereum.request({
        method: 'eth_accounts',
      })

      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        const provider = new ethers.BrowserProvider(ethereum)
        const signer = await provider.getSigner()
        const signerAddress = await signer.getAddress()

        if (signerAddress.toLowerCase() === address.toLowerCase()) {
          setAccount(signerAddress)
        }
      }
    } catch (err) {
      console.error('检查连接状态失败:', err)
    }
  }

  // 连接钱包
  const connectWallet = async () => {
    try {
      setLoading(true)
      setError(null)

      const ethereum = getEthereumProvider()
      if (!ethereum) {
        setError('未检测到 MetaMask 扩展程序。请确保已安装并启用 MetaMask。')
        setLoading(false)
        return
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        setError('未获取到账户信息，请检查 MetaMask 是否已解锁并包含账户')
        setLoading(false)
        return
      }

      const address = accounts[0]
      const provider = new ethers.BrowserProvider(ethereum)
      const signer = await provider.getSigner()
      const signerAddress = await signer.getAddress()

      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        setError('账户地址不匹配，请重试')
        setLoading(false)
        return
      }

      setAccount(signerAddress)
      setLoading(false)
    } catch (err) {
      console.error('连接钱包失败:', err)
      let errorMessage = '连接钱包失败'
      
      if (err.code === 4001) {
        errorMessage = '用户拒绝了连接请求。请在 MetaMask 弹窗中点击"连接"或"下一步"。'
      } else if (err.code === -32002) {
        errorMessage = '连接请求已提交，请检查 MetaMask 弹窗。'
      } else if (err.message) {
        errorMessage = '连接钱包失败: ' + err.message
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  // 断开连接
  const disconnectWallet = () => {
    setAccount(null)
    setError(null)
  }

  // 监听账户变化
  useEffect(() => {
    checkConnection()

    const ethereum = getEthereumProvider()
    if (ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          const address = accounts[0]
          setAccount(address)
        }
      }

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
  }, [])

  const value = {
    account,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    setError,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

