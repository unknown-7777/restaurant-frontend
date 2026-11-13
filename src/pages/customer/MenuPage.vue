<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
      <div class="flex items-center justify-between max-w-3xl mx-auto">
        <div>
          <h1 class="text-xl font-bold text-gray-900">🍽 Menu</h1>
          <p v-if="tableInfo" class="text-sm text-gray-500">Table {{ tableInfo.number }}</p>
          <p v-else-if="tableQrCode" class="text-sm text-gray-400">Checking table…</p>
        </div>
        <div class="flex items-center gap-3">
          <div
            v-if="cartCount > 0"
            @click="showCart = true"
            class="relative cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
          >
            🛒 View Cart
            <span class="bg-white text-orange-500 font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {{ cartCount }}
            </span>
          </div>
          <button
            v-if="auth.isAuthenticated"
            @click="handleLogout"
            class="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>

    <div v-if="tableQrCode && qrAccessBlocked" class="max-w-3xl mx-auto px-4 py-12">
      <div class="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center text-amber-900">
        <h2 class="font-bold">This table cannot be opened right now</h2>
        <p class="mt-2 text-sm">{{ qrAccessMessage }}</p>
      </div>
    </div>
    <div v-else-if="tableQrCode && guestSessionClosed" class="max-w-3xl mx-auto px-4 py-12">
      <div class="rounded-xl border border-gray-200 bg-white p-5 text-center text-gray-700 shadow-sm">
        <h2 class="font-bold">This ordering visit has ended</h2>
        <p class="mt-2 text-sm">To start a new visit, scan the table QR code again.</p>
      </div>
    </div>
    <div v-else class="max-w-3xl mx-auto px-4 py-6">
      <div v-if="tableError" class="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ tableError }}
      </div>
      <div v-if="orderError" class="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ orderError }}
      </div>
      <div v-if="orderSuccessMessage" class="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
        {{ orderSuccessMessage }}
      </div>
      <section v-if="canFinishVisit" class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="font-semibold text-gray-900">Leaving without ordering?</h2>
        <p class="mt-1 text-sm text-gray-600">Finish this visit to make the table available again.</p>
        <button @click="finishVisit" :disabled="finishVisitLoading" class="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50">
          {{ finishVisitLoading ? 'Finishing…' : 'Finish visit' }}
        </button>
      </section>

      <section v-if="customerOrders.length" class="mb-6 space-y-3">
        <article v-for="order in customerOrders" :key="order.id" class="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-bold text-gray-900">Table {{ tableInfo?.number }} · Order #{{ order.id.slice(0, 8) }}</h2>
              <p class="mt-1 text-sm text-gray-500">Total: ${{ Number(order.total_amount).toFixed(2) }}</p>
            </div>
            <span class="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold capitalize text-orange-700">{{ order.status }}</span>
          </div>
          <p class="mt-3 text-sm text-gray-600">
            <template v-if="order.payment">Payment received. Thank you!</template>
            <template v-else-if="order.status === 'served'">Your order has been served. Request the bill when you are ready to pay.</template>
            <template v-else-if="order.status === 'pending'">Your order is waiting for staff confirmation. The kitchen will start after a waiter confirms it.</template>
            <template v-else>Your order is with the restaurant. This status updates automatically.</template>
          </p>
          <p v-if="order.payment" class="mt-3 text-sm font-medium text-green-700">
            {{ order.payment.method.toUpperCase() }} · ${{ order.payment.amount }} paid
          </p>
        </article>
      </section>

      <section v-if="billableCustomerOrders.length && !allCustomerOrdersPaid" class="mb-6 rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <h2 class="font-bold text-gray-900">One bill for your table</h2>
        <p class="mt-1 text-sm text-gray-600">
          {{ tableInfo?.bill_requested_at
            ? 'Bill requested. Staff will collect or process your selected payment method.'
            : canRequestBill
              ? `All served orders · $${tableBillTotal.toFixed(2)}`
              : 'You can request one bill after all unpaid table orders have been served.' }}
        </p>
        <div v-if="canRequestBill && !tableInfo?.bill_requested_at" class="mt-3 flex flex-col gap-2 sm:flex-row">
          <select v-model="paymentMethod" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="cash">Cash · pay staff</option>
            <option value="card">Card · staff terminal</option>
            <option value="qris">QRIS · staff QR</option>
          </select>
          <button @click="requestTableBill" :disabled="billRequestLoading" class="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {{ billRequestLoading ? 'Requesting…' : 'Request one table bill' }}
          </button>
        </div>
      </section>
      <div v-if="tableInfo?.bill_requested_at" class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        Your table bill is being handled. Ordering is paused until staff completes payment.
      </div>

      <section v-if="allCustomerOrdersPaid && !feedbackSubmitted" class="mb-6 rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
        <h2 class="font-bold text-gray-900">How was your visit?</h2>
        <p class="mt-1 text-sm text-gray-600">Rate your experience and leave an optional comment.</p>
        <div class="mt-3 flex gap-2" role="radiogroup" aria-label="Restaurant rating">
          <button v-for="score in 5" :key="score" @click="feedbackRating = score" :aria-label="`${score} star${score === 1 ? '' : 's'}`" :aria-pressed="feedbackRating === score" class="text-3xl leading-none" :class="feedbackRating >= score ? 'text-amber-400' : 'text-gray-300'">★</button>
        </div>
        <textarea v-model="feedbackComment" maxlength="2000" rows="3" placeholder="Tell us about your experience (optional)" class="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"></textarea>
        <button @click="submitFeedback" :disabled="feedbackLoading || !feedbackRating" class="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {{ feedbackLoading ? 'Sending…' : 'Send feedback' }}
        </button>
      </section>
      <div v-else-if="allCustomerOrdersPaid && feedbackSubmitted" class="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Thank you for rating your visit!
      </div>

      <!-- Category tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button
          @click="selectedCategory = null"
          :class="selectedCategory === null
            ? 'bg-orange-500 text-white'
            : 'bg-white border border-gray-300 text-gray-600'"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
        >
          All
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = cat.id"
          :class="selectedCategory === cat.id
            ? 'bg-orange-500 text-white'
            : 'bg-white border border-gray-300 text-gray-600'"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-gray-400">
        Loading menu...
      </div>

      <!-- Menu items -->
      <div v-else class="space-y-3">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
        >
          <!-- Image -->
          <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              v-if="item.image_url"
              :src="item.image_url"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-3xl">🍽</span>
          </div>

          <!-- Info -->
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900">{{ item.name }}</h3>
            <p v-if="item.description" class="text-gray-400 text-xs mt-0.5 line-clamp-2">
              {{ item.description }}
            </p>
            <p class="text-orange-500 font-bold mt-1">${{ item.price }}</p>
          </div>

          <!-- Add button -->
          <div class="flex-shrink-0">
            <div v-if="getCartQty(item.id) > 0" class="flex items-center gap-2">
              <button
                @click="decreaseItem(item)"
                :disabled="!!tableInfo?.bill_requested_at"
                class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold transition-colors"
              >
                −
              </button>
              <span class="font-bold text-gray-900 w-4 text-center">{{ getCartQty(item.id) }}</span>
              <button
                @click="addItem(item)"
                :disabled="!!tableInfo?.bill_requested_at"
                class="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors"
              >
                +
              </button>
            </div>
            <button
              v-else
              @click="addItem(item)"
              :disabled="!item.is_available || !!tableInfo?.bill_requested_at"
              class="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart drawer -->
    <div v-if="showCart && !qrAccessBlocked && !guestSessionClosed" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/50" @click="showCart = false"></div>
      <div class="relative bg-white w-full max-w-md h-full flex flex-col shadow-xl">

        <div class="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">Your Order</h2>
          <button @click="showCart = false" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto p-5">
          <div v-if="cart.items.length === 0" class="text-center py-10 text-gray-400">
            Your cart is empty
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="(item, index) in cart.items"
              :key="index"
              class="flex items-center justify-between"
            >
              <div class="flex-1">
                <p class="font-medium text-gray-900 text-sm">{{ item.name }}</p>
                <p class="text-orange-500 text-sm">${{ (item.unit_price * item.quantity).toFixed(2) }}</p>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <button
                  @click="cart.updateQuantity(index, item.quantity - 1)"
                  class="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-sm transition-colors"
                >
                  −
                </button>
                <span class="font-bold text-gray-900 w-4 text-center text-sm">{{ item.quantity }}</span>
                <button
                  @click="cart.updateQuantity(index, item.quantity + 1)"
                  class="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 p-5">
          <div class="flex justify-between mb-4">
            <span class="font-semibold text-gray-900">Total</span>
            <span class="font-bold text-xl text-gray-900">${{ cart.total.toFixed(2) }}</span>
          </div>

          <div class="mb-4">
            <input
              v-model="orderNotes"
              type="text"
              placeholder="Any special requests? (optional)"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div v-if="orderError" class="text-red-500 text-sm mb-3">{{ orderError }}</div>

          <button
            @click="placeOrder"
            :disabled="orderLoading || cart.items.length === 0 || (!auth.isAuthenticated && !tableQrCode) || !!tableError || !!tableInfo?.bill_requested_at || guestSessionClosed || (!!tableQrCode && !guestSessionToken)"
            class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {{ orderLoading ? 'Sending order...' : (tableQrCode && customerOrders.length ? 'Place another order' : 'Place order') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'
import { categoriesApi } from '../../api/categories'
import { menuItemsApi } from '../../api/menuItems'
import { ordersApi } from '../../api/orders'
import { tablesApi } from '../../api/tables'
import { startLiveRefresh } from '../../utils/liveRefresh'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
const route = useRoute()

const categories = ref([])
const menuItems = ref([])
const loading = ref(true)
const selectedCategory = ref(null)
const showCart = ref(false)
const orderNotes = ref('')
const orderLoading = ref(false)
const orderError = ref('')
const orderSuccessMessage = ref('')
const tableInfo = ref(null)
const tableError = ref('')
const guestSessionToken = ref('')
const guestSessionClosed = ref(false)
const qrAccessBlocked = ref(false)
const qrAccessMessage = ref('Only the customer who started this visit can order from it. Please ask a staff member if you need help.')
const finishVisitLoading = ref(false)
const customerOrders = ref([])
const paymentMethod = ref('cash')
const billRequestLoading = ref(false)
const refreshingOrders = ref(false)
const feedbackRating = ref(0)
const feedbackComment = ref('')
const feedbackLoading = ref(false)
const feedbackSubmitted = ref(false)
let stopLiveRefresh

const tableQrCode = computed(() => typeof route.query.table === 'string' ? route.query.table : '')

const cartCount = computed(() => cart.itemCount)
const billableCustomerOrders = computed(() => customerOrders.value.filter(order => order.status !== 'cancelled'))
const unpaidBillOrders = computed(() => billableCustomerOrders.value.filter(order => !order.payment))
const canFinishVisit = computed(() => !!tableQrCode.value
  && !!guestSessionToken.value
  && !guestSessionClosed.value
  && unpaidBillOrders.value.length === 0
  && !tableInfo.value?.bill_requested_at)
const allCustomerOrdersPaid = computed(() => billableCustomerOrders.value.length > 0
  && billableCustomerOrders.value.every(order => !!order.payment))
const feedbackOrder = computed(() => billableCustomerOrders.value.find(order => !!order.payment) || null)
const canRequestBill = computed(() => unpaidBillOrders.value.length > 0
  && unpaidBillOrders.value.every(order => order.status === 'served')
  && tableInfo.value?.bill_ready !== false
  && !tableInfo.value?.bill_requested_at)
const tableBillTotal = computed(() => Number(tableInfo.value?.bill_total
  ?? unpaidBillOrders.value.reduce((sum, order) => sum + Number(order.total_amount), 0)))

const filteredItems = computed(() => {
  if (!selectedCategory.value) return menuItems.value
  return menuItems.value.filter(i => i.category_id === selectedCategory.value)
})

function getCartQty(menuItemId) {
  const found = cart.items.find(i => i.menu_item_id === menuItemId)
  return found ? found.quantity : 0
}

function addItem(menuItem) {
  if (tableInfo.value?.bill_requested_at) return
  orderSuccessMessage.value = ''
  cart.addItem(menuItem, 1)
}

function decreaseItem(menuItem) {
  if (tableInfo.value?.bill_requested_at) return
  const index = cart.items.findIndex(i => i.menu_item_id === menuItem.id)
  if (index !== -1) {
    cart.updateQuantity(index, cart.items[index].quantity - 1)
  }
}

async function placeOrder() {
  if (cart.items.length === 0 || orderLoading.value) return
  if (tableQrCode.value && (!guestSessionToken.value || guestSessionClosed.value)) {
    orderError.value = 'This ordering visit has ended. Scan the table QR code again to start a new visit.'
    return
  }
  orderLoading.value = true
  orderError.value = ''
  orderSuccessMessage.value = ''
  try {
    const orderData = {
      ...(!tableQrCode.value && auth.user ? { table_id: cart.tableId } : {}),
      notes: orderNotes.value || null,
      items: cart.items.map(i => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
      })),
    }
    if (tableQrCode.value) {
      const response = await ordersApi.createFromQr({
        ...orderData,
        table_qr_code: tableQrCode.value,
        guest_session_token: guestSessionToken.value,
      })
      const createdOrder = response.data.data
      customerOrders.value = [createdOrder, ...customerOrders.value.filter(order => order.id !== createdOrder.id)]
      const orderIds = readStoredOrderIds().filter(id => id !== createdOrder.id)
      sessionStorage.setItem(orderStorageKey(), JSON.stringify([createdOrder.id, ...orderIds].slice(0, 10)))
    } else {
      await ordersApi.create(orderData)
    }
    cart.clearCart()
    orderNotes.value = ''
    showCart.value = false
    orderSuccessMessage.value = tableQrCode.value
      ? 'Order sent for staff confirmation. Add more items whenever you are ready; each round is tracked separately above.'
      : 'Order sent successfully.'
  } catch (e) {
    if (e.response?.status === 410) {
      guestSessionClosed.value = true
      showCart.value = false
    }
    orderError.value = e.response?.data?.message || 'Failed to place order.'
  } finally {
    orderLoading.value = false
  }
}

async function finishVisit() {
  if (!canFinishVisit.value || finishVisitLoading.value) return
  finishVisitLoading.value = true
  orderError.value = ''
  try {
    await tablesApi.finishGuestSession({
      table_qr_code: tableQrCode.value,
      guest_session_token: guestSessionToken.value,
    })
    guestSessionClosed.value = true
    showCart.value = false
    cart.clearCart()
  } catch (error) {
    if (error.response?.status === 410) {
      guestSessionClosed.value = true
      showCart.value = false
    }
    orderError.value = error.response?.data?.message || 'Could not finish this visit. Please ask a staff member.'
  } finally {
    finishVisitLoading.value = false
  }
}

function orderStorageKey() {
  return `qr-order:${tableQrCode.value}`
}

function guestSessionStorageKey() {
  return `qr-guest-session:${tableQrCode.value}`
}

function readStoredOrderIds() {
  const stored = sessionStorage.getItem(orderStorageKey())
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : [stored]
  } catch {
    return [stored]
  }
}

async function refreshQrOrders() {
  if (!tableQrCode.value) return
  const orderIds = [...new Set([...customerOrders.value.map(order => order.id), ...readStoredOrderIds()])].slice(0, 10)
  if (!orderIds.length || refreshingOrders.value) return
  refreshingOrders.value = true
  try {
    const [ordersResponse, tableResponse] = await Promise.all([
      ordersApi.getManyFromQr(orderIds, tableQrCode.value, guestSessionToken.value),
      tablesApi.getByQrCode(tableQrCode.value),
    ])
    customerOrders.value = ordersResponse.data.data.orders
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    guestSessionClosed.value = !ordersResponse.data.data.session_active
    if (guestSessionClosed.value) showCart.value = false
    tableInfo.value = tableResponse.data.data
    const returnedIds = new Set(customerOrders.value.map(order => order.id))
    sessionStorage.setItem(orderStorageKey(), JSON.stringify(orderIds.filter(id => returnedIds.has(id))))
    feedbackSubmitted.value = feedbackOrder.value
      ? sessionStorage.getItem(feedbackStorageKey(feedbackOrder.value.id)) === 'submitted'
      : false
  } finally {
    refreshingOrders.value = false
  }
}

async function requestTableBill() {
  if (billRequestLoading.value || !canRequestBill.value) return
  billRequestLoading.value = true
  orderError.value = ''
  try {
    const response = await tablesApi.requestBillByQr({
      table_qr_code: tableQrCode.value,
      guest_session_token: guestSessionToken.value,
      method: paymentMethod.value,
    })
    tableInfo.value = response.data.data
  } catch (error) {
    if (error.response?.status === 410) {
      guestSessionClosed.value = true
      showCart.value = false
    }
    orderError.value = error.response?.data?.message || 'Could not request the table bill. Please ask a staff member.'
  } finally {
    billRequestLoading.value = false
  }
}

function feedbackStorageKey(orderId) {
  return `qr-feedback:${tableQrCode.value}:${orderId}`
}

async function submitFeedback() {
  if (!feedbackRating.value || !feedbackOrder.value || feedbackLoading.value) return
  feedbackLoading.value = true
  orderError.value = ''
  const orderId = feedbackOrder.value.id
  try {
    await ordersApi.sendFeedbackFromQr(orderId, {
      table_qr_code: tableQrCode.value,
      rating: feedbackRating.value,
      comment: feedbackComment.value.trim() || null,
    })
    sessionStorage.setItem(feedbackStorageKey(orderId), 'submitted')
    feedbackSubmitted.value = true
  } catch (error) {
    orderError.value = error.response?.data?.message || 'Could not send feedback. Please try again.'
  } finally {
    feedbackLoading.value = false
  }
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(async () => {
  loading.value = true
  try {
    if (tableQrCode.value) {
      const tableResponse = await tablesApi.getByQrCode(tableQrCode.value)
      tableInfo.value = tableResponse.data.data

      let storedSessionToken = sessionStorage.getItem(guestSessionStorageKey())
      const navigationType = performance.getEntriesByType('navigation')[0]?.type
      if (storedSessionToken) {
        try {
          const sessionResponse = await tablesApi.startGuestSession({
            table_qr_code: tableQrCode.value,
            guest_session_token: storedSessionToken,
          })
          guestSessionToken.value = sessionResponse.data.data.token
        } catch (error) {
          if (error.response?.status === 410 && navigationType === 'navigate') {
            sessionStorage.removeItem(guestSessionStorageKey())
            storedSessionToken = null
          } else if (error.response?.status === 410) {
            guestSessionClosed.value = true
            showCart.value = false
            return
          } else {
            throw error
          }
        }
      }

      if (!storedSessionToken) {
        const sessionResponse = await tablesApi.startGuestSession({ table_qr_code: tableQrCode.value })
        guestSessionToken.value = sessionResponse.data.data.token
        sessionStorage.setItem(guestSessionStorageKey(), guestSessionToken.value)
      }
    }

    const [catsRes, itemsRes] = await Promise.all([
      categoriesApi.list(),
      menuItemsApi.list({ per_page: 100, is_available: true }),
    ])
    categories.value = catsRes.data.data
    menuItems.value = itemsRes.data.data.items
  } catch (e) {
    if (e.response?.status === 409) {
      qrAccessBlocked.value = true
      qrAccessMessage.value = e.response.data?.message || qrAccessMessage.value
    } else if (e.response?.status === 410) {
      guestSessionClosed.value = true
    } else if (e.response?.status === 404) {
      tableError.value = 'This table QR code is invalid. Please ask a staff member for help.'
    } else if (!e.response && tableQrCode.value) {
      const apiUrl = import.meta.env.VITE_API_URL?.trim()
        || `${window.location.protocol}//${window.location.hostname}:8000`
      tableError.value = `Cannot reach the restaurant API at ${apiUrl}. Check that the API server is running and the phone is on the same Wi-Fi network.`
    } else {
      orderError.value = 'Could not load the menu. Please refresh and try again.'
    }
  } finally {
    loading.value = false
  }

  if (qrAccessBlocked.value || guestSessionClosed.value || tableError.value) return

  if (tableQrCode.value) {
    try {
      await refreshQrOrders()
      stopLiveRefresh = startLiveRefresh(refreshQrOrders)
    } catch (error) {
      if (error.response?.status === 409) {
        qrAccessBlocked.value = true
        qrAccessMessage.value = error.response.data?.message || qrAccessMessage.value
      } else if (error.response?.status === 410) {
        guestSessionClosed.value = true
        showCart.value = false
      } else if (error.response?.status === 404) {
        tableError.value = 'This table QR code is invalid. Please ask a staff member for help.'
      } else if (!error.response) {
        const apiUrl = import.meta.env.VITE_API_URL?.trim()
          || `${window.location.protocol}//${window.location.hostname}:8000`
        tableError.value = `Cannot reach the restaurant API at ${apiUrl}. Check that the API server is running and the phone is on the same Wi-Fi network.`
      } else {
        tableError.value = `Could not verify this table (HTTP ${error.response.status}). Please try again or ask a staff member for help.`
      }
    }
  }
})

onUnmounted(() => stopLiveRefresh?.())
</script>
