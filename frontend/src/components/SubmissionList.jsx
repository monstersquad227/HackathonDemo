import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { submissionApi } from '../api/submissionApi'
import BackToEventDetail from './BackToEventDetail'
import './SubmissionList.css'

const SubmissionList = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const handleCardClick = (submissionId) => {
    // 点击作品卡片进入投票页面
    navigate(`/events/${eventId}/voting?submission=${submissionId}`)
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
      <BackToEventDetail />
      <h1>作品提交管理</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <h2>作品列表 ({submissions.length})</h2>
        {submissions.length === 0 ? (
          <div className="empty-state">暂无提交</div>
        ) : (
          <div className="submissions-grid">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="submission-card"
                onClick={() => handleCardClick(submission.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="submission-header">
                  <h3>{submission.title}</h3>
                </div>
                <p className="submission-description">{submission.description}</p>
                <div className="submission-info">
                  <p><strong>队伍 ID:</strong> {submission.team_id}</p>
                  <p><strong>队长钱包地址:</strong> {submission.submitted_by?.slice(0, 10)}...{submission.submitted_by?.slice(-8)}</p>
                  <p><strong>提交时间:</strong> {formatDate(submission.submitted_at)}</p>
                </div>
                <div className="links">
                  {submission.github_repo && (
                    <a
                      href={submission.github_repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GitHub
                    </a>
                  )}
                  {submission.demo_url && (
                    <a
                      href={submission.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Demo
                    </a>
                  )}
                  {submission.documentation && (
                    <a
                      href={submission.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      文档
                    </a>
                  )}
                </div>
                <div className="submission-actions" style={{ marginTop: '10px' }}>
                  <button className="btn btn-primary" onClick={(e) => {
                    e.stopPropagation()
                    handleCardClick(submission.id)
                  }}>
                    进入投票页面
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SubmissionList

