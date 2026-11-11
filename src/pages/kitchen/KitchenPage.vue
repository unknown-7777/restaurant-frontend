<template>
  <div class="min-h-screen bg-gray-900 p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-white">Kitchen Display</h1>
      <span class="text-gray-400 text-sm">Auto-refreshes every 10s</span>
    </div>

    <div v-if="loading" class="text-gray-400">Loading orders...</div>

    <div v-else-if="orders.length === 0" class="text-center py-20">
      <p class="text-gray-500 text-lg">No active orders</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-gray-800 rounded-xl p-5 border border-gray-700"
      >
        <div class="flex items-center justify-between mb-4">
          <div>
            <span class="text-white font-bold text-lg">
              Table {{ order.table?.number ?? 'Takeaway' }}
            </span>
            <span class="text-gray-400 text-sm ml-2">#{{ order.id.slice(0,8) }}</span>
          </div>
          <span
            :class="statusClass(order.status)"
            class="px-3 py-1 rounded-full text-xs font-semibold uppercase"
          >
            {{ order.status }}
          </span>
        </div>

        <div class="space-y-2 mb-4">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="text-gray-300 text-sm"
          >
            <span class="font-semibold text-white">{{ item.quantity }}×</span>
            {{ item.menu_item?.name }}
            <span v-if="item.special_request" class="text-yellow-400 block text-xs ml-4">
              ⚠ {{ item.special_request }}
            </span>
          </div>
        </div>

        <div v-if="order.notes" class="text-yellow-300 text-xs border-t border-gray-700 pt-3">
          Note: {{ order.notes }}
        </div>

        <div class="flex gap-2 mt-4">
          <button
            v-if="order.status === 'confirmed'"
            @click="updateStatus(order.id, 'preparing')"
            class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Start Preparing
          </button>
          <button
            v-if="order.status === 'preparing'"
            @click="updateStatus(order.id, 'ready')"
            class="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Mark Ready
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ordersApi } from '../../api/orders'

const orders = ref([])
const loading = ref(true)
let interval = null

async function fetchOrders() {
  try {
    const response = await ordersApi.list({ status: 'confirmed,preparing', per_page: 50 })
    orders.value = response.data.data.orders
  } finally {
    loading.value = false
  }
}

async function updateStatus(id, status) {
  await ordersApi.updateStatus(id, status)
  await fetchOrders()
}

function statusClass(status) {
  return {
    'confirmed': 'bg-blue-500 text-white',
    'preparing': 'bg-yellow-500 text-black',
    'ready': 'bg-green-500 text-white',
  }[status] || 'bg-gray-500 text-white'
}

onMounted(() => {
  fetchOrders()
  interval = setInterval(fetchOrders, 10000)
})

onUnmounted(() => clearInterval(interval))
</script>
