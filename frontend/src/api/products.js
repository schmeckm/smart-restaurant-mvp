import request from '@/utils/request'

/**
 * Get products list
 */
export function getProducts(params) {
  return request({
    url: '/products',
    method: 'get',
    params
  })
}

/**
 * Get product by ID
 */
export function getProduct(id) {
  return request({
    url: `/products/${id}`,
    method: 'get'
  })
}

/**
 * Create new product
 */
export function createProduct(data) {
  return request({
    url: '/products',
    method: 'post',
    data
  })
}

/**
 * Update product
 */
export function updateProduct(id, data) {
  return request({
    url: `/products/${id}`,
    method: 'put',
    data
  })
}

/**
 * Delete product
 */
export function deleteProduct(id) {
  return request({
    url: `/products/${id}`,
    method: 'delete'
  })
}