import React, { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import './EventList.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'

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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          活动列表
        </Typography>
      </Box>

      {loading && <Typography>加载中...</Typography>}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {events.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
              <Typography>暂无活动</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {events.map((event) => (
                <Grid item xs={12} sm={6} md={4} key={event.id}>
                  <Card>
                    <CardActionArea component={RouterLink} to={`/events/${event.id}`}>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography variant="h6" noWrap>
                            {event.name}
                          </Typography>
                          <Chip
                            label={getStageName(event.current_stage)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1.5, minHeight: 40 }}
                        >
                          {event.description || '暂无描述'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>地点:</strong> {event.location || '-'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>开始时间:</strong> {formatDate(event.start_time)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>结束时间:</strong> {formatDate(event.end_time)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>主办方:</strong>{' '}
                          {event.organizer_address
                            ? `${event.organizer_address.slice(0, 10)}...`
                            : '-'}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  )
}

export default EventList

