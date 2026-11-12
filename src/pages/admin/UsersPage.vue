<template>
  <AppLayout>
    <div class="p-4 sm:p-6">

      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
          <p class="text-gray-500 text-sm mt-0.5">Manage staff accounts and roles</p>
        </div>
        <button
          @click="openCreateModal"
          class="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add User
        </button>
      </div>

      <!-- Account status filter -->
      <div class="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          v-for="tab in activityTabs"
          :key="tab.value"
          @click="selectedActivity = tab.value"
          :class="selectedActivity === tab.value
            ? 'bg-gray-800 text-white'
            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Role filter -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          v-for="tab in roleTabs"
          :key="tab.value"
          @click="selectedRole = tab.value"
          :class="selectedRole === tab.value
            ? 'bg-orange-500 text-white'
            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search -->
      <div class="mb-4">
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email..."
          class="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-gray-400">
        Loading users...
      </div>

      <!-- Empty -->
      <div v-else-if="users.length === 0" class="text-center py-20">
        <p class="text-gray-400 text-lg">No users found</p>
      </div>

      <!-- Users table -->
      <div v-else class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table class="w-full min-w-[760px]">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left text-xs font-medium text-gray-500 px-4 py-3">Name</th>
              <th class="text-left text-xs font-medium text-gray-500 px-4 py-3">Email</th>
              <th class="text-left text-xs font-medium text-gray-500 px-4 py-3">Role</th>
              <th class="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
              <th class="text-left text-xs font-medium text-gray-500 px-4 py-3">Joined</th>
              <th class="text-right text-xs font-medium text-gray-500 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </div>
                  <span class="font-medium text-gray-900 text-sm">{{ user.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ user.email }}</td>
              <td class="px-4 py-3">
                <span :class="roleClass(user.role)" class="px-2 py-1 rounded-full text-xs font-medium capitalize">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="user.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-500'"
                  class="px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-400">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditModal(user)"
                    class="text-xs text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    @click="toggleActive(user)"
                    class="text-xs text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {{ user.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button
                    @click="deleteUser(user)"
                    class="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.last_page > 1" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
        <p class="text-sm text-gray-500">
          Showing {{ users.length }} of {{ meta.total }} users
        </p>
        <div class="flex gap-2">
          <button
            @click="page--; fetchUsers()"
            :disabled="page === 1"
            class="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <button
            @click="page++; fetchUsers()"
            :disabled="page === meta.last_page"
            class="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

    </div>

    <!-- Create / Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
      <div class="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900">
            {{ editingUser ? 'Edit User' : 'Add User' }}
          </h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              maxlength="255"
              placeholder="e.g. John Smith"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="john@restaurant.com"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Password {{ editingUser ? '(leave blank to keep current)' : '' }}
            </label>
            <input
              v-model="form.password"
              type="password"
              :required="!editingUser"
              minlength="8"
              placeholder="Min 8 characters"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              v-model="form.role"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="waiter">Waiter</option>
              <option value="cashier">Cashier</option>
              <option value="kitchen">Kitchen</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="form.is_active"
              type="checkbox"
              id="user_active"
              class="rounded"
            />
            <label for="user_active" class="text-sm text-gray-700">Active account</label>
          </div>
        </div>

        <div v-if="formError" class="text-red-500 text-sm mt-3">{{ formError }}</div>

        <div class="flex gap-3 mt-6">
          <button
            @click="showModal = false"
            :disabled="formLoading"
            class="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="saveUser"
            :disabled="formLoading"
            class="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
          >
            {{ formLoading ? 'Saving...' : editingUser ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

  </AppLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import AppLayout from '../../components/layout/AppLayout.vue'
import { usersApi } from '../../api/users'

const users = ref([])
const loading = ref(true)
const selectedRole = ref('all')
const selectedActivity = ref('active')
const search = ref('')
const page = ref(1)
const meta = ref({ total: 0, last_page: 1 })

const showModal = ref(false)
const formLoading = ref(false)
const formError = ref('')
const editingUser = ref(null)
const form = ref({
  name: '', email: '', password: '', role: '', is_active: true,
})

const roleTabs = [
  { label: 'All Staff', value: 'all' },
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Waiter', value: 'waiter' },
  { label: 'Cashier', value: 'cashier' },
  { label: 'Kitchen', value: 'kitchen' },
  { label: 'Customer', value: 'customer' },
]

const activityTabs = [
  { label: 'Active Users', value: 'active' },
  { label: 'Inactive Users', value: 'inactive' },
  { label: 'All Users', value: 'all' },
]

function roleClass(role) {
  return {
    admin:    'bg-purple-100 text-purple-700',
    manager:  'bg-blue-100 text-blue-700',
    waiter:   'bg-orange-100 text-orange-700',
    cashier:  'bg-green-100 text-green-700',
    kitchen:  'bg-yellow-100 text-yellow-700',
    customer: 'bg-gray-100 text-gray-600',
  }[role] || 'bg-gray-100 text-gray-600'
}

function formatDate(datetime) {
  return new Date(datetime).toLocaleDateString([], {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

async function fetchUsers() {
  loading.value = true
  try {
    const params = { page: page.value, per_page: 20 }
    if (selectedRole.value !== 'all') params.role = selectedRole.value
    if (selectedActivity.value !== 'all') params.is_active = selectedActivity.value === 'active'
    if (search.value) params.search = search.value
    const response = await usersApi.list(params)
    users.value = response.data.data.users
    meta.value = response.data.data.meta
  } catch (e) {
    alert(e.response?.data?.message || 'Could not load users. Please try again.')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingUser.value = null
  form.value = { name: '', email: '', password: '', role: '', is_active: true }
  formError.value = ''
  showModal.value = true
}

function openEditModal(user) {
  editingUser.value = user
  form.value = {
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    is_active: user.is_active,
  }
  formError.value = ''
  showModal.value = true
}

async function saveUser() {
  if (!form.value.name.trim() || !form.value.email.trim() || !form.value.role) {
    formError.value = 'Name, email and role are required.'
    return
  }
  if (!editingUser.value && !form.value.password) {
    formError.value = 'Password is required for new users.'
    return
  }
  formLoading.value = true
  formError.value = ''
  try {
    const data = { ...form.value }
    if (!data.password) delete data.password
    if (editingUser.value) {
      await usersApi.update(editingUser.value.id, data)
    } else {
      await usersApi.create(data)
    }
    showModal.value = false
    await fetchUsers()
  } catch (e) {
    formError.value = e.response?.data?.errors
      ? Object.values(e.response.data.errors).flat().join(' ')
      : e.response?.data?.message || 'Failed to save user.'
  } finally {
    formLoading.value = false
  }
}

async function toggleActive(user) {
  const previous = user.is_active
  user.is_active = !previous
  try {
    const response = await usersApi.toggleActive(user.id)
    const updated = response.data.data
    Object.assign(user, updated)
  } catch (e) {
    user.is_active = previous
    alert(e.response?.data?.message || 'Could not update this user status.')
  }
}

async function deleteUser(user) {
  if (!confirm(`Delete ${user.name}?`)) return
  try {
    await usersApi.delete(user.id)
    await fetchUsers()
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to delete user.')
  }
}

watch([selectedActivity, selectedRole, search], () => {
  page.value = 1
  fetchUsers()
})

onMounted(fetchUsers)
</script>
