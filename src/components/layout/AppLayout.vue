<template>
  <div class="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
    <button
      v-if="mobileMenuOpen"
      type="button"
      aria-label="Close navigation"
      class="fixed inset-0 z-40 bg-black/40 lg:hidden"
      @click="mobileMenuOpen = false"
    />

    <aside
      :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      class="fixed inset-y-0 left-0 z-50 w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen"
    >
      <div class="p-5 border-b border-gray-200">
        <h2 class="font-bold text-gray-900">🍽 Restaurant</h2>
        <p class="text-xs text-gray-500 mt-0.5 capitalize">{{ auth.user?.role }}</p>
      </div>

      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="relative group cursor-pointer" @click="triggerAvatarUpload" title="Change profile photo">
            <div class="w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center">
              <img
                v-if="auth.user?.avatar_url"
                :src="auth.user.avatar_url"
                class="w-full h-full object-cover"
                alt="Profile avatar"
              />
              <span v-else class="text-orange-600 font-bold text-sm">
                {{ auth.user?.name?.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span class="text-white text-xs">{{ avatarLoading ? '…' : '📷' }}</span>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ auth.user?.name }}</p>
            <p class="text-xs text-gray-400 capitalize">{{ auth.user?.role }}</p>
            <button
              v-if="auth.user?.avatar_url"
              type="button"
              class="text-xs text-red-500 hover:text-red-700 mt-1 disabled:opacity-50"
              :disabled="avatarLoading"
              @click="removeAvatar"
            >
              Remove photo
            </button>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <router-link
          v-for="link in visibleLinks"
          :key="link.to"
          :to="link.to"
          @click="mobileMenuOpen = false"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          active-class="bg-orange-50 text-orange-600 font-medium"
        >
          <span>{{ link.icon }}</span>
          {{ link.label }}
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-200">
        <input
          ref="avatarInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="uploadAvatar"
        />

        <button
          @click="handleLogout"
          class="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>

    <header class="lg:hidden sticky top-0 z-30 h-14 shrink-0 bg-white border-b border-gray-200 flex items-center gap-3 px-4">
      <button
        type="button"
        aria-label="Open navigation"
        :aria-expanded="mobileMenuOpen"
        class="w-10 h-10 rounded-lg hover:bg-gray-100 text-gray-700 text-xl"
        @click="mobileMenuOpen = true"
      >
        ☰
      </button>
      <span class="font-bold text-gray-900">🍽 Restaurant</span>
      <span class="ml-auto text-xs text-gray-500 capitalize">{{ auth.user?.role }}</span>
    </header>

    <main class="flex-1 min-w-0 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { usersApi } from '../../api/users'

const auth = useAuthStore()
const router = useRouter()
const avatarInput = ref(null)
const avatarLoading = ref(false)
const mobileMenuOpen = ref(false)

const allLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'manager'] },
  { to: '/users',     label: 'Users',      icon: '👥', roles: ['admin'] },
  { to: '/feedback',  label: 'Feedback',   icon: '⭐', roles: ['admin', 'manager'] },
  { to: '/menu',      label: 'Menu',       icon: '🍔', roles: ['admin', 'manager'] },
  { to: '/tables',    label: 'Tables',     icon: '🪑', roles: ['admin', 'manager', 'waiter'] },
  { to: '/orders',    label: 'Orders',     icon: '📋', roles: ['admin', 'manager', 'waiter', 'cashier'] },
  { to: '/kitchen',   label: 'Kitchen',    icon: '👨‍🍳', roles: ['admin', 'manager', 'kitchen'] },
]

const visibleLinks = computed(() =>
  allLinks.filter(link => link.roles.includes(auth.user?.role))
)

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

async function uploadAvatar(event) {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
    alert('Choose a JPEG, PNG or WebP image under 2 MB.')
    return
  }

  avatarLoading.value = true
  try {
    const response = await usersApi.uploadAvatar(file)
    // Update the user in the store
    auth.user = response.data.data
    localStorage.setItem('user', JSON.stringify(auth.user))
  } catch (e) {
    alert(e.response?.data?.errors?.avatar?.[0] || e.response?.data?.message || 'Failed to upload avatar.')
  } finally {
    avatarLoading.value = false
  }
}

async function removeAvatar() {
  if (!auth.user?.avatar_url || avatarLoading.value) return
  avatarLoading.value = true
  try {
    const response = await usersApi.removeAvatar()
    auth.user = response.data.data
    localStorage.setItem('user', JSON.stringify(auth.user))
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to remove avatar.')
  } finally {
    avatarLoading.value = false
  }
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>
