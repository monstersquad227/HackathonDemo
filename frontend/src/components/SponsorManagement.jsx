import React, { useState, useEffect } from 'react'
import { sponsorApi } from '../api/sponsorApi'
import './SponsorManagement.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Alert from '@mui/material/Alert'

const SponsorManagement = () => {
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    website_url: '',
    address: '',
  })

  useEffect(() => {
    loadSponsors()
  }, [])

  const loadSponsors = async () => {
    try {
      setLoading(true)
      const data = await sponsorApi.getAllSponsors()
      setSponsors(data)
      setError(null)
    } catch (err) {
      setError('加载赞助商列表失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await sponsorApi.createSponsor(formData)
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        logo_url: '',
        website_url: '',
        address: '',
      })
      loadSponsors()
    } catch (err) {
      alert('创建赞助商失败: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          赞助商管理
        </Typography>
        <Button variant="contained" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? '取消' : '创建赞助商'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showCreateForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            创建赞助商
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="名称 *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="描述"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Logo URL"
              type="url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="网站 URL"
              type="url"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="钱包地址 *"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="0x..."
              required
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1 }}>
              <Button type="submit" variant="contained">
                创建
              </Button>
              <Button variant="outlined" onClick={() => setShowCreateForm(false)}>
                取消
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {loading ? (
        <Typography>加载中...</Typography>
      ) : sponsors.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
          <Typography>暂无赞助商</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {sponsors.map((sponsor) => (
            <Grid item xs={12} sm={6} md={4} key={sponsor.id}>
              <Card>
                {sponsor.logo_url && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={sponsor.logo_url}
                    alt={sponsor.name}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom noWrap>
                    {sponsor.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5, minHeight: 40 }}
                  >
                    {sponsor.description || '暂无描述'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>地址:</strong>{' '}
                    {sponsor.address ? `${sponsor.address.slice(0, 10)}...` : '-'}
                  </Typography>
                  {sponsor.website_url && (
                    <Box sx={{ mt: 1 }}>
                      <Button
                        href={sponsor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                      >
                        访问网站
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default SponsorManagement

