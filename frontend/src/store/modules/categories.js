// FIXED: frontend/src/store/modules/categories.js
// Field name conversion between backend (camelCase) and frontend (snake_case)

import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories'

const state = {
  categories: [],
  loading: false,
  lastError: null
}

const mutations = {
  SET_CATEGORIES(state, categories) {
    // Normalize field names when setting categories
    state.categories = categories.map(cat => normalizeCategory(cat))
  },
  ADD_CATEGORY(state, category) {
    state.categories.push(normalizeCategory(category))
  },
  // 🔧 FIXED: UPDATE_CATEGORY with field name handling
  UPDATE_CATEGORY(state, updatedCategory) {
    const index = state.categories.findIndex(cat => cat.id === updatedCategory.id);
    if (index !== -1) {
      const normalizedUpdate = normalizeCategory(updatedCategory)
     
      // Merge and ensure both field formats are available
      const merged = {
        ...state.categories[index],
        ...normalizedUpdate,
        // Force both field formats for compatibility
       status: undefined
      }
      delete merged.status
      console.log('   Final merged:', merged)
      
      // Replace the category (this triggers Vue reactivity)
      state.categories.splice(index, 1, merged)
    } else {
      console.warn('🚨 Store: Category not found for update:', updatedCategory.id)
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

// 🔧 NEW: Helper function to normalize category field names
function normalizeCategory(category) {
  if (!category) return category
  
  // Extract active status from any possible field name
  let activeStatus = true // default
  if (category.isActive !== undefined) {
    activeStatus = category.isActive
  } else if (category.is_active !== undefined) {
    activeStatus = category.is_active
  }
  
  // Extract dates from any possible field name
  let createdAt = category.createdAt || category.created_at
  let updatedAt = category.updatedAt || category.updated_at
  
  return {
    ...category,
    // Ensure both field formats are always available
    isActive: activeStatus,
    is_active: activeStatus,
    createdAt: createdAt,
    created_at: createdAt,
    updatedAt: updatedAt,
    updated_at: updatedAt
  }
}

const actions = {
  async fetchCategories({ commit }, params = {}) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      console.log('🔄 Store: Fetching categories...')
      const response = await getCategories(params)
      const { data } = response
      
      console.log('✅ Store: Categories API response:', response.status)
      console.log('✅ Store: Raw categories data:', data)
      
      const categories = data.categories || data || []
      console.log('✅ Store: Setting categories:', categories.length)
      
      // Log first category structure for debugging
      if (categories.length > 0) {
        console.log('📋 Store: First category structure:', categories[0])
      }
      
      commit('SET_CATEGORIES', categories)
      return response
      
    } catch (error) {
      console.error('❌ Store: Categories fetch failed:', error)
      commit('SET_ERROR', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
      })
      commit('SET_CATEGORIES', [])
      
      if (error.response?.status === 401) {
        return { data: { categories: [] } }
      } else if (error.response?.status === 403) {
        return { data: { categories: [] } }
      } else {
        return { data: { categories: [] } }
      }
      
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createCategory({ commit, dispatch }, categoryData) {
    try {
      console.log('📝 Store: Creating category:', categoryData.name)
      const response = await createCategory(categoryData)
      
      if (response.data) {
        commit('ADD_CATEGORY', response.data)
        console.log('✅ Store: Category created:', response.data.name)
      }
      
      await dispatch('fetchCategories')
      return response
    } catch (error) {
      console.error('❌ Store: Error creating category:', error)
      throw error
    }
  },

  // 🔧 FIXED: Enhanced updateCategory action
  async updateCategory({ commit, state }, { id, data: categoryData }) {
    try {
      console.log('🔄 Store: Updating category:', id, 'with data:', categoryData)
      
      // Find current category in state
      const currentCategory = state.categories.find(cat => cat.id === id)
      console.log('📋 Store: Current category in state:', currentCategory)
      
      const response = await updateCategory(id, categoryData)
      console.log('✅ Store: Update API response:', response)
      
      if (response.data) {
        console.log('📥 Store: Update response data:', response.data)
        commit('UPDATE_CATEGORY', response.data)
      } else {
        console.log('📥 Store: No response.data, using fallback merge')
        // Fallback: Create update object with normalized fields
        const updateObject = {
          id,
          ...categoryData,
          // If updating is_active, also set isActive
          isActive: categoryData.is_active !== undefined ? categoryData.is_active : (currentCategory?.isActive),
          is_active: categoryData.is_active !== undefined ? categoryData.is_active : (currentCategory?.is_active)
        }
        commit('UPDATE_CATEGORY', updateObject)
      }
      
      return response
    } catch (error) {
      console.error('❌ Store: Error updating category:', error)
      throw error
    }
  },

  async deleteCategory({ commit, dispatch }, id) {
    try {
      console.log('🗑️ Store: Deleting category:', id)
      await deleteCategory(id)
      commit('REMOVE_CATEGORY', id)
      console.log('✅ Store: Category deleted successfully')
    } catch (error) {
      console.error('❌ Store: Error deleting category:', error)
      await dispatch('fetchCategories')
      throw error
    }
  },

  async refreshCategories({ dispatch }) {
    console.log('🔄 Store: Force refreshing categories...')
    return await dispatch('fetchCategories')
  },

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
  activeCategories: state => state.categories.filter(c => c.is_active || c.isActive),
  loading: state => state.loading,
  lastError: state => state.lastError,
  categoriesCount: state => state.categories.length,
  hasCategories: state => state.categories.length > 0,
  categoriesWithErrors: state => ({
    categories: state.categories,
    hasError: !!state.lastError,
    error: state.lastError
  }),
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