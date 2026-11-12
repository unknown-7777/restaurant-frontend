<template>
  <AppLayout>
    <div class="p-4 sm:p-6">

      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Orders</h1>
          <p class="text-gray-500 text-sm mt-0.5">Manage and track all orders</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Order
        </button>
      </div>

      <!-- Status filter tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          @click="selectedStatus = tab.value"
          :class="selectedStatus === tab.value
            ? 'bg-orange-500 text-white'
            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
        >
          {{ tab.label }}
          <span v-if="countByStatus(tab.value) > 0" class="ml-1 opacity-80">
            ({{ countByStatus(tab.value) }})
          </span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-gray-400">
        Loading orders...
      </div>

      <!-- Empty -->
      <div v-else-if="filteredOrders.length === 0" class="text-center py-20">
        <p class="text-gray-400 text-lg">No orders found</p>
      </div>

      <!-- Orders list -->
      <div v-else class="space-y-3">
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          @click="openOrder(order)"
          class="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-gray-900">
                    Table {{ order.table?.number ?? 'N/A' }}
                  </span>
                  <span class="text-gray-400 text-xs font-mono">
                    #{{ order.id.slice(0, 8) }}
                  </span>
                </div>
                <div class="text-gray-500 text-sm mt-0.5">
                  {{ order.items?.length ?? 0 }} items ·
                  {{ formatTime(order.created_at) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-bold text-gray-900">${{ order.total_amount }}</span>
              <StatusBadge :status="order.status" />
            </div>
          </div>

          <!-- Items preview -->
          <div v-if="order.items?.length" class="mt-3 flex flex-wrap gap-1">
            <span
              v-for="item in order.items.slice(0, 3)"
              :key="item.id"
              class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
            >
              {{ item.quantity }}× {{ item.menu_item?.name }}
            </span>
            <span
              v-if="order.items.length > 3"
              class="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full"
            >
              +{{ order.items.length - 3 }} more
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- Create Order Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
      <div class="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900">New Order</h2>
          <button @click="closeCreateModal" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <!-- Table select -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Table</label>
          <select
            v-model="createForm.table_id"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select table</option>
            <option
              v-for="table in availableTables"
              :key="table.id"
              :value="table.id"
            >
              Table {{ table.number }} ({{ table.capacity }} seats)
            </option>
          </select>
        </div>

        <!-- Notes -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input
            v-model="createForm.notes"
            type="text"
            placeholder="e.g. No spicy food"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <!-- Add items -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Add Items</label>

          <!-- Category filter -->
          <div class="flex gap-2 overflow-x-auto pb-1 mb-3">
            <button
              @click="itemCategory = null"
              :class="itemCategory === null ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'"
              class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            >
              All
            </button>
            <button
              v-for="cat in categories"
              :key="cat.id"
              @click="itemCategory = cat.id"
              :class="itemCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'"
              class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            >
              {{ cat.name }}
            </button>
          </div>

          <!-- Menu items -->
          <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            <button
              v-for="item in filteredMenuItems"
              :key="item.id"
              @click="addToOrder(item)"
              :disabled="!item.is_available"
              class="text-left border border-gray-200 rounded-lg p-2 hover:border-orange-300 hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
              <p class="text-xs text-orange-500 font-semibold">${{ item.price }}</p>
            </button>
          </div>
        </div>

        <!-- Order items list -->
        <div v-if="createForm.items.length > 0" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Order Items ({{ createForm.items.length }})
          </label>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="(item, index) in createForm.items"
              :key="index"
              class="flex items-center justify-between bg-gray-50 rounded-lg p-2"
            >
              <span class="text-sm text-gray-900">{{ item.name }}</span>
              <div class="flex items-center gap-2">
                <button
                  @click="decreaseQty(index)"
                  class="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-sm font-bold transition-colors"
                >
                  -
                </button>
                <span class="text-sm font-medium w-4 text-center">{{ item.quantity }}</span>
                <button
                  @click="increaseQty(index)"
                  class="w-6 h-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors"
                >
                  +
                </button>
                <button
                  @click="removeFromOrder(index)"
                  class="text-red-400 hover:text-red-600 text-xs ml-1"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
          <div class="text-right mt-2">
            <span class="text-sm font-bold text-gray-900">
              Total: ${{ orderTotal.toFixed(2) }}
            </span>
          </div>
        </div>

        <div v-if="createError" class="text-red-500 text-sm mb-3">{{ createError }}</div>

        <div class="flex gap-3">
          <button
            @click="closeCreateModal"
            class="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="submitOrder"
            :disabled="createLoading || createForm.items.length === 0"
            class="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
          >
            {{ createLoading ? 'Creating...' : 'Place Order' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div v-if="selectedOrder" class="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
      <div class="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-bold text-gray-900">
              Table {{ selectedOrder.table?.number ?? 'N/A' }}
            </h2>
            <p class="text-xs text-gray-400 font-mono">#{{ selectedOrder.id.slice(0, 8) }}</p>
          </div>
          <button @click="selectedOrder = null" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <!-- Status -->
        <div class="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <span class="text-sm text-gray-500">Status</span>
          <StatusBadge :status="selectedOrder.status" />
        </div>

        <!-- Items -->
        <div class="mb-4">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Items</h3>
          <div class="space-y-2">
            <div
              v-for="item in selectedOrder.items"
              :key="item.id"
              class="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0"
            >
              <div>
                <span class="font-medium text-gray-900">
                  {{ item.quantity }}× {{ item.menu_item?.name }}
                </span>
                <p v-if="item.special_request" class="text-xs text-yellow-600 mt-0.5">
                  ⚠ {{ item.special_request }}
                </p>
              </div>
              <span class="text-gray-900 font-medium">${{ item.subtotal }}</span>
            </div>
          </div>
          <div class="flex justify-between font-bold text-gray-900 mt-3 pt-3 border-t border-gray-200">
            <span>Total</span>
            <span>${{ selectedOrder.total_amount }}</span>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="selectedOrder.notes" class="mb-4 p-3 bg-yellow-50 rounded-lg">
          <p class="text-xs text-yellow-700">📝 {{ selectedOrder.notes }}</p>
        </div>

        <!-- Status actions -->
        <div class="mb-4">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Update Status</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="next in nextStatuses(selectedOrder.status)"
              :key="next"
              @click="updateOrderStatus(selectedOrder.id, next)"
              :class="statusButtonClass(next)"
              class="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
            >
              → {{ next }}
            </button>
          </div>
          <p v-if="nextStatuses(selectedOrder.status).length === 0" class="text-gray-400 text-sm">
            No further actions available.
          </p>
        </div>

        <!-- Payment -->
        <div
          v-if="selectedOrder.status === 'served' && !selectedOrder.payment"
          class="border-t border-gray-200 pt-4"
        >
          <h3 class="text-sm font-medium text-gray-700 mb-3">Process Payment</h3>
          <div class="space-y-3">
            <select
              v-model="paymentForm.method"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="qris">QRIS</option>
            </select>
            <input
              v-model.number="paymentForm.amount"
              type="number"
              :placeholder="`Amount (min $${selectedOrder.total_amount})`"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div v-if="paymentForm.amount > selectedOrder.total_amount" class="text-sm text-green-600">
              Change: ${{ (paymentForm.amount - selectedOrder.total_amount).toFixed(2) }}
            </div>
            <button
              @click="processPayment"
              :disabled="paymentLoading"
              class="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
            >
              {{ paymentLoading ? 'Processing...' : 'Process Payment' }}
            </button>
          </div>
        </div>

        <!-- Paid receipt -->
        <div v-if="selectedOrder.payment" class="border-t border-gray-200 pt-4">
          <div class="bg-green-50 rounded-lg p-3">
            <p class="text-green-700 text-sm font-medium">✓ Paid</p>
            <p class="text-green-600 text-xs mt-1">
              {{ selectedOrder.payment.method?.toUpperCase() }} ·
              ${{ selectedOrder.payment.amount }} paid ·
              ${{ selectedOrder.payment.change_amount }} change
            </p>
          </div>
        </div>

      </div>
    </div>

  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/layout/AppLayout.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { ordersApi } from '../../api/orders'
import { tablesApi } from '../../api/tables'
import { categoriesApi } from '../../api/categories'
import { menuItemsApi } from '../../api/menuItems'

const orders = ref([])
const tables = ref([])
const categories = ref([])
const menuItems = ref([])
const loading = ref(true)
const selectedStatus = ref('all')
const selectedOrder = ref(null)
const itemCategory = ref(null)

const showCreateModal = ref(false)
const createLoading = ref(false)
const createError = ref('')
const createForm = ref({ table_id: '', notes: '', items: [] })

const paymentLoading = ref(false)
const paymentForm = ref({ method: 'cash', amount: '' })

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Served', value: 'served' },
  { label: 'Paid', value: 'paid' },
  { label: 'Cancelled', value: 'cancelled' },
]

const transitions = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['served'],
  served:    ['paid'],
  paid:      [],
  cancelled: [],
}

const filteredOrders = computed(() => {
  if (selectedStatus.value === 'all') return orders.value
  return orders.value.filter(o => o.status === selectedStatus.value)
})

const availableTables = computed(() =>
  tables.value.filter(t => t.status === 'available')
)

const filteredMenuItems = computed(() => {
  if (!itemCategory.value) return menuItems.value
  return menuItems.value.filter(i => i.category_id === itemCategory.value)
})

const orderTotal = computed(() =>
  createForm.value.items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
)

function countByStatus(status) {
  if (status === 'all') return orders.value.length
  return orders.value.filter(o => o.status === status).length
}

function nextStatuses(status) {
  return transitions[status] || []
}

function statusButtonClass(status) {
  return {
    confirmed:  'bg-blue-100 text-blue-700 hover:bg-blue-200',
    preparing:  'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    ready:      'bg-purple-100 text-purple-700 hover:bg-purple-200',
    served:     'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    paid:       'bg-green-100 text-green-700 hover:bg-green-200',
    cancelled:  'bg-red-100 text-red-700 hover:bg-red-200',
  }[status] || 'bg-gray-100 text-gray-700'
}

function formatTime(datetime) {
  return new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function addToOrder(menuItem) {
  const existing = createForm.value.items.find(i => i.menu_item_id === menuItem.id)
  if (existing) {
    existing.quantity++
  } else {
    createForm.value.items.push({
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: parseFloat(menuItem.price),
      quantity: 1,
      special_request: '',
    })
  }
}

function increaseQty(index) {
  createForm.value.items[index].quantity++
}

function decreaseQty(index) {
  if (createForm.value.items[index].quantity <= 1) {
    removeFromOrder(index)
  } else {
    createForm.value.items[index].quantity--
  }
}

function removeFromOrder(index) {
  createForm.value.items.splice(index, 1)
}

function closeCreateModal() {
  showCreateModal.value = false
  createForm.value = { table_id: '', notes: '', items: [] }
  createError.value = ''
}

async function fetchAll() {
  loading.value = true
  try {
    const [ordersRes, tablesRes, catsRes, itemsRes] = await Promise.all([
      ordersApi.list({ per_page: 100 }),
      tablesApi.list(),
      categoriesApi.list(),
      menuItemsApi.list({ per_page: 100, is_available: true }),
    ])
    orders.value = ordersRes.data.data.orders
    tables.value = tablesRes.data.data
    categories.value = catsRes.data.data
    menuItems.value = itemsRes.data.data.items
  } finally {
    loading.value = false
  }
}

async function submitOrder() {
  if (createForm.value.items.length === 0) {
    createError.value = 'Add at least one item.'
    return
  }
  createLoading.value = true
  createError.value = ''
  try {
    await ordersApi.create({
      table_id: createForm.value.table_id || null,
      notes: createForm.value.notes || null,
      items: createForm.value.items.map(i => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        special_request: i.special_request || null,
      })),
    })
    closeCreateModal()
    await fetchAll()
  } catch (e) {
    createError.value = e.response?.data?.message || 'Failed to create order.'
  } finally {
    createLoading.value = false
  }
}

async function openOrder(order) {
  const response = await ordersApi.get(order.id)
  selectedOrder.value = response.data.data
  paymentForm.value = { method: 'cash', amount: '' }
}

async function updateOrderStatus(id, status) {
  await ordersApi.updateStatus(id, status)
  const response = await ordersApi.get(id)
  selectedOrder.value = response.data.data
  await fetchAll()
}

async function processPayment() {
  if (!paymentForm.value.amount) return
  paymentLoading.value = true
  try {
    await ordersApi.pay(selectedOrder.value.id, paymentForm.value)
    const response = await ordersApi.get(selectedOrder.value.id)
    selectedOrder.value = response.data.data
    await fetchAll()
  } catch (e) {
    alert(e.response?.data?.message || 'Payment failed.')
  } finally {
    paymentLoading.value = false
  }
}

onMounted(fetchAll)
</script>
