import client from './client'

export const menuItemsApi = {
  list: (params) => client.get('/menu-items', { params }),
  get: (id) => client.get(`/menu-items/${id}`),
  create: (data) => client.post('/menu-items', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => client.put(`/menu-items/${id}`, data),
  delete: (id) => client.delete(`/menu-items/${id}`),
}
