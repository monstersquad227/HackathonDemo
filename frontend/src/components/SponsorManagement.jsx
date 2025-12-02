import React, { useState, useEffect } from 'react'
import { sponsorApi } from '../api/sponsorApi'
import './SponsorManagement.css'

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

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="sponsor-management">
      <div className="page-header">
        <h1>赞助商管理</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? '取消' : '创建赞助商'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="card create-form">
          <h2>创建赞助商</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>名称 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Logo URL</label>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>网站 URL</label>
              <input
                type="url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>钱包地址 *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="0x..."
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                创建
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {sponsors.length === 0 ? (
        <div className="empty-state">
          <p>暂无赞助商</p>
        </div>
      ) : (
        <div className="sponsor-list">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="sponsor-card">
              {sponsor.logo_url && (
                <img src={sponsor.logo_url} alt={sponsor.name} className="sponsor-logo" />
              )}
              <h3>{sponsor.name}</h3>
              <p className="sponsor-description">{sponsor.description}</p>
              <div className="sponsor-info">
                <p>
                  <strong>地址:</strong> {sponsor.address?.slice(0, 10)}...
                </p>
                {sponsor.website_url && (
                  <p>
                    <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer">
                      访问网站
                    </a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SponsorManagement

