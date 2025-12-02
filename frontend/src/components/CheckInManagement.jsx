import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { checkinApi } from '../api/checkinApi'
import './CheckInManagement.css'

const CheckInManagement = () => {
  const { eventId } = useParams()
  const [checkIns, setCheckIns] = useState([])
  const [checkInCount, setCheckInCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [showQRCode, setShowQRCode] = useState(false)

  useEffect(() => {
    loadData()
  }, [eventId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [checkInsData, countData] = await Promise.all([
        checkinApi.getCheckInsByEvent(eventId),
        checkinApi.getCheckInCount(eventId),
      ])
      setCheckIns(checkInsData)
      setCheckInCount(countData.count || 0)
      setError(null)
    } catch (err) {
      setError('加载签到数据失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQRCode = async () => {
    try {
      const qrData = await checkinApi.generateQRCode(eventId)
      setQrCode(qrData)
      setShowQRCode(true)
    } catch (err) {
      alert('生成二维码失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  }

  const exportToCSV = () => {
    if (checkIns.length === 0) {
      alert('没有签到记录可导出')
      return
    }

    const headers = ['用户地址', '队伍', '签到时间', 'IP地址', '设备信息', '交易哈希']
    const rows = checkIns.map((checkIn) => [
      checkIn.user_address,
      checkIn.team?.name || '-',
      formatDate(checkIn.check_in_time),
      checkIn.ip_address || '-',
      checkIn.device_info || '-',
      checkIn.tx_hash || '-',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `check-ins-event-${eventId}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="checkin-management">
      <div className="page-header">
        <h1>签到管理</h1>
        <div className="header-actions">
          <button onClick={handleGenerateQRCode} className="btn btn-primary">
            生成签到二维码
          </button>
          <button onClick={exportToCSV} className="btn btn-secondary">
            导出签到记录
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card stats-card">
        <h2>签到统计</h2>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">总签到人数</span>
            <span className="stat-value">{checkInCount}</span>
          </div>
        </div>
      </div>

      {showQRCode && qrCode && (
        <div className="card qrcode-card">
          <h2>签到二维码</h2>
          <div className="qrcode-content">
            <div className="qrcode-message">
              <p>
                <strong>活动ID:</strong> {qrCode.event_id}
              </p>
              <p>
                <strong>签名消息:</strong>
              </p>
              <pre className="message-text">{qrCode.message}</pre>
              <p>
                <strong>有效期至:</strong> {new Date(qrCode.expires_at).toLocaleString('zh-CN')}
              </p>
            </div>
            <div className="qrcode-instructions">
              <h3>使用说明</h3>
              <ol>
                <li>用户扫描二维码获取签名消息</li>
                <li>使用钱包对消息进行签名</li>
                <li>提交签名完成签到</li>
              </ol>
            </div>
          </div>
          <button onClick={() => setShowQRCode(false)} className="btn btn-secondary">
            关闭
          </button>
        </div>
      )}

      <div className="card">
        <h2>签到记录 ({checkIns.length})</h2>
        {checkIns.length === 0 ? (
          <div className="empty-state">暂无签到记录</div>
        ) : (
          <div className="checkins-list">
            <table className="checkins-table">
              <thead>
                <tr>
                  <th>用户地址</th>
                  <th>队伍</th>
                  <th>签到时间</th>
                  <th>IP地址</th>
                  <th>设备信息</th>
                  <th>交易哈希</th>
                </tr>
              </thead>
              <tbody>
                {checkIns.map((checkIn) => (
                  <tr key={checkIn.id}>
                    <td className="address-cell">
                      {checkIn.user_address?.slice(0, 10)}...
                    </td>
                    <td>{checkIn.team?.name || '-'}</td>
                    <td>{formatDate(checkIn.check_in_time)}</td>
                    <td>{checkIn.ip_address || '-'}</td>
                    <td>{checkIn.device_info || '-'}</td>
                    <td>
                      {checkIn.tx_hash ? (
                        <a
                          href={`https://etherscan.io/tx/${checkIn.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          {checkIn.tx_hash?.slice(0, 10)}...
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckInManagement

