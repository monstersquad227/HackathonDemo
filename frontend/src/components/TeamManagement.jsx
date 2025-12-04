import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { teamApi } from '../api/teamApi'
import BackToEventDetail from './BackToEventDetail'
import './TeamManagement.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

const TeamManagement = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    event_id: eventId ? parseInt(eventId) : '',
    name: '',
    description: '',
    leader_address: '',
    max_members: 5,
    skills: '',
    members: [],
  })
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [joinMemberAddress, setJoinMemberAddress] = useState('')

  useEffect(() => {
    loadTeams()
  }, [eventId])

  const loadTeams = async () => {
    try {
      setLoading(true)
      let data
      if (eventId) {
        data = await teamApi.getTeamsByEvent(eventId)
      } else {
        data = await teamApi.getAllTeams()
      }
      // Ensure data is an array
      setTeams(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError('加载队伍列表失败: ' + (err.response?.data?.error || err.message))
      setTeams([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'max_members' || name === 'event_id' ? parseInt(value) || 0 : value,
    }))
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.description || !formData.leader_address || !formData.max_members) {
      alert('请填写所有必填字段：队伍名称、队伍描述、队长钱包地址、最大成员数')
      return
    }
    if (!formData.event_id) {
      alert('请选择活动')
      return
    }
    try {
      await teamApi.createTeam(formData)
      setShowCreateForm(false)
      setFormData({
        event_id: eventId ? parseInt(eventId) : '',
        name: '',
        description: '',
        leader_address: '',
        max_members: 5,
        skills: '',
        members: [],
      })
      loadTeams()
      alert('创建队伍成功')
    } catch (err) {
      alert('创建队伍失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleJoinTeam = (team) => {
    // Check if team is full
    if (team.members && team.members.length >= team.max_members) {
      alert('队伍已满，无法加入')
      return
    }
    setSelectedTeam(team)
    setJoinMemberAddress('')
    setJoinDialogOpen(true)
  }

  const handleJoinSubmit = async () => {
    if (!joinMemberAddress) {
      alert('请输入钱包地址')
      return
    }
    try {
      await teamApi.addMember(selectedTeam.id, { address: joinMemberAddress })
      setJoinDialogOpen(false)
      setSelectedTeam(null)
      setJoinMemberAddress('')
      loadTeams()
      alert('加入队伍成功')
    } catch (err) {
      alert('加入队伍失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
    }
    return statusMap[status] || 'status-pending'
  }

  const getStatusName = (status) => {
    const statusMap = {
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
    }
    return statusMap[status] || status
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        {eventId && <BackToEventDetail />}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            {eventId ? '活动队伍管理' : '队伍管理'}
          </Typography>
          {eventId && (
            <Button variant="contained" onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? '取消' : '创建队伍'}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showCreateForm && eventId && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            创建队伍
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="队伍名称 *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="队伍描述 *"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="队长钱包地址 *"
                  name="leader_address"
                  value={formData.leader_address}
                  onChange={handleChange}
                  placeholder="0x..."
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="最大成员数 *"
                  type="number"
                  name="max_members"
                  value={formData.max_members}
                  onChange={handleChange}
                  inputProps={{ min: 1, max: 20 }}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="队伍技能（逗号分隔）"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="例如: React, Solidity, UI/UX"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button type="submit" variant="contained">
                    创建队伍
                  </Button>
                  <Button variant="outlined" onClick={() => setShowCreateForm(false)}>
                    取消
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography>加载中...</Typography>
        </Box>
      ) : !teams || teams.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="h6" gutterBottom>暂无队伍</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {eventId ? '该活动还没有队伍，您可以创建第一个队伍' : '还没有队伍'}
          </Typography>
          {eventId && (
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => setShowCreateForm(true)}
            >
              创建第一个队伍
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {teams.map((team) => (
            <Grid item xs={12} md={6} key={team.id}>
              <Paper
                sx={{
                  p: 2,
                  cursor: eventId && team.status === 'approved' && (!team.members || team.members.length < team.max_members) ? 'pointer' : 'default',
                  '&:hover': eventId && team.status === 'approved' && (!team.members || team.members.length < team.max_members) ? { boxShadow: 4 } : {},
                }}
                onClick={() => {
                  if (eventId && team.status === 'approved' && (!team.members || team.members.length < team.max_members)) {
                    handleJoinTeam(team)
                  }
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="h6" noWrap>
                    {team.name}
                  </Typography>
                  <Chip
                    label={getStatusName(team.status)}
                    size="small"
                    color={
                      team.status === 'approved'
                        ? 'success'
                        : team.status === 'rejected'
                        ? 'error'
                        : 'warning'
                    }
                    variant="outlined"
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5, minHeight: 40 }}
                >
                  {team.description || '暂无描述'}
                </Typography>
                <Typography variant="body2">
                  <strong>队长:</strong>{' '}
                  {team.leader_address ? `${team.leader_address.slice(0, 10)}...` : '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>成员数:</strong> {team.members?.length || 0} / {team.max_members}
                </Typography>
                {team.skills && (
                  <Typography variant="body2">
                    <strong>技能:</strong> {team.skills}
                  </Typography>
                )}
                {team.members && team.members.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      成员:
                    </Typography>
                    <Box component="ul" sx={{ pl: 3, m: 0 }}>
                      {team.members.map((member, index) => (
                        <li key={index}>
                          <Typography variant="body2">
                            {member.name || '未命名'} ({member.address?.slice(0, 8)}...)
                            {member.role && ` - ${member.role}`}
                          </Typography>
                        </li>
                      ))}
                    </Box>
                  </Box>
                )}
                {eventId && team.status === 'approved' && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation()
                        handleJoinTeam(team)
                      }}
                      disabled={team.members?.length >= team.max_members}
                    >
                      {team.members?.length >= team.max_members ? '队伍已满' : '加入队伍'}
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>加入队伍</DialogTitle>
        <DialogContent>
          {selectedTeam && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                队伍: {selectedTeam.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                成员数: {selectedTeam.members?.length || 0} / {selectedTeam.max_members}
              </Typography>
            </Box>
          )}
          <TextField
            label="钱包地址 *"
            value={joinMemberAddress}
            onChange={(e) => setJoinMemberAddress(e.target.value)}
            placeholder="0x..."
            required
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>取消</Button>
          <Button onClick={handleJoinSubmit} variant="contained">
            加入
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TeamManagement
