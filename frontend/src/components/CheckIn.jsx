import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ethers } from 'ethers'
import { checkinApi } from '../api/checkinApi'
import './CheckIn.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'

const CheckIn = () => {
  const { eventId } = useParams()
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [userAddress, setUserAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [checkInStatus, setCheckInStatus] = useState(null)

  useEffect(() => {
    // Check if already checked in
    checkCheckInStatus()
  }, [eventId])

  const checkCheckInStatus = async () => {
    if (!window.ethereum) {
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setUserAddress(address)

      const checkIn = await checkinApi.getUserCheckIn(eventId, address)
      setCheckInStatus(checkIn)
    } catch (err) {
      // User not checked in yet
      setCheckInStatus(null)
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装MetaMask钱包')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setUserAddress(address)
      setError(null)
    } catch (err) {
      setError('连接钱包失败: ' + err.message)
    }
  }

  const scanQRCode = () => {
    // In a real implementation, this would use a QR code scanner
    // For now, we'll prompt user to enter the message manually
    const qrMessage = prompt('请扫描二维码或粘贴签名消息:')
    if (qrMessage) {
      setMessage(qrMessage)
    }
  }

  const signMessage = async () => {
    if (!window.ethereum) {
      alert('请安装MetaMask钱包')
      return
    }

    if (!message) {
      alert('请先扫描二维码获取签名消息')
      return
    }

    if (!userAddress) {
      await connectWallet()
      return
    }

    try {
      setLoading(true)
      setError(null)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Sign the message
      const sig = await signer.signMessage(message)
      setSignature(sig)

      // Get device info
      const deviceInfo = `${navigator.userAgent} - ${navigator.platform}`

      // Submit check-in
      const checkIn = await checkinApi.checkIn({
        event_id: parseInt(eventId),
        user_address: userAddress,
        signature: sig,
        message: message,
        ip_address: '', // Will be set by backend
        device_info: deviceInfo,
      })

      setSuccess(true)
      setCheckInStatus(checkIn)
    } catch (err) {
      if (err.code === 4001) {
        setError('用户拒绝了签名请求')
      } else {
        setError('签到失败: ' + (err.response?.data?.error || err.message))
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  }

  if (checkInStatus) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ✓ 签到成功
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body1">
              <strong>签到时间:</strong> {formatDate(checkInStatus.check_in_time)}
            </Typography>
            {checkInStatus.tx_hash && (
              <Typography variant="body1">
                <strong>交易哈希:</strong>{' '}
                <a
                  href={`https://etherscan.io/tx/${checkInStatus.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {checkInStatus.tx_hash?.slice(0, 10)}...
                </a>
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
        活动签到
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          签到成功！
        </Alert>
      )}

      <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          签到步骤
        </Typography>
        <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li>连接钱包</li>
          <li>扫描二维码获取签名消息</li>
          <li>对消息进行签名</li>
          <li>提交签到</li>
        </ol>
      </Box>

      <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
        {!userAddress ? (
          <Button
            variant="contained"
            size="large"
            onClick={connectWallet}
            sx={{ mb: 2 }}
          >
            连接钱包
          </Button>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>已连接:</strong> {userAddress?.slice(0, 10)}...
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="签名消息"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="请扫描二维码获取签名消息"
              multiline
              rows={4}
              fullWidth
            />
            <Button variant="outlined" onClick={scanQRCode} sx={{ whiteSpace: 'nowrap', height: 'fit-content' }}>
              扫描二维码
            </Button>
          </Box>

          {signature && (
            <TextField
              label="签名结果"
              value={signature}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          )}

          <Button
            variant="contained"
            size="large"
            onClick={signMessage}
            disabled={loading || !message || !userAddress}
          >
            {loading ? '处理中...' : '确认签到'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default CheckIn

