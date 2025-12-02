import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { fundingPoolApi } from '../api/fundingPoolApi'
import { sponsorshipApi } from '../api/sponsorshipApi'
import './FundingPoolManagement.css'

const FundingPoolManagement = () => {
  const { eventId } = useParams()
  const [pool, setPool] = useState(null)
  const [sponsorships, setSponsorships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    contract_address: '',
  })
  const [lockForm, setLockForm] = useState({
    locked_until: '',
  })
  const [updatingPool, setUpdatingPool] = useState(false)

  useEffect(() => {
    loadData()
  }, [eventId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [poolData, sponsorshipsData] = await Promise.all([
        fundingPoolApi.getFundingPoolByEvent(eventId).catch(() => null),
        sponsorshipApi.getSponsorshipsByEvent(eventId),
      ])
      setPool(poolData)
      setSponsorships(sponsorshipsData)
      setError(null)
    } catch (err) {
      setError('加载数据失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePool = async (e) => {
    e.preventDefault()
    try {
      await fundingPoolApi.createFundingPool({
        event_id: parseInt(eventId),
        contract_address: formData.contract_address,
      })
      setShowCreateForm(false)
      loadData()
    } catch (err) {
      alert('创建奖金池失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleSetLockedUntil = async (e) => {
    e.preventDefault()
    if (!lockForm.locked_until) {
      alert('请先选择锁定时间')
      return
    }

    try {
      setUpdatingPool(true)
      const iso = new Date(lockForm.locked_until).toISOString()
      await fundingPoolApi.setLockedUntil(eventId, iso)
      await loadData()
    } catch (err) {
      alert('设置锁定时间失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setUpdatingPool(false)
    }
  }

  const handleMarkDistributed = async () => {
    if (!window.confirm('确定标记为“已发放”吗？请确保已在链上完成奖金发放。')) {
      return
    }
    try {
      setUpdatingPool(true)
      await fundingPoolApi.markAsDistributed(eventId)
      await loadData()
    } catch (err) {
      alert('标记发放状态失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setUpdatingPool(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      deposited: 'status-deposited',
    }
    return statusMap[status] || 'status-pending'
  }

  const getStatusName = (status) => {
    const statusMap = {
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
      deposited: '已存入',
    }
    return statusMap[status] || status
  }

  const getAssetTypeName = (type) => {
    const typeMap = {
      erc20: 'ERC20 代币',
      native: '原生资产',
      nft: 'NFT',
    }
    return typeMap[type] || type
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="funding-pool-management">
      <h1>奖金池管理</h1>
      {error && <div className="error-message">{error}</div>}

      {!pool && (
        <div className="card">
          <h2>创建奖金池</h2>
          {showCreateForm ? (
            <form onSubmit={handleCreatePool}>
              <div className="form-group">
                <label>合约地址 *</label>
                <input
                  type="text"
                  value={formData.contract_address}
                  onChange={(e) =>
                    setFormData({ contract_address: e.target.value })
                  }
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
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              创建奖金池
            </button>
          )}
        </div>
      )}

      {pool && (
        <div className="card">
          <h2>奖金池信息</h2>
          <div className="pool-info">
            <p>
              <strong>合约地址:</strong> {pool.contract_address}
            </p>
            <p>
              <strong>总金额:</strong> {pool.total_amount || '0'}
            </p>
            <p>
              <strong>锁定至:</strong>{' '}
              {pool.locked_until
                ? new Date(pool.locked_until).toLocaleString('zh-CN')
                : '未锁定'}
            </p>
            <p>
              <strong>已发放:</strong> {pool.distributed ? '是' : '否'}
            </p>
          </div>
          <div className="pool-actions">
            <form onSubmit={handleSetLockedUntil} className="lock-form">
              <label>
                锁定至时间
                <input
                  type="datetime-local"
                  value={lockForm.locked_until}
                  onChange={(e) =>
                    setLockForm({ locked_until: e.target.value })
                  }
                />
              </label>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={updatingPool}
              >
                {updatingPool ? '处理中...' : '设置锁定时间'}
              </button>
            </form>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleMarkDistributed}
              disabled={updatingPool || pool.distributed}
            >
              {pool.distributed ? '已标记为已发放' : '标记为已发放'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2>赞助记录</h2>
        {sponsorships.length === 0 ? (
          <div className="empty-state">暂无赞助记录</div>
        ) : (
          <div className="sponsorships-list">
            {sponsorships.map((sponsorship) => (
              <div key={sponsorship.id} className="sponsorship-card">
                <div className="sponsorship-header">
                  <h3>{sponsorship.sponsor?.name || '未知赞助商'}</h3>
                  <span
                    className={`status-badge ${getStatusBadgeClass(
                      sponsorship.status
                    )}`}
                  >
                    {getStatusName(sponsorship.status)}
                  </span>
                </div>
                <div className="sponsorship-info">
                  <p>
                    <strong>资产类型:</strong> {getAssetTypeName(sponsorship.asset_type)}
                  </p>
                  {sponsorship.token_address && (
                    <p>
                      <strong>代币地址:</strong> {sponsorship.token_address?.slice(0, 10)}...
                    </p>
                  )}
                  <p>
                    <strong>金额:</strong> {sponsorship.amount_display || sponsorship.amount}
                  </p>
                  {sponsorship.voting_weight && (
                    <p>
                      <strong>投票权重:</strong> {sponsorship.voting_weight}
                    </p>
                  )}
                  {sponsorship.benefits && (
                    <p>
                      <strong>权益:</strong> {sponsorship.benefits}
                    </p>
                  )}
                  {sponsorship.deposit_tx_hash && (
                    <p>
                      <strong>交易哈希:</strong>{' '}
                      <a
                        href={`https://etherscan.io/tx/${sponsorship.deposit_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {sponsorship.deposit_tx_hash?.slice(0, 10)}...
                      </a>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FundingPoolManagement

