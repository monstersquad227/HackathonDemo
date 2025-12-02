import React, { useState, useEffect } from 'react'
import { teamApi } from '../api/teamApi'
import './TeamManagement.css'

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

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="team-management">
      <div className="page-header">
        <h1>队伍管理</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? '取消' : '创建队伍'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="card create-form">
          <h2>创建队伍</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>队伍名称 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>队伍描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>队长钱包地址 *</label>
                <input
                  type="text"
                  name="leader_address"
                  value={formData.leader_address}
                  onChange={handleChange}
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="form-group">
                <label>最大成员数</label>
                <input
                  type="number"
                  name="max_members"
                  value={formData.max_members}
                  onChange={handleChange}
                  min="1"
                  max="20"
                />
              </div>
            </div>
            <div className="form-group">
              <label>队伍技能（逗号分隔）</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="例如: React, Solidity, UI/UX"
              />
            </div>

            <div className="form-section">
              <h3>添加成员</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>钱包地址 *</label>
                  <input
                    type="text"
                    name="address"
                    value={newMember.address}
                    onChange={handleMemberChange}
                    placeholder="0x..."
                  />
                </div>
                <div className="form-group">
                  <label>姓名</label>
                  <input
                    type="text"
                    name="name"
                    value={newMember.name}
                    onChange={handleMemberChange}
                  />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    name="email"
                    value={newMember.email}
                    onChange={handleMemberChange}
                  />
                </div>
                <div className="form-group">
                  <label>角色</label>
                  <input
                    type="text"
                    name="role"
                    value={newMember.role}
                    onChange={handleMemberChange}
                    placeholder="例如: Developer"
                  />
                </div>
                <div className="form-group">
                  <label>技能</label>
                  <input
                    type="text"
                    name="skills"
                    value={newMember.skills}
                    onChange={handleMemberChange}
                  />
                </div>
                <button
                  type="button"
                  onClick={addMemberToForm}
                  className="btn btn-secondary"
                >
                  添加
                </button>
              </div>

              {formData.members.length > 0 && (
                <div className="members-list">
                  <h4>已添加成员 ({formData.members.length})</h4>
                  {formData.members.map((member, index) => (
                    <div key={index} className="member-item">
                      <span>{member.address?.slice(0, 10)}... - {member.name || '未命名'}</span>
                      <button
                        type="button"
                        onClick={() => removeMemberFromForm(index)}
                        className="btn btn-danger btn-sm"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                创建队伍
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="empty-state">
          <p>暂无队伍</p>
        </div>
      ) : (
        <div className="team-list">
          {teams.map((team) => (
            <div key={team.id} className="team-card">
              <div className="team-header">
                <h3>{team.name}</h3>
                <span className={`status-badge ${getStatusBadgeClass(team.status)}`}>
                  {getStatusName(team.status)}
                </span>
              </div>
              <p className="team-description">{team.description}</p>
              <div className="team-info">
                <p>
                  <strong>队长:</strong> {team.leader_address?.slice(0, 10)}...
                </p>
                <p>
                  <strong>成员数:</strong> {team.members?.length || 0} / {team.max_members}
                </p>
                {team.skills && (
                  <p>
                    <strong>技能:</strong> {team.skills}
                  </p>
                )}
              </div>
              {team.members && team.members.length > 0 && (
                <div className="members-preview">
                  <strong>成员:</strong>
                  <ul>
                    {team.members.map((member, index) => (
                      <li key={index}>
                        {member.name || '未命名'} ({member.address?.slice(0, 8)}...)
                        {member.role && ` - ${member.role}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeamManagement

