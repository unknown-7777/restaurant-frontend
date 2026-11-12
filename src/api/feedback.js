import client from './client'

export const feedbackApi = {
  list: (params) => client.get('/feedback', { params }),
}
