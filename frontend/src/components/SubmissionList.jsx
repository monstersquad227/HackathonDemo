import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { submissionApi } from '../api/submissionApi'
import './SubmissionList.css'

const SubmissionList = () => {
  const { eventId } = useParams()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [organizerAddress, setOrganizerAddress] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    loadSubmissions()
  }, [eventId])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const data = await submissionApi.getSubmissionsByEvent(eventId)
      setSubmissions(data)
      setError(null)
    } catch (err) {
      setError('加载作品提交失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    const map = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
    }
    return map[status] || 'status-pending'
  }

  const getStatusLabel = (status) => {
    const map = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
    }
    return map[status] || status
  }

  const handleApprove = async (id) => {
    if (!organizerAddress) {
      alert('请输入主办方钱包地址')
      return
    }
    try {
      await submissionApi.approveSubmission(id, organizerAddress, comment)
      setComment('')
      loadSubmissions()
    } catch (err) {
      alert('批准失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleReject = async (id) => {
    if (!organizerAddress) {
      alert('请输入主办方钱包地址')
      return
    }
    if (!window.confirm('确定要拒绝该作品吗？')) return
    try {
      await submissionApi.rejectSubmission(id, organizerAddress, comment)
      setComment('')
      loadSubmissions()
    } catch (err) {
      alert('拒绝失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="submission-list-page">
      <h1>作品提交管理</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="card approval-controls">
        <div className="form-group">
          <label>主办方钱包地址</label>
          <input
            type="text"
            value={organizerAddress}
            onChange={(e) => setOrganizerAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>审核意见（可选）</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <p className="hint">在审批作品时将使用该地址验证身份</p>
      </div>

      <div className="card">
        <h2>作品列表 ({submissions.length})</h2>
        {submissions.length === 0 ? (
          <div className="empty-state">暂无提交</div>
        ) : (
          <div className="submissions-grid">
            {submissions.map((submission) => (
              <div key={submission.id} className="submission-card">
                <div className="submission-header">
                  <h3>{submission.title}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(submission.status)}`}>
                    {getStatusLabel(submission.status)}
                  </span>
                </div>
                <p className="submission-description">{submission.description}</p>
                <div className="submission-info">
                  <p><strong>队伍 ID:</strong> {submission.team_id}</p>
                  <p><strong>提交者:</strong> {submission.submitted_by?.slice(0, 10)}...</p>
                  <p><strong>提交时间:</strong> {formatDate(submission.submitted_at)}</p>
                </div>
                <div className="links">
                  {submission.github_repo && (
                    <a href={submission.github_repo} target="_blank" rel="noopener noreferrer">
                      GitHub
                    </a>
                  )}
                  {submission.demo_url && (
                    <a href={submission.demo_url} target="_blank" rel="noopener noreferrer">
                      Demo
                    </a>
                  )}
                  {submission.documentation && (
                    <a href={submission.documentation} target="_blank" rel="noopener noreferrer">
                      文档
                    </a>
                  )}
                  {submission.storage_url && (
                    <a href={submission.storage_url} target="_blank" rel="noopener noreferrer">
                      存储链接
                    </a>
                  )}
                </div>

                {submission.files && submission.files.length > 0 && (
                  <div className="files-section">
                    <strong>附件:</strong>
                    <ul>
                      {submission.files.map((file) => (
                        <li key={file.id}>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            {file.file_name || file.url}
                          </a>
                          {file.hash && <span className="file-hash">Hash: {file.hash.slice(0, 16)}...</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {submission.reviewer_comment && (
                  <p className="review-comment">
                    <strong>审核意见:</strong> {submission.reviewer_comment}
                  </p>
                )}

                {submission.status === 'pending' && (
                  <div className="submission-actions">
                    <button className="btn btn-primary" onClick={() => handleApprove(submission.id)}>
                      通过
                    </button>
                    <button className="btn btn-danger" onClick={() => handleReject(submission.id)}>
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

export default SubmissionList

