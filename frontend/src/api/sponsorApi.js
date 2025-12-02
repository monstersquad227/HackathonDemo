import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const sponsorApi = {
  // Get all sponsors
  getAllSponsors: async () => {
    const response = await api.get('/sponsors')
    return response.data
  },

  // Get sponsor by ID
  getSponsorById: async (id) => {
    const response = await api.get(`/sponsors/${id}`)
    return response.data
  },

  // Get sponsor by address
  getSponsorByAddress: async (address) => {
    const response = await api.get(`/sponsors/address/${address}`)
    return response.data
  },

  // Create new sponsor
  createSponsor: async (sponsorData) => {
    const response = await api.post('/sponsors', sponsorData)
    return response.data
  },

  // Update sponsor
  updateSponsor: async (id, sponsorData) => {
    const response = await api.put(`/sponsors/${id}`, sponsorData)
    return response.data
  },

  // Delete sponsor
  deleteSponsor: async (id) => {
    const response = await api.delete(`/sponsors/${id}`)
    return response.data
  },
}

export default sponsorApi

