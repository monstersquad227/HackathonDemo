import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { registrationApi } from '../api/registrationApi'
import { eventApi } from '../api/eventApi'
import './RegistrationManagement.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'

const RegistrationManagement = () => {
  const { eventId } = useParams()
  const [registrations, setRegistrations] = useState([])
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [eventId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [registrationsData, eventData] = await Promise.all([
        registrationApi.getRegistrationsByEvent(eventId),
        eventApi.getEventById(eventId)
      ])
      setRegistrations(registrationsData)
      setEvent(eventData)
      setError(null)
    } catch (err) {
      setError('加载数据失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    if (!event || !event.organizer_address) {
      alert('无法获取主办方钱包地址')
      return
    }
    try {
      await registrationApi.approveRegistration(id, event.organizer_address)
      loadData()
    } catch (err) {
      alert('批准失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleReject = async (id) => {
    if (!event || !event.organizer_address) {
      alert('无法获取主办方钱包地址')
      return
    }
    if (!window.confirm('确定要拒绝这个报名吗？')) {
      return
    }
    try {
      await registrationApi.rejectRegistration(id, event.organizer_address)
      loadData()
    } catch (err) {
      alert('拒绝失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      sbt_minted: 'status-sbt',
    }
    return statusMap[status] || 'status-pending'
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

  // 计算已批准的报名人数
  const approvedCount = registrations.filter(
    (reg) => reg.status === 'approved' || reg.status === 'sbt_minted'
  ).length

  // 检查是否达到报名人数限制
  const isLimitReached = event && event.max_participants > 0 && approvedCount >= event.max_participants

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={600} sx={{ mb: 3 }}>
        报名管理
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 报名人数统计 */}
      {event && event.max_participants > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: isLimitReached ? 'error.light' : 'info.light' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1">
              <strong>报名人数统计:</strong> 已批准 {approvedCount} / {event.max_participants} 人
            </Typography>
            {isLimitReached && (
              <Chip
                label="报名人数已满"
                color="error"
                size="small"
              />
            )}
          </Box>
          {isLimitReached && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              报名人数已达到上限，无法批准更多报名
            </Alert>
          )}
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          报名列表 ({registrations.length})
        </Typography>
        {loading ? (
          <Typography>加载中...</Typography>
        ) : registrations.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>暂无报名记录</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {registrations.map((registration) => (
              <Grid item xs={12} md={6} key={registration.id}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" noWrap>
                      {registration.team?.name || registration.wallet_address || '未知'}
                    </Typography>
                    <Chip
                      label={getStatusName(registration.status)}
                      size="small"
                      color={
                        registration.status === 'approved'
                          ? 'success'
                          : registration.status === 'rejected'
                          ? 'error'
                          : registration.status === 'sbt_minted'
                          ? 'primary'
                          : 'warning'
                      }
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
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
                    {registration.team && (
                      <Typography variant="body2">
                        <strong>队伍成员:</strong> {registration.team?.members?.length || 0} 人
                      </Typography>
                    )}
                    {registration.wallet_address && (
                      <Typography variant="body2">
                        <strong>钱包地址:</strong> {registration.wallet_address}
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
                  </Box>
                  {registration.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleApprove(registration.id)}
                        fullWidth
                        disabled={
                          !event ||
                          !event.organizer_address ||
                          isLimitReached
                        }
                        title={
                          isLimitReached
                            ? '报名人数已满，无法批准更多报名'
                            : ''
                        }
                      >
                        批准
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => handleReject(registration.id)}
                        fullWidth
                        disabled={!event || !event.organizer_address}
                      >
                        拒绝
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  )
}

export default RegistrationManagement

