// frontend/src/store/modules/forecasts.js

import {
  getForecastVersions,
  getForecastVersion,
  createForecastVersion,
  updateForecastVersion,
  deleteForecastVersion,
  cloneForecastVersion
} from '@/api/forecasts'

const state = {
  versions: [],
  currentVersion: null,
  loading: false
}

const mutations = {
  SET_VERSIONS(state, versions) {
    state.versions = Array.isArray(versions) ? versions : []
  },
  SET_CURRENT_VERSION(state, version) {
    state.currentVersion = version
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  ADD_VERSION(state, version) {
    if (version && version.id) {
      state.versions.unshift(version)
    } else {
      console.error('❌ ADD_VERSION: Invalid version object', version)
    }
  },
  UPDATE_VERSION(state, updatedVersion) {
    if (!updatedVersion || !updatedVersion.id) {
      console.error('❌ UPDATE_VERSION: Invalid version object', updatedVersion)
      return
    }
    const index = state.versions.findIndex(v => v.id === updatedVersion.id)
    if (index !== -1) {
      state.versions.splice(index, 1, updatedVersion)
    }
  },
  REMOVE_VERSION(state, versionId) {
    state.versions = state.versions.filter(v => v.id !== versionId)
  }
}

const actions = {
  async fetchVersions({ commit }) {
    commit('SET_LOADING', true)
    try {
      console.log('📤 Fetching versions...')
      const response = await getForecastVersions()
      console.log('📥 Response:', response)
      
      const versions = response.data || []
      console.log('✅ Versions:', versions)
      
      if (!Array.isArray(versions)) {
        console.error('❌ Versions is not an array')
        commit('SET_VERSIONS', [])
        return response
      }
      
      commit('SET_VERSIONS', versions)
      return response
    } catch (error) {
      console.error('❌ Error fetching versions:', error)
      commit('SET_VERSIONS', [])
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchVersion({ commit }, versionId) {
    commit('SET_LOADING', true)
    try {
      console.log('📤 Fetching version:', versionId)
      const response = await getForecastVersion(versionId)
      console.log('📥 Response:', response)
      
      const version = response.data  // ✅ FIX
      console.log('✅ Version:', version)
      
      if (!version) {
        throw new Error('Version not found')
      }
      
      commit('SET_CURRENT_VERSION', version)
      return version
    } catch (error) {
      console.error('❌ Error fetching version:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createVersion({ commit }, versionData) {
    try {
      console.log('📤 Creating version:', versionData)
      const response = await createForecastVersion(versionData)
      console.log('📥 Response:', response)
      
      const newVersion = response.data  // ✅ FIX
      console.log('✅ New version:', newVersion)
      
      if (!newVersion || !newVersion.id) {
        throw new Error('Invalid version data')
      }
      
      commit('ADD_VERSION', newVersion)
      return newVersion
    } catch (error) {
      console.error('❌ Error creating version:', error)
      throw error
    }
  },

  async updateVersion({ commit }, { id, data }) {
    try {
      const response = await updateForecastVersion(id, data)
      const updatedVersion = response.data  // ✅ FIX
      commit('UPDATE_VERSION', updatedVersion)
      commit('SET_CURRENT_VERSION', updatedVersion)
      return updatedVersion
    } catch (error) {
      console.error('Error updating version:', error)
      throw error
    }
  },

  async deleteVersion({ commit }, versionId) {
    try {
      await deleteForecastVersion(versionId)
      commit('REMOVE_VERSION', versionId)
      commit('SET_CURRENT_VERSION', null)
    } catch (error) {
      console.error('Error deleting version:', error)
      throw error
    }
  },

  async cloneVersion({ commit }, { id, name }) {
    try {
      const response = await cloneForecastVersion(id, { name })
      const clonedVersion = response.data  // ✅ FIX
      commit('ADD_VERSION', clonedVersion)
      return clonedVersion
    } catch (error) {
      console.error('Error cloning version:', error)
      throw error
    }
  },

  setCurrentVersion({ commit }, version) {
    commit('SET_CURRENT_VERSION', version)
  }
}

const getters = {
  versions: state => state.versions,
  currentVersion: state => state.currentVersion,
  loading: state => state.loading,
  baselineVersion: state => state.versions.find(v => v && v.isBaseline)
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}