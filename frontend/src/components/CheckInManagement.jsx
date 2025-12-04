import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { checkinApi } from '../api/checkinApi'
import BackToEventDetail from './BackToEventDetail'
import './CheckInManagement.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
const CheckInManagement = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [checkIns, setCheckIns] = useState([])
  const [checkInCount, setCheckInCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

    const headers = ['用户地址', '签到时间', 'IP地址', '设备信息', '交易哈希']
    const rows = checkIns.map((checkIn) => [
      checkIn.user_address,
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

  return (
    <Box>
      <BackToEventDetail />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          签到管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={exportToCSV}>
            导出签到记录
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          签到统计
        </Typography>
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              总签到人数
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {checkInCount}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          签到记录 ({checkIns.length})
        </Typography>
        {loading ? (
          <Typography>加载中...</Typography>
        ) : checkIns.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>暂无签到记录</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>用户地址</TableCell>
                  <TableCell>签到时间</TableCell>
                  <TableCell>IP地址</TableCell>
                  <TableCell>设备信息</TableCell>
                  <TableCell>交易哈希</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {checkIns.map((checkIn) => (
                  <TableRow key={checkIn.id}>
                    <TableCell>
                      {checkIn.user_address?.slice(0, 10)}...
                    </TableCell>
                    <TableCell>{formatDate(checkIn.check_in_time)}</TableCell>
                    <TableCell>{checkIn.ip_address || '-'}</TableCell>
                    <TableCell>{checkIn.device_info || '-'}</TableCell>
                    <TableCell>
                      {checkIn.tx_hash ? (
                        <a
                          href={`https://etherscan.io/tx/${checkIn.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {checkIn.tx_hash?.slice(0, 10)}...
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default CheckInManagement

