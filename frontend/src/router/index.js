import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/LoginPage.vue'),
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPasswordPage.vue'),
  },
  {
    path: '/',
    component: () => import('../components/layout/AuthenticatedLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/DashboardPage.vue'),
      },
      {
        path: 'map',
        name: 'Map',
        component: () => import('../views/MapPage.vue'),
      },
      {
        path: 'create-request',
        name: 'CreateRequest',
        component: () => import('../views/CreateRequestPage.vue'),
      },
      {
        path: 'my-requests',
        name: 'MyRequests',
        component: () => import('../views/MyRequestsPage.vue'),
      },
      {
        path: 'requests',
        name: 'CoordinatorRequests',
        component: () => import('../views/CoordinatorRequestsPage.vue'),
        meta: { roles: ['COORDINATOR', 'ADMIN'] },
      },
      {
        path: 'volunteers',
        name: 'Volunteers',
        component: () => import('../views/VolunteersPage.vue'),
        meta: { roles: ['COORDINATOR', 'ADMIN'] },
      },
      {
        path: 'incidents',
        name: 'Incidents',
        component: () => import('../views/IncidentsPage.vue'),
        meta: { roles: ['COORDINATOR', 'ADMIN'] },
      },
      {
        path: 'tasks',
        name: 'VolunteerTasks',
        component: () => import('../views/VolunteerTasksPage.vue'),
        meta: { roles: ['VOLUNTEER'] },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/ProfilePage.vue'),
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('../components/layout/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboardPage.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/AdminUsersPage.vue') },
      { path: 'users/:id', name: 'AdminUserDetail', component: () => import('../views/admin/AdminUserDetailPage.vue') },
      { path: 'requests', name: 'AdminRequests', component: () => import('../views/admin/AdminRequestsPage.vue') },
      { path: 'requests/:id', name: 'AdminRequestDetail', component: () => import('../views/admin/AdminRequestDetailPage.vue') },
      { path: 'incidents', name: 'AdminIncidents', component: () => import('../views/admin/AdminIncidentsPage.vue') },
      { path: 'incidents/new', name: 'AdminIncidentNew', component: () => import('../views/admin/AdminIncidentFormPage.vue') },
      { path: 'incidents/:id', name: 'AdminIncidentDetail', component: () => import('../views/admin/AdminIncidentDetailPage.vue') },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const allowedRoles = to.meta.roles
  const authStore = useAuthStore()
  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  if (allowedRoles?.length && authStore.user) {
    const role = (authStore.user.role || '').toUpperCase()
    if (!allowedRoles.includes(role)) {
      next('/dashboard')
      return
    }
  }
  next()
})

export default router
