import { login, logout, getInfo } from '@/api/user'
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
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_EMAIL: (state, email) => {
    state.email = email
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  SET_USER: (state, user) => {
    state.user = user
  }
}

const actions = {
  // User login
  login({ commit }, userInfo) {
    const { email, password } = userInfo
    return new Promise((resolve, reject) => {
      login({ email: email.trim(), password: password })
        .then(response => {
          console.log('🔍 Full Response:', response)
          
          const { data } = response
          
          // Backend sendet: { success: true, data: { token, user } }
          const token = data.data?.token || data.token
          const user = data.data?.user || data.user
          
          console.log('🔍 Token:', token)
          console.log('🔍 User:', user)
          
          if (!token) {
            reject('No token received')
            return
          }
          
          commit('SET_TOKEN', token)
          setToken(token)
          resolve()
        })
        .catch(error => {
          console.error('❌ Login error:', error)
          reject(error)
        })
    })
  },

  // Google OAuth login
  googleLogin({ commit }, token) {
    return new Promise((resolve, reject) => {
      commit('SET_TOKEN', token)
      setToken(token)
      resolve()
    })
  },

  // Get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      getInfo(state.token)
        .then(response => {
          console.log('🔍 GetInfo Response:', response)
          
          const { data } = response
          
          // Backend sendet: { success: true, data: { user } }
          const userData = data.data || data
          
          console.log('🔍 User Data:', userData)

          if (!userData) {
            reject('Verification failed, please Login again.')
            return
          }

          const { name, email, avatar, role } = userData
          
          // Verwende role statt roles (Backend sendet role als String)
          const roles = role ? [role] : ['staff']

          commit('SET_ROLES', roles)
          commit('SET_NAME', name)
          commit('SET_EMAIL', email)
          commit('SET_AVATAR', avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png')
          commit('SET_USER', userData)
          resolve(userData)
        })
        .catch(error => {
          console.error('❌ GetInfo error:', error)
          reject(error)
        })
    })
  },

  // User logout
  logout({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
      logout(state.token)
        .then(() => {
          commit('SET_TOKEN', '')
          commit('SET_ROLES', [])
          commit('SET_USER', null)
          removeToken()
          resetRouter()

          // reset visited views and cached views
          // dispatch('tagsView/delAllViews', null, { root: true })

          resolve()
        })
        .catch(error => {
          reject(error)
        })
    })
  },

  // Remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      commit('SET_USER', null)
      removeToken()
      resolve()
    })
  },

  // Dynamically modify permissions
  async changeRoles({ commit, dispatch }, role) {
    const token = role + '-token'

    commit('SET_TOKEN', token)
    setToken(token)

    const { roles } = await dispatch('getInfo')

    resetRouter()

    // generate accessible routes map based on roles
    const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })
    // dynamically add accessible routes
    router.addRoute(accessRoutes)

    // reset visited views and cached views
    dispatch('tagsView/delAllViews', null, { root: true })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters: {
    isAuthenticated: (state) => !!state.token,
    user: (state) => state.user || {
      name: state.name,
      email: state.email,
      avatar: state.avatar,
      roles: state.roles
    }
  }
}