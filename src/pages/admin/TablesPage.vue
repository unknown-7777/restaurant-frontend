<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import AppLayout from '../../components/layout/AppLayout.vue'
import { tablesApi } from '../../api/tables'

const tables = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const selectedTable = ref(null)
const createLoading = ref(false)
const createError = ref('')
const qrCodeDataUrl = ref('')
const qrGenerating = ref(false)
let refreshTimer

const createForm = ref({ number: '', capacity: 4 })

const counts = computed(() => ({
  available: tables.value.filter(t => t.status === 'available').length,
  occupied:  tables.value.filter(t => t.status === 'occupied').length,
  reserved:  tables.value.filter(t => t.status === 'reserved').length,
}))

function cardClass(status) {
  return {
    available: 'border-green-300 bg-green-50',
    occupied:  'border-red-300 bg-red-50',
    reserved:  'border-yellow-300 bg-yellow-50',
  }[status] || 'border-gray-200 bg-white'
}

function dotClass(status) {
  return {
    available: 'bg-green-500',
    occupied:  'bg-red-500',
    reserved:  'bg-yellow-500',
  }[status] || 'bg-gray-400'
}

function statusTextClass(status) {
  return {
    available: 'text-green-600',
    occupied:  'text-red-500',
    reserved:  'text-yellow-600',
  }[status] || 'text-gray-600'
}

function tableStatusLabel(status) {
  return status === 'available' ? 'Empty' : status.charAt(0).toUpperCase() + status.slice(1)
}

async function fetchTables() {
  loading.value = true
  try {
    const response = await tablesApi.list()
    tables.value = response.data.data
  } finally {
    loading.value = false
  }
}

function selectTable(table) {
  selectedTable.value = { ...table }
  generateQrCode(selectedTable.value)
}

async function createTable() {
  if (!createForm.value.number) {
    createError.value = 'Table number is required.'
    return
  }
  createLoading.value = true
  createError.value = ''
  try {
    await tablesApi.create(createForm.value)
    showCreateModal.value = false
    createForm.value = { number: '', capacity: 4 }
    await fetchTables()
  } catch (e) {
    createError.value = e.response?.data?.message || 'Failed to create table.'
  } finally {
    createLoading.value = false
  }
}

async function changeStatus(table, status) {
  if (table.status === status) return
  await tablesApi.update(table.id, { status })
  selectedTable.value = null
  await fetchTables()
}

async function deleteTable(table) {
  if (!confirm(`Delete Table ${table.number}?`)) return
  await tablesApi.delete(table.id)
  selectedTable.value = null
  await fetchTables()
}

function qrLink(table) {
  const frontendUrl = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, '')
  return `${frontendUrl}/order?table=${encodeURIComponent(table.qr_code)}`
}

async function generateQrCode(table) {
  qrGenerating.value = true
  qrCodeDataUrl.value = ''
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(qrLink(table), {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
  } finally {
    qrGenerating.value = false
  }
}

function printQrCode(table) {
  const printWindow = window.open('', '_blank', 'width=480,height=560')
  if (!printWindow || !qrCodeDataUrl.value) return
  const title = `Table ${table.number} QR code`
  const image = qrCodeDataUrl.value
  const link = qrLink(table)
  printWindow.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:32px}img{width:300px;height:300px}p{word-break:break-all}</style></head><body><h1>${title}</h1><img src="${image}" alt="${title}"><p>${link}</p><script>window.onload=()=>window.print()<\/script></body></html>`)
  printWindow.document.close()
}

onMounted(() => {
  fetchTables()
  refreshTimer = window.setInterval(fetchTables, 10000)
})

onUnmounted(() => window.clearInterval(refreshTimer))
</script>

<template>
  <AppLayout>
    <div class="p-4 sm:p-6">

      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Tables</h1>
          <p class="text-gray-500 text-sm mt-0.5">Manage restaurant tables and status</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Table
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ counts.available }}</p>
          <p class="text-sm text-gray-500 mt-0.5">Empty</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-red-500">{{ counts.occupied }}</p>
          <p class="text-sm text-gray-500 mt-0.5">Occupied</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-yellow-500">{{ counts.reserved }}</p>
          <p class="text-sm text-gray-500 mt-0.5">Reserved</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-20 text-gray-400">
        Loading tables...
      </div>

      <div v-else-if="tables.length === 0" class="text-center py-20">
        <p class="text-gray-400 text-lg">No tables yet</p>
        <p class="text-gray-400 text-sm mt-1">Click "Add Table" to create your first table</p>
      </div>

      <div v-else class="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        <div
          v-for="table in tables"
          :key="table.id"
          :class="cardClass(table.status)"
          class="rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md"
          @click="selectTable(table)"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-2xl font-bold">{{ table.number }}</span>
            <span :class="dotClass(table.status)" class="w-3 h-3 rounded-full"></span>
          </div>
          <p class="text-sm font-medium">{{ tableStatusLabel(table.status) }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ table.capacity }} seats</p>
        </div>
      </div>

    </div>

    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
      <div class="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Add New Table</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
            <input
              v-model.number="createForm.number"
              type="number"
              min="1"
              placeholder="e.g. 5"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              v-model.number="createForm.capacity"
              type="number"
              min="1"
              placeholder="e.g. 4"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div v-if="createError" class="text-red-500 text-sm mt-3">{{ createError }}</div>

        <div class="flex gap-3 mt-6">
          <button
            @click="showCreateModal = false; createError = ''"
            class="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="createTable"
            :disabled="createLoading"
            class="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {{ createLoading ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedTable" class="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
      <div class="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-gray-900">Table {{ selectedTable.number }}</h2>
          <button @click="selectedTable = null" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div class="space-y-2 mb-6">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Capacity</span>
            <span class="font-medium">{{ selectedTable.capacity }} seats</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Status</span>
            <span :class="statusTextClass(selectedTable.status)" class="font-medium capitalize">
              {{ tableStatusLabel(selectedTable.status) }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">QR Code</span>
            <span class="font-mono text-xs text-gray-400">{{ selectedTable.qr_code?.slice(0, 16) }}...</span>
          </div>
        </div>

        <div class="border border-gray-200 rounded-xl p-4 mb-6 text-center">
          <p class="text-sm font-semibold text-gray-800 mb-3">Scan to order at this table</p>
          <img
            v-if="qrCodeDataUrl"
            :src="qrCodeDataUrl"
            :alt="`QR code for table ${selectedTable.number}`"
            class="w-48 h-48 mx-auto"
          />
          <p v-else-if="qrGenerating" class="h-48 flex items-center justify-center text-sm text-gray-400">Generating QR code…</p>
          <p class="text-xs text-gray-400 mt-2 break-all">{{ qrLink(selectedTable) }}</p>
          <button
            type="button"
            @click="printQrCode(selectedTable)"
            :disabled="!qrCodeDataUrl"
            class="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Print QR code
          </button>
        </div>

        <div class="mb-6">
          <p class="text-sm font-medium text-gray-700 mb-2">Change Status</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="status in ['available', 'occupied', 'reserved']"
              :key="status"
              @click="changeStatus(selectedTable, status)"
              :class="selectedTable.status === status
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'"
              class="border text-xs font-medium py-2 rounded-lg capitalize transition-colors"
            >
              {{ tableStatusLabel(status) }}
            </button>
          </div>
        </div>

        <button
          @click="deleteTable(selectedTable)"
          class="w-full border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Delete Table
        </button>
      </div>
    </div>

  </AppLayout>
</template>
