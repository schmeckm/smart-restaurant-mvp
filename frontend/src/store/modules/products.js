// frontend/src/store/modules/products.js
// COMPLETE CORRECTED VERSION

import request from '@/utils/request'

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
    const index = state.products.findIndex(prod => prod.id === updatedProduct.id);
    if (index !== -1) {
      state.products.splice(index, 1, { ...state.products[index], ...updatedProduct });
    }
  },
  REMOVE_PRODUCT(state, productId) {
    const index = state.products.findIndex(prod => prod.id === productId);
    if (index !== -1) {
      state.products.splice(index, 1);
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination }
  }
}

// Helper function to normalize ingredient data
const normalizeIngredients = (ingredients) => {
  if (!ingredients || !Array.isArray(ingredients)) return []
  
  return ingredients.map(ing => ({
    ...ing,
    // Flatten ProductIngredient data to top level
    quantity: ing.ProductIngredient?.quantity || ing.quantity || 0,
    unit: ing.ProductIngredient?.unit || ing.unit || 'g',
    preparationNote: ing.ProductIngredient?.preparationNote || ing.preparationNote,
    isOptional: ing.ProductIngredient?.isOptional || ing.isOptional || false,
    sortOrder: ing.ProductIngredient?.sortOrder || ing.sortOrder || 0
  }))
}

const actions = {
  // ==========================================
  // FETCH PRODUCTS
  // ==========================================
  async fetchProducts({ commit }, params = {}) {
    commit('SET_LOADING', true)
    try {
      console.log('📥 Fetching products with params:', params)
      
      const response = await request.get('/products', { params })
      
      const responseData = response.data
      const data = responseData.data || responseData
      let products = data.products || data || []
      
      // Normalize ingredients if present
      products = products.map(product => ({
        ...product,
        ingredients: normalizeIngredients(product.ingredients)
      }))
      
      console.log('✅ Fetched products:', products.length)
      
      commit('SET_PRODUCTS', products)
      
      // Handle pagination
      if (data.pagination) {
        commit('SET_PAGINATION', data.pagination)
      } else if (responseData.pagination) {
        commit('SET_PAGINATION', {
          page: responseData.pagination.page,
          total: responseData.pagination.total,
          limit: responseData.pagination.limit
        })
      }
      
      return response
    } catch (error) {
      console.error('❌ Error fetching products:', error)
      commit('SET_PRODUCTS', [])
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // ==========================================
  // FETCH SINGLE PRODUCT
  // ==========================================
  async fetchProduct({ commit }, productId) {
    try {
      console.log('📥 Fetching product:', productId)
      
      const response = await request.get(`/products/${productId}`)
      let product = response.data?.data || response.data
      
      // Normalize ingredients
      if (product && product.ingredients) {
        product.ingredients = normalizeIngredients(product.ingredients)
      }
      
      commit('SET_CURRENT_PRODUCT', product)
      
      return product
    } catch (error) {
      console.error('❌ Error fetching product:', error)
      return null
    }
  },

  // ==========================================
  // CREATE PRODUCT
  // ==========================================
  async createProduct({ commit, dispatch }, productData) {
    try {
      console.log('📝 Creating product:', productData.name)
      
      const productPayload = {
        name: productData.name,
        category: productData.category,
        price: productData.price,
        cost: productData.cost,
        description: productData.description,
        is_available: productData.is_available !== undefined ? productData.is_available : true
      }

      console.log('📤 Sending product payload:', productPayload)

      const response = await request.post('/products', productPayload)
      let product = response.data?.data || response.data
      
      // Normalize ingredients if present
      if (product && product.ingredients) {
        product.ingredients = normalizeIngredients(product.ingredients)
      }
      
      console.log('✅ Product created with ID:', product.id)
      commit('ADD_PRODUCT', product)

      return product
    } catch (error) {
      console.error('❌ Error creating product:', error)
      console.error('Error response:', error.response?.data)
      throw error
    }
  },

  // ==========================================
  // UPDATE PRODUCT (FIXED)
  // ==========================================
  async updateProduct({ commit }, { id, data: productData }) {
    try {
      console.log('🔄 Updating product:', id, 'with data:', productData)
      
      const response = await request.put(`/products/${id}`, productData)
      let product = response.data?.data || response.data
      
      console.log('✅ Product update response:', response.data)
      
      // Normalize ingredients if present
      if (product && product.ingredients) {
        product.ingredients = normalizeIngredients(product.ingredients)
      }
      
      // Direct state update
      if (product) {
        commit('UPDATE_PRODUCT', product)
      } else {
        // Fallback: Merge with existing data
        commit('UPDATE_PRODUCT', { id, ...productData })
      }
      
      return response
    } catch (error) {
      console.error('❌ Error updating product:', error)
      console.error('API Error Details:', error.response?.data)
      throw error
    }
  },

  // ==========================================
  // DELETE PRODUCT (FIXED)
  // ==========================================
  async deleteProduct({ commit, dispatch }, id) {
    try {
      console.log('🗑️ Deleting product:', id)
      
      await request.delete(`/products/${id}`)
      
      console.log('✅ Product deleted successfully')
      commit('REMOVE_PRODUCT', id)
      
    } catch (error) {
      console.error('❌ Error deleting product:', error)
      // Bei Fehler: Reload zur Sicherheit
      await dispatch('fetchProducts')
      throw error
    }
  },

  // ==========================================
  // SEARCH PRODUCTS
  // ==========================================
  async searchProducts({ commit }, searchParams) {
    commit('SET_LOADING', true)
    try {
      const response = await request.get('/products/search', { params: searchParams })
      
      const data = response.data?.data || response.data
      let products = data.products || data || []
      
      // Normalize ingredients
      products = products.map(product => ({
        ...product,
        ingredients: normalizeIngredients(product.ingredients)
      }))
      
      commit('SET_PRODUCTS', products)
      
      if (data.pagination) {
        commit('SET_PAGINATION', data.pagination)
      }
      
      return response
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  }
}

const getters = {
  products: state => state.products,
  currentProduct: state => state.currentProduct,
  loading: state => state.loading,
  pagination: state => state.pagination,
  productsWithRecipes: state => state.products.filter(p => p.instructions),
  productsWithoutRecipes: state => state.products.filter(p => !p.instructions),
  productsByCategory: (state) => (category) => {
    return state.products.filter(p => p.category === category)
  },
  availableProducts: state => state.products.filter(p => p.is_available)
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}