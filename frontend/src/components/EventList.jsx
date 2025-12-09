import React, { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

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

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={600} sx={{ mb: 0.5 }}>
          活动列表
        </Typography>
        <Typography variant="body2" color="text.secondary">
          浏览所有可用的黑客松活动
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {events.length === 0 ? (
            <Box 
              sx={{ 
                py: 8, 
                textAlign: 'center', 
                color: 'text.secondary',
                bgcolor: 'background.paper',
                borderRadius: 2,
                px: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                暂无活动
              </Typography>
              <Typography variant="body2">
                还没有创建任何活动，请先创建一个新活动
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {events.map((event) => (
                <Grid item xs={12} sm={6} md={4} key={event.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardActionArea 
                      component={RouterLink} 
                      to={`/events/${event.id}`}
                      sx={{ 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                      }}
                    >
                      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                            gap: 1,
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              flex: 1,
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {event.name}
                          </Typography>
                          <Chip
                            label={getStageName(event.current_stage)}
                            size="small"
                            color={getStageColor(event.current_stage)}
                            sx={{ 
                              flexShrink: 0,
                              fontWeight: 500,
                            }}
                          />
                        </Box>
                        
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ 
                            mb: 2, 
                            minHeight: 40,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {event.description || '暂无描述'}
                        </Typography>
                        
                        <Stack spacing={1} sx={{ mt: 'auto' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                              地点:
                            </Typography>
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {event.location || '-'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                              开始:
                            </Typography>
                            <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8125rem' }}>
                              {formatDate(event.start_time)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                              结束:
                            </Typography>
                            <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8125rem' }}>
                              {formatDate(event.end_time)}
                            </Typography>
                          </Box>
                          {event.organizer_address && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                                主办方:
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  flex: 1,
                                  fontSize: '0.8125rem',
                                  fontFamily: 'monospace',
                                  color: 'text.secondary',
                                }}
                              >
                                {event.organizer_address.slice(0, 10)}...
                              </Typography>
                            </Box>
                          )}
                        </Stack>
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

