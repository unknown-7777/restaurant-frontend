import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/auth/LoginPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../pages/admin/DashboardPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager'] },
  },
  {
    path: '/menu',
    name: 'menu',
    component: () => import('../pages/admin/MenuPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager'] },
  },
  {
    path: '/tables',
    name: 'tables',
    component: () => import('../pages/admin/TablesPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager', 'waiter'] },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('../pages/waiter/OrdersPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager', 'waiter', 'cashier'] },
  },
  {
    path: '/orders/:id',
    name: 'order-detail',
    component: () => import('../pages/waiter/OrderDetailPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager', 'waiter', 'cashier'] },
  },
  {
    path: '/kitchen',
    name: 'kitchen',
    component: () => import('../pages/kitchen/KitchenPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager', 'kitchen'] },
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('../pages/UnauthorizedPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from) => {
  const auth = useAuthStore()

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return { name: 'unauthorized' }
  }
})

export default router
