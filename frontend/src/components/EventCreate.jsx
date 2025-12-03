import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import './EventCreate.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

const EventCreate = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    registration_start_time: '',
    registration_end_time: '',
    checkin_start_time: '',
    checkin_end_time: '',
    submission_start_time: '',
    submission_end_time: '',
    voting_start_time: '',
    voting_end_time: '',
    organizer_address: '',
    allow_sponsor_voting: false,
    allow_public_voting: false,
    on_chain: false,
    prizes: [
      { rank: 1, name: '一等奖', description: '', amount: '', count: 1 },
      { rank: 2, name: '二等奖', description: '', amount: '', count: 2 },
      { rank: 3, name: '三等奖', description: '', amount: '', count: 3 },
    ],
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handlePrizeChange = (index, field, value) => {
    const newPrizes = [...formData.prizes]
    newPrizes[index][field] = value
    setFormData((prev) => ({
      ...prev,
      prizes: newPrizes,
    }))
  }

  const addPrize = () => {
    setFormData((prev) => ({
      ...prev,
      prizes: [
        ...prev.prizes,
        { rank: prev.prizes.length + 1, name: '', description: '', amount: '', count: 1 },
      ],
    }))
  }

  // 中国主要城市列表
  const cities = [
    '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆',
    '天津', '苏州', '长沙', '郑州', '济南', '青岛', '大连', '厦门', '福州', '合肥',
    '石家庄', '太原', '沈阳', '长春', '哈尔滨', '南昌', '南宁', '海口', '昆明', '贵阳',
    '拉萨', '乌鲁木齐', '银川', '西宁', '其他'
  ]

  // 验证时间逻辑
  const validateTimes = () => {
    const errors = []
    
    // 验证基本时间
    if (formData.start_time && formData.end_time) {
      const startTime = new Date(formData.start_time)
      const endTime = new Date(formData.end_time)
      
      if (endTime <= startTime) {
        errors.push('结束时间必须晚于开始时间')
      }
    }

    // 验证各阶段时间
    const validateStageTime = (startTime, endTime, stageName) => {
      if (!startTime || !endTime) return
      
      const stageStart = new Date(startTime)
      const stageEnd = new Date(endTime)
      const eventStart = formData.start_time ? new Date(formData.start_time) : null
      const eventEnd = formData.end_time ? new Date(formData.end_time) : null
      
      if (stageEnd <= stageStart) {
        errors.push(`${stageName}结束时间必须晚于开始时间`)
      }
      
      if (eventStart && stageStart < eventStart) {
        errors.push(`${stageName}开始时间不能早于活动开始时间`)
      }
      
      if (eventEnd && stageEnd > eventEnd) {
        errors.push(`${stageName}结束时间不能晚于活动结束时间`)
      }
    }

    validateStageTime(
      formData.registration_start_time,
      formData.registration_end_time,
      '报名'
    )
    validateStageTime(
      formData.checkin_start_time,
      formData.checkin_end_time,
      '签到'
    )
    validateStageTime(
      formData.submission_start_time,
      formData.submission_end_time,
      '提交'
    )
    validateStageTime(
      formData.voting_start_time,
      formData.voting_end_time,
      '投票'
    )

    return errors
  }

  const removePrize = (index) => {
    // 至少保留一个奖项
    if (formData.prizes.length <= 1) {
      return
    }
    const newPrizes = formData.prizes.filter((_, i) => i !== index)
    setFormData((prev) => ({
      ...prev,
      prizes: newPrizes,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 验证奖项至少有一个
    if (!formData.prizes || formData.prizes.length === 0) {
      setError('奖项设置中至少要有一个排名')
      setLoading(false)
      return
    }

    // 验证奖项配置中的必填字段
    const prizeValidationErrors = []
    formData.prizes.forEach((prize, index) => {
      if (!prize.rank || prize.rank <= 0) {
        prizeValidationErrors.push(`第${index + 1}个奖项的排名为必填项`)
      }
      if (!prize.name || prize.name.trim() === '') {
        prizeValidationErrors.push(`第${index + 1}个奖项的奖项名称为必填项`)
      }
      if (!prize.count || prize.count <= 0) {
        prizeValidationErrors.push(`第${index + 1}个奖项的个数为必填项`)
      }
      if (!prize.amount || prize.amount.trim() === '') {
        prizeValidationErrors.push(`第${index + 1}个奖项的奖金金额为必填项`)
      }
    })
    
    if (prizeValidationErrors.length > 0) {
      setError(prizeValidationErrors.join('; '))
      setLoading(false)
      return
    }

    // 验证时间
    const validationErrors = validateTimes()
    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '))
      setLoading(false)
      return
    }

    try {
      // Convert datetime strings to ISO format
      const formatDateTimeToISO = (dateTimeString) => {
        if (!dateTimeString) return null
        return new Date(dateTimeString).toISOString()
      }

      const submitData = {
        ...formData,
        start_time: formatDateTimeToISO(formData.start_time),
        end_time: formatDateTimeToISO(formData.end_time),
        registration_start_time: formatDateTimeToISO(formData.registration_start_time),
        registration_end_time: formatDateTimeToISO(formData.registration_end_time),
        checkin_start_time: formatDateTimeToISO(formData.checkin_start_time),
        checkin_end_time: formatDateTimeToISO(formData.checkin_end_time),
        submission_start_time: formatDateTimeToISO(formData.submission_start_time),
        submission_end_time: formatDateTimeToISO(formData.submission_end_time),
        voting_start_time: formatDateTimeToISO(formData.voting_start_time),
        voting_end_time: formatDateTimeToISO(formData.voting_end_time),
      }

      const event = await eventApi.createEvent(submitData)
      navigate(`/events/${event.id}`)
    } catch (err) {
      setError('创建活动失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
        创建新活动
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                基本信息
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="活动名称 *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label="活动描述 *"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  required
                  fullWidth
                />
                <FormControl fullWidth required>
                  <InputLabel>活动地点（城市） *</InputLabel>
                  <Select
                    label="活动地点（城市） *"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  >
                    {cities.map((city) => (
                      <MenuItem key={city} value={city}>
                        {city}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="开始时间 *"
                      type="date"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="结束时间 *"
                      type="date"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      required
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <TextField
                  label="主办方钱包地址 *"
                  name="organizer_address"
                  value={formData.organizer_address}
                  onChange={handleChange}
                  placeholder="0x..."
                  required
                  fullWidth
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                阶段时间设置
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="报名开始时间 *"
                    type="datetime-local"
                    name="registration_start_time"
                    value={formData.registration_start_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="报名结束时间 *"
                    type="datetime-local"
                    name="registration_end_time"
                    value={formData.registration_end_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="签到开始时间 *"
                    type="datetime-local"
                    name="checkin_start_time"
                    value={formData.checkin_start_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="签到结束时间 *"
                    type="datetime-local"
                    name="checkin_end_time"
                    value={formData.checkin_end_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="提交开始时间 *"
                    type="datetime-local"
                    name="submission_start_time"
                    value={formData.submission_start_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="提交结束时间 *"
                    type="datetime-local"
                    name="submission_end_time"
                    value={formData.submission_end_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="投票开始时间 *"
                    type="datetime-local"
                    name="voting_start_time"
                    value={formData.voting_start_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="投票结束时间 *"
                    type="datetime-local"
                    name="voting_end_time"
                    value={formData.voting_end_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                投票设置
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="allow_sponsor_voting"
                      checked={formData.allow_sponsor_voting}
                      onChange={handleChange}
                    />
                  }
                  label="允许赞助商投票"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="allow_public_voting"
                      checked={formData.allow_public_voting}
                      onChange={handleChange}
                    />
                  }
                  label="允许公众投票"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="on_chain"
                      checked={formData.on_chain}
                      onChange={handleChange}
                    />
                  }
                  label="链上创建（需要连接钱包）"
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">奖项配置</Typography>
                <Button variant="outlined" onClick={addPrize}>
                  添加奖项
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {formData.prizes.map((prize, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <TextField
                          label="排名 *"
                          type="number"
                          value={prize.rank}
                          onChange={(e) =>
                            handlePrizeChange(index, 'rank', parseInt(e.target.value))
                          }
                          inputProps={{ min: 1 }}
                          required
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="奖项名称 *"
                          value={prize.name}
                          onChange={(e) =>
                            handlePrizeChange(index, 'name', e.target.value)
                          }
                          required
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          label="个数 *"
                          type="number"
                          value={prize.count || 1}
                          onChange={(e) =>
                            handlePrizeChange(index, 'count', parseInt(e.target.value) || 1)
                          }
                          inputProps={{ min: 1 }}
                          required
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="奖金金额 *"
                          value={prize.amount}
                          onChange={(e) =>
                            handlePrizeChange(index, 'amount', e.target.value)
                          }
                          placeholder="例如: 1000 USDC"
                          required
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        {formData.prizes.length > 1 && (
                          <Button
                            color="error"
                            variant="text"
                            onClick={() => removePrize(index)}
                          >
                            删除
                          </Button>
                        )}
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="奖项描述"
                          value={prize.description}
                          onChange={(e) =>
                            handlePrizeChange(index, 'description', e.target.value)
                          }
                          multiline
                          rows={2}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? '创建中...' : '创建活动'}
              </Button>
              <Button variant="outlined" onClick={() => navigate('/')}>
                取消
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default EventCreate

