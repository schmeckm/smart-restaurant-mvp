// ============================================
// frontend/src/api/index.js
// ============================================
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Response Interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          ElMessage.error('Sitzung abgelaufen')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          break
        case 403:
          ElMessage.error('Keine Berechtigung')
          break
        case 404:
          ElMessage.error('Nicht gefunden')
          break
        case 500:
          ElMessage.error('Serverfehler')
          break
        default:
          ElMessage.error(data.message || 'Fehler')
      }
    }
    return Promise.reject(error)
  }
)

const auth = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  googleAuth: (token) => apiClient.post('/auth/google', { token }),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  logout: () => apiClient.post('/auth/logout')
}

const products = {
  getAll: (params) => apiClient.get('/products', { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`)
}

const sales = {
  getAll: (params) => apiClient.get('/sales', { params }),
  getById: (id) => apiClient.get(`/sales/${id}`),
  create: (data) => apiClient.post('/sales', data),
  getAnalytics: (params) => apiClient.get('/sales/analytics', { params })
}

const setAuthToken = (token) => {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const removeAuthToken = () => {
  delete apiClient.defaults.headers.common['Authorization']
}

export default {
  auth,
  products,
  sales,
  setAuthToken,
  removeAuthToken
}
