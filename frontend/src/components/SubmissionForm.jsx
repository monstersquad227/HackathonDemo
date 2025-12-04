import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { submissionApi } from '../api/submissionApi'
import { teamApi } from '../api/teamApi'
import { useWallet } from '../contexts/WalletContext'
import BackToEventDetail from './BackToEventDetail'
import './SubmissionForm.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

const SubmissionForm = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { account: connectedAddress } = useWallet()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    github_repo: '',
    demo_url: '',
    documentation: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [existingSubmission, setExistingSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [teamInfo, setTeamInfo] = useState(null)
  const [validatingTeam, setValidatingTeam] = useState(false)
  const [useConnectedWallet, setUseConnectedWallet] = useState(true)
  const [manualAddress, setManualAddress] = useState('')
  
  // 计算实际使用的钱包地址
  const walletAddress = useConnectedWallet && connectedAddress ? connectedAddress : manualAddress

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 验证钱包地址格式
  const validateAddress = (address) => {
    if (!address) return false
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // 加载已存在的提交
  useEffect(() => {
    const loadExistingSubmission = async () => {
      try {
        setLoading(true)
        const submissions = await submissionApi.getSubmissionsByEvent(eventId)
        // 如果已连接钱包，查找该钱包地址的提交
        if (walletAddress) {
          const existing = submissions.find(
            (s) => s.submitted_by?.toLowerCase() === walletAddress.toLowerCase()
          )
          if (existing) {
            setExistingSubmission(existing)
            setFormData({
              title: existing.title || '',
              description: existing.description || '',
              github_repo: existing.github_repo || '',
              demo_url: existing.demo_url || '',
              documentation: existing.documentation || '',
            })
            // 如果已存在的提交使用的地址与当前钱包地址一致，使用连接的钱包
            if (existing.submitted_by?.toLowerCase() === connectedAddress?.toLowerCase()) {
              setUseConnectedWallet(true)
              setManualAddress('')
            } else {
              setUseConnectedWallet(false)
              setManualAddress(existing.submitted_by || '')
            }
            // 加载队伍信息
            if (existing.team_id) {
              await loadTeamInfo(existing.team_id)
            }
          } else {
            // 如果没有找到已存在的提交，清空existingSubmission
            setExistingSubmission(null)
            setTeamInfo(null)
          }
        }
      } catch (err) {
        // 静默处理错误
      } finally {
        setLoading(false)
      }
    }
    loadExistingSubmission()
  }, [eventId, walletAddress, connectedAddress])

  // 当钱包地址改变时，自动查找队伍
  useEffect(() => {
    const checkTeam = async () => {
      if (walletAddress && validateAddress(walletAddress)) {
        await findTeamByLeader(walletAddress)
      } else {
        setTeamInfo(null)
      }
    }
    checkTeam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, eventId])

  // 通过队长钱包地址查找队伍
  const loadTeamInfo = async (teamId) => {
    if (!teamId) return
    try {
      const team = await teamApi.getTeamById(teamId)
      setTeamInfo(team)
    } catch (err) {
      setTeamInfo(null)
    }
  }

  // 通过队长钱包地址和活动ID查找队伍
  const findTeamByLeader = async (address) => {
    if (!address || !validateAddress(address)) {
      setTeamInfo(null)
      return false
    }
    try {
      setValidatingTeam(true)
      const teams = await teamApi.getTeamsByLeader(address)
      // 查找在该活动中的队伍
      const eventTeams = await teamApi.getTeamsByEvent(eventId)
      const teamInEvent = teams.find((t) =>
        eventTeams.some((et) => et.id === t.id)
      )
      if (teamInEvent) {
        setTeamInfo(teamInEvent)
        return true
      } else {
        setTeamInfo(null)
        return false
      }
    } catch (err) {
      setTeamInfo(null)
      return false
    } finally {
      setValidatingTeam(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 验证所有必填字段
    if (!walletAddress || walletAddress.trim() === '') {
      setError('请输入队长钱包地址')
      return
    }
    if (!formData.title || !formData.title.trim()) {
      setError('请输入作品标题')
      return
    }
    if (!formData.description || !formData.description.trim()) {
      setError('请输入作品描述')
      return
    }
    if (!formData.github_repo || !formData.github_repo.trim()) {
      setError('请输入GitHub仓库链接')
      return
    }
    if (!formData.demo_url || !formData.demo_url.trim()) {
      setError('请输入Demo链接')
      return
    }
    if (!formData.documentation || !formData.documentation.trim()) {
      setError('请输入文档链接')
      return
    }
    
    // 验证队长钱包地址格式
    if (!validateAddress(walletAddress)) {
      setError('请输入有效的队长钱包地址（0x开头的42位地址）')
      return
    }

    // 验证队长钱包地址是否在该活动中有队伍
    if (!teamInfo) {
      const hasTeam = await findTeamByLeader(walletAddress)
      if (!hasTeam) {
        setError('该钱包地址在此活动中没有对应的队伍')
        return
      }
    }

    try {
      setSubmitting(true)
      setError(null)

      if (existingSubmission) {
        // 更新已存在的提交
        const updatePayload = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          github_repo: formData.github_repo.trim(),
          demo_url: formData.demo_url.trim(),
          documentation: formData.documentation.trim(),
          submitted_by: walletAddress, // 用于验证是否是队长
        }
        await submissionApi.updateSubmission(existingSubmission.id, updatePayload)
        setSuccess(true)
        setError(null)
      } else {
        // 创建新提交（不传team_id，后端会自动通过leader_address查找）
        const payload = {
          event_id: parseInt(eventId),
          title: formData.title.trim(),
          description: formData.description.trim(),
          github_repo: formData.github_repo.trim(),
          demo_url: formData.demo_url.trim(),
          documentation: formData.documentation.trim(),
          submitted_by: walletAddress,
        }
        await submissionApi.createSubmission(payload)
        setSuccess(true)
        setFormData({
          title: '',
          description: '',
          github_repo: '',
          demo_url: '',
          documentation: '',
        })
        setManualAddress('')
        setTeamInfo(null)
      }
    } catch (err) {
      setError('提交失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="submission-form-page">
      <BackToEventDetail />
      <h1>{existingSubmission ? '修改作品' : '提交作品'}</h1>
      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          {existingSubmission ? '修改成功' : '提交成功'}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="submission-form">
          <div className="form-group">
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
              {useConnectedWallet && !connectedAddress && (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  请使用右上角的"连接钱包"按钮连接您的钱包，或取消勾选使用手动输入
                </Alert>
              )}
              {validatingTeam && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  正在查找队伍...
                </Typography>
              )}
              {teamInfo && !validatingTeam && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  找到队伍：{teamInfo.name} (ID: {teamInfo.id})
                </Alert>
              )}
              {!teamInfo && !validatingTeam && walletAddress && validateAddress(walletAddress) && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  未找到该钱包地址在此活动中的队伍
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                请输入队长钱包地址，系统将自动查找该地址在此活动中的队伍
              </Typography>
            </Box>
          </div>
          <div className="form-group">
            <label>作品标题 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>作品描述 *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>
          <div className="form-group">
            <label>GitHub 仓库链接 *</label>
            <input
              type="url"
              name="github_repo"
              value={formData.github_repo}
              onChange={handleChange}
              placeholder="https://github.com/..."
              required
            />
          </div>
          <div className="form-group">
            <label>Demo 链接 *</label>
            <input
              type="url"
              name="demo_url"
              value={formData.demo_url}
              onChange={handleChange}
              placeholder="https://..."
              required
            />
          </div>
          <div className="form-group">
            <label>文档链接 *</label>
            <input
              type="url"
              name="documentation"
              value={formData.documentation}
              onChange={handleChange}
              placeholder="https://..."
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (existingSubmission ? '修改中...' : '提交中...') : (existingSubmission ? '修改作品' : '提交作品')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubmissionForm

