import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories'

const state = {
  categories: [],
  loading: false
}

const mutations = {
  SET_CATEGORIES(state, categories) {
    state.categories = categories
  },
  ADD_CATEGORY(state, category) {
    state.categories.push(category)
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  }
}

const actions = {
  async fetchCategories({ commit }, params = {}) {
    commit('SET_LOADING', true)
    try {
      const response = await getCategories(params)
      const { data } = response
      
      commit('SET_CATEGORIES', data.categories || [])
      return response
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createCategory({ commit, dispatch }, categoryData) {
    try {
      const response = await createCategory(categoryData)
      
      if (response.data) {
        commit('ADD_CATEGORY', response.data)
      }
      
      await dispatch('fetchCategories')
      return response
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  },

  async updateCategory({ dispatch }, { id, data: categoryData }) {
    try {
      await updateCategory(id, categoryData)
      await dispatch('fetchCategories')
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  },

  async deleteCategory({ dispatch }, id) {
    try {
      await deleteCategory(id)
      await dispatch('fetchCategories')
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }
}

const getters = {
  categories: state => state.categories,
  activeCategories: state => state.categories.filter(c => c.is_active),
  loading: state => state.loading
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}