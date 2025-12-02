import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { registrationApi } from '../api/registrationApi'
import { teamApi } from '../api/teamApi'
import './RegistrationManagement.css'

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

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="registration-management">
      <h1>报名管理</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="section-header">
          <h2>创建报名</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
          >
            {showCreateForm ? '取消' : '创建报名'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleSubmit} className="create-form">
            <div className="form-group">
              <label>选择队伍 *</label>
              <select
                name="team_id"
                value={formData.team_id}
                onChange={handleChange}
                required
              >
                <option value="">请选择队伍</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.members?.length || 0} 成员)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>项目名称</label>
              <input
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>项目描述</label>
              <textarea
                name="project_description"
                value={formData.project_description}
                onChange={handleChange}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                提交报名
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <h2>报名列表 ({registrations.length})</h2>
        {registrations.length === 0 ? (
          <div className="empty-state">暂无报名记录</div>
        ) : (
          <div className="registrations-list">
            {registrations.map((registration) => (
              <div key={registration.id} className="registration-card">
                <div className="registration-header">
                  <h3>{registration.team?.name || '未知队伍'}</h3>
                  <span
                    className={`status-badge ${getStatusBadgeClass(
                      registration.status
                    )}`}
                  >
                    {getStatusName(registration.status)}
                  </span>
                </div>
                <div className="registration-info">
                  {registration.project_name && (
                    <p>
                      <strong>项目名称:</strong> {registration.project_name}
                    </p>
                  )}
                  {registration.project_description && (
                    <p>
                      <strong>项目描述:</strong> {registration.project_description}
                    </p>
                  )}
                  <p>
                    <strong>队伍成员:</strong>{' '}
                    {registration.team?.members?.length || 0} 人
                  </p>
                  {registration.sbt_token_id && (
                    <p>
                      <strong>SBT Token ID:</strong> {registration.sbt_token_id}
                    </p>
                  )}
                  {registration.sbt_tx_hash && (
                    <p>
                      <strong>SBT交易哈希:</strong>{' '}
                      <a
                        href={`https://etherscan.io/tx/${registration.sbt_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {registration.sbt_tx_hash?.slice(0, 10)}...
                      </a>
                    </p>
                  )}
                </div>
                {registration.status === 'pending' && (
                  <div className="registration-actions">
                    <input
                      type="text"
                      placeholder="主办方钱包地址"
                      id={`organizer-${registration.id}`}
                      className="organizer-input"
                    />
                    <button
                      onClick={() =>
                        handleApprove(
                          registration.id,
                          document.getElementById(`organizer-${registration.id}`).value
                        )
                      }
                      className="btn btn-primary btn-sm"
                    >
                      批准
                    </button>
                    <button
                      onClick={() =>
                        handleReject(
                          registration.id,
                          document.getElementById(`organizer-${registration.id}`).value
                        )
                      }
                      className="btn btn-danger btn-sm"
                    >
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RegistrationManagement

