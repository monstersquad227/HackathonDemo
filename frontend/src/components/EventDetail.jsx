import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import './EventDetail.css'

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingStage, setUpdatingStage] = useState(false)

  useEffect(() => {
    loadEvent()
  }, [id])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const data = await eventApi.getEventById(id)
      setEvent(data)
      setError(null)
    } catch (err) {
      setError('加载活动详情失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStageUpdate = async (newStage) => {
    if (!window.confirm(`确定要将活动阶段更新为 "${getStageName(newStage)}" 吗？`)) {
      return
    }

    try {
      setUpdatingStage(true)
      const updatedEvent = await eventApi.updateStage(id, newStage)
      setEvent(updatedEvent)
    } catch (err) {
      alert('更新阶段失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setUpdatingStage(false)
    }
  }

  const getStageName = (stage) => {
    const stageMap = {
      registration: '报名中',
      checkin: '签到',
      submission: '提交作品',
      voting: '投票中',
      awards: '颁奖',
      ended: '已结束',
    }
    return stageMap[stage] || stage
  }

  const getStageBadgeClass = (stage) => {
    const stageMap = {
      registration: 'stage-registration',
      checkin: 'stage-checkin',
      submission: 'stage-submission',
      voting: 'stage-voting',
      awards: 'stage-awards',
      ended: 'stage-ended',
    }
    return stageMap[stage] || 'stage-registration'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  }

  const stages = [
    { value: 'registration', label: '报名中' },
    { value: 'checkin', label: '签到' },
    { value: 'submission', label: '提交作品' },
    { value: 'voting', label: '投票中' },
    { value: 'awards', label: '颁奖' },
    { value: 'ended', label: '已结束' },
  ]

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (error || !event) {
    return (
      <div className="error">
        {error || '活动不存在'}
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="event-detail-page">
      <div className="detail-header">
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          ← 返回列表
        </button>
        <h1>{event.name}</h1>
        <span className={`stage-badge ${getStageBadgeClass(event.current_stage)}`}>
          {getStageName(event.current_stage)}
        </span>
      </div>

      <div className="detail-content">
        <div className="card">
          <h2>基本信息</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>活动描述:</strong>
              <p>{event.description || '-'}</p>
            </div>
            <div className="info-item">
              <strong>活动地点:</strong>
              <p>{event.location || '-'}</p>
            </div>
            <div className="info-item">
              <strong>开始时间:</strong>
              <p>{formatDate(event.start_time)}</p>
            </div>
            <div className="info-item">
              <strong>结束时间:</strong>
              <p>{formatDate(event.end_time)}</p>
            </div>
            <div className="info-item">
              <strong>主办方地址:</strong>
              <p className="address">{event.organizer_address}</p>
            </div>
            <div className="info-item">
              <strong>链上状态:</strong>
              <p>{event.on_chain ? '是' : '否'}</p>
            </div>
            {event.contract_address && (
              <div className="info-item">
                <strong>合约地址:</strong>
                <p className="address">{event.contract_address}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2>阶段时间</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>报名时间:</strong>
              <p>
                {formatDate(event.registration_start_time)} -{' '}
                {formatDate(event.registration_end_time)}
              </p>
            </div>
            <div className="info-item">
              <strong>签到时间:</strong>
              <p>
                {formatDate(event.checkin_start_time)} -{' '}
                {formatDate(event.checkin_end_time)}
              </p>
            </div>
            <div className="info-item">
              <strong>提交时间:</strong>
              <p>
                {formatDate(event.submission_start_time)} -{' '}
                {formatDate(event.submission_end_time)}
              </p>
            </div>
            <div className="info-item">
              <strong>投票时间:</strong>
              <p>
                {formatDate(event.voting_start_time)} -{' '}
                {formatDate(event.voting_end_time)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>投票设置</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>允许赞助商投票:</strong>
              <p>{event.allow_sponsor_voting ? '是' : '否'}</p>
            </div>
            <div className="info-item">
              <strong>允许公众投票:</strong>
              <p>{event.allow_public_voting ? '是' : '否'}</p>
            </div>
          </div>
        </div>

        {event.prizes && event.prizes.length > 0 && (
          <div className="card">
            <h2>奖项配置</h2>
            <div className="prizes-list">
              {event.prizes.map((prize, index) => (
                <div key={index} className="prize-card">
                  <h3>
                    {prize.name} (第{prize.rank}名)
                  </h3>
                  {prize.description && <p>{prize.description}</p>}
                  {prize.amount && (
                    <p className="prize-amount">
                      <strong>奖金:</strong> {prize.amount}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2>阶段管理</h2>
          <p className="current-stage">
            当前阶段: <strong>{getStageName(event.current_stage)}</strong>
          </p>
          <div className="stage-buttons">
            {stages.map((stage) => (
              <button
                key={stage.value}
                onClick={() => handleStageUpdate(stage.value)}
                disabled={
                  updatingStage || event.current_stage === stage.value
                }
                className={`btn ${
                  event.current_stage === stage.value
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>奖金池管理</h2>
          <Link
            to={`/events/${event.id}/funding-pool`}
            className="btn btn-primary"
          >
            管理奖金池
          </Link>
        </div>

        <div className="card">
          <h2>报名管理</h2>
          <Link
            to={`/events/${event.id}/registrations`}
            className="btn btn-primary"
          >
            查看报名
          </Link>
        </div>

        <div className="card">
          <h2>签到管理</h2>
          <div className="action-buttons">
            <Link
              to={`/events/${event.id}/check-in`}
              className="btn btn-primary"
            >
              管理签到
            </Link>
            <Link
              to={`/events/${event.id}/checkin`}
              className="btn btn-secondary"
            >
              用户签到
            </Link>
          </div>
        </div>

        <div className="card">
          <h2>作品提交</h2>
          <div className="action-buttons">
            <Link
              to={`/events/${event.id}/submissions`}
              className="btn btn-primary"
            >
              管理提交
            </Link>
            <Link
              to={`/events/${event.id}/submit`}
              className="btn btn-secondary"
            >
              提交作品
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetail

