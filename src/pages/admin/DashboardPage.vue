<template>
  <AppLayout>
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders Today" :value="stats.ordersToday" color="orange" />
        <StatCard label="Pending Orders" :value="stats.pending" color="yellow" />
        <StatCard label="Tables Occupied" :value="stats.occupied" color="blue" />
        <StatCard label="Revenue Today" :value="'$' + stats.revenue" color="green" />
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
        <div v-if="loading" class="text-gray-400 text-sm">Loading...</div>
        <div v-else-if="orders.length === 0" class="text-gray-400 text-sm">No orders yet.</div>
        <div v-else class="space-y-3">
          <div
            v-for="order in orders"
            :key="order.id"
            class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div>
              <span class="font-medium text-gray-900">Order #{{ order.id.slice(0, 8) }}</span>
              <span class="text-gray-500 text-sm ml-2">Table {{ order.table?.number ?? 'N/A' }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-gray-900 font-medium">${{ order.total_amount }}</span>
              <StatusBadge :status="order.status" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/layout/AppLayout.vue'
import StatCard from '../../components/shared/StatCard.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { ordersApi } from '../../api/orders'

const orders = ref([])
const loading = ref(true)
const stats = ref({ ordersToday: 0, pending: 0, occupied: 0, revenue: '0.00' })

onMounted(async () => {
  try {
    const response = await ordersApi.list({ per_page: 10 })
    orders.value = response.data.data.orders
    stats.value.ordersToday = response.data.data.meta.total
    stats.value.pending = orders.value.filter(o => o.status === 'pending').length
  } finally {
    loading.value = false
  }
})
</script>
