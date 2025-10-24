import request from '@/utils/request'

/**
 * User login
 */
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * Google OAuth login
 */
export function googleLogin(data) {
  return request({
    url: '/auth/google',
    method: 'post',
    data
  })
}

/**
 * Get user info
 */
export function getInfo(token) {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

/**
 * User logout
 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}