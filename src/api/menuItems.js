import client from './client'

export const menuItemsApi = {
  list: (params) => client.get('/menu-items', { params }),
  get: (id) => client.get(`/menu-items/${id}`),
  create: (data) => client.post('/menu-items', toFormData(data)),
  update: (id, data) => {
    const form = toFormData(data)
    // PHP does not populate multipart fields for PUT requests. Laravel's
    // method override lets it parse the multipart payload as an update.
    form.append('_method', 'PUT')
    return client.post(`/menu-items/${id}`, form)
  },
  delete: (id) => client.delete(`/menu-items/${id}`),
}

function toFormData(data) {
  const form = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      form.append(key, value instanceof File ? value : String(value))
    }
  })
  return form
}
