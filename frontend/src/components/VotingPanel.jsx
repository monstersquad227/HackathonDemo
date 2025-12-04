import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import { submissionApi } from '../api/submissionApi'
import { voteApi } from '../api/voteApi'
import { checkinApi } from '../api/checkinApi'
import { useWallet } from '../contexts/WalletContext'
import BackToEventDetail from './BackToEventDetail'
import './VotingPanel.css'

const defaultForm = {
  submission_id: '',
  voter_address: '',
  voter_type: 'public',
  reason: '',
  signature: '',
  offchain_proof: '',
}


function VotingPanel() {
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  const submissionIdParam = searchParams.get('submission')
  const { account } = useWallet()
  const [event, setEvent] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [processingVote, setProcessingVote] = useState(false)

  useEffect(() => {
    if (eventId) {
      loadData()
    } else {
      setError('活动ID无效')
      setLoading(false)
    }
  }, [eventId])

  // 如果从作品列表进入，设置默认选中的作品
  useEffect(() => {
    if (submissionIdParam && Array.isArray(submissions) && submissions.length > 0) {
      const submissionId = parseInt(submissionIdParam)
      const foundSubmission = submissions.find((s) => s.id === submissionId)
      if (foundSubmission) {
        setForm((prev) => ({ ...prev, submission_id: submissionId }))
      }
    }
  }, [submissionIdParam, submissions])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [eventData, submissionsData] = await Promise.all([
        eventApi.getEventById(eventId).catch(err => {
          throw new Error('获取活动数据失败: ' + (err.response?.data?.error || err.message))
        }),
        submissionApi.getSubmissionsByEvent(eventId).catch(() => {
          return [] // 提交数据失败不影响页面显示
        }),
      ])
      setEvent(eventData)
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : [])
      
      // 如果从作品列表进入且有submission参数，优先使用参数中的submission_id
      const validSubmissions = Array.isArray(submissionsData) ? submissionsData : []
      if (submissionIdParam) {
        const submissionId = parseInt(submissionIdParam)
        if (validSubmissions.find((s) => s.id === submissionId)) {
          setForm((prev) => ({ ...prev, submission_id: submissionId }))
        } else if (validSubmissions.length > 0) {
          setForm((prev) => ({ ...prev, submission_id: validSubmissions[0].id }))
        }
      } else if (validSubmissions.length > 0 && !form.submission_id) {
        setForm((prev) => ({ ...prev, submission_id: validSubmissions[0].id }))
      }
    } catch (err) {
      setError(err.message || '加载数据失败，请刷新页面重试')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // 当钱包地址变化时，自动更新表单中的投票地址
  useEffect(() => {
    if (account) {
      setForm((prev) => ({ ...prev, voter_address: account }))
    }
  }, [account])

  const handleVoteSubmit = async (event) => {
    event.preventDefault()
    if (!form.submission_id) {
      alert('请选择作品')
      return
    }
    if (!account) {
      alert('请先连接钱包')
      return
    }
    if (!form.voter_address) {
      alert('请输入投票地址')
      return
    }
    // 验证钱包地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(form.voter_address)) {
      alert('请输入有效的钱包地址（0x开头的42位地址）')
      return
    }
    
    // 校验投票地址是否已签到
    try {
      const checkIn = await checkinApi.getUserCheckIn(eventId, form.voter_address)
      if (!checkIn || !checkIn.id) {
        alert('只有签到通过的参赛者才能投票，请先完成签到')
        return
      }
    } catch (err) {
      // 如果API返回404或找不到记录，说明未签到
      if (err.response?.status === 404 || err.response?.status === 400) {
        alert('只有签到通过的参赛者才能投票，请先完成签到')
        return
      }
      // 其他错误也提示
      alert('验证签到状态失败: ' + (err.response?.data?.error || err.message))
      return
    }
    
    const payload = {
      event_id: Number(eventId),
      submission_id: Number(form.submission_id),
      voter_address: form.voter_address,
      voter_type: 'public', // 从作品列表进入的投票默认为公众投票
      reason: form.reason || undefined,
      signature: form.signature || undefined,
      offchain_proof: form.offchain_proof || undefined,
    }
    try {
      setProcessingVote(true)
      await voteApi.castVote(payload)
      alert('投票成功')
      setForm((prev) => ({ ...defaultForm, submission_id: prev.submission_id, voter_address: account || '' }))
      await loadData()
    } catch (err) {
      alert('投票失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setProcessingVote(false)
    }
  }


  const votingWindow = useMemo(() => {
    if (!event) return '-'
    const { voting_start_time, voting_end_time } = event
    if (!voting_start_time && !voting_end_time) return '-'
    const format = (value) => (value ? new Date(value).toLocaleString('zh-CN') : '未设置')
    return `${format(voting_start_time)} ～ ${format(voting_end_time)}`
  }, [event])

  // 确保至少显示一些内容，即使数据加载失败
  if (loading) {
    return (
      <div className="voting-panel" style={{ minHeight: '400px', padding: '20px' }}>
        <div className="loading" style={{ padding: '40px', textAlign: 'center', fontSize: '16px' }}>
          加载投票数据中...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="voting-panel" style={{ minHeight: '400px', padding: '20px' }}>
        <div className="error-message" style={{ padding: '40px', textAlign: 'center' }}>
          <h2>加载失败</h2>
          <p style={{ color: '#dc3545', margin: '20px 0' }}>{error}</p>
          <button onClick={() => loadData()} className="btn btn-primary" style={{ marginTop: '20px' }}>
            重试
          </button>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="voting-panel" style={{ minHeight: '400px', padding: '20px' }}>
        <div className="error-message" style={{ padding: '40px', textAlign: 'center' }}>
          <h2>活动不存在</h2>
          <p style={{ margin: '20px 0' }}>无法找到ID为 {eventId} 的活动</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            返回活动列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="voting-panel" style={{ minHeight: '400px', padding: '20px' }}>
      <BackToEventDetail />
      <div className="panel-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600' }}>投票面板</h1>
          <p className="subtitle" style={{ margin: 0 }}>
            活动：{event?.name || '未知活动'} · 当前阶段：{event?.current_stage || '未知'}
          </p>
        </div>
      </div>

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
        <h2>提交投票</h2>
        <form onSubmit={handleVoteSubmit} className="form-vertical">
          <label>
            作品
            <input
              type="text"
              value={
                form.submission_id && Array.isArray(submissions) && submissions.length > 0
                  ? (() => {
                      const submission = submissions.find((s) => s.id === Number(form.submission_id))
                      return submission ? `${submission.title} (#${submission.id})` : ''
                    })()
                  : '暂无作品'
              }
              readOnly
              style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
            />
          </label>

          <label>
            投票地址 *
            <input
              name="voter_address"
              placeholder="0x..."
              value={form.voter_address}
              onChange={handleFormChange}
              required
            />
            <p className="hint" style={{ marginTop: '5px', fontSize: '0.9em', color: '#666' }}>
              每个钱包地址只能投一票。连接钱包后地址将自动填入，也可手动编辑。
            </p>
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
    </div>
  )
}

export default VotingPanel



