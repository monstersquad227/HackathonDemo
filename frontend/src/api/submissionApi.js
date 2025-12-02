import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const submissionApi = {
  createSubmission: async (data) => {
    const response = await api.post('/submissions', data)
    return response.data
  },

  getSubmissionById: async (id) => {
    const response = await api.get(`/submissions/${id}`)
    return response.data
  },

  getSubmissionsByEvent: async (eventId) => {
    const response = await api.get(`/submissions/event/${eventId}`)
    return response.data
  },

  getAllSubmissions: async () => {
    const response = await api.get('/submissions')
    return response.data
  },

  updateSubmission: async (id, data) => {
    const response = await api.put(`/submissions/${id}`, data)
    return response.data
  },

  approveSubmission: async (id, organizerAddress, comment) => {
    const response = await api.patch(`/submissions/${id}/approve`, {
      organizer_address: organizerAddress,
      comment,
    })
    return response.data
  },

  rejectSubmission: async (id, organizerAddress, comment) => {
    const response = await api.patch(`/submissions/${id}/reject`, {
      organizer_address: organizerAddress,
      comment,
    })
    return response.data
  },

  deleteSubmission: async (id) => {
    const response = await api.delete(`/submissions/${id}`)
    return response.data
  },
}

export default submissionApi

