// frontend/src/store/modules/sales.js (FINALE KORRIGIERTE VERSION)
import { getSales, getSale, createSale, updateSale, deleteSale } from '@/api/sales'
import request from '@/utils/request'
import dayjs from 'dayjs'

const state = {
  // Existing sales state
  sales: [],
  currentSale: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },

  // 📊 Enhanced Analytics State
  analytics: {
    today: {
      totalSales: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      activeProducts: 0,
      totalStockValue: 0,
      loading: false,
      lastUpdated: null
    },
    dailySales: {
      data: [],
      loading: false,
      period: '7d',
      lastUpdated: null
    },
    topProducts: {
      data: [],
      loading: false,
      lastUpdated: null
    },
    lowStock: {
      data: [],
      loading: false,
      lastUpdated: null
    }
  }
}

const getters = {
  // Existing getters
  sales: state => state.sales,
  currentSale: state => state.currentSale,
  loading: state => state.loading,
  pagination: state => state.pagination,

  // 📊 Analytics getters
  todayAnalytics: state => state.analytics.today,
  dailySalesData: state => state.analytics.dailySales.data,
  topProductsData: state => state.analytics.topProducts.data,
  lowStockData: state => state.analytics.lowStock.data,
  
  // Loading states
  analyticsLoading: state => state.analytics.today.loading,
  dailySalesLoading: state => state.analytics.dailySales.loading,
  topProductsLoading: state => state.analytics.topProducts.loading,
  lowStockLoading: state => state.analytics.lowStock.loading,

  // Check if data needs refresh (older than 5 minutes)
  needsAnalyticsRefresh: state => {
    const lastUpdate = state.analytics.today.lastUpdated
    if (!lastUpdate) return true
    return Date.now() - new Date(lastUpdate).getTime() > 5 * 60 * 1000
  }
}

const mutations = {
  // Existing mutations
  SET_SALES(state, sales) {
    state.sales = sales
  },
  ADD_SALE(state, sale) {
    const exists = state.sales.find(s => s.id === sale.id)
    if (!exists) {
      state.sales.unshift(sale)
    }
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

  // 📊 Analytics mutations
  SET_TODAY_ANALYTICS(state, data) {
    console.log('🔍 MUTATION SET_TODAY_ANALYTICS:', data)
    state.analytics.today = {
      ...state.analytics.today,
      ...data,
      loading: false,
      lastUpdated: new Date().toISOString()
    }
  },
  SET_TODAY_ANALYTICS_LOADING(state, loading) {
    state.analytics.today.loading = loading
  },
  
  SET_DAILY_SALES(state, { data, period }) {
    console.log('🔍 MUTATION SET_DAILY_SALES:', data, 'period:', period)
    state.analytics.dailySales = {
      data,
      loading: false,
      period,
      lastUpdated: new Date().toISOString()
    }
  },
  SET_DAILY_SALES_LOADING(state, loading) {
    state.analytics.dailySales.loading = loading
  },

  SET_TOP_PRODUCTS(state, data) {
    console.log('🔍 MUTATION SET_TOP_PRODUCTS:', data)
    state.analytics.topProducts = {
      data,
      loading: false,
      lastUpdated: new Date().toISOString()
    }
  },
  SET_TOP_PRODUCTS_LOADING(state, loading) {
    state.analytics.topProducts.loading = loading
  },

  SET_LOW_STOCK(state, data) {
    console.log('🔍 MUTATION SET_LOW_STOCK:', data)
    state.analytics.lowStock = {
      data,
      loading: false,
      lastUpdated: new Date().toISOString()
    }
  },
  SET_LOW_STOCK_LOADING(state, loading) {
    state.analytics.lowStock.loading = loading
  },

  // Reset analytics data
  RESET_ANALYTICS(state) {
    state.analytics.today = { ...state.analytics.today, lastUpdated: null }
    state.analytics.dailySales = { ...state.analytics.dailySales, data: [], lastUpdated: null }
    state.analytics.topProducts = { ...state.analytics.topProducts, data: [], lastUpdated: null }
    state.analytics.lowStock = { ...state.analytics.lowStock, data: [], lastUpdated: null }
  }
}

const actions = {
  // Existing sales actions remain the same...
  async fetchSales({ commit }, params = {}) {
    commit('SET_LOADING', true)
    try {
      const response = await getSales(params)
      const sales = response.data || []
      commit('SET_SALES', sales)

      if (response.count !== undefined) {
        const page = params.page || 1
        const limit = params.limit || 10
        commit('SET_PAGINATION', {
          page,
          limit,
          total: response.count,
          totalPages: Math.ceil(response.count / limit)
        })
      } else {
        commit('SET_PAGINATION', {
          page: params.page || 1,
          limit: params.limit || 10,
          total: sales.length,
          totalPages: Math.ceil(sales.length / (params.limit || 10))
        })
      }

      return response
    } catch (error) {
      console.error('❌ Fehler beim Laden der Verkäufe:', error)
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
      console.error('❌ Fehler beim Laden des Verkaufs:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createSale({ commit, dispatch }, saleData) {
    try {
      const response = await createSale(saleData)
      if (response.data) {
        commit('ADD_SALE', response.data)
        // Refresh analytics after new sale
        dispatch('refreshAnalytics')
      }
      return response
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Verkaufs:', error)
      throw error
    }
  },

  async updateSale({ dispatch, state }, { id, data }) {
    try {
      const response = await updateSale(id, data)
      await dispatch('fetchSales', {
        page: state.pagination.page,
        limit: state.pagination.limit
      })
      // Refresh analytics after update
      dispatch('refreshAnalytics')
      return response
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Verkaufs:', error)
      throw error
    }
  },

  async deleteSale({ dispatch, state }, id) {
    try {
      await deleteSale(id)
      await dispatch('fetchSales', {
        page: state.pagination.page,
        limit: state.pagination.limit
      })
      // Refresh analytics after delete
      dispatch('refreshAnalytics')
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Verkaufs:', error)
      throw error
    }
  },
// frontend/src/store/modules/sales.js
// In den actions Bereich hinzufügen:

// 💰 Financial Insights Actions
async fetchProfitability({ commit }, params = {}) {
  try {
    console.log('🔍 ACTION fetchProfitability: Starting...')
    const response = await request({
      url: '/analytics/profitability',
      method: 'get',
      params
    })
    
    console.log('🔍 ACTION fetchProfitability: API Response:', response.data)
    const data = response.data || []
    return data
  } catch (error) {
    console.error('❌ Error fetching profitability:', error)
    return []
  }
},

async fetchFinancialOverview({ commit }, params = {}) {
  try {
    console.log('🔍 ACTION fetchFinancialOverview: Starting...')
    const response = await request({
      url: '/analytics/financial-overview',
      method: 'get',
      params
    })
    
    console.log('🔍 ACTION fetchFinancialOverview: API Response:', response.data)
    const data = response.data || {}
    return data
  } catch (error) {
    console.error('❌ Error fetching financial overview:', error)
    return {}
  }
},


  // 📊 Enhanced Analytics Actions - 🔧 KORRIGIERTE URLs
// 🔧 BEHOBEN: fetchAnalytics
async fetchAnalytics({ commit, getters }, params = {}) {
  commit('SET_TODAY_ANALYTICS_LOADING', true)
  try {
    const response = await request({
      url: '/analytics/today',
      method: 'get',
      params
    })
    
    // ✅ BEHOBEN: Direkt response.data verwenden (nicht response.data.data)
    const data = response.data || {
      totalSales: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      activeProducts: 0,
      totalStockValue: 0
    }
    
    commit('SET_TODAY_ANALYTICS', data)
    return data
  } catch (error) {
    // Error handling...
  } finally {
    commit('SET_TODAY_ANALYTICS_LOADING', false)
  }
},

// 🔧 BEHOBEN: fetchTopProducts  
async fetchTopProducts({ commit }) {
  commit('SET_TOP_PRODUCTS_LOADING', true)
  try {
    const response = await request({ 
      url: '/analytics/top-products',
      method: 'get' 
    })
    
    // ✅ BEHOBEN: Direkt response.data verwenden
    const data = response.data || []
    commit('SET_TOP_PRODUCTS', data)
    return data
  } catch (error) {
    // Error handling...
  }
},

// 🔧 BEHOBEN: fetchDailySales
async fetchDailySales({ commit }, params = {}) {
  commit('SET_DAILY_SALES_LOADING', true)
  try {
    const response = await request({
      url: '/analytics/daily',
      method: 'get',
      params
    })
    
    // ✅ BEHOBEN: Direkt response.data verwenden
    const data = response.data || []
    const period = params.period || '7d'
    
    commit('SET_DAILY_SALES', { data, period })
    return data
  } catch (error) {
    // Error handling...
  }
},

// 🔧 BEHOBEN: fetchLowStockIngredients
async fetchLowStockIngredients({ commit }) {
  commit('SET_LOW_STOCK_LOADING', true)
  try {
    const response = await request({
      url: '/analytics/low-stock',
      method: 'get'
    })
    
    // ✅ BEHOBEN: Direkt response.data verwenden
    const data = response.data || []
    commit('SET_LOW_STOCK', data)
    return data
  } catch (error) {
    // Error handling...
  }
},

// 🔧 ALLE Analytics Actions korrigieren:

async fetchTopProducts({ commit }) {
  commit('SET_TOP_PRODUCTS_LOADING', true)
  try {
    console.log('🔍 ACTION fetchTopProducts: Starting...')
    const response = await request({ 
      url: '/analytics/top-products',
      method: 'get' 
    })
    
    console.log('🔍 ACTION fetchTopProducts: API Response:', response.data)
    
    // ✅ BEHOBEN: Direkt response.data verwenden (nicht response.data.data)
    const data = response.data || []
    commit('SET_TOP_PRODUCTS', data)
    return data
  } catch (error) {
    console.error('❌ Error fetching top products:', error)
    commit('SET_TOP_PRODUCTS', [])
    return []
  }
},

async fetchDailySales({ commit }, params = {}) {
  commit('SET_DAILY_SALES_LOADING', true)
  try {
    console.log('🔍 ACTION fetchDailySales: Starting with params:', params)
    const response = await request({
      url: '/analytics/daily',
      method: 'get',
      params
    })
    
    console.log('🔍 ACTION fetchDailySales: API Response:', response.data)
    
    // ✅ BEHOBEN: Direkt response.data verwenden (nicht response.data.data)
    const data = response.data || []
    const period = params.period || '7d'
    
    commit('SET_DAILY_SALES', { data, period })
    return data
  } catch (error) {
    console.error('❌ Error fetching daily sales:', error)
    commit('SET_DAILY_SALES', { data: [], period: params.period || '7d' })
    return []
  }
},

async fetchLowStockIngredients({ commit }) {
  commit('SET_LOW_STOCK_LOADING', true)
  try {
    console.log('🔍 ACTION fetchLowStockIngredients: Starting...')
    const response = await request({
      url: '/analytics/low-stock',
      method: 'get'
    })
    
    console.log('🔍 ACTION fetchLowStockIngredients: API Response:', response.data)
    
    // ✅ BEHOBEN: Direkt response.data verwenden (nicht response.data.data)  
    const data = response.data || []
    commit('SET_LOW_STOCK', data)
    return data
  } catch (error) {
    console.error('❌ Error fetching low stock ingredients:', error)
    commit('SET_LOW_STOCK', [])
    return []
  }
},

  // 🔄 Refresh all analytics data - 🔧 BEHOBEN: Jetzt mit fetchDailySales
  async refreshAnalytics({ dispatch }) {
    console.log('🔍 ACTION refreshAnalytics: Starting complete refresh...')
    
    const promises = [
      dispatch('fetchAnalytics', { force: true }),
      dispatch('fetchTopProducts'),
      dispatch('fetchLowStockIngredients'),
      // 🔧 BEHOBEN: fetchDailySales war vorher nicht dabei!
      dispatch('fetchDailySales', {
        startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
        period: '7d'
      })
    ]
    
    try {
      await Promise.all(promises)
      console.log('🔍 ACTION refreshAnalytics: All completed successfully')
    } catch (error) {
      console.error('❌ Error refreshing analytics:', error)
    }
  },

  // 🧹 Clear analytics cache
  clearAnalyticsCache({ commit }) {
    commit('RESET_ANALYTICS')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}