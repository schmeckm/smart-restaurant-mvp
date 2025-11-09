// 📦 src/stores/availabilityStore.js – Full Version mit Edit-Logik
import { defineStore } from 'pinia'
import request from '@/utils/request'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api/v1'
console.log('🌍 API_URL aktiv:', API_URL)

export const useAvailabilityStore = defineStore('availability', {
  state: () => ({
    employeesAvailability: [],
    selectedEmployeeAvailability: [],
    availabilityTypes: [],
    loading: false,

    // ✅ Form persistence
    draftAvailability: {},
    formData: {},
    lastSavedFormState: {},
    autoSaveEnabled: true,

    // ✅ Edit mode
    editMode: false,
    currentEditId: null
  }),

  actions: {
    // 📅 Alle Mitarbeiter-Verfügbarkeiten einer Woche laden
    async fetchAllAvailabilities({ startDate, endDate }) {
      this.loading = true
      try {
        const res = await request({
          url: '/availability/overview/all',
          method: 'get',
          params: { start_date: startDate, end_date: endDate }
        })
        if (res.success && res.data) {
          this.employeesAvailability = res.data
        }
        return res.data
      } catch (error) {
        console.error('❌ Fehler beim Laden der Wochen-Verfügbarkeiten:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 👤 Einzelne Mitarbeiter-Verfügbarkeit laden
    async fetchEmployeeAvailability({ employeeId, startDate, endDate }) {
      this.loading = true
      try {
        const res = await request({
          url: `/availability/${employeeId}`,
          method: 'get',
          params: { start_date: startDate, end_date: endDate }
        })
        if (res.success && res.data) {
          this.selectedEmployeeAvailability = res.data
        }
        return res.data
      } catch (error) {
        console.error('❌ Fehler beim Laden der Mitarbeiter-Verfügbarkeit:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // ✅ Spezifische Mitarbeiter-Verfügbarkeit für Edit-Mode laden
    async loadAvailabilityForEdit({ employeeId, date }) {
      this.loading = true
      try {
        console.log(`🔍 Loading availability for employee ${employeeId} on ${date}`)
        const res = await request({
          url: `/availability/${employeeId}`,
          method: 'get',
          params: { start_date: date, end_date: date }
        })

        if (res.success && res.data && res.data.length > 0) {
          const existing = res.data[0]
          const formData = {
            id: existing.id,
            employee_id: employeeId,
            date: existing.date,
            start_time: existing.start_time,
            end_time: existing.end_time,
            availability_type: existing.availability_type || 'working',
            is_available: existing.is_available ?? true,
            notes: existing.notes || ''
          }
          this.draftAvailability = formData
          this.editMode = true
          this.currentEditId = existing.id
          console.log('✅ Bestehende Verfügbarkeit geladen:', formData)
          return { exists: true, data: formData }
        } else {
          const newData = {
            id: null,
            employee_id: employeeId,
            date,
            start_time: '09:00:00',
            end_time: '17:00:00',
            availability_type: 'working',
            is_available: true,
            notes: ''
          }
          this.draftAvailability = newData
          this.editMode = false
          this.currentEditId = null
          console.log('📝 Neue Verfügbarkeit erstellt:', newData)
          return { exists: false, data: newData }
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden für Edit:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // ➕ Neue Verfügbarkeit erstellen
    async createAvailability(payload) {
      try {
        const res = await request({
          url: '/availability',
          method: 'post',
          data: payload
        })
        return res.data
      } catch (error) {
        console.error('❌ Fehler beim Erstellen:', error)
        throw error
      }
    },

    // 🔄 Update bestehende Verfügbarkeit
    async updateAvailability(payload) {
      try {
        const res = await request({
          url: `/availability/${payload.id}`,
          method: 'put',
          data: payload
        })
        return res.data
      } catch (error) {
        console.error('❌ Update Fehler:', error)
        throw error
      }
    },

    // 🗑️ Delete Verfügbarkeit
    async deleteAvailability(availabilityId) {
      try {
        const res = await request({
          url: `/availability/${availabilityId}`,
          method: 'delete'
        })
        return res.data
      } catch (error) {
        console.error('❌ Delete Fehler:', error)
        throw error
      }
    },

    // ✅ Smart Save – automatisch Update oder Create
    async saveAvailabilitySmart(formData) {
      try {
        let result
        if (formData.id) result = await this.updateAvailability(formData)
        else result = await this.createAvailability(formData)
        this.clearFormData()
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

    // 📦 Bulk Create
    async bulkCreateAvailability(payload) {
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

    // 🎯 Smart Retry bei Duplikaten
    async saveEmployeeAvailability(payload) {
      try {
        console.log('🚀 Attempting bulk save...')
        return await this.bulkCreateAvailability(payload)
      } catch (bulkError) {
        console.log('🔍 Analyzing error:', bulkError)
        const isDuplicateError =
          bulkError.response?.data?.error?.includes('duplicate key') ||
          bulkError.message?.includes('duplicate key')
        if (isDuplicateError) {
          const { employee_id, availability_entries } = payload
          const results = []
          let successful = 0, skipped = 0
          for (const entry of availability_entries) {
            try {
              const result = await this.createAvailability({
                employee_id,
                ...entry
              })
              results.push(result)
              successful++
            } catch {
              skipped++
            }
          }
          const msg = `${successful} gespeichert, ${skipped} übersprungen`
          return { success: true, message: msg, data: results }
        } else {
          throw new Error(bulkError.message || 'Fehler beim Bulk Save')
        }
      }
    },

    // ⚙️ Verfügbarkeitstypen abrufen
    async fetchAvailabilityTypes() {
      try {
        const res = await request({
          url: '/availability/types',
          method: 'get'
        })
        if (res.success && res.data?.availability_types) {
          this.availabilityTypes = res.data.availability_types
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden der Typen:', error)
      }
    },

    // ✅ Form-Draft speichern
    async saveFormDraft(formData) {
      try {
        this.draftAvailability = formData
        localStorage.setItem('scheduling_form_draft', JSON.stringify({
          formData,
          timestamp: new Date().toISOString()
        }))
        this.lastSavedFormState = formData
        console.log('💾 Draft saved:', formData)
      } catch (error) {
        console.error('❌ Draft speichern fehlgeschlagen:', error)
      }
    },

    async loadFormDraft() {
      try {
        const draft = JSON.parse(localStorage.getItem('scheduling_form_draft'))
        if (draft) {
          this.draftAvailability = draft.formData
          console.log('📦 Draft geladen:', draft.formData)
          return draft.formData
        }
        return {}
      } catch (error) {
        console.error('❌ Fehler beim Laden des Drafts:', error)
        return {}
      }
    },

    clearFormData() {
      this.formData = {}
      this.draftAvailability = {}
      this.editMode = false
      this.currentEditId = null
    },

    async autoSaveForm(formData) {
      if (this.autoSaveEnabled && formData && Object.keys(formData).length > 0) {
        await this.saveFormDraft(formData)
      }
    },

    toggleAutoSave(enabled) {
      this.autoSaveEnabled = enabled
    }
  },

  getters: {
    hasFormDraft: (state) => Object.keys(state.draftAvailability).length > 0,
    hasUnsavedChanges: (state) =>
      JSON.stringify(state.draftAvailability) !== JSON.stringify(state.lastSavedFormState),
    isEditing: (state) => state.editMode && state.currentEditId !== null
  }
})
