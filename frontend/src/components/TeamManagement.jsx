import React, { useState, useEffect } from 'react'
import { teamApi } from '../api/teamApi'
import './TeamManagement.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'

const TeamManagement = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader_address: '',
    max_members: 5,
    skills: '',
    members: [],
  })
  const [newMember, setNewMember] = useState({
    address: '',
    name: '',
    email: '',
    skills: '',
    role: '',
  })

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const data = await teamApi.getAllTeams()
      setTeams(data)
      setError(null)
    } catch (err) {
      setError('加载队伍列表失败: ' + err.message)
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

  const handleMemberChange = (e) => {
    const { name, value } = e.target
    setNewMember((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const addMemberToForm = () => {
    if (!newMember.address) {
      alert('请输入成员钱包地址')
      return
    }
    setFormData((prev) => ({
      ...prev,
      members: [...prev.members, { ...newMember }],
    }))
    setNewMember({
      address: '',
      name: '',
      email: '',
      skills: '',
      role: '',
    })
  }

  const removeMemberFromForm = (index) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await teamApi.createTeam(formData)
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        leader_address: '',
        max_members: 5,
        skills: '',
        members: [],
      })
      loadTeams()
    } catch (err) {
      alert('创建队伍失败: ' + (err.response?.data?.error || err.message))
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          队伍管理
        </Typography>
        <Button variant="contained" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? '取消' : '创建队伍'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showCreateForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            创建队伍
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="队伍名称 *"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                  <TextField
                    label="队伍描述"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    fullWidth
                  />
                  <Grid container spacing={2}>
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
                        label="最大成员数"
                        type="number"
                        name="max_members"
                        value={formData.max_members}
                        onChange={handleChange}
                        inputProps={{ min: 1, max: 20 }}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  <TextField
                    label="队伍技能（逗号分隔）"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="例如: React, Solidity, UI/UX"
                    fullWidth
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  添加成员
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="钱包地址 *"
                      name="address"
                      value={newMember.address}
                      onChange={handleMemberChange}
                      placeholder="0x..."
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="姓名"
                      name="name"
                      value={newMember.name}
                      onChange={handleMemberChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="邮箱"
                      name="email"
                      value={newMember.email}
                      onChange={handleMemberChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="角色"
                      name="role"
                      value={newMember.role}
                      onChange={handleMemberChange}
                      placeholder="例如: Developer"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="技能"
                      name="skills"
                      value={newMember.skills}
                      onChange={handleMemberChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="button" variant="outlined" onClick={addMemberToForm}>
                      添加成员
                    </Button>
                  </Grid>
                </Grid>

                {formData.members.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      已添加成员 ({formData.members.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {formData.members.map((member, index) => (
                        <Paper
                          key={index}
                          variant="outlined"
                          sx={{
                            p: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body2">
                            {member.address?.slice(0, 10)}... - {member.name || '未命名'}
                          </Typography>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => removeMemberFromForm(index)}
                          >
                            删除
                          </Button>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
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
        <Typography>加载中...</Typography>
      ) : teams.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
          <Typography>暂无队伍</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {teams.map((team) => (
            <Grid item xs={12} md={6} key={team.id}>
              <Paper sx={{ p: 2 }}>
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
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default TeamManagement

