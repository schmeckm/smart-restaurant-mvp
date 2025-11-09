const TokenKey = 'token'

export function getToken() {
  return localStorage.getItem(TokenKey)
}

export function setToken(token) {
  localStorage.setItem(TokenKey, token)
  return token
}

export function removeToken() {
  localStorage.removeItem(TokenKey)
}
