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

  // 根据时间自动判断当前阶段
  const getCurrentStage = (event) => {
    if (!event) return 'registration'
    
    const now = new Date()
    const startTime = new Date(event.start_time)
    const endTime = new Date(event.end_time)
    
    // 如果活动还未开始
    if (now < startTime) {
      return 'registration'
    }
    
    // 如果活动已结束
    if (now > endTime) {
      return 'ended'
    }
    
    // 根据各阶段时间判断
    const checkTimeRange = (startTime, endTime) => {
      if (!startTime || !endTime) return false
      const start = new Date(startTime)
      const end = new Date(endTime)
      return now >= start && now <= end
    }
    
    // 按优先级检查：投票 > 提交 > 签到 > 报名
    if (checkTimeRange(event.voting_start_time, event.voting_end_time)) {
      return 'voting'
    }
    
    if (checkTimeRange(event.submission_start_time, event.submission_end_time)) {
      return 'submission'
    }
    
    if (checkTimeRange(event.checkin_start_time, event.checkin_end_time)) {
      return 'checkin'
    }
    
    if (checkTimeRange(event.registration_start_time, event.registration_end_time)) {
      return 'registration'
    }
    
    // 如果不在任何阶段时间内，根据活动时间判断
    if (now >= startTime && now <= endTime) {
      // 如果投票时间已过，可能是颁奖阶段
      if (event.voting_end_time && new Date(event.voting_end_time) < now) {
        return 'awards'
      }
      // 否则默认返回提交阶段
      return 'submission'
    }
    
    return 'registration'
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
    return date.toLocaleDateString('zh-CN')
  }

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
        <span className={`stage-badge ${getStageBadgeClass(getCurrentStage(event))}`}>
          {getStageName(getCurrentStage(event))}
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
              {event.prizes.map((prize, index) => {
                // 检查必填字段
                const missingFields = []
                if (!prize.rank || prize.rank <= 0) {
                  missingFields.push('排名')
                }
                if (!prize.name || prize.name.trim() === '') {
                  missingFields.push('奖项名称')
                }
                if (!prize.count || prize.count <= 0) {
                  missingFields.push('个数')
                }
                if (!prize.amount || prize.amount.trim() === '') {
                  missingFields.push('奖金金额')
                }

                return (
                  <div key={index} className="prize-card">
                    {missingFields.length > 0 && (
                      <div style={{ 
                        padding: '8px', 
                        marginBottom: '8px', 
                        backgroundColor: '#fff3cd', 
                        border: '1px solid #ffc107', 
                        borderRadius: '4px',
                        color: '#856404',
                        fontSize: '0.9em'
                      }}>
                        <strong>⚠️ 缺少必填字段:</strong> {missingFields.join('、')}
                      </div>
                    )}
                    <h3>
                      {prize.name || <span style={{ color: '#dc3545' }}>未设置奖项名称</span>} 
                      {prize.rank ? ` (第${prize.rank}名)` : <span style={{ color: '#dc3545' }}> (未设置排名)</span>}
                    </h3>
                    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                      <p style={{ margin: '4px 0' }}>
                        <strong>个数:</strong>{' '}
                        {(() => {
                          // 如果count为0、null或undefined，默认显示为1（因为数据库默认值是1）
                          const displayCount = (prize.count && prize.count > 0) ? prize.count : 1
                          return <span>{displayCount}个</span>
                        })()}
                      </p>
                      {prize.description && <p style={{ margin: '4px 0' }}>{prize.description}</p>}
                      <p className="prize-amount" style={{ margin: '4px 0' }}>
                        <strong>奖金:</strong>{' '}
                        {prize.amount ? (
                          <span>{prize.amount}</span>
                        ) : (
                          <span style={{ color: '#dc3545' }}>未设置</span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="card">
          <h2>报名管理</h2>
          <div className="action-buttons">
            <Link
              to={`/events/${event.id}/register`}
              className="btn btn-secondary"
            >
              参与报名
            </Link>
            <Link
              to={`/events/${event.id}/registrations`}
              className="btn btn-primary"
            >
              查看报名
            </Link>
          </div>
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
          <h2>队伍管理</h2>
          <Link to={`/events/${event.id}/teams`} className="btn btn-primary">
            管理队伍
          </Link>
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

        <div className="card">
          <h2>结果与排名</h2>
          <Link to={`/events/${event.id}/results`} className="btn btn-primary">
            查看结果
          </Link>
        </div>
      </div>
    </div>
  )
}

export default EventDetail

