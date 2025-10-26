// frontend/src/store/modules/categories.js
// CORRECTED VERSION WITH PROPER ERROR HANDLING

import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories'

const state = {
  categories: [],
  loading: false,
  lastError: null // Track last error for debugging
}

const mutations = {
  SET_CATEGORIES(state, categories) {
    state.categories = categories
  },
  ADD_CATEGORY(state, category) {
    state.categories.push(category)
  },
  UPDATE_CATEGORY(state, updatedCategory) {
    const index = state.categories.findIndex(cat => cat.id === updatedCategory.id);
    if (index !== -1) {
      state.categories.splice(index, 1, { ...state.categories[index], ...updatedCategory });
    }
  },
  REMOVE_CATEGORY(state, categoryId) {
    const index = state.categories.findIndex(cat => cat.id === categoryId);
    if (index !== -1) {
      state.categories.splice(index, 1);
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.lastError = error
  }
}

const actions = {
  // ==========================================
  // ENHANCED FETCH CATEGORIES WITH ERROR HANDLING
  // ==========================================
  async fetchCategories({ commit }, params = {}) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      console.log('🔄 Fetching categories...')
      console.log('🔑 Token exists:', !!localStorage.getItem('token'))
      
      const response = await getCategories(params)
      const { data } = response
      
      console.log('✅ Categories API response:', response.status)
      console.log('✅ Categories data:', data)
      
      const categories = data.categories || data || []
      console.log('✅ Setting categories:', categories.length)
      
      commit('SET_CATEGORIES', categories)
      return response
      
    } catch (error) {
      console.error('❌ Categories fetch failed:', error)
      console.error('❌ Error status:', error.response?.status)
      console.error('❌ Error data:', error.response?.data)
      
      // Store error for debugging
      commit('SET_ERROR', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
      })
      
      // ✅ CRITICAL: Set empty array to trigger fallback categories
      commit('SET_CATEGORIES', [])
      
      // Handle specific error types
      if (error.response?.status === 401) {
        console.warn('🚨 Categories API: 401 Unauthorized - Token expired or invalid')
        // Don't throw error, let UI handle gracefully with fallbacks
        return { data: { categories: [] } }
      } else if (error.response?.status === 403) {
        console.warn('🚨 Categories API: 403 Forbidden - No permission')
        return { data: { categories: [] } }
      } else {
        console.warn('🚨 Categories API: Network or server error')
        return { data: { categories: [] } }
      }
      
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // ==========================================
  // ENHANCED CREATE CATEGORY
  // ==========================================
  async createCategory({ commit, dispatch }, categoryData) {
    try {
      console.log('📝 Creating category:', categoryData.name)
      
      const response = await createCategory(categoryData)
      
      if (response.data) {
        commit('ADD_CATEGORY', response.data)
        console.log('✅ Category created:', response.data.name)
      }
      
      // Reload to ensure consistency
      await dispatch('fetchCategories')
      return response
    } catch (error) {
      console.error('❌ Error creating category:', error)
      console.error('❌ Error details:', error.response?.data)
      throw error
    }
  },

  // ==========================================
  // ENHANCED UPDATE CATEGORY
  // ==========================================
  async updateCategory({ commit }, { id, data: categoryData }) {
    try {
      console.log('🔄 Updating category:', id, 'with data:', categoryData)
      
      const response = await updateCategory(id, categoryData)
      console.log('✅ Category update response:', response)
      
      // Direct state update
      if (response.data) {
        commit('UPDATE_CATEGORY', response.data)
      } else {
        // Fallback: Merge with existing data
        commit('UPDATE_CATEGORY', { id, ...categoryData })
      }
      
      return response
    } catch (error) {
      console.error('❌ Error updating category:', error)
      console.error('❌ Error details:', error.response?.data)
      throw error
    }
  },

  // ==========================================
  // ENHANCED DELETE CATEGORY
  // ==========================================
  async deleteCategory({ commit, dispatch }, id) {
    try {
      console.log('🗑️ Deleting category:', id)
      
      await deleteCategory(id)
      commit('REMOVE_CATEGORY', id)
      
      console.log('✅ Category deleted successfully')
    } catch (error) {
      console.error('❌ Error deleting category:', error)
      // Bei Fehler: Reload zur Sicherheit
      await dispatch('fetchCategories')
      throw error
    }
  },

  // ==========================================
  // NEW: FORCE REFRESH CATEGORIES
  // ==========================================
  async refreshCategories({ dispatch }) {
    console.log('🔄 Force refreshing categories...')
    return await dispatch('fetchCategories')
  },

  // ==========================================
  // NEW: CHECK CATEGORIES STATUS
  // ==========================================
  checkCategoriesStatus({ state }) {
    return {
      hasCategories: state.categories.length > 0,
      categoriesCount: state.categories.length,
      isLoading: state.loading,
      lastError: state.lastError,
      tokenExists: !!localStorage.getItem('token')
    }
  }
}

const getters = {
  categories: state => state.categories,
  activeCategories: state => state.categories.filter(c => c.is_active),
  loading: state => state.loading,
  lastError: state => state.lastError,
  
  // ==========================================
  // NEW: ENHANCED GETTERS
  // ==========================================
  categoriesCount: state => state.categories.length,
  hasCategories: state => state.categories.length > 0,
  categoriesWithErrors: state => ({
    categories: state.categories,
    hasError: !!state.lastError,
    error: state.lastError
  }),
  
  // Get category by name (for form validation)
  getCategoryByName: (state) => (name) => {
    return state.categories.find(cat => 
      cat.name.toLowerCase() === name.toLowerCase()
    )
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}