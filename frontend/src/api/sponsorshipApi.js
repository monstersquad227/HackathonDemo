import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const sponsorshipApi = {
  // Get sponsorships by event ID
  getSponsorshipsByEvent: async (eventId) => {
    const response = await api.get(`/sponsorships/event/${eventId}`)
    return response.data
  },

  // Get sponsorship by ID
  getSponsorshipById: async (id) => {
    const response = await api.get(`/sponsorships/${id}`)
    return response.data
  },

  // Create new sponsorship
  createSponsorship: async (sponsorshipData) => {
    const response = await api.post('/sponsorships', sponsorshipData)
    return response.data
  },

  // Approve sponsorship
  approveSponsorship: async (id, organizerAddress) => {
    const response = await api.patch(`/sponsorships/${id}/approve`, {
      organizer_address: organizerAddress,
    })
    return response.data
  },

  // Reject sponsorship
  rejectSponsorship: async (id, organizerAddress) => {
    const response = await api.patch(`/sponsorships/${id}/reject`, {
      organizer_address: organizerAddress,
    })
    return response.data
  },

  // Update deposit status
  updateDepositStatus: async (id, txHash) => {
    const response = await api.patch(`/sponsorships/${id}/deposit`, {
      tx_hash: txHash,
    })
    return response.data
  },
}

export default sponsorshipApi

