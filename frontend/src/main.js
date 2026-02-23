import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.js'

// Импортируем все стили из дизайна
import './assets/styles/style.css'
import './assets/styles/auth.css'
import './assets/styles/dashboard.css'
import './assets/styles/form.css'
import './assets/styles/map.css'
import './assets/styles/profile.css'
import './assets/styles/volunteers.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const authStore = useAuthStore()
authStore.init()

app.mount('#app')
