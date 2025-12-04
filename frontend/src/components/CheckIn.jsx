import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ethers } from 'ethers'
import { checkinApi } from '../api/checkinApi'
import { useWallet } from '../contexts/WalletContext'
import { validateRegistration } from '../utils/walletValidation'
import './CheckIn.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'

const CheckIn = () => {
  const { eventId } = useParams()
  const { account: userAddress } = useWallet()
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [checkInStatus, setCheckInStatus] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [validating, setValidating] = useState(false)

  // 验证是否报名并检查签到状态
  useEffect(() => {
    const validateAndCheckStatus = async () => {
      if (!userAddress) {
        setIsRegistered(false)
        setCheckInStatus(null)
        return
      }

      setValidating(true)
      try {
        // 验证是否报名
        const registrationResult = await validateRegistration(eventId, userAddress)
        setIsRegistered(registrationResult.isRegistered)

        if (!registrationResult.isRegistered) {
          setError('您尚未报名参加此活动，请先报名')
          setCheckInStatus(null)
          setValidating(false)
          return
        }

        // 检查是否已签到
        try {
          const checkIn = await checkinApi.getUserCheckIn(eventId, userAddress)
          setCheckInStatus(checkIn)
          setError(null)
        } catch (err) {
          // 用户未签到，这是正常的
          setCheckInStatus(null)
          setError(null)
        }
      } catch (err) {
        console.error('验证失败:', err)
        setError('验证报名状态失败: ' + err.message)
      } finally {
        setValidating(false)
      }
    }

    validateAndCheckStatus()
  }, [userAddress, eventId])

  const handleFillMessage = async () => {
    try {
      const qrData = await checkinApi.generateQRCode(eventId)
      // 自动填充签名消息
      if (qrData.message) {
        setMessage(qrData.message)
        setError(null)
      }
    } catch (err) {
      setError('获取签名消息失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const signMessage = async () => {
    if (!window.ethereum) {
      alert('请安装MetaMask钱包')
      return
    }

    if (!message) {
      alert('请先填写签到签名消息')
      return
    }

    if (!userAddress) {
      setError('请先连接钱包')
      return
    }

    if (!isRegistered) {
      setError('您尚未报名参加此活动，无法完成签到')
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
          <li>填写签到签名消息</li>
          <li>对消息进行签名</li>
          <li>提交签到</li>
        </ol>
      </Box>

      <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
        {!userAddress ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            请使用右上角的"连接钱包"按钮连接您的钱包
          </Alert>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>已连接:</strong> {userAddress?.slice(0, 10)}...
            </Typography>
            {validating ? (
              <Typography variant="body2" color="text.secondary">
                验证报名状态中...
              </Typography>
            ) : !isRegistered ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                您尚未报名参加此活动，无法完成签到
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mt: 1 }}>
                已报名，可以进行签到
              </Alert>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label="签名消息"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="请点击右侧按钮填写签到签名消息"
              multiline
              rows={4}
              fullWidth
            />
            <Button 
              variant="contained" 
              onClick={handleFillMessage} 
              disabled={!userAddress}
              sx={{ whiteSpace: 'nowrap', height: 'fit-content' }}
            >
              填写签到签名消息
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
            disabled={loading || !message || !userAddress || !isRegistered || validating}
          >
            {loading ? '处理中...' : '确认签到'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default CheckIn

