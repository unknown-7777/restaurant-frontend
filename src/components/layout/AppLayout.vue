<template>
  <div class="min-h-screen bg-gray-50 flex">
    <aside class="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div class="p-5 border-b border-gray-200">
        <h2 class="font-bold text-gray-900">🍽 Restaurant</h2>
        <p class="text-xs text-gray-500 mt-0.5 capitalize">{{ auth.user?.role }}</p>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <router-link
          v-for="link in visibleLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          active-class="bg-orange-50 text-orange-600 font-medium"
        >
          <span>{{ link.icon }}</span>
          {{ link.label }}
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-200">
        <button
          @click="handleLogout"
          class="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>

    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const allLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'manager'] },
  { to: '/menu', label: 'Menu', icon: '🍔', roles: ['admin', 'manager'] },
  { to: '/tables', label: 'Tables', icon: '🪑', roles: ['admin', 'manager', 'waiter'] },
  { to: '/orders', label: 'Orders', icon: '📋', roles: ['admin', 'manager', 'waiter', 'cashier'] },
  { to: '/kitchen', label: 'Kitchen', icon: '👨‍🍳', roles: ['admin', 'manager', 'kitchen'] },
]

const visibleLinks = computed(() =>
  allLinks.filter(link => link.roles.includes(auth.user?.role))
)

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>
