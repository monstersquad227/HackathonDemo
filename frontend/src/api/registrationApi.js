import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const registrationApi = {
  // Get registrations by event ID
  getRegistrationsByEvent: async (eventId) => {
    const response = await api.get(`/registrations/event/${eventId}`)
    return response.data
  },

  // Get registration by ID
  getRegistrationById: async (id) => {
    const response = await api.get(`/registrations/${id}`)
    return response.data
  },

  // Create new registration
  createRegistration: async (registrationData) => {
    const response = await api.post('/registrations', registrationData)
    return response.data
  },

  // Approve registration
  approveRegistration: async (id, organizerAddress) => {
    const response = await api.patch(`/registrations/${id}/approve`, {
      organizer_address: organizerAddress,
    })
    return response.data
  },

  // Reject registration
  rejectRegistration: async (id, organizerAddress) => {
    const response = await api.patch(`/registrations/${id}/reject`, {
      organizer_address: organizerAddress,
    })
    return response.data
  },

  // Update SBT status
  updateSBTStatus: async (id, tokenId, txHash) => {
    const response = await api.patch(`/registrations/${id}/sbt`, {
      token_id: tokenId,
      tx_hash: txHash,
    })
    return response.data
  },

  // Delete registration
  deleteRegistration: async (id) => {
    const response = await api.delete(`/registrations/${id}`)
    return response.data
  },
}

export default registrationApi

