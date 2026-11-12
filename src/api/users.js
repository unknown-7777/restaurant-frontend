import client from './client'

export const usersApi = {
  list: (params) => client.get('/users', { params }),
  get: (id) => client.get(`/users/${id}`),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.put(`/users/${id}`, data),
  delete: (id) => client.delete(`/users/${id}`),
  toggleActive: (id) => client.patch(`/users/${id}/toggle-active`),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('avatar', file)
    return client.post('/upload/avatar', form)
  },
  removeAvatar: () => client.delete('/upload/avatar'),
}
