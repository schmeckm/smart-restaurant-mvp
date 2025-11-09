// frontend/src/store/modules/employees.js
// COMPLETE SYNTACTICALLY CORRECT VERSION

import request from '@/utils/request'

const state = {
  employees: [],
  currentEmployee: null,
  loading: false,
  total: 0,
  pagination: {
    page: 1,
    limit: 20
  }
}

const mutations = {
  SET_EMPLOYEES(state, employees) {
    state.employees = employees
  },
  
  SET_CURRENT_EMPLOYEE(state, employee) {
    state.currentEmployee = employee
  },
  
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  
  SET_TOTAL(state, total) {
    state.total = total
  },
  
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination }
  },
  
  ADD_EMPLOYEE(state, employee) {
    state.employees.unshift(employee)
    state.total += 1
  },
  
  UPDATE_EMPLOYEE(state, updatedEmployee) {
    const index = state.employees.findIndex(emp => emp.id === updatedEmployee.id)
    if (index !== -1) {
      state.employees.splice(index, 1, updatedEmployee)
    }
  },
  
  REMOVE_EMPLOYEE(state, employeeId) {
    const index = state.employees.findIndex(emp => emp.id === employeeId)
    if (index !== -1) {
      state.employees.splice(index, 1)
      state.total -= 1
    }
  },
  
  CLEAR_EMPLOYEES(state) {
    state.employees = []
    state.currentEmployee = null
    state.total = 0
  }
}

const actions = {
  // Fetch employees with pagination and filters
  async fetchEmployees({ commit, state }, params = {}) {
    commit('SET_LOADING', true)
    
    try {
      const queryParams = {
        page: params.page || state.pagination.page,
        limit: params.limit || state.pagination.limit,
        ...params
      }
      
      // Remove undefined/null values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === null || queryParams[key] === '') {
          delete queryParams[key]
        }
      })
      
      console.log('🔍 Fetching employees with params:', queryParams)
      
      const response = await request({
        url: '/employees',
        method: 'get',
        params: queryParams
      })
      
      console.log('✅ Raw response from request utility:', response)
      console.log('✅ Response data type:', typeof response.data)
      console.log('✅ Is response.data an array?', Array.isArray(response.data))
      
      // FINAL FIX: The request utility returns the employee array directly
      // Check if response.data is an array (the employees)
      if (Array.isArray(response.data)) {
        const employees = response.data
        
        console.log('🔄 Processing employees array:', employees.length)
        
        commit('SET_EMPLOYEES', employees)
        commit('SET_TOTAL', employees.length)
        commit('SET_PAGINATION', {
          page: queryParams.page,
          limit: queryParams.limit
        })
        
        console.log('✅ Employees stored successfully')
        return employees
      } 
      // Fallback: Check if it's the full API response object
      else if (response.data && typeof response.data === 'object' && response.data.success) {
        const employees = response.data.data || []
        const pagination = response.data.pagination || {}
        
        console.log('🔄 Processing full API response:', employees.length)
        
        commit('SET_EMPLOYEES', employees)
        commit('SET_TOTAL', pagination.total || employees.length)
        commit('SET_PAGINATION', {
          page: pagination.page || queryParams.page,
          limit: pagination.limit || queryParams.limit
        })
        
        console.log('✅ Employees stored successfully')
        return employees
      }
      // Handle unexpected format
      else {
        console.error('❌ Unexpected response format:', response.data)
        console.error('❌ Response type:', typeof response.data)
        console.error('❌ Is array:', Array.isArray(response.data))
        
        // Fallback: try to use whatever we got
        if (response.data) {
          const employees = Array.isArray(response.data) ? response.data : []
          commit('SET_EMPLOYEES', employees)
          commit('SET_TOTAL', employees.length)
          return employees
        }
        
        throw new Error('Invalid response format - no data received')
      }
      
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
      console.error('❌ Error details:', error.message)
      
      commit('SET_EMPLOYEES', [])
      commit('SET_TOTAL', 0)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // Get single employee
  async fetchEmployee({ commit }, employeeId) {
    commit('SET_LOADING', true)
    
    try {
      const response = await request({
        url: `/employees/${employeeId}`,
        method: 'get'
      })
      
      // Handle both formats: direct employee object or wrapped response
      let employee = null
      if (response.data && response.data.success) {
        employee = response.data.data
      } else if (response.data && response.data.id) {
        employee = response.data
      }
      
      if (employee) {
        commit('SET_CURRENT_EMPLOYEE', employee)
        return employee
      } else {
        throw new Error('Employee not found')
      }
    } catch (error) {
      console.error('❌ Error fetching employee:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // Create new employee
  async createEmployee({ commit }, employeeData) {
    try {
      console.log('➕ Creating employee:', employeeData)
      
      const response = await request({
        url: '/employees',
        method: 'post',
        data: employeeData
      })
      
      console.log('✅ Employee created response:', response.data)
      
      // Handle both formats: direct employee object or wrapped response
      let newEmployee = null
      if (response.data && response.data.success) {
        newEmployee = response.data.data
      } else if (response.data && response.data.id) {
        newEmployee = response.data
      }
      
      if (newEmployee) {
        commit('ADD_EMPLOYEE', newEmployee)
        return newEmployee
      } else {
        throw new Error('Failed to create employee - invalid response')
      }
    } catch (error) {
      console.error('❌ Error creating employee:', error)
      throw error
    }
  },
  
  // Update employee
  async updateEmployee({ commit }, { id, data }) {
    try {
      console.log('✏️ Updating employee:', id, data)
      
      const response = await request({
        url: `/employees/${id}`,
        method: 'put',
        data: data
      })
      
      console.log('✅ Employee updated response:', response.data)
      
      // Handle both formats: direct employee object or wrapped response
      let updatedEmployee = null
      if (response.data && response.data.success) {
        updatedEmployee = response.data.data
      } else if (response.data && response.data.id) {
        updatedEmployee = response.data
      }
      
      if (updatedEmployee) {
        commit('UPDATE_EMPLOYEE', updatedEmployee)
        return updatedEmployee
      } else {
        throw new Error('Failed to update employee - invalid response')
      }
    } catch (error) {
      console.error('❌ Error updating employee:', error)
      throw error
    }
  },
  
  // Delete employee (soft delete) - IMPROVED VERSION
  async deleteEmployee({ commit }, employeeId) {
    try {
      console.log('🗑️ Deleting employee:', employeeId)
      
      const response = await request({
        url: `/employees/${employeeId}`,
        method: 'delete'
      })
      
      console.log('✅ Employee deleted - raw response:', response)
      console.log('✅ Response data type:', typeof response.data)
      console.log('✅ Response data content:', response.data)
      
      // ROBUST: Handle multiple response formats
      let deleteSuccessful = false
      
      // Format 1: Full API response with success flag
      if (response.data && response.data.success === true) {
        console.log('🔄 Format 1: Full API response with success=true')
        deleteSuccessful = true
      }
      // Format 2: Response has a success message
      else if (response.data && response.data.message && typeof response.data.message === 'string') {
        console.log('🔄 Format 2: Response with message:', response.data.message)
        deleteSuccessful = true
      }
      // Format 3: HTTP 200/204 response (empty or minimal content)
      else if (response.status >= 200 && response.status < 300) {
        console.log('🔄 Format 3: HTTP success status:', response.status)
        deleteSuccessful = true
      }
      // Format 4: Response data is simply true or empty object (successful delete)
      else if (response.data === true || 
               (response.data && Object.keys(response.data).length === 0) ||
               response.data === null ||
               response.data === undefined) {
        console.log('🔄 Format 4: Empty/true response indicates success')
        deleteSuccessful = true
      }
      // Format 5: Check if response itself is truthy and no obvious error
      else if (response && !response.error && !response.data?.error) {
        console.log('🔄 Format 5: General truthy response without errors')
        deleteSuccessful = true
      }
      
      if (deleteSuccessful) {
        console.log('✅ Delete confirmed successful - removing from store')
        commit('REMOVE_EMPLOYEE', employeeId)
        return true
      } else {
        console.error('❌ Delete failed - unexpected response format')
        console.error('❌ Response:', response)
        throw new Error(`Failed to delete employee - unexpected response format: ${JSON.stringify(response.data)}`)
      }
      
    } catch (error) {
      console.error('❌ Error deleting employee:', error)
      console.error('❌ Error details:', error.message)
      
      // Provide more specific error information
      if (error.response) {
        console.error('❌ HTTP Response Error:', error.response.status, error.response.data)
        throw new Error(`Failed to delete employee: HTTP ${error.response.status} - ${error.response.data?.message || 'Server error'}`)
      } else if (error.message) {
        throw new Error(`Failed to delete employee: ${error.message}`)
      } else {
        throw new Error('Failed to delete employee: Unknown error')
      }
    }
  },
  // 🧠 Get weekly pattern for an employee
  async fetchEmployeePattern({ commit }, employeeId) {
    try {
      const response = await request({
        url: `/employees/${employeeId}/pattern`,
        method: 'get'
      })

      if (response.data?.data) {
        return response.data.data
      } else {
        console.warn('⚠️ Kein Arbeitsmuster gefunden oder leere Antwort:', response.data)
        return null
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des Arbeitsmusters:', error)
      throw error
    }
  },

  // 💾 Save weekly pattern for an employee
  async saveEmployeePattern({ commit }, { employeeId, patternData }) {
    try {
      const response = await request({
        url: `/employees/${employeeId}/pattern`,
        method: 'post',
        data: patternData
      })

      if (response.data?.success) {
        console.log('✅ Arbeitsmuster erfolgreich gespeichert:', response.data)
        return response.data
      } else {
        console.warn('⚠️ Antwort ohne success=true:', response.data)
        return response.data
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Arbeitsmusters:', error)
      throw error
    }
  },
  

  // Clear store data
  clearEmployees({ commit }) {
    commit('CLEAR_EMPLOYEES')
  }
}

const getters = {
  employees: state => state.employees,
  currentEmployee: state => state.currentEmployee,
  loading: state => state.loading,
  total: state => state.total,
  pagination: state => state.pagination,
  
  // Get employees by department
  employeesByDepartment: state => department => {
    return state.employees.filter(emp => emp.department === department)
  },
  
  // Get employees by position
  employeesByPosition: state => position => {
    return state.employees.filter(emp => emp.position === position)
  },
  
  // Get active employees
  activeEmployees: state => {
    return state.employees.filter(emp => emp.isActive || emp.activeStatus)
  },
  
  // Calculate average performance
  averagePerformance: state => {
    if (state.employees.length === 0) return 0
    const total = state.employees.reduce((sum, emp) => sum + (parseFloat(emp.performanceScore) || 0), 0)
    return (total / state.employees.length).toFixed(2)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}