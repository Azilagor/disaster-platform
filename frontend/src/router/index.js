import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/LoginPage.vue')
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../views/MapPage.vue')
  },
  {
    path: '/create-request',
    name: 'CreateRequest',
    component: () => import('../views/CreateRequestPage.vue')
  },
  {
    path: '/',
    component: () => import('../components/layout/AuthenticatedLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/DashboardPage.vue')
      },
      {
        path: 'volunteers',
        name: 'Volunteers',
        component: () => import('../views/VolunteersPage.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/ProfilePage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const authStore = useAuthStore()
  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
