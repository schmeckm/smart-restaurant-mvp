// frontend/src/store/modules/forecasts.js
// ✅ FINAL FIXED VERSION – kompatibel mit aktuellem forecastController.js

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
  // ============================================================
  // 🔹 Alle Forecast-Versionen abrufen
  // ============================================================
  async fetchVersions({ commit }) {
    commit('SET_LOADING', true)
    try {
      console.log('📤 Fetching versions...')
      const response = await getForecastVersions()
      console.log('📥 Response:', response)

      // ✅ Backend liefert { success: true, data: [...] }
      const versions = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : []

      console.log('✅ Versions loaded:', versions)

      if (!Array.isArray(versions)) {
        console.error('❌ Versions is not an array')
        commit('SET_VERSIONS', [])
        return []
      }

      commit('SET_VERSIONS', versions)
      return versions
    } catch (error) {
      console.error('❌ Error fetching versions:', error)
      commit('SET_VERSIONS', [])
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // ============================================================
  // 🔹 Einzelne Version mit Items abrufen
  // ============================================================
  async fetchVersion({ commit }, versionId) {
    commit('SET_LOADING', true)
    try {
      console.log('📤 Fetching version:', versionId)
      const response = await getForecastVersion(versionId)
      console.log('📥 Response:', response)

      const version = response?.data?.data || response?.data
      console.log('✅ Loaded version:', version)

      if (!version) throw new Error('Version not found')

      version.items = version.items || version.forecastItems || []

      commit('SET_CURRENT_VERSION', version)
      return version
    } catch (error) {
      console.error('❌ Error fetching version:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // ============================================================
  // 🔹 Neue Version erstellen
  // ============================================================
  async createVersion({ commit }, versionData) {
    try {
      console.log('📤 Creating version:', versionData)
      const response = await createForecastVersion(versionData)
      console.log('📥 Response:', response)

      const newVersion = response?.data?.data || response?.data
      console.log('✅ Created version:', newVersion)

      if (!newVersion || !newVersion.id) throw new Error('Invalid version data')

      commit('ADD_VERSION', newVersion)
      return newVersion
    } catch (error) {
      console.error('❌ Error creating version:', error)
      throw error
    }
  },

  // ============================================================
  // 🔹 Version aktualisieren
  // ============================================================
  async updateVersion({ commit }, { id, data }) {
    try {
      console.log('📤 Updating version:', id)
      const response = await updateForecastVersion(id, data)
      const updatedVersion = response?.data?.data || response?.data
      console.log('✅ Updated version:', updatedVersion)

      if (updatedVersion) {
        commit('UPDATE_VERSION', updatedVersion)
        commit('SET_CURRENT_VERSION', updatedVersion)
      }
      return updatedVersion
    } catch (error) {
      console.error('❌ Error updating version:', error)
      throw error
    }
  },

  // ============================================================
  // 🔹 Version löschen
  // ============================================================
  async deleteVersion({ commit }, versionId) {
    try {
      await deleteForecastVersion(versionId)
      commit('REMOVE_VERSION', versionId)
      commit('SET_CURRENT_VERSION', null)
    } catch (error) {
      console.error('❌ Error deleting version:', error)
      throw error
    }
  },

  // ============================================================
  // 🔹 Version duplizieren
  // ============================================================
  async cloneVersion({ commit }, { id, name }) {
    try {
      console.log('📤 Cloning version:', id)
      const response = await cloneForecastVersion(id, { name })
      const clonedVersion = response?.data?.data || response?.data
      console.log('✅ Cloned version:', clonedVersion)

      if (clonedVersion) commit('ADD_VERSION', clonedVersion)
      return clonedVersion
    } catch (error) {
      console.error('❌ Error cloning version:', error)
      throw error
    }
  },

  // ============================================================
  // 🔹 Aktuelle Version manuell setzen
  // ============================================================
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
