import request from '@/utils/request'

/**
 * Get ingredients list
 */
export function getIngredients(params) {
  return request({
    url: '/ingredients',
    method: 'get',
    params
  })
}

/**
 * Get ingredient by ID
 */
export function getIngredient(id) {
  return request({
    url: `/ingredients/${id}`,
    method: 'get'
  })
}

/**
 * Create new ingredient
 */
export function createIngredient(data) {
  return request({
    url: '/ingredients',
    method: 'post',
    data
  })
}

/**
 * Update ingredient
 */
export function updateIngredient(id, data) {
  return request({
    url: `/ingredients/${id}`,
    method: 'put',
    data
  })
}

/**
 * Delete ingredient
 */
export function deleteIngredient(id) {
  return request({
    url: `/ingredients/${id}`,
    method: 'delete'
  })
}

/**
 * Get low stock ingredients
 */
export function getLowStockIngredients() {
  return request({
    url: '/ingredients/low-stock',
    method: 'get'
  })
}