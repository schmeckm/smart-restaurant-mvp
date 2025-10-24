// frontend/src/store/modules/sales.js
import { getSales, getSale, createSale, updateSale, deleteSale } from '@/api/sales'  // ⬅️ UPDATE!
import request from '@/utils/request'

const state = {
  sales: [],
  currentSale: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
}

const getters = {
  sales: state => state.sales,
  currentSale: state => state.currentSale,
  loading: state => state.loading,
  pagination: state => state.pagination
}

const mutations = {
  SET_SALES(state, sales) {
    state.sales = sales
  },
  SET_CURRENT_SALE(state, sale) {
    state.currentSale = sale
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination }
  },
  ADD_SALE(state, sale) {
    state.sales.unshift(sale)
  }
}

const actions = {
  async fetchSales({ commit }, params = {}) {
    commit('SET_LOADING', true)
    try {
      const response = await getSales(params)
      const { data } = response
      
      commit('SET_SALES', data.sales || data.data || [])
      
      if (data.pagination) {
        commit('SET_PAGINATION', data.pagination)
      } else if (data.currentPage !== undefined) {
        commit('SET_PAGINATION', {
          page: data.currentPage,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages
        })
      } else if (data.page !== undefined) {
        commit('SET_PAGINATION', {
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: Math.ceil(data.total / data.limit)
        })
      }
      
      return response
    } catch (error) {
      console.error('Error fetching sales:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchSale({ commit }, saleId) {
    commit('SET_LOADING', true)
    try {
      const response = await getSale(saleId)
      commit('SET_CURRENT_SALE', response.data)
      return response
    } catch (error) {
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createSale({ commit, dispatch, state }, saleData) {
    try {
      const response = await createSale(saleData)
      
      if (response.data) {
        commit('ADD_SALE', response.data)
      }
      
      // Liste neu laden
      await dispatch('fetchSales', {
        page: 1,
        limit: state.pagination.limit
      })
      
      return response
    } catch (error) {
      throw error
    }
  },

  async updateSale({ dispatch, state }, { id, data }) {  // ⬅️ NEU!
    try {
      const response = await updateSale(id, data)
      
      // Liste neu laden
      await dispatch('fetchSales', {
        page: state.pagination.page,
        limit: state.pagination.limit
      })
      
      return response
    } catch (error) {
      throw error
    }
  },

  async deleteSale({ dispatch, state }, id) {  // ⬅️ NEU!
    try {
      await deleteSale(id)
      
      // Liste neu laden
      await dispatch('fetchSales', {
        page: state.pagination.page,
        limit: state.pagination.limit
      })
    } catch (error) {
      throw error
    }
  },

  async fetchAnalytics(_, params = {}) {
    try {
      const response = await request({
        url: '/sales/analytics',
        method: 'get',
        params
      })
      return response.data
    } catch (error) {
      console.error('Error fetching analytics:', error)
      return {
        totalSales: 0,
        totalRevenue: 0,
        avgOrderValue: 0
      }
    }
  },

  async fetchTopProducts() {
    try {
      const response = await request({
        url: '/sales/top-products',
        method: 'get'
      })
      return response.data
    } catch (error) {
      console.error('Error fetching top products:', error)
      return []
    }
  },

  async fetchDailySales(_, params = {}) {
    try {
      const response = await request({
        url: '/sales/daily',
        method: 'get',
        params
      })
      return response.data
    } catch (error) {
      console.error('Error fetching daily sales:', error)
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