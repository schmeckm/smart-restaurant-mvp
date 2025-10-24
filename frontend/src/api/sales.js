import request from '@/utils/request'

export function getSales(params) {
  return request({
    url: '/sales',
    method: 'get',
    params
  })
}

export function getSale(id) {
  return request({
    url: `/sales/${id}`,
    method: 'get'
  })
}

export function createSale(data) {
  return request({
    url: '/sales',
    method: 'post',
    data
  })
}

export function updateSale(id, data) {  // ⬅️ NEU!
  return request({
    url: `/sales/${id}`,
    method: 'put',
    data
  })
}

export function deleteSale(id) {  // ⬅️ NEU!
  return request({
    url: `/sales/${id}`,
    method: 'delete'
  })
}