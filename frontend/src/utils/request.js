// frontend/src/utils/request.js
import axios from 'axios'
import store from '@/store'
import { getToken } from '@/utils/auth'

// Simple notification function
const notify = (message, type = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`)
  
  // Simple browser notification for errors
  if (type === 'error') {
    // You can replace this with any notification system you prefer
    console.error('API Error:', message)
  }
}

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API || 'http://localhost:5000/api/v1',
  timeout: 15000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent
    if (store.getters.token) {
      // let each request carry token
      config.headers['Authorization'] = 'Bearer ' + getToken()
    }
    return config
  },
  error => {
    // do something with request error
    console.log('Request Error:', error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * Determine the request status by custom code
   * Handle our API response structure: { success: true/false, data: ..., message: ... }
   */
  response => {
    console.log('API Response:', response.data) // Debug log

    const res = response.data

    // API returns success: true/false structure
    if (res.success === false) {
      notify(res.message || 'API Error', 'error')

      // Handle authentication errors
      if (response.status === 401) {
        const shouldReload = window.confirm('You have been logged out. Do you want to log in again?')
        if (shouldReload) {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        }
      }
      return Promise.reject(new Error(res.message || 'API Error'))
    } else {
      // Success case - return the response as-is
      return res
    }
  },
  error => {
    console.log('Response Error:', error) // for debug
    
    let message = 'Network Error'
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      if (data && data.message) {
        message = data.message
      } else if (status === 401) {
        message = 'Unauthorized - Please login again'
        // Auto logout on 401
        store.dispatch('user/resetToken').then(() => {
          location.reload()
        })
      } else if (status === 403) {
        message = 'Access denied'
      } else if (status === 404) {
        message = 'Resource not found'
      } else if (status === 500) {
        message = 'Server error'
      } else {
        message = `Error ${status}: ${error.response.statusText}`
      }
    } else if (error.request) {
      // Network error
      message = 'Network error - Please check your connection'
    }

    notify(message, 'error')
    
    return Promise.reject(error)
  }
)

export default service