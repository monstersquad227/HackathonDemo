import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { registrationApi } from '../api/registrationApi'
import { teamApi } from '../api/teamApi'
import './RegistrationManagement.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'

const RegistrationManagement = () => {
  const { eventId } = useParams()
  const [registrations, setRegistrations] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    team_id: '',
    project_name: '',
    project_description: '',
  })

  useEffect(() => {
    loadData()
  }, [eventId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [registrationsData, teamsData] = await Promise.all([
        registrationApi.getRegistrationsByEvent(eventId),
        teamApi.getAllTeams(),
      ])
      setRegistrations(registrationsData)
      setTeams(teamsData.filter(team => team.status === 'approved'))
      setError(null)
    } catch (err) {
      setError('加载数据失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await registrationApi.createRegistration({
        event_id: parseInt(eventId),
        team_id: parseInt(formData.team_id),
        project_name: formData.project_name,
        project_description: formData.project_description,
      })
      setShowCreateForm(false)
      setFormData({
        team_id: '',
        project_name: '',
        project_description: '',
      })
      loadData()
    } catch (err) {
      alert('创建报名失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleApprove = async (id, organizerAddress) => {
    if (!organizerAddress) {
      alert('请输入主办方钱包地址')
      return
    }
    try {
      await registrationApi.approveRegistration(id, organizerAddress)
      loadData()
    } catch (err) {
      alert('批准失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleReject = async (id, organizerAddress) => {
    if (!organizerAddress) {
      alert('请输入主办方钱包地址')
      return
    }
    if (!window.confirm('确定要拒绝这个报名吗？')) {
      return
    }
    try {
      await registrationApi.rejectRegistration(id, organizerAddress)
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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">创建报名</Typography>
          <Button variant="contained" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? '取消' : '创建报名'}
          </Button>
        </Box>

        {showCreateForm && (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControl fullWidth required>
              <InputLabel id="team-select-label">选择队伍 *</InputLabel>
              <Select
                labelId="team-select-label"
                label="选择队伍 *"
                name="team_id"
                value={formData.team_id}
                onChange={handleChange}
              >
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name} ({team.members?.length || 0} 成员)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="项目名称"
              name="project_name"
              value={formData.project_name}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="项目描述"
              name="project_description"
              value={formData.project_description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained">
                提交报名
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

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
                      {registration.team?.name || '未知队伍'}
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
                    <Typography variant="body2">
                      <strong>队伍成员:</strong> {registration.team?.members?.length || 0} 人
                    </Typography>
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
                      <TextField
                        placeholder="主办方钱包地址"
                        size="small"
                        fullWidth
                        id={`organizer-${registration.id}`}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() =>
                          handleApprove(
                            registration.id,
                            document.getElementById(`organizer-${registration.id}`).value
                          )
                        }
                      >
                        批准
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() =>
                          handleReject(
                            registration.id,
                            document.getElementById(`organizer-${registration.id}`).value
                          )
                        }
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

