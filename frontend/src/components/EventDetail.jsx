import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

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

  const getStageColor = (stage) => {
    const colorMap = {
      registration: 'info',
      checkin: 'warning',
      submission: 'success',
      voting: 'primary',
      awards: 'secondary',
      ended: 'default',
    }
    return colorMap[stage] || 'default'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !event) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error || '活动不存在'}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/')}
          startIcon={<ArrowBackIcon />}
        >
          返回列表
        </Button>
      </Box>
    )
  }

  const currentStage = getCurrentStage(event)

  return (
    <Box>
      {/* 头部 */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="text"
          onClick={() => navigate('/')}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          返回列表
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" component="h1" fontWeight={600} sx={{ flex: 1, minWidth: 200 }}>
            {event.name}
          </Typography>
          <Chip
            label={getStageName(currentStage)}
            color={getStageColor(currentStage)}
            sx={{ fontWeight: 500, fontSize: '0.875rem' }}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 基本信息 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              基本信息
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  活动描述
                </Typography>
                <Typography variant="body1">
                  {event.description || '-'}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  活动地点
                </Typography>
                <Typography variant="body1">
                  {event.location || '-'}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  开始时间
                </Typography>
                <Typography variant="body1">
                  {formatDate(event.start_time)}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  结束时间
                </Typography>
                <Typography variant="body1">
                  {formatDate(event.end_time)}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  主办方地址
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {event.organizer_address}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  链上状态
                </Typography>
                <Chip
                  label={event.on_chain ? '已上链' : '未上链'}
                  color={event.on_chain ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              {event.contract_address && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      合约地址
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      {event.contract_address}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* 阶段时间 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              阶段时间
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  报名时间
                </Typography>
                <Typography variant="body2">
                  {formatDate(event.registration_start_time)} - {formatDate(event.registration_end_time)}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  签到时间
                </Typography>
                <Typography variant="body2">
                  {formatDate(event.checkin_start_time)} - {formatDate(event.checkin_end_time)}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  提交时间
                </Typography>
                <Typography variant="body2">
                  {formatDate(event.submission_start_time)} - {formatDate(event.submission_end_time)}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  投票时间
                </Typography>
                <Typography variant="body2">
                  {formatDate(event.voting_start_time)} - {formatDate(event.voting_end_time)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* 投票设置 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              投票设置
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">允许赞助商投票</Typography>
                <Chip
                  label={event.allow_sponsor_voting ? '是' : '否'}
                  color={event.allow_sponsor_voting ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">允许公众投票</Typography>
                <Chip
                  label={event.allow_public_voting ? '是' : '否'}
                  color={event.allow_public_voting ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* 奖项配置 */}
        {event.prizes && event.prizes.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                奖项配置
              </Typography>
              <Grid container spacing={2}>
                {event.prizes.map((prize, index) => {
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
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          height: '100%',
                          borderLeft: '4px solid',
                          borderLeftColor: 'primary.main',
                          position: 'relative',
                        }}
                      >
                        {missingFields.length > 0 && (
                          <Alert 
                            severity="warning" 
                            sx={{ 
                              mb: 2,
                              py: 0.5,
                              fontSize: '0.8125rem',
                            }}
                          >
                            <strong>⚠️ 缺少必填字段:</strong> {missingFields.join('、')}
                          </Alert>
                        )}
                        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
                          {prize.name || (
                            <Typography component="span" color="error">
                              未设置奖项名称
                            </Typography>
                          )}
                          {prize.rank ? (
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              (第{prize.rank}名)
                            </Typography>
                          ) : (
                            <Typography component="span" variant="body2" color="error" sx={{ ml: 1 }}>
                              (未设置排名)
                            </Typography>
                          )}
                        </Typography>
                        <Stack spacing={1}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              个数:
                            </Typography>
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {(prize.count && prize.count > 0) ? prize.count : 1}个
                            </Typography>
                          </Box>
                          {prize.description && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {prize.description}
                              </Typography>
                            </Box>
                          )}
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              奖金:
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                ml: 1,
                                fontWeight: 600,
                                color: prize.amount ? 'success.main' : 'error.main',
                              }}
                            >
                              {prize.amount || '未设置'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  )
                })}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* 功能操作卡片 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              报名管理
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="outlined"
                component={Link}
                to={`/events/${event.id}/register`}
                sx={{ textTransform: 'none' }}
              >
                参与报名
              </Button>
              <Button
                variant="contained"
                component={Link}
                to={`/events/${event.id}/registrations`}
                sx={{ textTransform: 'none' }}
              >
                查看报名
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              签到管理
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                component={Link}
                to={`/events/${event.id}/check-in`}
                sx={{ textTransform: 'none' }}
              >
                管理签到
              </Button>
              <Button
                variant="outlined"
                component={Link}
                to={`/events/${event.id}/checkin`}
                sx={{ textTransform: 'none' }}
              >
                用户签到
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              队伍管理
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to={`/events/${event.id}/teams`}
              sx={{ textTransform: 'none' }}
            >
              管理队伍
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              作品提交
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                component={Link}
                to={`/events/${event.id}/submissions`}
                sx={{ textTransform: 'none' }}
              >
                管理提交
              </Button>
              <Button
                variant="outlined"
                component={Link}
                to={`/events/${event.id}/submit`}
                sx={{ textTransform: 'none' }}
              >
                提交作品
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              结果与排名
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to={`/events/${event.id}/results`}
              sx={{ textTransform: 'none' }}
            >
              查看结果
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default EventDetail
