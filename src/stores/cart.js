import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const tableId = ref(null)

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.subtotal, 0)
  )

  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  function addItem(menuItem, quantity = 1, modifiers = [], specialRequest = '') {
    const modifierTotal = modifiers.reduce((sum, m) => sum + m.price_delta, 0)
    const unitPrice = parseFloat(menuItem.price) + modifierTotal

    const existing = items.value.find(i =>
      i.menu_item_id === menuItem.id &&
      JSON.stringify(i.modifiers) === JSON.stringify(modifiers)
    )

    if (existing) {
      existing.quantity += quantity
      existing.subtotal = existing.unit_price * existing.quantity
    } else {
      items.value.push({
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity,
        unit_price: unitPrice,
        subtotal: unitPrice * quantity,
        modifiers,
        special_request: specialRequest,
      })
    }
  }

  function removeItem(index) {
    items.value.splice(index, 1)
  }

  function updateQuantity(index, quantity) {
    if (quantity <= 0) {
      removeItem(index)
      return
    }
    items.value[index].quantity = quantity
    items.value[index].subtotal = items.value[index].unit_price * quantity
  }

  function clearCart() {
    items.value = []
    tableId.value = null
  }

  function setTable(id) {
    tableId.value = id
  }

  return {
    items, tableId, total, itemCount,
    addItem, removeItem, updateQuantity, clearCart, setTable,
  }
})
