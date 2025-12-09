import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const voteApi = {
  castVote: async (payload) => {
    const response = await api.post('/votes', payload)
    return response.data
  },

  getVotesByEvent: async (eventId) => {
    const response = await api.get(`/votes/event/${eventId}`)
    return response.data
  },

  getVoteSummary: async (eventId) => {
    const response = await api.get(`/votes/event/${eventId}/summary`)
    return response.data
  },

  getVotesBySubmission: async (submissionId) => {
    const response = await api.get(`/votes/submission/${submissionId}`)
    return response.data
  },

  deleteVote: async (voteId, organizerAddress) => {
    const response = await api.delete(`/votes/${voteId}`, {
      params: { organizer_address: organizerAddress },
    })
    return response.data
  },

  getJudges: async (eventId) => {
    const response = await api.get(`/events/${eventId}/judges`)
    return response.data
  },

  addJudge: async (eventId, payload) => {
    const response = await api.post(`/events/${eventId}/judges`, payload)
    return response.data
  },

  removeJudge: async (eventId, judgeId, organizerAddress) => {
    const response = await api.delete(`/events/${eventId}/judges/${judgeId}`, {
      data: { organizer_address: organizerAddress },
    })
    return response.data
  },
}

export default voteApi





