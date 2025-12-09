import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import { registrationApi } from '../api/registrationApi'
import { useWallet } from '../contexts/WalletContext'
import BackToEventDetail from './BackToEventDetail'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

const Registration = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { account: connectedAddress } = useWallet()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [querying, setQuerying] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [registration, setRegistration] = useState(null)
  const [useConnectedWallet, setUseConnectedWallet] = useState(true)
  const [manualAddress, setManualAddress] = useState('')
  
  const walletAddress = useConnectedWallet && connectedAddress ? connectedAddress : manualAddress

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

  // 查询报名状态
  useEffect(() => {
    const checkRegistration = async () => {
      if (!walletAddress) {
        setRegistration(null)
        return
      }

      try {
        setQuerying(true)
        const registrations = await registrationApi.getRegistrationsByEvent(eventId)
        const found = registrations.find(
          (reg) => reg.wallet_address && reg.wallet_address.toLowerCase() === walletAddress.toLowerCase()
        )
        if (found) {
          setRegistration(found)
        } else {
          setRegistration(null)
        }
      } catch (err) {
        console.error('查询报名状态失败:', err)
        setRegistration(null)
      } finally {
        setQuerying(false)
      }
    }

    checkRegistration()
  }, [walletAddress, eventId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 验证钱包地址
    if (!walletAddress || walletAddress.trim() === '') {
      setError('请输入钱包地址')
      return
    }

    // 验证钱包地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
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
      setRegistration(null)
      // 重新查询报名状态
      const registrations = await registrationApi.getRegistrationsByEvent(eventId)
      const found = registrations.find(
        (reg) => reg.wallet_address && reg.wallet_address.toLowerCase() === walletAddress.trim().toLowerCase()
      )
      if (found) {
        setRegistration(found)
      }
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  钱包地址 *
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={useConnectedWallet}
                      onChange={(e) => {
                        setUseConnectedWallet(e.target.checked)
                        if (!e.target.checked) {
                          setManualAddress('')
                        }
                      }}
                      disabled={!connectedAddress}
                    />
                  }
                  label={connectedAddress ? `使用连接的钱包 (${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)})` : '使用连接的钱包（请先连接钱包）'}
                />
                {!useConnectedWallet && (
                  <TextField
                    label="手动输入钱包地址"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="0x..."
                    fullWidth
                    helperText="请输入以太坊钱包地址（42字符，以0x开头）"
                    error={manualAddress && !/^0x[a-fA-F0-9]{40}$/.test(manualAddress.trim())}
                  />
                )}
                {useConnectedWallet && !connectedAddress && (
                  <Alert severity="info">
                    请使用右上角的"连接钱包"按钮连接您的钱包，或取消勾选使用手动输入
                  </Alert>
                )}
                {walletAddress && querying && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      查询报名状态中...
                    </Typography>
                  </Box>
                )}
              </Box>

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
                  disabled={submitting || !walletAddress || walletAddress.trim() === '' || !!registration}
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

