import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ordersApi } from '../api/orders'

export const useOrderStore = defineStore('orders', () => {
  const orders = ref([])
  const currentOrder = ref(null)
  const loading = ref(false)

  async function fetchOrders(params = {}) {
    loading.value = true
    try {
      const response = await ordersApi.list(params)
      orders.value = response.data.data.orders
    } finally {
      loading.value = false
    }
  }

  async function fetchOrder(id) {
    const response = await ordersApi.get(id)
    currentOrder.value = response.data.data
    return currentOrder.value
  }

  async function updateStatus(id, status) {
    const response = await ordersApi.updateStatus(id, status)
    const updated = response.data.data
    const index = orders.value.findIndex(o => o.id === id)
    if (index !== -1) orders.value[index] = updated
    return updated
  }

  return {
    orders, currentOrder, loading,
    fetchOrders, fetchOrder, updateStatus,
  }
})
