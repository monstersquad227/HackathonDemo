import React, { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'

const WalletConnect = ({ showFullAddress = false }) => {
  const { account, loading, connectWallet, disconnectWallet } = useWallet()
  const [anchorEl, setAnchorEl] = useState(null)

  // 格式化地址显示
  const formatAddress = (address) => {
    if (!address) return ''
    if (showFullAddress) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setAnchorEl(null)
  }

  if (!account) {
    return (
      <Button
        variant="contained"
        color="primary"
        onClick={connectWallet}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} /> : <AccountCircleIcon />}
      >
        {loading ? '连接中...' : '连接钱包'}
      </Button>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleMenuOpen}
        startIcon={<AccountCircleIcon />}
        sx={{ minWidth: 'auto' }}
      >
        {formatAddress(account)}
      </Button>
      <Tooltip title="断开连接钱包">
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={handleDisconnect}
          startIcon={<LogoutIcon />}
          sx={{ minWidth: 'auto', px: 1.5 }}
        >
          断开
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {account}
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default WalletConnect

