// frontend/src/store/modules/products.js
// ✅ OPTIMIERTE, PRODUKTIONSREIFE VERSION

import request from '@/utils/request'
import { ElMessage } from 'element-plus'

// ===============================
// Axios Interceptors
// ===============================
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  response => response,
  error => {
    console.error('❌ API Error:', error.response?.data || error.message)
    if (process.env.NODE_ENV === 'development') {
      console.log('🧩 Full error:', error)
    }
    ElMessage.error(error.response?.data?.message || 'Serverfehler aufgetreten')
    return Promise.reject(error)
  }
)

// ===============================
// State
// ===============================
const state = {
  products: [],
  currentProduct: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
}

// ===============================
// Mutations
// ===============================
const mutations = {
  SET_PRODUCTS(state, products) {
    state.products = products
  },
  SET_CURRENT_PRODUCT(state, product) {
    state.currentProduct = product
  },
  ADD_PRODUCT(state, product) {
    state.products.push(product)
  },
  UPDATE_PRODUCT(state, updatedProduct) {
    const index = state.products.findIndex(p => p.id === updatedProduct.id)
    if (index !== -1) {
      state.products.splice(index, 1, { ...state.products[index], ...updatedProduct })
    }
  },
  REMOVE_PRODUCT(state, productId) {
    state.products = state.products.filter(p => p.id !== productId)
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination }
  }
}

// ===============================
// Helper Functions
// ===============================
const normalizeIngredients = (ingredients) => {
  if (!Array.isArray(ingredients)) return []
  return ingredients.map(ing => ({
    ...ing,
    quantity: ing.ProductIngredient?.quantity || ing.quantity || 0,
    unit: ing.ProductIngredient?.unit || ing.unit || 'g',
    preparationNote: ing.ProductIngredient?.preparationNote || ing.preparationNote,
    isOptional: ing.ProductIngredient?.isOptional || ing.isOptional || false,
    sortOrder: ing.ProductIngredient?.sortOrder || ing.sortOrder || 0
  }))
}

const normalizeProduct = (product) => {
  if (!product) return null
  return {
    ...product,
    ingredients: normalizeIngredients(product.ingredients)
  }
}

// ===============================
// Actions
// ===============================
const actions = {
  // FETCH ALL PRODUCTS
  async fetchProducts({ commit }, params = {}) {
    commit('SET_LOADING', true)
    try {
      const res = await request.get('/products', { params })
      const data = res.data.data || res.data
      const products = (data.products || data || []).map(normalizeProduct)

      commit('SET_PRODUCTS', products)
      commit('SET_PAGINATION', data.pagination || res.data.pagination || {})
      return res
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // FETCH SINGLE PRODUCT
  async fetchProduct({ commit }, id) {
    const res = await request.get(`/products/${id}`)
    const product = normalizeProduct(res.data.data || res.data)
    commit('SET_CURRENT_PRODUCT', product)
    return product
  },

  // CREATE PRODUCT
  async createProduct({ commit }, productData) {
    const payload = {
      name: productData.name,
      category: productData.category,
      price: productData.price,
      cost: productData.cost,
      description: productData.description,
      is_available: productData.is_available ?? true
    }

    const res = await request.post('/products', payload)
    const product = normalizeProduct(res.data.data || res.data)
    commit('ADD_PRODUCT', product)
    ElMessage.success('✅ Produkt erfolgreich erstellt')
    return product
  },

  // UPDATE PRODUCT
  async updateProduct({ commit }, { id, data }) {
    const res = await request.put(`/products/${id}`, data)
    const updated = normalizeProduct(res.data.data || res.data)
    commit('UPDATE_PRODUCT', updated)
    ElMessage.success('🔄 Produkt aktualisiert')
    return updated
  },

  // DELETE PRODUCT (optimistisches Update)
  async deleteProduct({ commit }, id) {
    commit('REMOVE_PRODUCT', id)
    try {
      await request.delete(`/products/${id}`)
      ElMessage.success('🗑️ Produkt gelöscht')
    } catch (error) {
      ElMessage.warning('⚠️ Fehler beim Löschen, Daten werden neu geladen')
      throw error
    }
  },

  // SEARCH PRODUCTS
  async searchProducts({ commit }, searchParams) {
    commit('SET_LOADING', true)
    try {
      const res = await request.get('/products/search', { params: searchParams })
      const data = res.data.data || res.data
      const products = (data.products || data || []).map(normalizeProduct)

      commit('SET_PRODUCTS', products)
      commit('SET_PAGINATION', data.pagination || {})
      return res
    } finally {
      commit('SET_LOADING', false)
    }
  }
}

// ===============================
// Getters
// ===============================
const getters = {
  products: state => state.products,
  currentProduct: state => state.currentProduct,
  loading: state => state.loading,
  pagination: state => state.pagination,
  productsWithRecipes: state => state.products.filter(p => p.instructions),
  productsWithoutRecipes: state => state.products.filter(p => !p.instructions),
  productsByCategory: state => category =>
    state.products.filter(p => p.category === category),
  availableProducts: state => state.products.filter(p => p.is_available)
}

// ===============================
// Export Store
// ===============================
export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
