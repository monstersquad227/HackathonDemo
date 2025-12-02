import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventApi } from '../api/eventApi'
import './EventCreate.css'

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
    <div className="event-create-page">
      <h1>创建新活动</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-section">
          <h2>基本信息</h2>
          <div className="form-group">
            <label>活动名称 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>活动描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>活动地点</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>开始时间 *</label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>结束时间 *</label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>主办方钱包地址 *</label>
            <input
              type="text"
              name="organizer_address"
              value={formData.organizer_address}
              onChange={handleChange}
              placeholder="0x..."
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h2>阶段时间设置</h2>
          <div className="form-row">
            <div className="form-group">
              <label>报名开始时间</label>
              <input
                type="datetime-local"
                name="registration_start_time"
                value={formData.registration_start_time}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>报名结束时间</label>
              <input
                type="datetime-local"
                name="registration_end_time"
                value={formData.registration_end_time}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>签到开始时间</label>
              <input
                type="datetime-local"
                name="checkin_start_time"
                value={formData.checkin_start_time}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>签到结束时间</label>
              <input
                type="datetime-local"
                name="checkin_end_time"
                value={formData.checkin_end_time}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>提交开始时间</label>
              <input
                type="datetime-local"
                name="submission_start_time"
                value={formData.submission_start_time}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>提交结束时间</label>
              <input
                type="datetime-local"
                name="submission_end_time"
                value={formData.submission_end_time}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>投票开始时间</label>
              <input
                type="datetime-local"
                name="voting_start_time"
                value={formData.voting_start_time}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>投票结束时间</label>
              <input
                type="datetime-local"
                name="voting_end_time"
                value={formData.voting_end_time}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>投票设置</h2>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="allow_sponsor_voting"
                checked={formData.allow_sponsor_voting}
                onChange={handleChange}
              />
              允许赞助商投票
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="allow_public_voting"
                checked={formData.allow_public_voting}
                onChange={handleChange}
              />
              允许公众投票
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="on_chain"
                checked={formData.on_chain}
                onChange={handleChange}
              />
              链上创建（需要连接钱包）
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>奖项配置</h2>
            <button type="button" onClick={addPrize} className="btn btn-secondary">
              添加奖项
            </button>
          </div>
          {formData.prizes.map((prize, index) => (
            <div key={index} className="prize-item">
              <div className="form-row">
                <div className="form-group">
                  <label>排名</label>
                  <input
                    type="number"
                    value={prize.rank}
                    onChange={(e) =>
                      handlePrizeChange(index, 'rank', parseInt(e.target.value))
                    }
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>奖项名称</label>
                  <input
                    type="text"
                    value={prize.name}
                    onChange={(e) =>
                      handlePrizeChange(index, 'name', e.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>奖金金额</label>
                  <input
                    type="text"
                    value={prize.amount}
                    onChange={(e) =>
                      handlePrizeChange(index, 'amount', e.target.value)
                    }
                    placeholder="例如: 1000 USDC"
                  />
                </div>
                {formData.prizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrize(index)}
                    className="btn btn-danger"
                  >
                    删除
                  </button>
                )}
              </div>
              <div className="form-group">
                <label>奖项描述</label>
                <textarea
                  value={prize.description}
                  onChange={(e) =>
                    handlePrizeChange(index, 'description', e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '创建中...' : '创建活动'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}

export default EventCreate

