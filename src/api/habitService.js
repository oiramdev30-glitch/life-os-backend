import apiClient from './client'

export const habitService = {
  getAll: async () => {
    const response = await apiClient.get('/habits')
    return response.data
  },

  toggle: async (id, done) => {
    const response = await apiClient.patch(`/habits/${id}`, { done })
    return response.data
  },

  create: async (habit) => {
    const response = await apiClient.post('/habits', habit)
    return response.data
  },
}