import client from './client'

export const tablesApi = {
  list: () => client.get('/tables'),
  get: (id) => client.get(`/tables/${id}`),
  getByQrCode: (code) => client.get(`/tables/qr/${encodeURIComponent(code)}`),
  requestBillByQr: (data) => client.post('/qr-tables/request-bill', data),
  create: (data) => client.post('/tables', data),
  update: (id, data) => client.put(`/tables/${id}`, data),
  delete: (id) => client.delete(`/tables/${id}`),
}
