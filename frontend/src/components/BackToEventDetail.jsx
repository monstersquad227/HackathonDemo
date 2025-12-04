import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '@mui/material/Button'

/**
 * 返回活动详情按钮组件
 * 统一所有活动详情子页面的返回按钮样式和行为
 */
const BackToEventDetail = ({ eventId: propEventId, text = '← 返回活动详情', sx = { mb: 2 } }) => {
  const navigate = useNavigate()
  const { eventId: paramEventId } = useParams()
  
  // 优先使用传入的 eventId，否则使用路由参数中的 eventId
  const targetEventId = propEventId || paramEventId

  const handleClick = () => {
    if (targetEventId) {
      navigate(`/events/${targetEventId}`)
    } else {
      navigate('/')
    }
  }

  return (
    <Button
      onClick={handleClick}
      sx={{
        alignSelf: 'flex-start',
        ...sx,
      }}
    >
      {text}
    </Button>
  )
}

export default BackToEventDetail

