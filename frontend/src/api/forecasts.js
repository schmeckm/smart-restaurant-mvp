// frontend/src/api/forecasts.js

import request from '@/utils/request'

/**
 * Get all forecast versions
 */
export function getForecastVersions() {
  return request({
    url: '/forecasts',
    method: 'get'
  })
}

/**
 * Get single forecast version with items
 */
export function getForecastVersion(id) {
  return request({
    url: `/forecasts/${id}`,
    method: 'get'
  })
}

/**
 * Create new forecast version
 */
export function createForecastVersion(data) {
  return request({
    url: '/forecasts',
    method: 'post',
    data
  })
}

/**
 * Update forecast version
 */
export function updateForecastVersion(id, data) {
  return request({
    url: `/forecasts/${id}`,
    method: 'put',
    data
  })
}

/**
 * Delete forecast version
 */
export function deleteForecastVersion(id) {
  return request({
    url: `/forecasts/${id}`,
    method: 'delete'
  })
}

/**
 * Clone forecast version
 */
export function cloneForecastVersion(id, data) {
  return request({
    url: `/forecasts/${id}/clone`,
    method: 'post',
    data
  })
}