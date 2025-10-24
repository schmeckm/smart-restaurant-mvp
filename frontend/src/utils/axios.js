// frontend/src/utils/axios.js
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api/v1'

// Set base URL
axios.defaults.baseURL = API_URL

// Request interceptor
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor
axios.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token')
          ElMessage.error('Sitzung abgelaufen. Bitte erneut anmelden.')
          router.push('/login')
          break
        case 403:
          ElMessage.error('Keine Berechtigung für diese Aktion')
          break
        case 404:
          ElMessage.error('Ressource nicht gefunden')
          break
        case 500:
          ElMessage.error('Serverfehler. Bitte später erneut versuchen.')
          break
        default:
          ElMessage.error(error.response.data?.message || 'Ein Fehler ist aufgetreten')
      }
    } else if (error.request) {
      ElMessage.error('Keine Verbindung zum Server')
    }
    return Promise.reject(error)
  }
)

export default axios