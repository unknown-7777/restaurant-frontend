import client from './client'

export const ordersApi = {
  list: (params) => client.get('/orders', { params }),
  get: (id) => client.get(`/orders/${id}`),
  create: (data) => client.post('/orders', data),
  createFromQr: (data) => client.post('/qr-orders', data),
  updateStatus: (id, status) => client.patch(`/orders/${id}/status`, { status }),
  addItem: (id, data) => client.post(`/orders/${id}/items`, data),
  removeItem: (orderId, itemId) => client.delete(`/orders/${orderId}/items/${itemId}`),
  pay: (id, data) => client.post(`/orders/${id}/pay`, data),
}
