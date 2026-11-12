<template>
  <AppLayout>
    <div class="p-4 sm:p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Customer feedback</h1>
        <p class="mt-1 text-sm text-gray-500">Ratings and comments from completed table orders</p>
      </div>

      <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>
      <div v-if="loading" class="py-16 text-center text-gray-400">Loading feedback…</div>
      <div v-else-if="feedback.length === 0" class="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-400">
        No customer feedback yet.
      </div>
      <div v-else class="space-y-3">
        <article v-for="entry in feedback" :key="entry.id" class="rounded-xl border border-gray-200 bg-white p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-gray-900">Table {{ entry.table?.number ?? '—' }}</p>
              <p class="text-xs text-gray-400">Order #{{ entry.order_id.slice(0, 8) }} · {{ formatDate(entry.created_at) }}</p>
            </div>
            <span class="text-xl tracking-wide text-amber-400" :aria-label="`${entry.rating} out of 5 stars`">
              {{ '★'.repeat(entry.rating) }}<span class="text-gray-200">{{ '★'.repeat(5 - entry.rating) }}</span>
            </span>
          </div>
          <p v-if="entry.comment" class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{{ entry.comment }}</p>
          <p v-else class="mt-3 text-sm italic text-gray-400">No written comment.</p>
        </article>
      </div>

      <div v-if="meta.last_page > 1" class="mt-4 flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ meta.total }} reviews</p>
        <div class="flex gap-2">
          <button @click="page--; fetchFeedback()" :disabled="page <= 1" class="rounded-lg border px-3 py-1 text-sm disabled:opacity-40">Previous</button>
          <button @click="page++; fetchFeedback()" :disabled="page >= meta.last_page" class="rounded-lg border px-3 py-1 text-sm disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AppLayout from '../../components/layout/AppLayout.vue'
import { feedbackApi } from '../../api/feedback'

const feedback = ref([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const meta = ref({ total: 0, last_page: 1 })

function formatDate(value) {
  return new Date(value).toLocaleString()
}

async function fetchFeedback() {
  loading.value = true
  error.value = ''
  try {
    const response = await feedbackApi.list({ page: page.value, per_page: 25 })
    feedback.value = response.data.data.feedback
    meta.value = response.data.data.meta
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not load customer feedback.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchFeedback)
</script>
