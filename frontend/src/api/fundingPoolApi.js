import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const fundingPoolApi = {
  // Get all funding pools
  getAllFundingPools: async () => {
    const response = await api.get('/funding-pools')
    return response.data
  },

  // Get funding pool by ID
  getFundingPoolById: async (id) => {
    const response = await api.get(`/funding-pools/${id}`)
    return response.data
  },

  // Get funding pool by event ID
  getFundingPoolByEvent: async (eventId) => {
    const response = await api.get(`/funding-pools/event/${eventId}`)
    return response.data
  },

  // Create new funding pool
  createFundingPool: async (poolData) => {
    const response = await api.post('/funding-pools', poolData)
    return response.data
  },

  // Update funding pool
  updateFundingPool: async (id, poolData) => {
    const response = await api.put(`/funding-pools/${id}`, poolData)
    return response.data
  },

  // Set locked until
  setLockedUntil: async (eventId, lockedUntil) => {
    const response = await api.patch(`/funding-pools/event/${eventId}/lock`, {
      locked_until: lockedUntil,
    })
    return response.data
  },

  // Mark as distributed
  markAsDistributed: async (eventId) => {
    const response = await api.patch(`/funding-pools/event/${eventId}/distribute`)
    return response.data
  },
}

export default fundingPoolApi

