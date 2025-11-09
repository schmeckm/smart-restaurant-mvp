// =====================================
// ✅ Vuex Modul: user.js (final funktionierend)
// =====================================
import { login, logout, getProfile, updateUserProfile, changePassword } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import router, { resetRouter } from '@/router'

const state = {
  token: getToken(),
  name: '',
  email: '',
  avatar: '',
  roles: [],
  user: null
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
  },
  SET_USER(state, user) {
    state.user = user
  },
  SET_NAME(state, name) {
    state.name = name
  },
  SET_EMAIL(state, email) {
    state.email = email
  },
  SET_AVATAR(state, avatar) {
    state.avatar = avatar
  },
  SET_ROLES(state, roles) {
    state.roles = roles
  },
  CLEAR_USER_DATA(state) {
    state.token = ''
    state.user = null
    state.roles = []
    removeToken()
  }
}

const actions = {
  // 🔐 LOGIN
  async login({ commit, dispatch }, userInfo) {
    const { email, password } = userInfo
    const response = await login({ email: email.trim(), password })
    const token = response.data?.token || response.data?.data?.token
    if (!token) throw new Error('Kein Token vom Server erhalten')

    commit('SET_TOKEN', token)
    setToken(token)

    const user = await dispatch('getInfo')
    commit('SET_USER', user)
    return user
  },

  // 👤 Benutzerinformationen abrufen
  async getInfo({ commit }) {
    const response = await getProfile()
    const data = response.data?.data || response.data
    if (!data) throw new Error('Benutzerdaten nicht gefunden')

    const { name, email, avatar, role, restaurant, uiLanguage } = data
    const roles = role ? [role] : ['employee']

    commit('SET_NAME', name)
    commit('SET_EMAIL', email)
    commit('SET_AVATAR', avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png')
    commit('SET_ROLES', roles)
    commit('SET_USER', data)

    return data
  },

  // ✏️ Profil aktualisieren
  async updateProfile({ commit }, profileData) {
    const response = await updateUserProfile(profileData)
    const updated = response.data?.data || response.data
    commit('SET_USER', updated)
    commit('SET_NAME', updated.name)
    commit('SET_EMAIL', updated.email)
    return updated
  },

  // 🔐 Passwort ändern
  async changePassword({ }, { currentPassword, newPassword }) {
    const response = await changePassword({ currentPassword, newPassword })
    return response
  },

  // 🚪 LOGOUT
  async logout({ commit }) {
    try {
      await logout()
    } catch (e) {
      console.warn('Logout fehlgeschlagen, Session wird trotzdem beendet')
    } finally {
      commit('CLEAR_USER_DATA')
      resetRouter()
    }
  },

  // ❌ Token zurücksetzen
  resetToken({ commit }) {
    commit('CLEAR_USER_DATA')
  }
}

const getters = {
  token: state => state.token,
  isAuthenticated: state => !!state.token,
  user: state => state.user,
  roles: state => state.roles,
  name: state => state.name,
  email: state => state.email,
  avatar: state => state.avatar
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
