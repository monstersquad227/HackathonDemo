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
      { rank: 1, name: '一等奖', description: '', amount: '' },
      { rank: 2, name: '二等奖', description: '', amount: '' },
      { rank: 3, name: '三等奖', description: '', amount: '' },
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
        { rank: prev.prizes.length + 1, name: '', description: '', amount: '' },
      ],
    }))
  }

  const removePrize = (index) => {
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

    try {
      // Convert date strings to ISO format
      const submitData = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        registration_start_time: formData.registration_start_time
          ? new Date(formData.registration_start_time).toISOString()
          : null,
        registration_end_time: formData.registration_end_time
          ? new Date(formData.registration_end_time).toISOString()
          : null,
        checkin_start_time: formData.checkin_start_time
          ? new Date(formData.checkin_start_time).toISOString()
          : null,
        checkin_end_time: formData.checkin_end_time
          ? new Date(formData.checkin_end_time).toISOString()
          : null,
        submission_start_time: formData.submission_start_time
          ? new Date(formData.submission_start_time).toISOString()
          : null,
        submission_end_time: formData.submission_end_time
          ? new Date(formData.submission_end_time).toISOString()
          : null,
        voting_start_time: formData.voting_start_time
          ? new Date(formData.voting_start_time).toISOString()
          : null,
        voting_end_time: formData.voting_end_time
          ? new Date(formData.voting_end_time).toISOString()
          : null,
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
                  label="活动描述"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  fullWidth
                />
                <TextField
                  label="活动地点"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  fullWidth
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="开始时间 *"
                      type="datetime-local"
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
                      type="datetime-local"
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
                    label="报名开始时间"
                    type="datetime-local"
                    name="registration_start_time"
                    value={formData.registration_start_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="报名结束时间"
                    type="datetime-local"
                    name="registration_end_time"
                    value={formData.registration_end_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="签到开始时间"
                    type="datetime-local"
                    name="checkin_start_time"
                    value={formData.checkin_start_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="签到结束时间"
                    type="datetime-local"
                    name="checkin_end_time"
                    value={formData.checkin_end_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="提交开始时间"
                    type="datetime-local"
                    name="submission_start_time"
                    value={formData.submission_start_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="提交结束时间"
                    type="datetime-local"
                    name="submission_end_time"
                    value={formData.submission_end_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="投票开始时间"
                    type="datetime-local"
                    name="voting_start_time"
                    value={formData.voting_start_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="投票结束时间"
                    type="datetime-local"
                    name="voting_end_time"
                    value={formData.voting_end_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
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
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="排名"
                          type="number"
                          value={prize.rank}
                          onChange={(e) =>
                            handlePrizeChange(index, 'rank', parseInt(e.target.value))
                          }
                          inputProps={{ min: 1 }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="奖项名称"
                          value={prize.name}
                          onChange={(e) =>
                            handlePrizeChange(index, 'name', e.target.value)
                          }
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="奖金金额"
                          value={prize.amount}
                          onChange={(e) =>
                            handlePrizeChange(index, 'amount', e.target.value)
                          }
                          placeholder="例如: 1000 USDC"
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

