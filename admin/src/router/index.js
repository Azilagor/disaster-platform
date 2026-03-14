import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  {
    path: '/login',
    name: 'AdminLogin',
    component: () => import('../views/LoginPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('../components/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/DashboardPage.vue') },
      { path: 'users', name: 'Users', component: () => import('../views/UsersListPage.vue') },
      { path: 'users/:id', name: 'UserDetail', component: () => import('../views/UserDetailPage.vue') },
      { path: 'requests', name: 'Requests', component: () => import('../views/RequestsListPage.vue') },
      { path: 'requests/:id', name: 'RequestDetail', component: () => import('../views/RequestDetailPage.vue') },
      { path: 'incidents', name: 'Incidents', component: () => import('../views/IncidentsListPage.vue') },
      { path: 'incidents/new', name: 'IncidentNew', component: () => import('../views/IncidentFormPage.vue') },
      { path: 'incidents/:id', name: 'IncidentDetail', component: () => import('../views/IncidentDetailPage.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
    await authStore.fetchUser().catch(() => {})
    if (!authStore.isAdmin) {
      authStore.logout()
      next({ path: '/login', query: { error: 'admin_only' } })
      return
    }
  }
  if (to.meta.guest && authStore.isAuthenticated && authStore.isAdmin) {
    next('/')
    return
  }
  next()
})

export default router
