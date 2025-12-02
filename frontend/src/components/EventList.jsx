import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import './EventList.css'

const EventList = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await eventApi.getAllEvents()
      setEvents(data)
      setError(null)
    } catch (err) {
      setError('加载活动列表失败: ' + err.message)
    } finally {
      setLoading(false)
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="event-list-page">
      <div className="page-header">
        <h1>活动列表</h1>
        <Link to="/events/create" className="btn btn-primary">
          创建新活动
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <p>暂无活动，点击上方按钮创建第一个活动</p>
        </div>
      ) : (
        <div className="event-list">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <Link to={`/events/${event.id}`} className="event-link">
                <h3>{event.name}</h3>
                <p className="event-description">{event.description}</p>
                <div className="event-info">
                  <p>
                    <strong>地点:</strong> {event.location || '-'}
                  </p>
                  <p>
                    <strong>开始时间:</strong> {formatDate(event.start_time)}
                  </p>
                  <p>
                    <strong>结束时间:</strong> {formatDate(event.end_time)}
                  </p>
                  <p>
                    <strong>主办方:</strong> {event.organizer_address?.slice(0, 10)}...
                  </p>
                </div>
                <span className={`stage-badge ${getStageBadgeClass(event.current_stage)}`}>
                  {getStageName(event.current_stage)}
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventList

