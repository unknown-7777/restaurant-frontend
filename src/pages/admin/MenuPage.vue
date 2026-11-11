<template>
  <AppLayout>
    <div class="p-6">

      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p class="text-gray-500 text-sm mt-0.5">Manage categories and menu items</p>
        </div>
        <div class="flex gap-2">
          <button
            @click="showCategoryModal = true"
            class="border border-orange-500 text-orange-500 hover:bg-orange-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Category
          </button>
          <button
            @click="openCreateItem"
            class="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Menu Item
          </button>
        </div>
      </div>

      <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          @click="selectedCategory = null"
          :class="selectedCategory === null
            ? 'bg-orange-500 text-white'
            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
        >
          All Items
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = cat.id"
          :class="selectedCategory === cat.id
            ? 'bg-orange-500 text-white'
            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
        >
          {{ cat.name }}
          <span class="ml-1 opacity-70">({{ cat.items_count ?? 0 }})</span>
        </button>
      </div>

      <div v-if="loading" class="text-center py-20 text-gray-400">
        Loading menu items...
      </div>

      <div v-else-if="filteredItems.length === 0" class="text-center py-20">
        <p class="text-gray-400 text-lg">No items found</p>
        <p class="text-gray-400 text-sm mt-1">Click "+ Menu Item" to add your first item</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div class="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
            <img
              v-if="item.image_url"
              :src="item.image_url"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-4xl">🍽</span>
          </div>

          <div class="p-4">
            <div class="flex items-start justify-between mb-1">
              <h3 class="font-semibold text-gray-900">{{ item.name }}</h3>
              <span class="font-bold text-orange-500 ml-2">${{ item.price }}</span>
            </div>
            <p class="text-gray-500 text-xs mb-2">{{ item.category?.name }}</p>
            <p v-if="item.description" class="text-gray-400 text-xs line-clamp-2 mb-3">
              {{ item.description }}
            </p>

            <div class="flex items-center justify-between">
              <span
                :class="item.is_available
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-500'"
                class="text-xs font-medium px-2 py-1 rounded-full"
              >
                {{ item.is_available ? 'Available' : 'Unavailable' }}
              </span>
              <div class="flex gap-2">
                <button
                  @click="toggleAvailability(item)"
                  class="text-xs text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Toggle
                </button>
                <button
                  @click="openEditItem(item)"
                  class="text-xs text-blue-400 hover:text-blue-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  @click="deleteItem(item)"
                  class="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div v-if="showCategoryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Add Category</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              v-model="categoryForm.name"
              type="text"
              placeholder="e.g. Main Course"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              v-model.number="categoryForm.sort_order"
              type="number"
              min="0"
              placeholder="0"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div v-if="categoryError" class="text-red-500 text-sm mt-3">{{ categoryError }}</div>
        <div class="flex gap-3 mt-6">
          <button
            @click="showCategoryModal = false"
            class="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="createCategory"
            :disabled="categoryLoading"
            class="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
          >
            {{ categoryLoading ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showItemModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-900 mb-4">
          {{ editingItem ? 'Edit Menu Item' : 'Add Menu Item' }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              v-model="itemForm.category_id"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              v-model="itemForm.name"
              type="text"
              placeholder="e.g. Grilled Chicken"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              v-model="itemForm.description"
              rows="2"
              placeholder="Optional description"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              v-model.number="itemForm.price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              v-model.number="itemForm.sort_order"
              type="number"
              min="0"
              placeholder="0"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="itemForm.is_available"
              type="checkbox"
              id="is_available"
              class="rounded"
            />
            <label for="is_available" class="text-sm text-gray-700">Available for ordering</label>
          </div>
        </div>

        <div v-if="itemError" class="text-red-500 text-sm mt-3">{{ itemError }}</div>

        <div class="flex gap-3 mt-6">
          <button
            @click="showItemModal = false"
            class="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="saveItem"
            :disabled="itemLoading"
            class="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
          >
            {{ itemLoading ? 'Saving...' : editingItem ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/layout/AppLayout.vue'
import { categoriesApi } from '../../api/categories'
import { menuItemsApi } from '../../api/menuItems'

const categories = ref([])
const items = ref([])
const loading = ref(true)
const selectedCategory = ref(null)

const showCategoryModal = ref(false)
const categoryLoading = ref(false)
const categoryError = ref('')
const categoryForm = ref({ name: '', sort_order: 0 })

const showItemModal = ref(false)
const itemLoading = ref(false)
const itemError = ref('')
const editingItem = ref(null)
const itemForm = ref({
  category_id: '',
  name: '',
  description: '',
  price: '',
  sort_order: 0,
  is_available: true,
})

const filteredItems = computed(() => {
  if (!selectedCategory.value) return items.value
  return items.value.filter(i => i.category_id === selectedCategory.value)
})

async function fetchAll() {
  loading.value = true
  try {
    const [catRes, itemRes] = await Promise.all([
      categoriesApi.list(),
      menuItemsApi.list({ per_page: 100 }),
    ])
    categories.value = catRes.data.data
    items.value = itemRes.data.data.items
  } finally {
    loading.value = false
  }
}

async function createCategory() {
  if (!categoryForm.value.name) {
    categoryError.value = 'Name is required.'
    return
  }
  categoryLoading.value = true
  categoryError.value = ''
  try {
    await categoriesApi.create(categoryForm.value)
    showCategoryModal.value = false
    categoryForm.value = { name: '', sort_order: 0 }
    await fetchAll()
  } catch (e) {
    categoryError.value = e.response?.data?.message || 'Failed to create category.'
  } finally {
    categoryLoading.value = false
  }
}

function openCreateItem() {
  editingItem.value = null
  itemForm.value = {
    category_id: categories.value[0]?.id || '',
    name: '',
    description: '',
    price: '',
    sort_order: 0,
    is_available: true,
  }
  itemError.value = ''
  showItemModal.value = true
}

function openEditItem(item) {
  editingItem.value = item
  itemForm.value = {
    category_id: item.category_id,
    name: item.name,
    description: item.description || '',
    price: item.price,
    sort_order: item.sort_order,
    is_available: item.is_available,
  }
  itemError.value = ''
  showItemModal.value = true
}

async function saveItem() {
  if (!itemForm.value.category_id || !itemForm.value.name || !itemForm.value.price) {
    itemError.value = 'Category, name and price are required.'
    return
  }
  itemLoading.value = true
  itemError.value = ''
  try {
    if (editingItem.value) {
      await menuItemsApi.update(editingItem.value.id, itemForm.value)
    } else {
      await menuItemsApi.create(itemForm.value)
    }
    showItemModal.value = false
    await fetchAll()
  } catch (e) {
    itemError.value = e.response?.data?.message || 'Failed to save item.'
  } finally {
    itemLoading.value = false
  }
}

async function toggleAvailability(item) {
  await menuItemsApi.update(item.id, { is_available: !item.is_available })
  await fetchAll()
}

async function deleteItem(item) {
  if (!confirm(`Delete "${item.name}"?`)) return
  await menuItemsApi.delete(item.id)
  await fetchAll()
}

onMounted(fetchAll)
</script>
