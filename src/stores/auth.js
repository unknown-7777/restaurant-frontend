import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isManager = computed(() => user.value?.role === 'manager')
  const isWaiter = computed(() => user.value?.role === 'waiter')
  const isKitchen = computed(() => user.value?.role === 'kitchen')
  const isCashier = computed(() => user.value?.role === 'cashier')

  const hasRole = (roles) => {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  async function login(credentials) {
    const response = await authApi.login(credentials)
    const { user: userData, token: userToken } = response.data.data
    user.value = userData
    token.value = userToken
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', userToken)
    return userData
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  return {
    user, token, isAuthenticated,
    isAdmin, isManager, isWaiter, isKitchen, isCashier,
    hasRole, login, logout,
  }
})
