import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import { registrationApi } from '../api/registrationApi'
import BackToEventDetail from './BackToEventDetail'
import './Registration.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'

const Registration = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [querying, setQuerying] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
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
    // 基本的以太坊地址验证（42字符，以0x开头）
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const handleWalletAddressChange = async (value) => {
    setWalletAddress(value)
    setRegistration(null)
    setError(null)
    
    // 如果地址有效，自动查询报名状态
    if (value.trim() && validateWalletAddress(value.trim())) {
      try {
        setQuerying(true)
        const registrations = await registrationApi.getRegistrationsByEvent(eventId)
        const found = registrations.find(
          (reg) => reg.wallet_address && reg.wallet_address.toLowerCase() === value.trim().toLowerCase()
        )
        if (found) {
          setRegistration(found)
        }
      } catch (err) {
        // 查询失败不影响用户输入
        console.error('查询报名状态失败:', err)
      } finally {
        setQuerying(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 验证钱包地址
    if (!walletAddress.trim()) {
      setError('请输入钱包地址')
      return
    }

    if (!validateWalletAddress(walletAddress.trim())) {
      setError('请输入有效的钱包地址（以太坊地址格式：0x开头，42字符）')
      return
    }

    // 如果已经报名，不允许重复报名
    if (registration) {
      setError('该钱包地址已经报名，请勿重复提交')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      await registrationApi.createRegistration({
        event_id: parseInt(eventId),
        wallet_address: walletAddress.trim(),
      })
      
      setSuccess(true)
      setWalletAddress('')
      setRegistration(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message || '报名失败，请稍后重试')
    } finally {
      setSubmitting(false)
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
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
      <BackToEventDetail />

      <Typography variant="h4" component="h1" fontWeight={600} sx={{ mb: 3 }}>
        活动报名
      </Typography>

      {event && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {event.name}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {event.description && (
              <Typography variant="body1" color="text.secondary">
                <strong>活动描述:</strong> {event.description}
              </Typography>
            )}
            {event.location && (
              <Typography variant="body2" color="text.secondary">
                <strong>活动地点:</strong> {event.location}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              <strong>报名时间:</strong>{' '}
              {formatDate(event.registration_start_time)} - {formatDate(event.registration_end_time)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>活动时间:</strong> {formatDate(event.start_time)} - {formatDate(event.end_time)}
            </Typography>
          </Box>
        </Paper>
      )}

      {success ? (
        <Paper sx={{ p: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            报名成功！您的报名已提交，等待主办方审核。
          </Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={() => navigate(`/events/${eventId}`)}>
              返回活动详情
            </Button>
            <Button variant="outlined" onClick={() => {
              setSuccess(false)
              setWalletAddress('')
              setRegistration(null)
            }}>
              继续报名
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          {registration ? (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                报名状态
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
          ) : null}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {registration ? '重新报名' : '填写报名信息'}
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              每个活动每人只能参与一次，请确保钱包地址正确。输入钱包地址后会自动查询报名状态。
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="钱包地址 *"
                value={walletAddress}
                onChange={(e) => handleWalletAddressChange(e.target.value)}
                fullWidth
                required
                placeholder="0x..."
                helperText="请输入您的以太坊钱包地址（用于唯一性校验）"
                error={walletAddress && !validateWalletAddress(walletAddress.trim())}
                disabled={querying}
                InputProps={{
                  endAdornment: querying ? <CircularProgress size={20} /> : null,
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/events/${eventId}`)}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || !walletAddress.trim() || !!registration}
                >
                  {submitting ? '提交中...' : '提交报名'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  )
}

export default Registration

