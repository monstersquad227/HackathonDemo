import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { teamApi } from '../api/teamApi'
import { useWallet } from '../contexts/WalletContext'
import { validateRegistrationAndCheckIn } from '../utils/walletValidation'
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
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

const TeamManagement = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { account: connectedAddress } = useWallet()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    event_id: eventId ? parseInt(eventId) : '',
    name: '',
    description: '',
    max_members: 5,
    skills: '',
    members: [],
  })
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [isValidated, setIsValidated] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [useConnectedWallet, setUseConnectedWallet] = useState(true)
  const [manualAddress, setManualAddress] = useState('')
  const [useConnectedWalletForJoin, setUseConnectedWalletForJoin] = useState(true)
  const [manualAddressForJoin, setManualAddressForJoin] = useState('')
  
  const walletAddress = useConnectedWallet && connectedAddress ? connectedAddress : manualAddress
  const joinWalletAddress = useConnectedWalletForJoin && connectedAddress ? connectedAddress : manualAddressForJoin

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

  // 验证钱包地址是否报名并签到（创建队伍）
  useEffect(() => {
    const validateWallet = async () => {
      if (!walletAddress || !eventId || walletAddress.trim() === '') {
        setIsValidated(false)
        setValidationError(null)
        return
      }

      // 验证地址格式
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
        setIsValidated(false)
        setValidationError('请输入有效的钱包地址')
        return
      }

      setValidating(true)
      setValidationError(null)
      try {
        const result = await validateRegistrationAndCheckIn(eventId, walletAddress.trim())
        if (result.isRegistered && result.isCheckedIn) {
          setIsValidated(true)
          setValidationError(null)
        } else {
          setIsValidated(false)
          if (!result.isRegistered) {
            setValidationError('该钱包地址尚未报名参加此活动')
          } else if (!result.isCheckedIn) {
            setValidationError('该钱包地址尚未完成签到，无法创建或加入队伍')
          }
        }
      } catch (err) {
        console.error('验证失败:', err)
        setIsValidated(false)
        setValidationError('验证失败: ' + err.message)
      } finally {
        setValidating(false)
      }
    }

    validateWallet()
  }, [walletAddress, eventId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'max_members' || name === 'event_id' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.description || !formData.max_members) {
      alert('请填写所有必填字段：队伍名称、队伍描述、最大成员数')
      return
    }
    if (!formData.event_id) {
      alert('请选择活动')
      return
    }
    if (!walletAddress || walletAddress.trim() === '') {
      alert('请输入钱包地址')
      return
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      alert('请输入有效的钱包地址（以太坊地址格式：0x开头，42字符）')
      return
    }
    if (!isValidated) {
      alert(validationError || '请先报名并完成签到')
      return
    }
    try {
      await teamApi.createTeam({
        ...formData,
        leader_address: walletAddress.trim(),
      })
      setShowCreateForm(false)
      setFormData({
        event_id: eventId ? parseInt(eventId) : '',
        name: '',
        description: '',
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
    setManualAddressForJoin('')
    setUseConnectedWalletForJoin(true)
    setJoinDialogOpen(true)
  }

  const handleJoinSubmit = async () => {
    if (!joinWalletAddress || joinWalletAddress.trim() === '') {
      alert('请输入钱包地址')
      return
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(joinWalletAddress.trim())) {
      alert('请输入有效的钱包地址（以太坊地址格式：0x开头，42字符）')
      return
    }
    
    // 验证加入队伍的钱包地址
    setValidating(true)
    try {
      const result = await validateRegistrationAndCheckIn(eventId, joinWalletAddress.trim())
      if (!result.isRegistered || !result.isCheckedIn) {
        if (!result.isRegistered) {
          alert('该钱包地址尚未报名参加此活动')
        } else if (!result.isCheckedIn) {
          alert('该钱包地址尚未完成签到，无法加入队伍')
        }
        setValidating(false)
        return
      }
      
      // 验证通过，加入队伍
      try {
        await teamApi.addMember(selectedTeam.id, { address: joinWalletAddress.trim() })
        setJoinDialogOpen(false)
        setSelectedTeam(null)
        setManualAddressForJoin('')
        setUseConnectedWalletForJoin(true)
        loadTeams()
        alert('加入队伍成功')
      } catch (err) {
        alert('加入队伍失败: ' + (err.response?.data?.error || err.message))
      } finally {
        setValidating(false)
      }
    } catch (err) {
      alert('验证失败: ' + err.message)
      setValidating(false)
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
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    队长钱包地址 *
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
                  {walletAddress && walletAddress.trim() !== '' && (
                    <>
                      {validating ? (
                        <Typography variant="body2" color="text.secondary">
                          验证中...
                        </Typography>
                      ) : !isValidated ? (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {validationError || '请先报名并完成签到'}
                        </Alert>
                      ) : (
                        <Alert severity="success" sx={{ mt: 1 }}>
                          已验证：已报名并完成签到
                        </Alert>
                      )}
                    </>
                  )}
                  {useConnectedWallet && !connectedAddress && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      请使用右上角的"连接钱包"按钮连接您的钱包，或取消勾选使用手动输入
                    </Alert>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
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
                  <Button 
                    type="submit" 
                    variant="contained"
                    disabled={!walletAddress || !isValidated || validating}
                  >
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              钱包地址 *
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useConnectedWalletForJoin}
                  onChange={(e) => {
                    setUseConnectedWalletForJoin(e.target.checked)
                    if (!e.target.checked) {
                      setManualAddressForJoin('')
                    }
                  }}
                  disabled={!connectedAddress}
                />
              }
              label={connectedAddress ? `使用连接的钱包 (${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)})` : '使用连接的钱包（请先连接钱包）'}
            />
            {!useConnectedWalletForJoin && (
              <TextField
                label="手动输入钱包地址"
                value={manualAddressForJoin}
                onChange={(e) => setManualAddressForJoin(e.target.value)}
                placeholder="0x..."
                fullWidth
                helperText="请输入以太坊钱包地址（42字符，以0x开头）"
                error={manualAddressForJoin && !/^0x[a-fA-F0-9]{40}$/.test(manualAddressForJoin.trim())}
              />
            )}
            {useConnectedWalletForJoin && !connectedAddress && (
              <Alert severity="info" sx={{ mt: 1 }}>
                请使用右上角的"连接钱包"按钮连接您的钱包，或取消勾选使用手动输入
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setJoinDialogOpen(false)
            setManualAddressForJoin('')
            setUseConnectedWalletForJoin(true)
          }}>取消</Button>
          <Button 
            onClick={handleJoinSubmit} 
            variant="contained"
            disabled={!joinWalletAddress || joinWalletAddress.trim() === '' || validating}
          >
            {validating ? '验证中...' : '加入'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TeamManagement
