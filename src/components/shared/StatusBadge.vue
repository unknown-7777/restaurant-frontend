<template>
  <span :class="badgeClass" class="px-2 py-1 rounded-full text-xs font-semibold uppercase">
    {{ status }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ status: String })
const badgeClass = computed(() => ({
  'pending':   'bg-gray-100 text-gray-600',
  'confirmed': 'bg-blue-100 text-blue-700',
  'preparing': 'bg-yellow-100 text-yellow-700',
  'ready':     'bg-purple-100 text-purple-700',
  'served':    'bg-indigo-100 text-indigo-700',
  'paid':      'bg-green-100 text-green-700',
  'cancelled': 'bg-red-100 text-red-700',
}[props.status] || 'bg-gray-100 text-gray-600'))
</script>
