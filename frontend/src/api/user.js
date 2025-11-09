import request from '@/utils/request'

/**
 * 🟢 Login (E-Mail & Passwort)
 */
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * 🟢 Google OAuth Login
 */
export function googleLogin(data) {
  return request({
    url: '/auth/google',
    method: 'post',
    data
  })
}

/**
 * 👤 Aktuelles Benutzerprofil abrufen
 */
export function getProfile() {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

/**
 * ✏️ Benutzerprofil aktualisieren
 */
export function updateUserProfile(data) {
  return request({
    url: '/auth/profile',
    method: 'put',
    data
  })
}

/**
 * 🔐 Passwort ändern
 */
export function changePassword(data) {
  return request({
    url: '/auth/change-password',
    method: 'post',
    data
  })
}

/**
 * 🚪 Benutzer-Logout
 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}
