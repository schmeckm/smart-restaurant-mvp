// src/store/modules/availability.js - COMPLETE VERSION WITH EDIT FUNCTIONALITY
import request from '@/utils/request'

export default {
  namespaced: true,

  state: () => ({
    employeesAvailability: [],
    selectedEmployeeAvailability: [],
    availabilityTypes: [],
    loading: false,
    
    // ✅ Form persistence state
    draftAvailability: {},
    formData: {},
    lastSavedFormState: {},
    autoSaveEnabled: true,
    
    // ✅ Edit mode state
    editMode: false,
    currentEditId: null
  }),

  mutations: {
    SET_LOADING(state, value) {
      state.loading = value
    },
    SET_EMPLOYEES_AVAILABILITY(state, data) {
      state.employeesAvailability = data
    },
    SET_SELECTED_EMPLOYEE_AVAILABILITY(state, data) {
      state.selectedEmployeeAvailability = data
    },
    SET_AVAILABILITY_TYPES(state, data) {
      state.availabilityTypes = data
    },
    
    // ✅ Form persistence mutations
    SET_FORM_DATA(state, formData) {
      state.formData = formData
    },
    SET_DRAFT_AVAILABILITY(state, draftData) {
      state.draftAvailability = draftData
    },
    CLEAR_FORM_DATA(state) {
      state.formData = {}
      state.draftAvailability = {}
      state.editMode = false
      state.currentEditId = null
    },
    SET_LAST_SAVED_STATE(state, formState) {
      state.lastSavedFormState = formState
    },
    SET_AUTO_SAVE(state, enabled) {
      state.autoSaveEnabled = enabled
    },
    SET_EDIT_MODE(state, { mode, id = null }) {
      state.editMode = mode
      state.currentEditId = id
    }
  },

  actions: {
    // 📅 Alle Mitarbeiter-Verfügbarkeiten einer Woche laden
    async fetchAllAvailabilities({ commit }, { startDate, endDate }) {
      commit('SET_LOADING', true)
      try {
        const res = await request({
          url: '/availability/overview/all',
          method: 'get',
          params: { start_date: startDate, end_date: endDate }
        })
        if (res.success && res.data) {
          commit('SET_EMPLOYEES_AVAILABILITY', res.data)
        }
        return res.data
      } catch (error) {
        console.error('❌ Fehler beim Laden der Wochen-Verfügbarkeiten:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // 👤 Einzelne Mitarbeiter-Verfügbarkeit laden
    async fetchEmployeeAvailability({ commit }, { employeeId, startDate, endDate }) {
      commit('SET_LOADING', true)
      try {
        const res = await request({
          url: `/availability/${employeeId}`,
          method: 'get',
          params: { start_date: startDate, end_date: endDate }
        })
        if (res.success && res.data) {
          commit('SET_SELECTED_EMPLOYEE_AVAILABILITY', res.data)
        }
        return res.data
      } catch (error) {
        console.error('❌ Fehler beim Laden der Mitarbeiter-Verfügbarkeit:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // ✅ NEU: Spezifische Mitarbeiter-Verfügbarkeit für Edit-Mode laden
    async loadAvailabilityForEdit({ commit }, { employeeId, date }) {
      commit('SET_LOADING', true)
      try {
        console.log(`🔍 Loading availability for employee ${employeeId} on ${date}`)
        
        const res = await request({
          url: `/availability/${employeeId}`,
          method: 'get',
          params: { 
            start_date: date, 
            end_date: date 
          }
        })
        
        if (res.success && res.data && res.data.length > 0) {
          // ✅ Bestehende Verfügbarkeit gefunden
          const existing = res.data[0]
          const formData = {
            id: existing.id,  // WICHTIG für Updates
            employee_id: employeeId,
            date: existing.date,
            start_time: existing.start_time,
            end_time: existing.end_time,
            availability_type: existing.availability_type || 'working',
            is_available: existing.is_available ?? true,
            notes: existing.notes || ''
          }
          
          commit('SET_DRAFT_AVAILABILITY', formData)
          commit('SET_EDIT_MODE', { mode: true, id: existing.id })
          
          console.log('✅ Bestehende Verfügbarkeit geladen:', formData)
          return { exists: true, data: formData }
          
        } else {
          // ✅ Keine bestehenden Daten - neue Verfügbarkeit
          const newData = {
            id: null,
            employee_id: employeeId,
            date: date,
            start_time: '09:00:00',
            end_time: '17:00:00',
            availability_type: 'working',
            is_available: true,
            notes: ''
          }
          
          commit('SET_DRAFT_AVAILABILITY', newData)
          commit('SET_EDIT_MODE', { mode: false, id: null })
          
          console.log('📝 Neue Verfügbarkeit erstellt:', newData)
          return { exists: false, data: newData }
        }
        
      } catch (error) {
        console.error('❌ Fehler beim Laden für Edit:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // ➕ Einzelne Verfügbarkeit erstellen
    async createAvailability(_, payload) {
      try {
        const res = await request({
          url: '/availability',
          method: 'post',
          data: payload
        })
        return res.data
      } catch (error) {
        console.error('❌ Fehler beim Erstellen der Verfügbarkeit:', error)
        throw error
      }
    },

    // ✅ NEU: Update bestehende Verfügbarkeit
    async updateAvailability(_, payload) {
      try {
        console.log('🔄 Updating availability:', payload)
        const res = await request({
          url: `/availability/${payload.id}`,
          method: 'put',
          data: payload
        })
        return res.data
      } catch (error) {
        console.error('❌ Update fehler:', error)
        throw error
      }
    },

    // ✅ NEU: Delete Verfügbarkeit
    async deleteAvailability(_, availabilityId) {
      try {
        console.log('🗑️ Deleting availability:', availabilityId)
        const res = await request({
          url: `/availability/${availabilityId}`,
          method: 'delete'
        })
        return res.data
      } catch (error) {
        console.error('❌ Delete fehler:', error)
        throw error
      }
    },

    // ✅ NEU: Smart Save - automatisch Update oder Create
    async saveAvailabilitySmart({ dispatch, commit }, formData) {
      try {
        let result
        
        if (formData.id) {
          // Update bestehende Verfügbarkeit
          console.log('🔄 Updating existing availability...')
          result = await dispatch('updateAvailability', formData)
          
        } else {
          // Create neue Verfügbarkeit
          console.log('➕ Creating new availability...')
          result = await dispatch('createAvailability', formData)
        }
        
        // Nach erfolgreichem Speichern: Edit-Mode zurücksetzen
        commit('CLEAR_FORM_DATA')
        
        return {
          success: true,
          data: result,
          message: formData.id ? 'Verfügbarkeit aktualisiert' : 'Neue Verfügbarkeit gespeichert'
        }
        
      } catch (error) {
        console.error('❌ Smart save failed:', error)
        throw error
      }
    },

    // 📦 Mehrere Verfügbarkeiten gleichzeitig erstellen
    async bulkCreateAvailability(_, payload) {
      try {
        const res = await request({
          url: '/availability/bulk/create',
          method: 'post',
          data: payload
        })
        return res.data
      } catch (error) {
        console.error('❌ Fehler beim Bulk-Erstellen:', error)
        throw error
      }
    },

    // 🎯 FIXED: Correct Error Detection and Individual Fallback
    async saveEmployeeAvailability({ dispatch }, payload) {
      try {
        console.log('🚀 Attempting bulk save...')
        return await dispatch('bulkCreateAvailability', payload)
      } catch (bulkError) {
        
        console.log('🔍 Analyzing error:', {
          status: bulkError.response?.status,
          message: bulkError.message,
          responseError: bulkError.response?.data?.error,
          responseMessage: bulkError.response?.data?.message
        })
        
        // ✅ FIXED: Check ALL possible locations for duplicate error
        const isDuplicateError = 
          bulkError.response?.data?.error?.includes('duplicate key') ||
          bulkError.response?.data?.error?.includes('unique constraint') ||
          bulkError.response?.data?.error?.includes('unique_employee_date') ||
          bulkError.response?.data?.message?.includes('duplicate key') ||
          bulkError.message?.includes('duplicate key')
        
        if (isDuplicateError) {
          console.log('🔄 Duplicate key detected! Switching to individual save strategy...')
          
          try {
            const { employee_id, availability_entries } = payload
            let successful = 0
            let skipped = 0
            const results = []
            
            console.log(`🔍 Attempting to save ${availability_entries.length} records individually...`)
            
            // Try each record individually
            for (let i = 0; i < availability_entries.length; i++) {
              const entry = availability_entries[i]
              
              try {
                console.log(`💾 Saving record ${i + 1}/${availability_entries.length}: ${entry.date}`)
                
                const result = await dispatch('createAvailability', {
                  employee_id,
                  date: entry.date,
                  start_time: entry.start_time,
                  end_time: entry.end_time,
                  availability_type: entry.availability_type || 'working',
                  is_available: entry.is_available !== false,
                  notes: entry.notes || ''
                })
                
                results.push(result)
                successful++
                console.log(`✅ Successfully saved ${entry.date}`)
                
              } catch (singleError) {
                skipped++
                console.log(`⚠️ Skipped ${entry.date}: Already exists or error`)
              }
            }
            
            // Return appropriate success message
            if (successful > 0) {
              const message = `${successful} neue Verfügbarkeiten gespeichert${skipped > 0 ? `, ${skipped} bereits vorhanden` : ''}`
              console.log(`✅ Final result: ${message}`)
              
              return {
                success: true,
                message: message,
                data: results
              }
            } else if (skipped > 0) {
              return {
                success: true,
                message: `Alle ${skipped} Verfügbarkeiten bereits vorhanden`,
                data: []
              }
            } else {
              throw new Error('Keine Verfügbarkeiten konnten gespeichert werden')
            }
            
          } catch (individualError) {
            console.error('❌ Individual save strategy failed:', individualError)
            throw new Error('Fehler beim Speichern der Verfügbarkeiten: ' + individualError.message)
          }
          
        } else {
          // Not a duplicate error - propagate original error
          console.error('❌ Non-duplicate error occurred:', bulkError)
          
          const errorMessage = bulkError.response?.data?.message || 
                              bulkError.response?.data?.error ||
                              bulkError.message || 
                              'Unbekannter Fehler beim Speichern der Verfügbarkeiten'
          
          throw new Error(errorMessage)
        }
      }
    },

    // ⚙️ Typen abrufen
    async fetchAvailabilityTypes({ commit }) {
      try {
        const res = await request({
          url: '/availability/types',
          method: 'get'
        })
        if (res.success && res.data?.availability_types) {
          commit('SET_AVAILABILITY_TYPES', res.data.availability_types)
        }
        return res.data
      } catch (error) {
        console.error('❌ Fehler beim Laden der Verfügbarkeitstypen:', error)
        throw error
      }
    },

    // ✅ Form persistence actions
    async saveFormDraft({ commit, state }, formData) {
      try {
        commit('SET_DRAFT_AVAILABILITY', formData)
        
        // Save to localStorage for persistence across browser sessions
        const draftKey = 'scheduling_form_draft'
        const draftData = {
          formData,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
        
        localStorage.setItem(draftKey, JSON.stringify(draftData))
        commit('SET_LAST_SAVED_STATE', formData)
        
        console.log('💾 Form draft saved:', formData)
        return true
        
      } catch (error) {
        console.error('❌ Error saving form draft:', error)
        return false
      }
    },

    async loadFormDraft({ commit }) {
      try {
        const draftKey = 'scheduling_form_draft'
        const draft = localStorage.getItem(draftKey)
        
        if (draft) {
          const parsedDraft = JSON.parse(draft)
          
          // Check if draft is not too old (optional: 24 hours)
          const draftAge = new Date() - new Date(parsedDraft.timestamp)
          const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
          
          if (draftAge < maxAge) {
            commit('SET_DRAFT_AVAILABILITY', parsedDraft.formData)
            console.log('📦 Form draft loaded:', parsedDraft.formData)
            return parsedDraft.formData
          } else {
            // Draft too old, remove it
            localStorage.removeItem(draftKey)
            console.log('🗑️ Old draft removed')
          }
        }
        
        return {}
      } catch (error) {
        console.error('❌ Error loading form draft:', error)
        return {}
      }
    },

    clearFormDraft({ commit }) {
      try {
        commit('CLEAR_FORM_DATA')
        localStorage.removeItem('scheduling_form_draft')
        console.log('🗑️ Form draft cleared')
        return true
      } catch (error) {
        console.error('❌ Error clearing form draft:', error)
        return false
      }
    },

    // ✅ Auto-save functionality
    async autoSaveForm({ dispatch, state }, formData) {
      if (!state.autoSaveEnabled) return
      
      try {
        // Only save if form has meaningful data
        if (formData && Object.keys(formData).length > 0) {
          await dispatch('saveFormDraft', formData)
        }
      } catch (error) {
        console.error('❌ Auto-save failed:', error)
      }
    },

    toggleAutoSave({ commit }, enabled) {
      commit('SET_AUTO_SAVE', enabled)
    },

    // ✅ Check if form has unsaved changes
    hasUnsavedChanges({ state }) {
      const current = JSON.stringify(state.draftAvailability)
      const saved = JSON.stringify(state.lastSavedFormState)
      return current !== saved
    }
  },

  getters: {
    employeesAvailability: (state) => state.employeesAvailability,
    selectedEmployeeAvailability: (state) => state.selectedEmployeeAvailability,
    availabilityTypes: (state) => state.availabilityTypes,
    availabilityLoading: (state) => state.loading,
    
    // ✅ Form persistence getters
    draftAvailability: (state) => state.draftAvailability,
    formData: (state) => state.formData,
    hasFormDraft: (state) => Object.keys(state.draftAvailability).length > 0,
    autoSaveEnabled: (state) => state.autoSaveEnabled,
    hasUnsavedChanges: (state) => {
      const current = JSON.stringify(state.draftAvailability)
      const saved = JSON.stringify(state.lastSavedFormState)
      return current !== saved
    },
    
    // ✅ Edit mode getters
    isEditMode: (state) => state.editMode,
    currentEditId: (state) => state.currentEditId,
    isEditing: (state) => state.editMode && state.currentEditId !== null
  }
}