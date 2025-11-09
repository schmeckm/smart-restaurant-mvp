<template>
  <div class="hybrid-scheduling">
    <div class="header">
      <h1></h1>
    </div>

    <!-- ✅ Native Week Picker -->
    <div class="controls">
      <label>📅 Woche auswählen:</label>
      <input 
        type="week" 
        v-model="selectedWeek"
        @change="handleWeekChange"
        class="week-input"
      />
      
      <button class="btn-primary" @click="loadData">🔄 Daten laden</button>
      
      <!-- Debug Info -->
      <div class="debug-info">
        <span>📊 Alle Mitarbeiter: {{ allEmployees.length }}</span>
        <span>🔍 Gefiltert: {{ filteredEmployees.length }}</span>
        <span>✅ Available Days: {{ getTotalAvailableDays() }}</span>
      </div>
    </div>

    <!-- ✅ Employee Filter Controls -->
    <div class="filter-section">
      <h3>👥 Mitarbeiterfilter</h3>
      <div class="filter-controls">
        <div class="filter-group">
          <label for="dept-filter">Abteilung:</label>
          <select 
            id="dept-filter"
            v-model="employeeFilter.department" 
            @change="applyFilters"
            class="filter-select"
          >
            <option value="">Alle Abteilungen</option>
            <option v-for="dept in uniqueDepartments" :key="dept" :value="dept">
              {{ dept }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="pos-filter">Position:</label>
          <select 
            id="pos-filter"
            v-model="employeeFilter.position" 
            @change="applyFilters"
            class="filter-select"
          >
            <option value="">Alle Positionen</option>
            <option v-for="pos in uniquePositions" :key="pos" :value="pos">
              {{ getPositionLabel(pos) }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <button class="btn-reset" @click="resetFilters">
            🔄 Filter zurücksetzen
          </button>
        </div>

        <!-- Filter Status -->
        <div class="filter-status">
          <span class="filter-badge" :class="{ 'active': hasActiveFilters }">
            {{ filteredEmployees.length }} von {{ allEmployees.length }} Mitarbeitern
          </span>
          <span v-if="hasActiveFilters" class="active-filters">
            <span v-if="employeeFilter.department" class="filter-tag">
              📁 {{ employeeFilter.department }}
            </span>
            <span v-if="employeeFilter.position" class="filter-tag">
              👤 {{ getPositionLabel(employeeFilter.position) }}
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- ✅ Employee Grid mit nativen HTML -->
    <div v-if="filteredEmployees.length > 0" class="employee-grid">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="employee-header">Mitarbeiter</th>
            <th v-for="(day, index) in weekDays" :key="day" class="day-header" :class="{ 'weekend': isWeekendDay(index) }">
              <div class="day-name">
                <span v-if="isWeekendDay(index)" class="weekend-icon">🌅</span>
                {{ getDayShortName(index) }}
              </div>
              <small class="day-date">{{ getFormattedDate(index) }}</small>
            </th>
            <th class="actions-header">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in filteredEmployees" :key="employee.id">
            <td class="employee-cell">
              <div class="employee-name">{{ employee.firstName }} {{ employee.lastName }}</div>
              <div class="employee-position">{{ employee.position }}</div>
            </td>
            <td v-for="day in 7" :key="day" class="day-cell" :class="[getStatusClass(employee.id, day), { 'weekend-cell': isWeekendDay(day - 1) }]">
              {{ getStatusIcon(employee.id, day) }}
            </td>
            <td>
              <button class="btn-edit" @click="openModal(employee)">✏️ Bearbeiten</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading">
      <div class="loading-spinner">⏳</div>
      <p>📊 Lade Mitarbeiterdaten...</p>
    </div>

    <!-- No Data -->
    <div v-else class="no-data">
      <div class="no-data-icon">👥</div>
      <p>Keine Mitarbeiter gefunden</p>
      <button class="btn-primary" @click="loadData">🔄 Erneut versuchen</button>
    </div>

    <!-- ✅ Native Modal (kein el-dialog) -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ currentEmployee?.firstName || 'Unbekannt' }} {{ currentEmployee?.lastName || '' }}</h3>
          <button @click="closeModal" class="close-btn">✖️</button>
        </div>
        
        <div class="modal-body">
          <!-- Current Data Display -->
          <div class="current-data">
            <h4>📊 Aktuelle Verfügbarkeit:</h4>
            <div class="current-week-display">
              <span v-for="(day, index) in dayNames" :key="index" class="day-status">
                {{ day.substring(0, 2) }}: {{ getEmployeeStatusText(currentEmployee?.id, index + 1) }}
              </span>
            </div>
          </div>

          <!-- Quick Templates -->
          <div class="templates">
            <button class="template-btn" @click="applyTemplate('parttime')">
              ⏰ Teilzeit (Mo/Mi/Fr 9-15h)
            </button>
            <button class="template-btn" @click="applyTemplate('fulltime')">
              🕘 Vollzeit (Mo-Fr 8-17h)
            </button>
            <button class="template-btn clear" @click="applyTemplate('clear')">
              🗑️ Leeren
            </button>
          </div>

          <!-- Day Editors -->
          <div class="day-editors">
            <div v-for="(day, index) in dayNames" :key="index" class="day-editor">
              <h4>{{ day }}</h4>
              <div class="time-row">
                <label>
                  <input type="checkbox" v-model="modalData[index].enabled" />
                  Arbeitszeit
                </label>
                <input 
                  v-if="modalData[index].enabled"
                  type="time" 
                  v-model="modalData[index].start"
                  class="time-input"
                />
                <span v-if="modalData[index].enabled">bis</span>
                <input 
                  v-if="modalData[index].enabled"
                  type="time" 
                  v-model="modalData[index].end"
                  class="time-input"
                />
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div class="save-preview">
            <h4>💾 Wird gespeichert:</h4>
            <div class="preview-entries">
              <div v-for="(entry, index) in getPreviewEntries()" :key="index" class="preview-entry">
                📅 {{ entry.day }}: {{ entry.time }} ({{ entry.type }})
              </div>
              <div v-if="getPreviewEntries().length === 0" class="no-entries">
                Keine Arbeitszeiten definiert
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Abbrechen</button>
          <button @click="saveData" class="btn-primary" :disabled="saving || !currentEmployee">
            {{ saving ? '💾 Speichert...' : `💾 Speichern (${getPreviewEntries().length} Einträge)` }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import utc from 'dayjs/plugin/utc'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(weekOfYear)
dayjs.extend(utc)
dayjs.extend(isoWeek)
const store = useStore()

// State
const selectedWeek = ref('')
const allEmployees = ref([])  // Alle Mitarbeiter ohne Filter
const showModal = ref(false)
const currentEmployee = ref(null)
const saving = ref(false)
const loading = ref(false)
const scheduleData = ref({}) // Real data from database

// ✅ Filter State
const employeeFilter = ref({
  department: '',
  position: ''
})

const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

// Modal data
const modalData = ref([
  { enabled: false, start: '09:00', end: '17:00' },
  { enabled: false, start: '09:00', end: '17:00' },
  { enabled: false, start: '09:00', end: '17:00' },
  { enabled: false, start: '09:00', end: '17:00' },
  { enabled: false, start: '09:00', end: '17:00' },
  { enabled: false, start: '09:00', end: '17:00' },
  { enabled: false, start: '09:00', end: '17:00' }
])

// Functions
const loadData = async () => {
  loading.value = true
  
  try {
    console.log('📅 Loading employees...')
    const result = await store.dispatch('employees/fetchEmployees')
    allEmployees.value = Array.isArray(result) ? result : (result?.data || [])
    console.log('✅ Loaded', allEmployees.value.length, 'employees')
    
    // ✅ ECHTE: Lade auch die echten Verfügbarkeiten
    await loadAvailabilities()
    
  } catch (error) {
    console.error('❌ Load error:', error)
  } finally {
    loading.value = false
  }
}

// ✅ ECHTE: Funktion zum Laden der echten Verfügbarkeiten
const loadAvailabilities = async () => {
  if (!selectedWeek.value || allEmployees.value.length === 0) return
  
  console.log('📊 Loading REAL availability data for week:', selectedWeek.value)
  
  // Parse week string (2025-W45) - ✅ FIX: Verwende ISO-Wochen für Montag als ersten Tag
  const [year, weekNum] = selectedWeek.value.split('-W')
  const startDate = dayjs().year(year).isoWeek(weekNum).startOf('isoWeek').format('YYYY-MM-DD')
  const endDate = dayjs().year(year).isoWeek(weekNum).endOf('isoWeek').format('YYYY-MM-DD')
  
  console.log(`📅 ISO Week Date range: ${startDate} to ${endDate}`)
  
  const newScheduleData = {}
  
  for (const employee of allEmployees.value) {
    console.log(`📋 Loading availability for: ${employee.firstName} ${employee.lastName} (${employee.id})`)
    
    try {
      const data = await store.dispatch('availability/fetchEmployeeAvailability', {
        employeeId: employee.id,
        startDate,
        endDate
      })
      
      console.log(`📊 Raw API data for ${employee.firstName}:`, data)
      
      // Process real data into simple format
      const employeeWeekData = {}
      
      if (data && Array.isArray(data)) {
        data.forEach(entry => {
          if (entry.date && entry.start_time && entry.end_time && entry.availability_type === 'working') {
            // ✅ ROBUST: Date handling mit UTC-Fallback
            let entryDate
            try {
              entryDate = dayjs(entry.date).utc().startOf('day')
            } catch (utcError) {
              console.log('⚠️ UTC Plugin not available, using local time')
              entryDate = dayjs(entry.date).startOf('day')
            }
            
            // ✅ FIX: Verwende isoWeekday() für korrekte Tag-Zuordnung (1=Montag, 7=Sonntag)
            const isoDay = entryDate.isoWeekday() // 1=Monday, 2=Tuesday, ..., 7=Sunday
            
            console.log(`🧪 DEBUG Load: ${entry.date} → isoDay ${isoDay} (${entryDate.format('dddd')})`)
            
            employeeWeekData[isoDay] = {
              available: true,
              start_time: entry.start_time.substring(0, 5), // Remove seconds: "09:00:00" -> "09:00"
              end_time: entry.end_time.substring(0, 5)
            }
            
            console.log(`   📅 ${entry.date} (${entryDate.format('dddd')}) -> isoDay ${isoDay}: ${entry.start_time}-${entry.end_time}`)
          }
        })
      }
      
      newScheduleData[employee.id] = employeeWeekData
      
      const availableDays = Object.keys(employeeWeekData).length
      console.log(`✅ ${employee.firstName}: ${availableDays} available days`)
      
    } catch (error) {
      console.error(`❌ Error loading availability for ${employee.firstName}:`, error)
      newScheduleData[employee.id] = {}
    }
  }
  
  // ✅ CRITICAL: Force reactivity update mit completly new object
  scheduleData.value = { ...newScheduleData }
  
  console.log('🎯 Final schedule data loaded:', scheduleData.value)
  
  // ✅ ADDITIONAL: Force Vue reactivity
  await nextTick()
  console.log('🔄 Vue reactivity cycle completed')
}

const handleWeekChange = async () => {
  console.log('🔄 Week changed to:', selectedWeek.value)
  await loadAvailabilities()
}

// ✅ COMPUTED PROPERTIES für Filter
const filteredEmployees = computed(() => {
  if (!allEmployees.value || !Array.isArray(allEmployees.value)) return []
  
  return allEmployees.value.filter(emp => {
    if (!emp) return false
    
    // Department Filter
    const matchDept = !employeeFilter.value.department || 
                     emp.department === employeeFilter.value.department
    
    // Position Filter
    const matchPos = !employeeFilter.value.position || 
                    emp.position === employeeFilter.value.position
    
    return matchDept && matchPos
  })
})

const uniqueDepartments = computed(() => {
  if (!allEmployees.value || !Array.isArray(allEmployees.value)) return []
  return [...new Set(allEmployees.value.map(e => e && e.department).filter(Boolean))]
})

const uniquePositions = computed(() => {
  if (!allEmployees.value || !Array.isArray(allEmployees.value)) return []
  return [...new Set(allEmployees.value.map(e => e && e.position).filter(Boolean))]
})

const hasActiveFilters = computed(() => {
  return employeeFilter.value.department || employeeFilter.value.position
})

// ✅ WEEK DAYS COMPUTATION für Grid - ✅ FIX: Verwende ISO-Wochen
const weekDays = computed(() => {
  if (!selectedWeek.value) return [0, 1, 2, 3, 4, 5, 6] // Default indices
  
  try {
    const [year, weekNum] = selectedWeek.value.split('-W')
    const startOfWeek = dayjs().year(year).isoWeek(weekNum).startOf('isoWeek') // ✅ FIX: isoWeek statt week
    
    console.log('📅 Computing ISO week days for:', selectedWeek.value)
    console.log('📅 Start of ISO week (Montag):', startOfWeek.format('YYYY-MM-DD dddd'))
    
    return Array.from({ length: 7 }, (_, index) => {
      const dayDate = startOfWeek.add(index, 'day')
      const result = {
        date: dayDate.format('YYYY-MM-DD'),
        dayIndex: index,
        dayName: dayDate.format('dddd'),
        shortDate: dayDate.format('DD.MM')
      }
      console.log(`   ISO Day ${index}: ${result.shortDate} (${result.dayName})`)
      return result
    })
  } catch (error) {
    console.error('❌ Error computing ISO week days:', error)
    return [0, 1, 2, 3, 4, 5, 6] // Fallback
  }
})

// ✅ GRID HELPER FUNCTIONS
const getDayShortName = (index) => {
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  return dayNames[index] || '?'
}

const getFormattedDate = (index) => {
  try {
    if (!weekDays.value || !weekDays.value[index]) {
      console.log('⚠️ No week data for index:', index)
      return '--'
    }
    return weekDays.value[index].shortDate
  } catch (error) {
    console.error('❌ Error formatting date for index', index, ':', error)
    return '--'
  }
}

const isWeekendDay = (index) => {
  return index === 5 || index === 6 // Saturday = 5, Sunday = 6
}

// ✅ FILTER FUNCTIONS
const applyFilters = () => {
  console.log('🔍 Applying filters:', employeeFilter.value)
  console.log(`📊 Filtered: ${filteredEmployees.value.length} von ${allEmployees.value.length} Mitarbeitern`)
}

const resetFilters = () => {
  console.log('🔄 Resetting filters')
  employeeFilter.value = {
    department: '',
    position: ''
  }
  applyFilters()
}

const getPositionLabel = (position) => {
  const labels = {
    manager: 'Manager',
    chef: 'Küchenchef', 
    cook: 'Koch',
    waiter: 'Kellner',
    waitress: 'Kellnerin',
    bartender: 'Barkeeper',
    cleaner: 'Reinigungskraft',
    cashier: 'Kassier'
  }
  return labels[position] || position || 'Unbekannt'
}

// ✅ VERBESSERTE Grid Functions mit echten Daten
const getStatusIcon = (employeeId, dayNumber) => {
  const employeeData = scheduleData.value[employeeId]
  const hasData = employeeData && employeeData[dayNumber]
  
  if (employeeId === Object.keys(scheduleData.value)[0]) { // Log for first employee only
    console.log(`🧪 DEBUG Grid: Employee ${employeeId}, day ${dayNumber} → has data: ${hasData ? '✅' : '❌'}`)
  }
  
  return hasData ? '✅' : '❌'
}

const getStatusClass = (employeeId, dayNumber) => {
  const employeeData = scheduleData.value[employeeId]
  return employeeData && employeeData[dayNumber] ? 'available' : 'unavailable'
}

const getEmployeeStatusText = (employeeId, dayNumber) => {
  if (!employeeId || !scheduleData.value) return 'Nicht verfügbar'
  
  const employeeData = scheduleData.value[employeeId]
  if (employeeData && employeeData[dayNumber]) {
    const dayData = employeeData[dayNumber]
    if (dayData.start_time && dayData.end_time) {
      return `${dayData.start_time}-${dayData.end_time}`
    }
  }
  return 'Nicht verfügbar'
}

const getTotalAvailableDays = () => {
  if (!scheduleData.value || typeof scheduleData.value !== 'object') return 0
  
  let total = 0
  Object.values(scheduleData.value).forEach(employeeData => {
    if (employeeData && typeof employeeData === 'object') {
      total += Object.keys(employeeData).length
    }
  })
  return total
}

// Modal functions
const openModal = async (employee) => {
  // ✅ DEFENSIVE: Validate employee parameter
  if (!employee || !employee.id) {
    console.error('❌ Invalid employee passed to openModal:', employee)
    return
  }
  
  currentEmployee.value = employee
  showModal.value = true
  
  console.log(`📝 Opening modal for: ${employee.firstName} ${employee.lastName} (ID: ${employee.id})`)
  
  // ✅ ECHTE: Lade aktuelle Daten für diesen Mitarbeiter
  try {
    if (!selectedWeek.value) {
      console.error('❌ No week selected')
      return
    }
    
    const [year, weekNum] = selectedWeek.value.split('-W')
    if (!year || !weekNum) {
      console.error('❌ Invalid week format:', selectedWeek.value)
      return
    }
    
    // ✅ FIX: Verwende ISO-Wochen auch im Modal
    const startDate = dayjs().year(year).isoWeek(weekNum).startOf('isoWeek').format('YYYY-MM-DD')
    const endDate = dayjs().year(year).isoWeek(weekNum).endOf('isoWeek').format('YYYY-MM-DD')

    const data = await store.dispatch('availability/fetchEmployeeAvailability', {
      employeeId: employee.id,
      startDate,
      endDate
    })

    console.log('📊 Modal data loaded:', data)

    // Reset modal data first
    for (let i = 0; i < 7; i++) {
      modalData.value[i] = { enabled: false, start: '09:00', end: '17:00' }
    }

    // Fill with real data
    if (data && Array.isArray(data)) {
      data.forEach(entry => {
        if (entry && entry.date && entry.start_time && entry.end_time && entry.availability_type === 'working') {
          // ✅ ROBUST: Date handling mit UTC-Fallback
          let entryDate
          try {
            entryDate = dayjs(entry.date).utc().startOf('day')
          } catch (utcError) {
            console.log('⚠️ UTC Plugin not available in modal, using local time')
            entryDate = dayjs(entry.date).startOf('day')
          }
          
          // ✅ FIX: Verwende isoWeekday() für korrektes Modal-Mapping
          const isoDay = entryDate.isoWeekday() // 1=Monday, 2=Tuesday, ..., 7=Sunday
          const modalIndex = isoDay - 1 // Convert to 0-6 for modal array (0=Monday, 6=Sunday)
          const expectedDayName = dayNames[modalIndex]
          
          console.log(`🧪 DEBUG Modal: ${entry.date} → isoDay ${isoDay} (${entryDate.format('dddd')}) → modalIndex ${modalIndex} (${expectedDayName})`)
          
          if (modalIndex >= 0 && modalIndex < 7) {
            modalData.value[modalIndex] = {
              enabled: true,
              start: entry.start_time.substring(0, 5), // Remove seconds if present
              end: entry.end_time.substring(0, 5)
            }
            
            console.log(`   📅 Loaded: ${entryDate.format('dddd')} (index ${modalIndex}): ${entry.start_time}-${entry.end_time}`)
          }
        }
      })
    }

  } catch (error) {
    console.error('❌ Error loading modal data:', error)
    
    // Reset to defaults on error
    for (let i = 0; i < 7; i++) {
      modalData.value[i] = { enabled: false, start: '09:00', end: '17:00' }
    }
  }
}

const closeModal = () => {
  console.log('📝 Closing modal...')
  
  // ✅ SAFE: Clean state in correct order
  showModal.value = false
  currentEmployee.value = null
  
  // Reset modal data to defaults
  for (let i = 0; i < 7; i++) {
    modalData.value[i] = { enabled: false, start: '09:00', end: '17:00' }
  }
  
  console.log('✅ Modal state cleaned')
}

const applyTemplate = (type) => {
  console.log(`🎨 Applying template: ${type}`)
  
  if (!modalData.value || !Array.isArray(modalData.value) || modalData.value.length !== 7) {
    console.error('❌ Modal data not properly initialized')
    return
  }
  
  switch (type) {
    case 'clear':
      for (let i = 0; i < 7; i++) {
        if (modalData.value[i]) {
          modalData.value[i].enabled = false
        }
      }
      break
    case 'parttime':
      // Clear all first
      for (let i = 0; i < 7; i++) {
        if (modalData.value[i]) {
          modalData.value[i].enabled = false
        }
      }
      // Set Mo, Mi, Fr
      if (modalData.value[0]) modalData.value[0] = { enabled: true, start: '09:00', end: '15:00' }
      if (modalData.value[2]) modalData.value[2] = { enabled: true, start: '09:00', end: '15:00' }
      if (modalData.value[4]) modalData.value[4] = { enabled: true, start: '09:00', end: '15:00' }
      break
    case 'fulltime':
      for (let i = 0; i < 5; i++) {
        if (modalData.value[i]) {
          modalData.value[i] = { enabled: true, start: '08:00', end: '17:00' }
        }
      }
      // Clear weekend
      if (modalData.value[5]) modalData.value[5].enabled = false
      if (modalData.value[6]) modalData.value[6].enabled = false
      break
  }
  
  console.log('✅ Template applied successfully')
}

// ✅ PREVIEW: Was wird gespeichert
const getPreviewEntries = () => {
  if (!modalData.value || !Array.isArray(modalData.value)) return []
  
  const entries = []
  
  modalData.value.forEach((day, index) => {
    if (day && day.enabled && day.start && day.end && dayNames[index]) {
      entries.push({
        day: dayNames[index],
        time: `${day.start}-${day.end}`,
        type: 'working'
      })
    }
  })
  
  return entries
}

// ✅ BUG-FIX: Enhanced Save Function mit FORCED Grid Update
const saveData = async () => {
  // ✅ DEFENSIVE: Null checks first
  if (!currentEmployee.value || !currentEmployee.value.id) {
    console.error('❌ No current employee selected')
    return
  }
  
  saving.value = true
  
  try {
    const entries = []
    
    // ✅ ALTERNATIVE: Immer 7 Einträge senden (available oder unavailable)
    const allEntries = []
    const [year, weekNum] = selectedWeek.value.split('-W')
    
    if (!year || !weekNum) {
      console.error('❌ Invalid week format:', selectedWeek.value)
      return
    }
    
    console.log('🧪 DEBUG: Modal data before save:', modalData.value)
    console.log('🧪 DEBUG: Selected week:', selectedWeek.value)
    
    // ✅ CRITICAL FIX: Verwende ISO-Wochen für korrektes Mapping
    const weekStart = dayjs().year(year).isoWeek(weekNum).startOf('isoWeek')
    console.log('🧪 DEBUG: ISO Week start date (Montag):', weekStart.format('YYYY-MM-DD dddd'))
    
    for (let modalIndex = 0; modalIndex < 7; modalIndex++) {
      const day = modalData.value[modalIndex]
      if (!day) {
        console.error('❌ Missing modal data for day', modalIndex)
        continue
      }
      
      // ✅ CRITICAL FIX: Korrekte Modal-Index zu Datum Zuordnung
      const entryDate = weekStart.add(modalIndex, 'day').format('YYYY-MM-DD')
      const entryDayName = weekStart.add(modalIndex, 'day').format('dddd')
      const expectedDayName = dayNames[modalIndex]
      
      console.log(`🧪 DEBUG Save: modalIndex ${modalIndex} (${expectedDayName}) → ${entryDate} (${entryDayName}) → enabled: ${day.enabled}`)
      
      if (day.enabled && day.start && day.end) {
        // Working day
        allEntries.push({
          employee_id: currentEmployee.value.id,
          date: entryDate,
          start_time: day.start,
          end_time: day.end,
          availability_type: 'working',
          is_available: true
        })
      } else {
        // Not available day
        allEntries.push({
          employee_id: currentEmployee.value.id,
          date: entryDate,
          start_time: null,
          end_time: null,
          availability_type: 'unavailable',
          is_available: false
        })
      }
    }
    
    console.log('💾 Saving ALL 7 days to REAL database (working + unavailable):', allEntries)
    console.log(`📊 Working days: ${allEntries.filter(e => e.is_available).length}/7`)
    console.log(`📅 Unavailable days: ${allEntries.filter(e => !e.is_available).length}/7`)
    console.log(`👤 Employee: ${currentEmployee.value.firstName} ${currentEmployee.value.lastName} (${currentEmployee.value.id})`)
    
    // ✅ SAFE: Always send exactly 7 entries (full week replacement)
    await store.dispatch('availability/saveEmployeeAvailability', {
      employee_id: currentEmployee.value.id,
      availability_entries: allEntries
    })
    
    console.log('✅ Database save completed!')
    
    // ✅ CRITICAL FIX: Multiple strategies for grid refresh
    console.log('🔄 Strategy 1: Force refresh availability data...')
    await loadAvailabilities()
    
    console.log('🔄 Strategy 2: Force Vue reactivity...')
    await nextTick()
    
    console.log('🔄 Strategy 3: Direct update scheduleData...')
    // Update local data immediately for instant feedback - ✅ FIX: Verwende ISO-Mapping
    const employeeId = currentEmployee.value.id
    const newEmployeeData = {}
    
    allEntries.forEach(entry => {
      if (entry.is_available && entry.start_time && entry.end_time) {
        const entryDate = dayjs(entry.date)
        const isoDay = entryDate.isoWeekday() // ✅ FIX: Verwende isoWeekday() für korrektes Mapping
        
        console.log(`🔄 Direct update: ${entry.date} (${entryDate.format('dddd')}) → isoDay ${isoDay}`)
        
        newEmployeeData[isoDay] = {
          available: true,
          start_time: entry.start_time,
          end_time: entry.end_time
        }
      }
    })
    
    // Force update with completely new object reference
    const updatedScheduleData = { ...scheduleData.value }
    updatedScheduleData[employeeId] = newEmployeeData
    scheduleData.value = updatedScheduleData
    
    console.log(`🔄 Strategy 4: Manual scheduleData update for employee ${employeeId}:`, newEmployeeData)
    
    closeModal()
    
    // ✅ Verify the data was actually updated
    setTimeout(() => {
      if (scheduleData.value && scheduleData.value[employeeId]) {
        const availableDays = Object.keys(scheduleData.value[employeeId]).length
        console.log(`🔍 VERIFICATION: ${currentEmployee.value?.firstName} now has ${availableDays} available days in grid`)
        console.log('🔍 Full employee data:', scheduleData.value[employeeId])
      }
    }, 500)
    
    console.log('🎉 Save completed successfully with forced grid refresh!')
    
  } catch (error) {
    console.error('❌ REAL SAVE ERROR:', error)
    console.error('❌ Current employee state:', currentEmployee.value)
    console.error('❌ Selected week state:', selectedWeek.value)
    // Error handling would go here
  } finally {
    saving.value = false
  }
}

// Initialization
onMounted(async () => {
  console.log('🚀 Simple Scheduling with Database mounted')
  
  // Set current week
  const now = new Date()
  const year = now.getFullYear()
  const week = dayjs().week()
  selectedWeek.value = `${year}-W${week.toString().padStart(2, '0')}`
  
  console.log('📅 Set current week:', selectedWeek.value)
  
  await loadData()
})
</script>

<style scoped>
/* Enhanced styling for the simple version */
.hybrid-scheduling { 
  padding: 20px; 
  max-width: 1200px; 
  margin: 0 auto; 
}

.header { 
  text-align: center; 
  margin-bottom: 30px;
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
}

.controls { 
  margin-bottom: 20px; 
  display: flex; 
  gap: 15px; 
  align-items: center; 
  flex-wrap: wrap;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.debug-info {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #6c757d;
}

.debug-info span {
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

/* ✅ Filter Section Styles */
.filter-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.filter-section h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  min-width: 160px;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.btn-reset {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  height: fit-content;
}

.btn-reset:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.filter-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: auto;
}

.filter-badge {
  background: white;
  border: 2px solid #e9ecef;
  color: #6c757d;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s;
}

.filter-badge.active {
  border-color: #409eff;
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}

.active-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-tag {
  background: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.week-input { 
  padding: 10px 12px; 
  border: 1px solid #ddd; 
  border-radius: 6px; 
  font-size: 14px;
  transition: border-color 0.2s;
}

.week-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.btn-primary { 
  background: #409eff; 
  color: white; 
  border: none; 
  padding: 10px 16px; 
  border-radius: 6px; 
  cursor: pointer; 
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #337ecc;
  transform: translateY(-1px);
}

.schedule-table { 
  width: 100%; 
  border-collapse: collapse; 
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.schedule-table th { 
  background: #f8f9fa;
  border: 1px solid #e9ecef; 
  padding: 12px 8px; 
  text-align: center; 
  font-weight: 600;
  font-size: 14px;
  color: #495057;
  vertical-align: middle;
}

/* ✅ Enhanced Day Headers */
.day-header {
  min-width: 80px;
  transition: all 0.2s;
}

.day-header.weekend {
  background: linear-gradient(135deg, #ffe6e6 0%, #ffcccc 100%);
  color: #8b0000;
}

.day-name {
  font-weight: 700;
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.weekend-icon {
  font-size: 12px;
}

.day-header.weekend .day-name {
  color: #8b0000;
}

.day-date {
  font-weight: 400;
  font-size: 11px;
  color: #6c757d;
  display: block;
}

.day-header.weekend .day-date {
  color: #8b0000;
  opacity: 0.8;
}

.employee-header {
  text-align: left !important;
  min-width: 150px;
  font-weight: 700;
}

.actions-header {
  min-width: 100px;
  font-weight: 700;
}

.schedule-table td { 
  border: 1px solid #e9ecef; 
  padding: 12px 8px; 
  text-align: center; 
  vertical-align: middle;
}

.employee-cell {
  text-align: left !important;
  min-width: 150px;
}

.employee-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.employee-position {
  font-size: 12px;
  color: #6c757d;
  text-transform: capitalize;
}

.day-cell {
  width: 80px;
  font-size: 18px;
  transition: all 0.2s;
  cursor: pointer;
}

.day-cell:hover {
  background: #f8f9fa;
  transform: scale(1.1);
}

/* ✅ BUG-FIX: Removed explicit background colors for cleaner look */
.day-cell.available { 
  color: #22c55e; 
  font-weight: bold;
  /* ❌ REMOVED: background: rgba(34, 197, 94, 0.1); */
}

.day-cell.unavailable { 
  color: #ef4444; 
  /* ❌ REMOVED: background: rgba(239, 68, 68, 0.1); */
}

.day-cell.weekend-cell {
  background: rgba(255, 230, 230, 0.3);
  border-left: 3px solid #ffb3b3;
}

.day-cell.weekend-cell.available {
  background: rgba(255, 230, 230, 0.6);
  color: #8b0000;
  border-left: 3px solid #22c55e;
}

.day-cell.weekend-cell.unavailable {
  background: rgba(255, 230, 230, 0.3);
  color: #8b0000;
  border-left: 3px solid #ef4444;
}

.btn-edit {
  background: #6c757d;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.loading, .no-data {
  text-align: center;
  padding: 60px;
  color: #6c757d;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 2px dashed #e9ecef;
}

.loading-spinner {
  font-size: 48px;
  margin-bottom: 16px;
  animation: spin 2s linear infinite;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.modal-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  background: rgba(0,0,0,0.5); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 1000; 
}

.modal { 
  background: white; 
  padding: 0; 
  border-radius: 12px; 
  width: 90%; 
  max-width: 700px; 
  max-height: 90vh; 
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255,255,255,0.2);
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.current-data {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.current-data h4 {
  margin: 0 0 12px 0;
  color: #495057;
}

.current-week-display {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.day-status {
  background: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.templates { 
  margin-bottom: 20px; 
  padding: 16px;
  background: #e3f2fd;
  border-radius: 8px;
}

.template-btn { 
  margin-right: 10px; 
  margin-bottom: 8px;
  padding: 8px 16px; 
  border: 1px solid #ddd; 
  border-radius: 6px; 
  background: white; 
  cursor: pointer; 
  font-size: 14px;
  transition: all 0.2s;
}

.template-btn:hover {
  background: #409eff;
  color: white;
  border-color: #409eff;
  transform: translateY(-1px);
}

.template-btn.clear:hover {
  background: #f56c6c;
  border-color: #f56c6c;
}

.day-editors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.day-editor { 
  padding: 16px; 
  border: 1px solid #e9ecef; 
  border-radius: 8px; 
  background: #fafafa;
}

.day-editor h4 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 16px;
}

.time-row { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  flex-wrap: wrap;
}

.time-row label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  min-width: 100px;
}

.time-input { 
  padding: 6px 8px; 
  border: 1px solid #ddd; 
  border-radius: 4px; 
  font-size: 14px;
}

.time-input:focus {
  outline: none;
  border-color: #409eff;
}

.save-preview {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.save-preview h4 {
  margin: 0 0 12px 0;
  color: #856404;
}

.preview-entries {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-entry {
  font-family: monospace;
  font-size: 12px;
  color: #495057;
}

.no-entries {
  color: #6c757d;
  font-style: italic;
}

.modal-footer { 
  padding: 16px 20px; 
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-secondary { 
  background: #6c757d; 
  color: white; 
  border: none; 
  padding: 10px 16px; 
  border-radius: 6px; 
  cursor: pointer; 
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .hybrid-scheduling {
    padding: 10px;
  }
  
  /* ✅ Mobile Header */
  .header {
    margin-bottom: 20px;
    padding: 16px;
  }
  
  .header h1 {
    font-size: 22px;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  /* ✅ Filter Mobile Styles */
  .filter-controls {
    flex-direction: column;
    gap: 16px;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-select {
    min-width: 100%;
  }
  
  .filter-status {
    margin-left: 0;
    align-items: center;
  }
  
  /* ✅ Mobile Grid */
  .schedule-table {
    font-size: 11px;
  }
  
  .day-header {
    min-width: 60px;
  }
  
  .day-name {
    font-size: 12px;
  }
  
  .day-date {
    font-size: 10px;
  }
  
  .day-cell {
    font-size: 16px;
    padding: 8px 4px;
  }
  
  .employee-cell {
    min-width: 100px;
  }
  
  .btn-edit {
    font-size: 11px;
    padding: 4px 8px;
  }
  
  .modal {
    width: 95%;
    max-height: 95vh;
  }
  
  .day-editors {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 10px;
  }
}
</style>