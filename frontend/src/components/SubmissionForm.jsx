import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ethers } from 'ethers'
import { submissionApi } from '../api/submissionApi'
import { teamApi } from '../api/teamApi'
import './SubmissionForm.css'

const SubmissionForm = () => {
  const { eventId } = useParams()
  const [formData, setFormData] = useState({
    leader_address: '',
    title: '',
    description: '',
    github_repo: '',
    demo_url: '',
    documentation: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [existingSubmission, setExistingSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [teamInfo, setTeamInfo] = useState(null)
  const [validatingTeam, setValidatingTeam] = useState(false)

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
              leader_address: existing.submitted_by || '',
              title: existing.title || '',
              description: existing.description || '',
              github_repo: existing.github_repo || '',
              demo_url: existing.demo_url || '',
              documentation: existing.documentation || '',
            })
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
        console.error('加载已存在提交失败:', err)
      } finally {
        setLoading(false)
      }
    }
    loadExistingSubmission()
  }, [eventId, walletAddress])

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装 MetaMask 钱包')
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setWalletAddress(address)
      // 如果连接钱包成功，自动填入队长钱包地址
      setFormData((prev) => ({
        ...prev,
        leader_address: address,
      }))
      // 自动查找队伍
      await findTeamByLeader(address)
      setError(null)
    } catch (err) {
      setError('连接钱包失败: ' + err.message)
    }
  }

  // 通过队长钱包地址查找队伍
  const loadTeamInfo = async (teamId) => {
    if (!teamId) return
    try {
      const team = await teamApi.getTeamById(teamId)
      setTeamInfo(team)
    } catch (err) {
      console.error('加载队伍信息失败:', err)
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
      console.error('查找队伍失败:', err)
      setTeamInfo(null)
      return false
    } finally {
      setValidatingTeam(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 验证所有必填字段
    if (!formData.leader_address) {
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
    if (!validateAddress(formData.leader_address)) {
      setError('请输入有效的队长钱包地址（0x开头的42位地址）')
      return
    }

    // 验证队长钱包地址是否在该活动中有队伍
    if (!teamInfo) {
      const hasTeam = await findTeamByLeader(formData.leader_address)
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
          submitted_by: formData.leader_address, // 用于验证是否是队长
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
          submitted_by: formData.leader_address,
        }
        await submissionApi.createSubmission(payload)
        setSuccess(true)
        setFormData({
          leader_address: '',
          title: '',
          description: '',
          github_repo: '',
          demo_url: '',
          documentation: '',
        })
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
            <label>队长钱包地址 *</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                name="leader_address"
                value={formData.leader_address}
                onChange={async (e) => {
                  handleChange(e)
                  // 当地址改变时，自动查找队伍
                  if (e.target.value && validateAddress(e.target.value)) {
                    await findTeamByLeader(e.target.value)
                  } else {
                    setTeamInfo(null)
                  }
                }}
                placeholder="0x..."
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={connectWallet}
                className="btn btn-secondary"
              >
                连接钱包
              </button>
            </div>
            {validatingTeam && (
              <p className="hint" style={{ marginTop: '5px', fontSize: '0.9em', color: '#666' }}>
                正在查找队伍...
              </p>
            )}
            {teamInfo && !validatingTeam && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '0.9em' }}>
                  <strong>找到队伍：</strong>{teamInfo.name} (ID: {teamInfo.id})
                </p>
              </div>
            )}
            {!teamInfo && !validatingTeam && formData.leader_address && validateAddress(formData.leader_address) && (
              <p className="hint" style={{ marginTop: '5px', fontSize: '0.9em', color: '#f44336' }}>
                未找到该钱包地址在此活动中的队伍
              </p>
            )}
            <p className="hint" style={{ marginTop: '5px', fontSize: '0.9em', color: '#666' }}>
              请输入队长钱包地址，系统将自动查找该地址在此活动中的队伍
            </p>
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

