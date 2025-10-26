// frontend/src/store/modules/ingredients.js
// FIXED to work with new backend API format

import {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getLowStockIngredients
} from '@/api/ingredients';

const state = {
  ingredients: [],
  currentIngredient: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  }
}

const getters = {
  ingredients: state => state.ingredients,
  currentIngredient: state => state.currentIngredient,
  loading: state => state.loading,
  pagination: state => state.pagination,
  lowStockIngredients: state => state.ingredients.filter(i => 
    parseFloat(i.stockQuantity) <= parseFloat(i.minStock)
  )
}

const mutations = {
  SET_INGREDIENTS(state, ingredients) {
    state.ingredients = ingredients
  },
  SET_CURRENT_INGREDIENT(state, ingredient) {
    state.currentIngredient = ingredient
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination }
  },
  ADD_INGREDIENT(state, ingredient) {
    state.ingredients.unshift(ingredient)
  },
  UPDATE_INGREDIENT(state, updatedIngredient) {
    const index = state.ingredients.findIndex(i => i.id === updatedIngredient.id)
    if (index !== -1) {
      state.ingredients.splice(index, 1, updatedIngredient)
    }
  },
  REMOVE_INGREDIENT(state, ingredientId) {
    state.ingredients = state.ingredients.filter(i => i.id !== ingredientId)
  }
}

const actions = {
  async fetchIngredients({ commit }, params = {}) {
    commit('SET_LOADING', true)
    try {
      const response = await getIngredients(params)
      
      // Backend returns: { success: true, data: [...], pagination: {...} }
      commit('SET_INGREDIENTS', response.data || [])
      
      if (response.pagination) {
        commit('SET_PAGINATION', {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.pages
        })
      }
      
      return response
    } catch (error) {
      console.error('Error fetching ingredients:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchIngredient({ commit }, ingredientId) {
    commit('SET_LOADING', true)
    try {
      const response = await getIngredient(ingredientId)
      commit('SET_CURRENT_INGREDIENT', response.data)
      return response
    } catch (error) {
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createIngredient({ commit, dispatch }, ingredientData) {
    try {
      const response = await createIngredient(ingredientData)
      
      if (response.data) {
        commit('ADD_INGREDIENT', response.data)
      }
      
      await dispatch('fetchIngredients', { limit: 50 })
      return response
    } catch (error) {
      throw error
    }
  },

  async updateIngredient({ commit, dispatch }, { id, data }) {
    try {
      const response = await updateIngredient(id, data)
      
      if (response.data) {
        commit('UPDATE_INGREDIENT', response.data)
      }
      
      await dispatch('fetchIngredients', { limit: 50 })
      return response
    } catch (error) {
      throw error
    }
  },

  async deleteIngredient({ commit }, ingredientId) {
    try {
      await deleteIngredient(ingredientId)
      commit('REMOVE_INGREDIENT', ingredientId)
    } catch (error) {
      throw error
    }
  },

  async updateStock({ commit }, { id, quantity, operation }) {
    try {
      const response = await updateIngredient(id, { 
        stockQuantity: quantity,
        operation 
      })
      
      if (response.data) {
        commit('UPDATE_INGREDIENT', response.data)
      }
      
      return response
    } catch (error) {
      throw error
    }
  },

  async fetchLowStock({ commit }) {
    try {
      const response = await getLowStockIngredients()
      return response.data || []
    } catch (error) {
      console.error('Error fetching low stock:', error)
      return []
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}