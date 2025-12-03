import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import { registrationApi } from '../api/registrationApi'
import './Registration.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

const Registration = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

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

    try {
      setSubmitting(true)
      setError(null)
      
      await registrationApi.createRegistration({
        event_id: parseInt(eventId),
        wallet_address: walletAddress.trim(),
        project_name: projectName.trim(),
        project_description: projectDescription.trim(),
      })
      
      setSuccess(true)
      setWalletAddress('')
      setProjectName('')
      setProjectDescription('')
    } catch (err) {
      setError(err.response?.data?.error || err.message || '报名失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
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
      <Button
        onClick={() => navigate(`/events/${eventId}`)}
        sx={{ mb: 2 }}
      >
        ← 返回活动详情
      </Button>

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
            <Button variant="outlined" onClick={() => setSuccess(false)}>
              继续报名
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            填写报名信息
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            每个活动每人只能参与一次，请确保钱包地址正确。
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
              onChange={(e) => setWalletAddress(e.target.value)}
              fullWidth
              required
              placeholder="0x..."
              helperText="请输入您的以太坊钱包地址（用于唯一性校验）"
              error={walletAddress && !validateWalletAddress(walletAddress.trim())}
            />

            <TextField
              label="项目名称（可选）"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              fullWidth
              placeholder="请输入项目名称"
            />

            <TextField
              label="项目描述（可选）"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="请输入项目描述"
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
                disabled={submitting || !walletAddress.trim()}
              >
                {submitting ? '提交中...' : '提交报名'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  )
}

export default Registration

