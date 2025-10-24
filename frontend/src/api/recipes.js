import request from '@/utils/request'

/**
 * Get recipes list
 */
export function getRecipes(params) {
  return request({
    url: '/recipes',
    method: 'get',
    params
  })
}

/**
 * Get recipe by ID
 */
export function getRecipe(id) {
  return request({
    url: `/recipes/${id}`,
    method: 'get'
  })
}

/**
 * Get recipe by product ID
 */
export function getRecipeByProduct(productId) {
  return request({
    url: `/recipes/product/${productId}`,
    method: 'get'
  })
}

/**
 * Create new recipe
 */
export function createRecipe(data) {
  return request({
    url: '/recipes',
    method: 'post',
    data
  })
}

/**
 * Update recipe
 */
export function updateRecipe(id, data) {
  return request({
    url: `/recipes/${id}`,
    method: 'put',
    data
  })
}

/**
 * Delete recipe
 */
export function deleteRecipe(id) {
  return request({
    url: `/recipes/${id}`,
    method: 'delete'
  })
}