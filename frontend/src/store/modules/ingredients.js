// frontend/src/store/modules/ingredients.js
// ✅ Fixed to match the new backend API response and frontend data structure

import {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getLowStockIngredients
} from '@/api/ingredients'

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
  lowStockIngredients: state =>
    state.ingredients.filter(i =>
      parseFloat(i.current_stock) <= parseFloat(i.min_stock)
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
  // ✅ Hauptliste laden
  async fetchIngredients({ commit }, params = {}) {
  commit('SET_LOADING', true)
  try {
    const response = await getIngredients(params)

    // ✅ Backend-Format BEIBEHALTEN (nicht transformieren)
    const mappedIngredients = (response.data || []).map(item => ({
      ...item, // Alle Backend-Felder übernehmen (pricePerUnit, stockQuantity, etc.)
      nutritionStatus: 'not_loaded', // Initial Status
      nutritionSource: null
    }))

    commit('SET_INGREDIENTS', mappedIngredients)
    commit('SET_PAGINATION', {
      total: response.count || 0
    })

    return { data: mappedIngredients, count: response.count || 0 }
  } catch (error) {
    console.error('❌ Error fetching ingredients:', error)
    throw error
  } finally {
    commit('SET_LOADING', false)
  }
},

  // ✅ Einzelne Zutat laden
  async fetchIngredient({ commit }, ingredientId) {
    commit('SET_LOADING', true)
    try {
      const response = await getIngredient(ingredientId)
      if (response.data) {
        commit('SET_CURRENT_INGREDIENT', response.data)
      }
      return response
    } catch (error) {
      console.error('❌ Error fetching ingredient:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // ✅ Neue Zutat anlegen
  async createIngredient({ commit, dispatch }, ingredientData) {
    try {
      const response = await createIngredient(ingredientData)

      if (response.data && response.data.data) {
        const newItem = response.data.data
        commit('ADD_INGREDIENT', {
          id: newItem.id,
          name: newItem.name,
          category: newItem.category || 'other',
          unit: newItem.unit,
          cost_per_unit: newItem.pricePerUnit || 0,
          current_stock: newItem.stockQuantity || 0,
          min_stock: newItem.minStockLevel || 0,
          supplier: newItem.supplier || '',
          isActive: newItem.isActive ?? true,
          restaurantId: newItem.restaurantId || null
        })
      }

      // Aktualisiere Liste nach Anlage
      await dispatch('fetchIngredients', { limit: 50 })
      return response
    } catch (error) {
      console.error('❌ Error creating ingredient:', error)
      throw error
    }
  },

  // ✅ Zutat aktualisieren
  async updateIngredient({ commit, dispatch }, { id, data }) {
    try {
      const response = await updateIngredient(id, data)

      if (response.data && response.data.data) {
        const updated = response.data.data
        commit('UPDATE_INGREDIENT', {
          id: updated.id,
          name: updated.name,
          category: updated.category || 'other',
          unit: updated.unit,
          cost_per_unit: updated.pricePerUnit || 0,
          current_stock: updated.stockQuantity || 0,
          min_stock: updated.minStockLevel || 0,
          supplier: updated.supplier || '',
          isActive: updated.isActive ?? true,
          restaurantId: updated.restaurantId || null
        })
      }

      // Nach Update komplette Liste neu laden
      await dispatch('fetchIngredients', { limit: 50 })
      return response
    } catch (error) {
      console.error('❌ Error updating ingredient:', error)
      throw error
    }
  },

  // ✅ Zutat löschen
  async deleteIngredient({ commit }, ingredientId) {
    try {
      await deleteIngredient(ingredientId)
      commit('REMOVE_INGREDIENT', ingredientId)
    } catch (error) {
      console.error('❌ Error deleting ingredient:', error)
      throw error
    }
  },

  // ✅ Bestand aktualisieren
  async updateStock({ commit }, { id, quantity, operation }) {
    try {
      const response = await updateIngredient(id, {
        stockQuantity: quantity,
        operation
      })

      if (response.data && response.data.data) {
        commit('UPDATE_INGREDIENT', response.data.data)
      }

      return response
    } catch (error) {
      console.error('❌ Error updating stock:', error)
      throw error
    }
  },

  // ✅ Zutaten mit niedrigem Bestand
  async fetchLowStock({ commit }) {
    try {
      const response = await getLowStockIngredients()
      return response.data?.data || []
    } catch (error) {
      console.error('❌ Error fetching low stock:', error)
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
