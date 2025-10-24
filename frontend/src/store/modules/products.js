import { getProducts, createProduct, updateProduct, deleteProduct } from '@/api/products'

const state = {
  products: [],
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
  ADD_PRODUCT(state, product) {
    state.products.unshift(product)
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination }
  }
}

const actions = {
  async fetchProducts({ commit }, params) {
    commit('SET_LOADING', true)
    try {
      const response = await getProducts(params)
      const { data } = response
      
      commit('SET_PRODUCTS', data.products || data.data || [])
      
      if (data.pagination) {
        commit('SET_PAGINATION', data.pagination)
      } else if (data.total !== undefined) {
        commit('SET_PAGINATION', {
          total: data.total,
          page: params?.page || 1,
          limit: params?.limit || 20
        })
      }
      
      return response
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createProduct({ commit, dispatch }, productData) {
    try {
      const response = await createProduct(productData)
      
      if (response.data) {
        commit('ADD_PRODUCT', response.data)
      }
      
      await dispatch('fetchProducts', {
        page: 1,
        limit: state.pagination.limit
      })
      
      return response
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  },

  async updateProduct({ dispatch }, { id, data: productData }) {
    try {
      await updateProduct(id, productData)
      await dispatch('fetchProducts', {
        page: state.pagination.page,
        limit: state.pagination.limit
      })
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  },

  async deleteProduct({ dispatch }, id) {
    try {
      await deleteProduct(id)
      await dispatch('fetchProducts', {
        page: state.pagination.page,
        limit: state.pagination.limit
      })
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }
}

const getters = {
  products: state => state.products,
  loading: state => state.loading,
  pagination: state => state.pagination
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}