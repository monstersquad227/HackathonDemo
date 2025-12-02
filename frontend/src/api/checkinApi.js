import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const checkinApi = {
  // Generate QR code for check-in
  generateQRCode: async (eventId) => {
    const response = await api.get(`/check-ins/event/${eventId}/qrcode`)
    return response.data
  },

  // Check in with signature
  checkIn: async (checkInData) => {
    const response = await api.post('/check-ins', checkInData)
    return response.data
  },

  // Get check-ins by event ID
  getCheckInsByEvent: async (eventId) => {
    const response = await api.get(`/check-ins/event/${eventId}`)
    return response.data
  },

  // Get check-in count for event
  getCheckInCount: async (eventId) => {
    const response = await api.get(`/check-ins/event/${eventId}/count`)
    return response.data
  },

  // Get user check-in for event
  getUserCheckIn: async (eventId, userAddress) => {
    const response = await api.get(`/check-ins/event/${eventId}/user/${userAddress}`)
    return response.data
  },

  // Get check-in by ID
  getCheckInById: async (id) => {
    const response = await api.get(`/check-ins/${id}`)
    return response.data
  },

  // Update transaction hash
  updateTxHash: async (id, txHash) => {
    const response = await api.patch(`/check-ins/${id}/tx`, { tx_hash: txHash })
    return response.data
  },
}

export default checkinApi

