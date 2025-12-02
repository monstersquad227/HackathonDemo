import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ethers } from 'ethers'
import { checkinApi } from '../api/checkinApi'
import './CheckIn.css'

const CheckIn = () => {
  const { eventId } = useParams()
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [userAddress, setUserAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [checkInStatus, setCheckInStatus] = useState(null)

  useEffect(() => {
    // Check if already checked in
    checkCheckInStatus()
  }, [eventId])

  const checkCheckInStatus = async () => {
    if (!window.ethereum) {
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setUserAddress(address)

      const checkIn = await checkinApi.getUserCheckIn(eventId, address)
      setCheckInStatus(checkIn)
    } catch (err) {
      // User not checked in yet
      setCheckInStatus(null)
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装MetaMask钱包')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setUserAddress(address)
      setError(null)
    } catch (err) {
      setError('连接钱包失败: ' + err.message)
    }
  }

  const scanQRCode = () => {
    // In a real implementation, this would use a QR code scanner
    // For now, we'll prompt user to enter the message manually
    const qrMessage = prompt('请扫描二维码或粘贴签名消息:')
    if (qrMessage) {
      setMessage(qrMessage)
    }
  }

  const signMessage = async () => {
    if (!window.ethereum) {
      alert('请安装MetaMask钱包')
      return
    }

    if (!message) {
      alert('请先扫描二维码获取签名消息')
      return
    }

    if (!userAddress) {
      await connectWallet()
      return
    }

    try {
      setLoading(true)
      setError(null)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Sign the message
      const sig = await signer.signMessage(message)
      setSignature(sig)

      // Get device info
      const deviceInfo = `${navigator.userAgent} - ${navigator.platform}`

      // Submit check-in
      const checkIn = await checkinApi.checkIn({
        event_id: parseInt(eventId),
        user_address: userAddress,
        signature: sig,
        message: message,
        ip_address: '', // Will be set by backend
        device_info: deviceInfo,
      })

      setSuccess(true)
      setCheckInStatus(checkIn)
    } catch (err) {
      if (err.code === 4001) {
        setError('用户拒绝了签名请求')
      } else {
        setError('签到失败: ' + (err.response?.data?.error || err.message))
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  }

  if (checkInStatus) {
    return (
      <div className="checkin-page">
        <div className="card success-card">
          <h1>✓ 签到成功</h1>
          <div className="checkin-info">
            <p>
              <strong>签到时间:</strong> {formatDate(checkInStatus.check_in_time)}
            </p>
            {checkInStatus.tx_hash && (
              <p>
                <strong>交易哈希:</strong>{' '}
                <a
                  href={`https://etherscan.io/tx/${checkInStatus.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {checkInStatus.tx_hash?.slice(0, 10)}...
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkin-page">
      <h1>活动签到</h1>
      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">签到成功！</div>
      )}

      <div className="card">
        <h2>签到步骤</h2>
        <ol className="steps-list">
          <li>连接钱包</li>
          <li>扫描二维码获取签名消息</li>
          <li>对消息进行签名</li>
          <li>提交签到</li>
        </ol>
      </div>

      <div className="card">
        <h2>签到操作</h2>
        {!userAddress ? (
          <button onClick={connectWallet} className="btn btn-primary btn-large">
            连接钱包
          </button>
        ) : (
          <div className="wallet-connected">
            <p>
              <strong>已连接:</strong> {userAddress?.slice(0, 10)}...
            </p>
          </div>
        )}

        <div className="form-group">
          <label>签名消息</label>
          <div className="message-input-group">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="请扫描二维码获取签名消息"
              rows="4"
            />
            <button onClick={scanQRCode} className="btn btn-secondary">
              扫描二维码
            </button>
          </div>
        </div>

        {signature && (
          <div className="form-group">
            <label>签名结果</label>
            <input type="text" value={signature} readOnly className="signature-input" />
          </div>
        )}

        <button
          onClick={signMessage}
          disabled={loading || !message || !userAddress}
          className="btn btn-primary btn-large"
        >
          {loading ? '处理中...' : '确认签到'}
        </button>
      </div>
    </div>
  )
}

export default CheckIn

