// @/api/nutrition.js
import request from '@/utils/request'

// ✅ Ihre bestehenden Funktionen bleiben...
export function getNutritionForIngredient(ingredientId) {
  return request({
    url: `/nutrition/ingredient/${ingredientId}`,
    method: 'get'
  })
}

export function getNutritionForProduct(productId) {
  return request({
    url: `/nutrition/product/${productId}`,
    method: 'get'
  })
}

/**
 * Check nutrition status for multiple entities
 * @param {Array} entityIds - Array of entity UUIDs
 * @param {string} entityType - Type of entity (ingredient, product)
 */
export function checkNutritionBulkStatus(entityIds, entityType = 'ingredient') {
  return request({
    url: '/nutrition/bulk-status', 
    method: 'post',
    data: { entityIds, entityType }
  })
}