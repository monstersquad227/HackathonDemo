import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ethers } from 'ethers'
import { submissionApi } from '../api/submissionApi'
import './SubmissionForm.css'

const SubmissionForm = () => {
  const { eventId } = useParams()
  const [formData, setFormData] = useState({
    team_id: '',
    title: '',
    description: '',
    github_repo: '',
    demo_url: '',
    documentation: '',
    storage_url: '',
  })
  const [files, setFiles] = useState([
    { file_name: '', file_type: '', url: '', hash: '' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (index, field, value) => {
    const newFiles = [...files]
    newFiles[index][field] = value
    setFiles(newFiles)
  }

  const addFile = () => {
    setFiles((prev) => [...prev, { file_name: '', file_type: '', url: '', hash: '' }])
  }

  const removeFile = (index) => {
    if (files.length === 1) return
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装 MetaMask 钱包')
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setWalletAddress(address)
      setError(null)
    } catch (err) {
      setError('连接钱包失败: ' + err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!walletAddress) {
      await connectWallet()
      if (!walletAddress) return
    }

    try {
      setSubmitting(true)
      setError(null)

      const payload = {
        event_id: parseInt(eventId),
        team_id: parseInt(formData.team_id),
        title: formData.title,
        description: formData.description,
        github_repo: formData.github_repo,
        demo_url: formData.demo_url,
        documentation: formData.documentation,
        storage_url: formData.storage_url,
        submitted_by: walletAddress,
        files: files.filter(
          (file) => file.file_name || file.url || file.hash
        ),
      }

      await submissionApi.createSubmission(payload)
      setSuccess(true)
      setFormData({
        team_id: '',
        title: '',
        description: '',
        github_repo: '',
        demo_url: '',
        documentation: '',
        storage_url: '',
      })
      setFiles([{ file_name: '', file_type: '', url: '', hash: '' }])
    } catch (err) {
      setError('提交失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="submission-form-page">
      <h1>提交作品</h1>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">提交成功，等待审核</div>}

      <div className="card">
        <form onSubmit={handleSubmit} className="submission-form">
          <div className="form-group">
            <label>队伍 ID *</label>
            <input
              type="number"
              name="team_id"
              value={formData.team_id}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>作品标题 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>作品描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />
          </div>
          <div className="form-group">
            <label>GitHub 仓库链接</label>
            <input
              type="url"
              name="github_repo"
              value={formData.github_repo}
              onChange={handleChange}
              placeholder="https://github.com/..."
            />
          </div>
          <div className="form-group">
            <label>Demo 链接</label>
            <input
              type="url"
              name="demo_url"
              value={formData.demo_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label>文档链接</label>
            <input
              type="url"
              name="documentation"
              value={formData.documentation}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label>存储链接（IPFS / Arweave）</label>
            <input
              type="url"
              name="storage_url"
              value={formData.storage_url}
              onChange={handleChange}
              placeholder="ipfs://..."
            />
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>附件信息</h3>
              <button type="button" onClick={addFile} className="btn btn-secondary">
                添加附件
              </button>
            </div>
            {files.map((file, index) => (
              <div key={index} className="file-row">
                <input
                  type="text"
                  placeholder="文件名"
                  value={file.file_name}
                  onChange={(e) => handleFileChange(index, 'file_name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="类型"
                  value={file.file_type}
                  onChange={(e) => handleFileChange(index, 'file_type', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="URL (ipfs://...)"
                  value={file.url}
                  onChange={(e) => handleFileChange(index, 'url', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Hash"
                  value={file.hash}
                  onChange={(e) => handleFileChange(index, 'hash', e.target.value)}
                />
                {files.length > 1 && (
                  <button type="button" onClick={() => removeFile(index)} className="btn btn-danger btn-sm">
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '提交中...' : '提交作品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubmissionForm

