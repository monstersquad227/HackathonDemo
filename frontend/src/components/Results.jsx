import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import { voteApi } from '../api/voteApi'
import './Results.css'

const stageLabels = {
  registration: '报名中',
  checkin: '签到',
  submission: '提交作品',
  voting: '投票中',
  awards: '颁奖',
  ended: '已结束',
}

function Results() {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [eventData, summaryData] = await Promise.all([
          eventApi.getEventById(eventId),
          voteApi.getVoteSummary(eventId),
        ])
        setEvent(eventData)
        setSummary(summaryData)
        setError('')
      } catch (err) {
        setError(err.response?.data?.error || err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eventId])

  const rankedList = useMemo(() => {
    if (!summary || summary.length === 0) return []
    const sorted = [...summary].sort((a, b) => b.total_weight - a.total_weight)
    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }))
  }, [summary])

  const prizeByRank = useMemo(() => {
    if (!event?.prizes) return {}
    const map = {}
    event.prizes.forEach((p) => {
      map[p.rank] = p
    })
    return map
  }, [event])

  const isFinalStage = event && (event.current_stage === 'awards' || event.current_stage === 'ended')

  if (loading) {
    return <div className="results-page loading">结果加载中...</div>
  }

  if (error) {
    return (
      <div className="results-page error-message">
        加载失败: {error}
        <div style={{ marginTop: '16px' }}>
          <Link className="btn btn-secondary" to={`/events/${eventId}`}>
            返回活动详情
          </Link>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="results-page error-message">
        活动不存在
        <div style={{ marginTop: '16px' }}>
          <Link className="btn btn-secondary" to="/">
            返回活动列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="results-page">
      <div className="results-header">
        <div>
          <h1>{event.name} · 结果与排名</h1>
          <p className="subtitle">
            当前阶段：{stageLabels[event.current_stage] || event.current_stage}
            {isFinalStage ? ' · 本页面展示最终结果' : ' · 投票仍可能变动，结果仅供实时参考'}
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-secondary" to={`/events/${eventId}`}>
            返回活动详情
          </Link>
        </div>
      </div>

      <div className="results-layout">
        <section className="card">
          <h2>排行榜</h2>
          {rankedList.length === 0 ? (
            <div className="empty-state">暂时还没有投票记录</div>
          ) : (
            <div className="table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>名次</th>
                    <th>作品</th>
                    <th>总票权</th>
                    <th>评委票权</th>
                    <th>赞助商票权</th>
                    <th>公众票权</th>
                    <th>票数</th>
                    <th>对应奖项</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedList.map((item) => {
                    const prize = prizeByRank[item.rank]
                    return (
                      <tr key={item.submission_id}>
                        <td>
                          <span className={`rank-badge rank-${item.rank}`}>
                            #{item.rank}
                          </span>
                        </td>
                        <td>{item.submission_title || `Submission #${item.submission_id}`}</td>
                        <td>{item.total_weight.toFixed(2)}</td>
                        <td>{item.judge_weight.toFixed(2)}</td>
                        <td>{item.sponsor_weight.toFixed(2)}</td>
                        <td>{item.public_weight.toFixed(2)}</td>
                        <td>{item.vote_count}</td>
                        <td>
                          {prize ? (
                            <div className="prize-cell">
                              <div className="prize-name">{prize.name}</div>
                              {prize.amount && <div className="prize-amount">{prize.amount}</div>}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2>奖项配置总览</h2>
          {(!event.prizes || event.prizes.length === 0) && (
            <div className="empty-state">尚未配置奖项</div>
          )}
          {event.prizes && event.prizes.length > 0 && (
            <ul className="prize-summary-list">
              {event.prizes
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .map((prize) => (
                  <li key={prize.id || prize.rank} className="prize-summary-item">
                    <span className={`rank-badge rank-${prize.rank}`}>#{prize.rank}</span>
                    <div className="prize-summary-text">
                      <div className="prize-summary-main">
                        <strong>{prize.name}</strong>
                        {prize.amount && <span className="prize-amount-inline">{prize.amount}</span>}
                      </div>
                      {prize.description && (
                        <div className="prize-summary-desc">{prize.description}</div>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          )}

          <p className="hint">
            排名基于线上投票统计结果（评委 / 赞助商 / 公众票权加总）。如需线下加分或特殊奖项，可在颁奖环节由主办方线下宣布。
          </p>
        </section>
      </div>
    </div>
  )
}

export default Results



