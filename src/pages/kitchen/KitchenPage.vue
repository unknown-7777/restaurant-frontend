<template>
  <div class="min-h-screen bg-gray-900">

    <!-- Header -->
    <div class="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold text-white">👨‍🍳 Kitchen Display</h1>
          <div class="flex items-center gap-2">
            <div :class="isConnected ? 'bg-green-500' : 'bg-red-500'" class="w-2 h-2 rounded-full"></div>
            <span class="text-gray-400 text-xs">{{ isConnected ? 'Live' : 'Reconnecting...' }}</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <!-- Stats -->
          <div class="hidden md:flex items-center gap-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-yellow-400">{{ confirmedCount }}</p>
              <p class="text-xs text-gray-400">Confirmed</p>
            </div>
            <div class="w-px h-8 bg-gray-700"></div>
            <div class="text-center">
              <p class="text-2xl font-bold text-orange-400">{{ preparingCount }}</p>
              <p class="text-xs text-gray-400">Preparing</p>
            </div>
          </div>

          <div class="w-px h-8 bg-gray-700 hidden md:block"></div>

          <!-- Time -->
          <div class="text-right hidden md:block">
            <p class="text-white font-mono text-lg">{{ currentTime }}</p>
            <p class="text-gray-400 text-xs">{{ currentDate }}</p>
          </div>

          <div class="w-px h-8 bg-gray-700"></div>

          <!-- User info -->
          <div class="flex items-center gap-3">
            <div class="text-right hidden md:block">
              <p class="text-white text-sm font-medium">{{ auth.user?.name }}</p>
              <p class="text-gray-400 text-xs capitalize">{{ auth.user?.role }}</p>
            </div>
            <button
              @click="handleLogout"
              class="bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>⎋</span>
              <span class="hidden md:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 sm:p-6">

      <!-- Empty state -->
      <div v-if="!loading && orders.length === 0" class="flex flex-col items-center justify-center py-32">
        <div class="text-6xl mb-4">✅</div>
        <p class="text-gray-400 text-xl font-medium">All caught up!</p>
        <p class="text-gray-600 text-sm mt-1">No active orders right now</p>
      </div>

      <!-- Loading -->
      <div v-else-if="loading" class="flex items-center justify-center py-32">
        <p class="text-gray-500">Loading orders...</p>
      </div>

      <!-- Orders grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="order in orders"
          :key="order.id"
          :class="order.status === 'preparing' ? 'border-yellow-500' : 'border-blue-500'"
          class="bg-gray-800 rounded-xl border-2 p-5 flex flex-col"
        >
          <!-- Ticket header -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-white font-bold text-xl">
                Table {{ order.table?.number ?? 'Takeaway' }}
              </p>
              <p class="text-gray-500 text-xs font-mono mt-0.5">#{{ order.id.slice(0, 8) }}</p>
            </div>
            <div class="text-right">
              <span
                :class="order.status === 'preparing'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-blue-500 text-white'"
                class="px-3 py-1 rounded-full text-xs font-bold uppercase"
              >
                {{ order.status }}
              </span>
              <p class="text-gray-500 text-xs mt-1">{{ formatTime(order.created_at) }}</p>
            </div>
          </div>

          <!-- Timer -->
          <div class="mb-4">
            <div
              :class="getTimerClass(order.created_at)"
              class="text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1"
            >
              <span>⏱</span>
              {{ getElapsedTime(order.created_at) }}
            </div>
          </div>

          <!-- Items -->
          <div class="flex-1 space-y-3 mb-4">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="border-b border-gray-700 pb-3 last:border-0 last:pb-0"
            >
              <div class="flex items-start gap-2">
                <span class="text-white font-bold text-lg leading-none min-w-6">
                  {{ item.quantity }}×
                </span>
                <div class="flex-1">
                  <p class="text-white text-sm font-medium">{{ item.menu_item?.name }}</p>
                  <div v-if="item.modifiers?.length" class="mt-1 space-y-0.5">
                    <p
                      v-for="mod in item.modifiers"
                      :key="mod.id"
                      class="text-gray-400 text-xs"
                    >
                      + {{ mod.name }}
                    </p>
                  </div>
                  <p v-if="item.special_request" class="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                    <span>⚠</span> {{ item.special_request }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Order notes -->
          <div v-if="order.notes" class="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-2 mb-4">
            <p class="text-yellow-300 text-xs">📝 {{ order.notes }}</p>
          </div>

          <!-- Action button -->
          <button
            v-if="order.status === 'confirmed'"
            @click="updateStatus(order.id, 'preparing')"
            class="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-colors text-sm"
          >
            🔥 Start Preparing
          </button>
          <button
            v-else-if="order.status === 'preparing'"
            @click="updateStatus(order.id, 'ready')"
            class="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-lg transition-colors text-sm"
          >
            ✓ Mark as Ready
          </button>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { ordersApi } from '../../api/orders'

const auth = useAuthStore()
const router = useRouter()

const orders = ref([])
const loading = ref(true)
const isConnected = ref(true)
const currentTime = ref('')
const currentDate = ref('')
let refreshInterval = null
let clockInterval = null

const confirmedCount = computed(() =>
  orders.value.filter(o => o.status === 'confirmed').length
)

const preparingCount = computed(() =>
  orders.value.filter(o => o.status === 'preparing').length
)

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  currentDate.value = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(datetime) {
  return new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getElapsedTime(datetime) {
  const diff = Math.floor((Date.now() - new Date(datetime)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function getTimerClass(datetime) {
  const minutes = Math.floor((Date.now() - new Date(datetime)) / 60000)
  if (minutes < 10) return 'bg-green-900/50 text-green-400'
  if (minutes < 20) return 'bg-yellow-900/50 text-yellow-400'
  return 'bg-red-900/50 text-red-400'
}

async function fetchOrders() {
  try {
    const [confirmed, preparing] = await Promise.all([
      ordersApi.list({ status: 'confirmed', per_page: 50 }),
      ordersApi.list({ status: 'preparing', per_page: 50 }),
    ])
    orders.value = [
      ...confirmed.data.data.orders,
      ...preparing.data.data.orders,
    ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    isConnected.value = true
  } catch {
    isConnected.value = false
  } finally {
    loading.value = false
  }
}

async function updateStatus(id, status) {
  await ordersApi.updateStatus(id, status)
  await fetchOrders()
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(() => {
  fetchOrders()
  updateClock()
  refreshInterval = setInterval(fetchOrders, 10000)
  clockInterval = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  clearInterval(refreshInterval)
  clearInterval(clockInterval)
})
</script>
