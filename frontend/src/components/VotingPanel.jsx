import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import { submissionApi } from '../api/submissionApi'
import { voteApi } from '../api/voteApi'
import { checkinApi } from '../api/checkinApi'
import { useWallet } from '../contexts/WalletContext'
import BackToEventDetail from './BackToEventDetail'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'

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

  const selectedSubmission = submissions.find((s) => s.id === Number(form.submission_id))

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            加载失败
          </Typography>
          <Typography>{error}</Typography>
        </Alert>
        <Button variant="contained" onClick={() => loadData()} sx={{ textTransform: 'none' }}>
          重试
        </Button>
      </Box>
    )
  }

  if (!event) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            活动不存在
          </Typography>
          <Typography>无法找到ID为 {eventId} 的活动</Typography>
        </Alert>
        <Button 
          variant="contained" 
          component={Link} 
          to="/" 
          sx={{ textTransform: 'none' }}
        >
          返回活动列表
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <BackToEventDetail />
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={600} sx={{ mb: 1 }}>
          投票面板
        </Typography>
        <Typography variant="body2" color="text.secondary">
          活动：{event?.name || '未知活动'} · 当前阶段：{event?.current_stage || '未知'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              投票窗口
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  投票时间
                </Typography>
                <Typography variant="body1">
                  {votingWindow}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  投票设置
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    允许赞助商投票：{event?.allow_sponsor_voting ? '是' : '否'}
                  </Typography>
                  <Typography variant="body2">
                    允许公众投票：{event?.allow_public_voting ? '是' : '否'}
                  </Typography>
                </Stack>
              </Box>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                公众默认每作品 1 票、每场最多 3 票，评委/赞助商凭权重自动计分。
              </Alert>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              提交投票
            </Typography>
            <Box component="form" onSubmit={handleVoteSubmit}>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>作品</InputLabel>
                  <Select
                    name="submission_id"
                    value={form.submission_id}
                    onChange={handleFormChange}
                    label="作品"
                    required
                  >
                    {submissions.map((submission) => (
                      <MenuItem key={submission.id} value={submission.id}>
                        {submission.title} (#{submission.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  name="voter_address"
                  label="投票地址 *"
                  placeholder="0x..."
                  value={form.voter_address}
                  onChange={handleFormChange}
                  required
                  fullWidth
                  helperText="每个钱包地址只能投一票。连接钱包后地址将自动填入，也可手动编辑。"
                />

                <TextField
                  name="reason"
                  label="投票理由（可选）"
                  value={form.reason}
                  onChange={handleFormChange}
                  multiline
                  rows={3}
                  fullWidth
                />

                <TextField
                  name="signature"
                  label="签名（可选）"
                  placeholder="0x..."
                  value={form.signature}
                  onChange={handleFormChange}
                  fullWidth
                />

                <TextField
                  name="offchain_proof"
                  label="线下证明 / NFT 证据（可选）"
                  placeholder="token 或截图链接"
                  value={form.offchain_proof}
                  onChange={handleFormChange}
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={processingVote}
                  fullWidth
                  sx={{ textTransform: 'none', py: 1.5 }}
                >
                  {processingVote ? '提交中...' : '提交投票'}
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default VotingPanel
