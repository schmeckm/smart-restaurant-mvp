import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'

// 🔧 Dynamische Base-URL je nach Umgebung
const isLocal = window.location.hostname === 'localhost'

const service = axios.create({
  baseURL: isLocal
    ? 'http://localhost:3000/api/v1' // 👉 dein lokales Backend
    : 'https://iotshowroom.de/api/v1', // 👉 Produktivsystem
  timeout: 15000
})

// 🔐 Token an jede Anfrage anhängen
service.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// ⚙️ Einheitliches Error-Handling
service.interceptors.response.use(
  response => response.data,
  error => {
    const status = error.response?.status
    const message = error.response?.data?.message || 'Serverfehler'

    if (status === 401) {
      ElMessage.error('Nicht autorisiert – bitte neu anmelden')
      localStorage.removeItem('token')
      setTimeout(() => window.location.reload(), 1500)
    } else {
      ElMessage.error(message)
    }

    return Promise.reject(error)
  }
)

export default service
