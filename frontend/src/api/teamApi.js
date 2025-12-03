import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const teamApi = {
  // Get all teams
  getAllTeams: async () => {
    const response = await api.get('/teams')
    return response.data
  },

  // Get team by ID
  getTeamById: async (id) => {
    const response = await api.get(`/teams/${id}`)
    return response.data
  },

  // Get teams by leader address
  getTeamsByLeader: async (address) => {
    const response = await api.get(`/teams/leader/${address}`)
    return response.data
  },

  // Get teams by member address
  getTeamsByMember: async (address) => {
    const response = await api.get(`/teams/member/${address}`)
    return response.data
  },

  // Get teams by event ID
  getTeamsByEvent: async (eventId) => {
    const response = await api.get(`/teams/event/${eventId}`)
    return response.data
  },

  // Create new team
  createTeam: async (teamData) => {
    const response = await api.post('/teams', teamData)
    return response.data
  },

  // Update team
  updateTeam: async (id, teamData) => {
    const response = await api.put(`/teams/${id}`, teamData)
    return response.data
  },

  // Add member to team
  addMember: async (id, memberData) => {
    const response = await api.post(`/teams/${id}/members`, memberData)
    return response.data
  },

  // Remove member from team
  removeMember: async (id, memberId) => {
    const response = await api.delete(`/teams/${id}/members/${memberId}`)
    return response.data
  },

  // Approve team
  approveTeam: async (id, organizerAddress) => {
    const response = await api.patch(`/teams/${id}/approve`, {
      organizer_address: organizerAddress,
    })
    return response.data
  },

  // Reject team
  rejectTeam: async (id, organizerAddress) => {
    const response = await api.patch(`/teams/${id}/reject`, {
      organizer_address: organizerAddress,
    })
    return response.data
  },

  // Delete team
  deleteTeam: async (id) => {
    const response = await api.delete(`/teams/${id}`)
    return response.data
  },
}

export default teamApi

