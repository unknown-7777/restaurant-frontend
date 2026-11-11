<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <p class="text-sm text-gray-500">{{ label }}</p>
    <p class="text-3xl font-bold text-gray-900 mt-1">{{ value }}</p>
  </div>
</template>

<script setup>
defineProps({ label: String, value: [String, Number], color: String })
</script>
