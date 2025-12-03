import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import { registrationApi } from '../api/registrationApi'
import './RegistrationQuery.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'

const RegistrationQuery = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [querying, setQuerying] = useState(false)
  const [error, setError] = useState(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const data = await eventApi.getEventById(eventId)
      setEvent(data)
      setError(null)
    } catch (err) {
      setError('加载活动信息失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const validateWalletAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const handleQuery = async () => {
    if (!walletAddress.trim()) {
      setError('请输入钱包地址')
      return
    }

    if (!validateWalletAddress(walletAddress.trim())) {
      setError('请输入有效的钱包地址（以太坊地址格式：0x开头，42字符）')
      return
    }

    try {
      setQuerying(true)
      setError(null)
      setRegistration(null)

      // 获取该活动的所有报名记录
      const registrations = await registrationApi.getRegistrationsByEvent(eventId)
      
      // 查找匹配的钱包地址
      const found = registrations.find(
        (reg) => reg.wallet_address && reg.wallet_address.toLowerCase() === walletAddress.trim().toLowerCase()
      )

      if (found) {
        setRegistration(found)
      } else {
        setError('未找到该钱包地址的报名记录')
      }
    } catch (err) {
      setError('查询失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setQuerying(false)
    }
  }

  const getStatusName = (status) => {
    const statusMap = {
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
      sbt_minted: 'SBT已铸造',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      sbt_minted: 'primary',
    }
    return colorMap[status] || 'default'
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !event) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          返回活动列表
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Button
        onClick={() => navigate(`/events/${eventId}`)}
        sx={{ mb: 2 }}
      >
        ← 返回活动详情
      </Button>

      <Typography variant="h4" component="h1" fontWeight={600} sx={{ mb: 3 }}>
        报名查询
      </Typography>

      {event && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {event.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请输入您的钱包地址查询报名状态
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          查询报名状态
        </Typography>

        {error && !registration && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="钱包地址 *"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            fullWidth
            required
            placeholder="0x..."
            helperText="请输入您的以太坊钱包地址"
            error={walletAddress && !validateWalletAddress(walletAddress.trim())}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/events/${eventId}`)}
              disabled={querying}
            >
              取消
            </Button>
            <Button
              variant="contained"
              onClick={handleQuery}
              disabled={querying || !walletAddress.trim()}
            >
              {querying ? '查询中...' : '查询'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {registration && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            报名信息
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">
                <strong>报名状态:</strong>
              </Typography>
              <Chip
                label={getStatusName(registration.status)}
                color={getStatusColor(registration.status)}
                variant="outlined"
              />
            </Box>
            {registration.team && (
              <Typography variant="body2">
                <strong>队伍名称:</strong> {registration.team.name}
              </Typography>
            )}
            {registration.project_name && (
              <Typography variant="body2">
                <strong>项目名称:</strong> {registration.project_name}
              </Typography>
            )}
            {registration.project_description && (
              <Typography variant="body2">
                <strong>项目描述:</strong> {registration.project_description}
              </Typography>
            )}
            {registration.sbt_token_id && (
              <Typography variant="body2">
                <strong>SBT Token ID:</strong> {registration.sbt_token_id}
              </Typography>
            )}
            {registration.sbt_tx_hash && (
              <Typography variant="body2">
                <strong>SBT 交易哈希:</strong>{' '}
                <a
                  href={`https://etherscan.io/tx/${registration.sbt_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {registration.sbt_tx_hash?.slice(0, 10)}...
                </a>
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              <strong>报名时间:</strong>{' '}
              {new Date(registration.created_at).toLocaleString('zh-CN')}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  )
}

export default RegistrationQuery

