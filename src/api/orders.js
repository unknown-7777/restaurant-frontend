import client from './client'

export const ordersApi = {
  list: (params) => client.get('/orders', { params }),
  get: (id) => client.get(`/orders/${id}`),
  create: (data) => client.post('/orders', data),
  createFromQr: (data) => client.post('/qr-orders', data),
  getManyFromQr: (orderIds, tableQrCode) => client.post('/qr-orders/status', { order_ids: orderIds, table_qr_code: tableQrCode }),
  sendFeedbackFromQr: (orderId, data) => client.post(`/qr-orders/${orderId}/feedback`, data),
  updateStatus: (id, status) => client.patch(`/orders/${id}/status`, { status }),
  addItem: (id, data) => client.post(`/orders/${id}/items`, data),
  removeItem: (orderId, itemId) => client.delete(`/orders/${orderId}/items/${itemId}`),
  pay: (id, data) => client.post(`/orders/${id}/pay`, data),
  payTable: (tableId, data) => client.post(`/tables/${tableId}/pay`, data),
}
