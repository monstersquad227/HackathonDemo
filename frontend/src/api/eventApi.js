import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const eventApi = {
  // Get all events
  getAllEvents: async () => {
    const response = await api.get('/events')
    return response.data
  },

  // Get event by ID
  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`)
    return response.data
  },

  // Create new event
  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData)
    return response.data
  },

  // Update event
  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData)
    return response.data
  },

  // Delete event
  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`)
    return response.data
  },

  // Update event stage
  updateStage: async (id, stage) => {
    const response = await api.patch(`/events/${id}/stage`, { stage })
    return response.data
  },
}

export default eventApi

