import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import { submissionApi } from '../api/submissionApi'
import { voteApi } from '../api/voteApi'
import './VotingPanel.css'

const defaultForm = {
  submission_id: '',
  voter_address: '',
  voter_type: 'public',
  weight: '',
  reason: '',
  signature: '',
  offchain_proof: '',
}

const defaultJudgeForm = {
  organizer_address: '',
  address: '',
  weight: '',
  max_votes: '',
}

const VoterTypeLabels = {
  judge: '评委',
  sponsor: '赞助商',
  public: '公众',
}

function VotingPanel() {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [summary, setSummary] = useState([])
  const [votes, setVotes] = useState([])
  const [judges, setJudges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [judgeForm, setJudgeForm] = useState(defaultJudgeForm)
  const [processingVote, setProcessingVote] = useState(false)
  const [processingJudge, setProcessingJudge] = useState(false)

  useEffect(() => {
    loadData()
  }, [eventId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [eventData, submissionsData, summaryData, votesData, judgeData] = await Promise.all([
        eventApi.getEventById(eventId),
        submissionApi.getSubmissionsByEvent(eventId),
        voteApi.getVoteSummary(eventId),
        voteApi.getVotesByEvent(eventId),
        voteApi.getJudges(eventId),
      ])
      setEvent(eventData)
      setSubmissions(submissionsData)
      setSummary(summaryData)
      setVotes(votesData)
      setJudges(judgeData)
      if (submissionsData.length > 0 && !form.submission_id) {
        setForm((prev) => ({ ...prev, submission_id: submissionsData[0].id }))
      }
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleJudgeFormChange = (event) => {
    const { name, value } = event.target
    setJudgeForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleVoteSubmit = async (event) => {
    event.preventDefault()
    if (!form.submission_id) {
      alert('请选择作品')
      return
    }
    if (!form.voter_address) {
      alert('请输入投票地址')
      return
    }
    const payload = {
      event_id: Number(eventId),
      submission_id: Number(form.submission_id),
      voter_address: form.voter_address,
      voter_type: form.voter_type,
      reason: form.reason || undefined,
      signature: form.signature || undefined,
      offchain_proof: form.offchain_proof || undefined,
    }
    if (form.weight) {
      payload.weight = Number(form.weight)
    }
    try {
      setProcessingVote(true)
      await voteApi.castVote(payload)
      alert('投票成功')
      setForm((prev) => ({ ...defaultForm, submission_id: prev.submission_id }))
      await loadData()
    } catch (err) {
      alert('投票失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setProcessingVote(false)
    }
  }

  const handleAddJudge = async (event) => {
    event.preventDefault()
    if (!judgeForm.organizer_address) {
      alert('请输入主办方地址')
      return
    }
    if (!judgeForm.address) {
      alert('请输入评委地址')
      return
    }
    const payload = {
      organizer_address: judgeForm.organizer_address,
      address: judgeForm.address,
      weight: judgeForm.weight ? Number(judgeForm.weight) : undefined,
      max_votes: judgeForm.max_votes ? Number(judgeForm.max_votes) : undefined,
    }
    try {
      setProcessingJudge(true)
      await voteApi.addJudge(eventId, payload)
      setJudgeForm((prev) => ({ ...prev, address: '', weight: '', max_votes: '' }))
      await loadData()
    } catch (err) {
      alert('添加失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setProcessingJudge(false)
    }
  }

  const handleRemoveJudge = async (judgeId) => {
    if (!judgeForm.organizer_address) {
      alert('请输入主办方地址以移除评委')
      return
    }
    if (!window.confirm('确定要移除该评委吗？')) return
    try {
      setProcessingJudge(true)
      await voteApi.removeJudge(eventId, judgeId, judgeForm.organizer_address)
      await loadData()
    } catch (err) {
      alert('移除失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setProcessingJudge(false)
    }
  }

  const sortedSummary = useMemo(() => {
    return [...summary].sort((a, b) => b.total_weight - a.total_weight)
  }, [summary])

  const voterOptions = useMemo(() => {
    if (!event) return []
    const options = [{ value: 'judge', label: '评委投票' }]
    if (event.allow_sponsor_voting) {
      options.push({ value: 'sponsor', label: '赞助商投票' })
    }
    if (event.allow_public_voting) {
      options.push({ value: 'public', label: '公众投票' })
    }
    return options
  }, [event])

  const votingWindow = useMemo(() => {
    if (!event) return '-'
    const { voting_start_time, voting_end_time } = event
    if (!voting_start_time && !voting_end_time) return '-'
    const format = (value) => (value ? new Date(value).toLocaleString('zh-CN') : '未设置')
    return `${format(voting_start_time)} ～ ${format(voting_end_time)}`
  }, [event])

  if (loading) {
    return <div className="loading">加载投票数据中...</div>
  }

  if (error) {
    return <div className="error-message">加载失败: {error}</div>
  }

  return (
    <div className="voting-panel">
      <div className="panel-header">
        <div>
          <h1>投票面板</h1>
          <p className="subtitle">
            活动：{event?.name} · 当前阶段：{event?.current_stage}
          </p>
        </div>
        <Link className="btn btn-outline" to={`/events/${eventId}`}>
          返回活动详情
        </Link>
      </div>

      <div className="grid">
        <div className="card">
          <h2>投票窗口</h2>
          <p>{votingWindow}</p>
          <ul className="inline-list">
            <li>允许赞助商投票：{event?.allow_sponsor_voting ? '是' : '否'}</li>
            <li>允许公众投票：{event?.allow_public_voting ? '是' : '否'}</li>
          </ul>
          <p className="hint">公众默认每作品 1 票、每场最多 3 票，评委/赞助商凭权重自动计分。</p>
        </div>

        <div className="card">
          <h2>投票排行榜</h2>
          {sortedSummary.length === 0 ? (
            <div className="empty-state">暂无线上投票</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>作品</th>
                    <th>总票权</th>
                    <th>评委</th>
                    <th>赞助商</th>
                    <th>公众</th>
                    <th>票数</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSummary.map((item) => (
                    <tr key={item.submission_id}>
                      <td>{item.submission_title || `Submission #${item.submission_id}`}</td>
                      <td>{item.total_weight.toFixed(2)}</td>
                      <td>{item.judge_weight.toFixed(2)}</td>
                      <td>{item.sponsor_weight.toFixed(2)}</td>
                      <td>{item.public_weight.toFixed(2)}</td>
                      <td>{item.vote_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>提交投票</h2>
          <form onSubmit={handleVoteSubmit} className="form-grid">
            <label>
              作品
              <select name="submission_id" value={form.submission_id} onChange={handleFormChange}>
                {submissions.map((submission) => (
                  <option key={submission.id} value={submission.id}>
                    {submission.title} (#{submission.id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              投票类型
              <select name="voter_type" value={form.voter_type} onChange={handleFormChange}>
                {voterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              投票地址
              <input
                name="voter_address"
                placeholder="0x..."
                value={form.voter_address}
                onChange={handleFormChange}
              />
            </label>

            <label>
              自定义权重（可选）
              <input
                name="weight"
                type="number"
                step="0.1"
                placeholder="默认按系统策略计算"
                value={form.weight}
                onChange={handleFormChange}
              />
            </label>

            <label>
              投票理由（可选）
              <textarea name="reason" value={form.reason} onChange={handleFormChange} rows={2} />
            </label>

            <label>
              签名（可选）
              <input
                name="signature"
                placeholder="0x..."
                value={form.signature}
                onChange={handleFormChange}
              />
            </label>

            <label>
              线下证明 / NFT 证据（可选）
              <input
                name="offchain_proof"
                placeholder="token 或截图链接"
                value={form.offchain_proof}
                onChange={handleFormChange}
              />
            </label>

            <button type="submit" className="btn btn-primary" disabled={processingVote}>
              {processingVote ? '提交中...' : '提交投票'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>评委白名单</h2>
          <form onSubmit={handleAddJudge} className="form-grid tight">
            <label>
              主办方地址
              <input
                name="organizer_address"
                placeholder="0x...（用于所有评委操作）"
                value={judgeForm.organizer_address}
                onChange={handleJudgeFormChange}
              />
            </label>
            <label>
              评委地址
              <input
                name="address"
                placeholder="0x..."
                value={judgeForm.address}
                onChange={handleJudgeFormChange}
              />
            </label>
            <label>
              权重
              <input
                name="weight"
                type="number"
                step="0.1"
                placeholder="默认 1"
                value={judgeForm.weight}
                onChange={handleJudgeFormChange}
              />
            </label>
            <label>
              票数上限
              <input
                name="max_votes"
                type="number"
                placeholder="默认 100"
                value={judgeForm.max_votes}
                onChange={handleJudgeFormChange}
              />
            </label>
            <button type="submit" className="btn btn-secondary" disabled={processingJudge}>
              {processingJudge ? '处理中...' : '添加评委'}
            </button>
          </form>

          <div className="table-wrapper">
            {judges.length === 0 ? (
              <div className="empty-state">还没有添加评委</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>地址</th>
                    <th>权重</th>
                    <th>票数上限</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {judges.map((judge) => (
                    <tr key={judge.id}>
                      <td>{judge.address}</td>
                      <td>{judge.weight}</td>
                      <td>{judge.max_votes}</td>
                      <td>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => handleRemoveJudge(judge.id)}
                          disabled={processingJudge}
                        >
                          移除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>最新投票</h2>
        {votes.length === 0 ? (
          <div className="empty-state">暂无投票记录</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>作品</th>
                  <th>类型</th>
                  <th>地址</th>
                  <th>权重</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {votes.slice(0, 20).map((vote) => (
                  <tr key={vote.id}>
                    <td>#{vote.id}</td>
                    <td>{vote.submission?.title || vote.submission_id}</td>
                    <td>{VoterTypeLabels[vote.voter_type]}</td>
                    <td className="mono">{vote.voter_address}</td>
                    <td>{Number(vote.weight).toFixed(2)}</td>
                    <td>{new Date(vote.created_at).toLocaleString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default VotingPanel



