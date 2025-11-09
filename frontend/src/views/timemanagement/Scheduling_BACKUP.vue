<template>
  <div class="ai-scheduling-dashboard">
    <!-- Navigation Bar -->
    <SchedulingNavigation />
    
    <!-- Header with Controls -->
    <AISchedulingHeader
      :selected-week="selectedWeek"
      :forecast-loading="forecastLoading"
      :optimization-loading="optimizationLoading"
      :has-optimized-schedule="hasOptimizedSchedule"
      @week-change="handleWeekChange"
      @generate-forecast="generateForecast"
      @optimize-schedule="optimizeSchedule"
      @save-schedule="saveSchedule"
    />

    <!-- DEBUG: Show current state -->
    <el-alert 
      v-if="debugMode"
      :title="`Debug: forecastLoading=${forecastLoading}, hasData=${forecastData.weeklyData.length}`"
      type="info"
      style="margin-bottom: 20px"
      closable
    />

    <!-- Metrics Cards -->
    <ForecastMetricsCards
      :forecast-data="forecastData"
      :optimization-data="optimizationData"
    />

    <!-- Business Summary & Metrics -->
    <BusinessSummaryCard
      :business-summary="businessSummary"
      :detailed-metrics="detailedMetrics"
      :confidence="forecastData.confidence"
    />

    <!-- Charts & Influence Factors -->
    <DemandForecastChart
      :weekly-data="forecastData.weeklyData"
      :influence-factors="influenceFactors"
      :confidence="forecastData.confidence"
      :loading="forecastLoading"
      :week-days="weekDays"
    />

    <!-- Recommendations & Events Row -->
    <el-row :gutter="20" style="margin-top: 20px;" v-if="recommendations.length > 0 || eventHighlights.length > 0">
      <!-- Enhanced Recommendations Section -->
      <el-col :xs="24" :lg="12" v-if="recommendations.length > 0">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>💡 KI-Empfehlungen</span>
              <el-tag type="success" size="small">{{ recommendations.length }} Maßnahmen</el-tag>
            </div>
          </template>
          <div class="recommendations-container">
            <div 
              v-for="(recommendation, index) in recommendations" 
              :key="index" 
              class="recommendation-item enhanced"
              :class="getRecommendationPriority(recommendation, index)"
            >
              <div class="recommendation-header">
                <div class="recommendation-icon">{{ getRecommendationIcon(recommendation) }}</div>
                <div class="recommendation-priority">{{ getRecommendationLabel(index) }}</div>
              </div>
              <div class="recommendation-text">{{ recommendation }}</div>
              <div class="recommendation-actions">
                <el-button size="small" type="primary" plain @click="markRecommendationDone(index)">
                  ✓ Erledigt
                </el-button>
                <el-button size="small" type="info" plain @click="shareRecommendation(recommendation)">
                  📤 Teilen
                </el-button>
              </div>
            </div>
            
            <div class="recommendations-footer">
              <el-button type="primary" @click="exportRecommendations" style="width: 100%;">
                📋 Alle Empfehlungen exportieren
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Event Highlights Section -->
      <el-col :xs="24" :lg="12" v-if="eventHighlights.length > 0">
        <el-card>
          <template #header>
            <span>🎪 Event Highlights</span>
          </template>
          <div class="events-container">
            <div 
              v-for="(highlight, index) in eventHighlights" 
              :key="index" 
              class="event-highlight-item"
            >
              <div class="event-icon">🎯</div>
              <div class="event-text">{{ highlight }}</div>
            </div>
            <div v-if="realEventsData?.totalEvents" class="events-summary">
              📍 {{ realEventsData.totalEvents }} Events im {{ realEventsData.searchRadius }}km Radius
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Employee Availability Overview -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>👥 Mitarbeiter-Verfügbarkeit</span>             
<el-dropdown @command="openEmployeeModal" trigger="click">
  <el-button size="small">              
    + Verfügbarkeit bearbeiten
    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
  </el-button>
  <template #dropdown>
    <el-dropdown-menu>
      <el-dropdown-item 
        v-for="employee in employees" 
        :key="employee.id"
        :command="employee"
      >
        {{ employee.firstName }} {{ employee.lastName }}
      </el-dropdown-item>
    </el-dropdown-menu>
  </template>
</el-dropdown>
            </div>
          </template>
          <div v-loading="employeesLoading">
            <div class="availability-grid">
              <div class="day-header">
                <div class="employee-name">Mitarbeiter</div>
                <div v-for="day in weekDays" :key="day.date" class="day-cell">
                  {{ day.label }}
                  <small>{{ formatDate(day.date) }}</small>
                </div>
              </div>
              
              <div 
                v-for="employee in employees" 
                :key="employee.id" 
                class="employee-row"
              >
              <div class="employee-info clickable-row" @click="openEmployeeModal(employee)">
  <div class="employee-name">{{ employee.firstName }} {{ employee.lastName }}</div>
  <div class="employee-position">{{ getPositionLabel(employee.position) }}</div>
  <div class="employee-score">{{ employee.performanceScore }}/10</div>
</div>
                
                <div 
                  v-for="day in weekDays" 
                  :key="`${employee.id}-${day.date}`" 
                  class="availability-cell"
                  :class="getAvailabilityClass(employee, day)"
                  @click="toggleEmployeeDay(employee.id, day.date)"
                >
                  <div class="availability-time">
                    {{ getAvailabilityTime(employee, day) }}
                  </div>
                  <div class="availability-status">
                    {{ getAvailabilityStatus(employee, day) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Optimized Schedule -->
    <el-row style="margin-top: 20px;" v-if="hasOptimizedSchedule">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="schedule-header">
              <span>📋 KI-Optimierter Schichtplan</span>
              <div class="schedule-metrics">
                <el-tag type="success">{{ scheduleMetrics.efficiencyScore }}% Effizienz</el-tag>
                <el-tag type="warning">€{{ scheduleMetrics.totalCost }} Kosten</el-tag>
                <el-tag type="info">{{ scheduleMetrics.totalHours }}h Total</el-tag>
              </div>
            </div>
          </template>
          
          <div class="schedule-grid">
            <div 
              v-for="day in optimizedSchedule" 
              :key="day.date" 
              class="day-schedule"
            >
              <div class="day-header">
                <h4>{{ formatDayHeader(day.date) }}</h4>
                <div class="day-stats">
                  <span class="predicted-customers">{{ day.predictedCustomers }} Kunden</span>
                  <span class="staff-count">{{ day.totalStaff }} Mitarbeiter</span>
                </div>
              </div>
              
              <div class="shifts-container">
                <div 
                  v-for="shift in day.shifts" 
                  :key="shift.id" 
                  class="shift-card"
                  :class="getShiftTypeClass(shift.shiftType)"
                >
                  <div class="shift-header">
                    <span class="shift-time">{{ shift.startTime }} - {{ shift.endTime }}</span>
                    <span class="shift-type">{{ getShiftTypeLabel(shift.shiftType) }}</span>
                  </div>
                  
                  <div class="shift-employees">
                    <div 
                      v-for="employee in shift.employees" 
                      :key="employee.id" 
                      class="employee-assignment"
                    >
                      <div class="employee-name">{{ employee.firstName }} {{ employee.lastName }}</div>
                      <div class="employee-details">
                        <span class="position">{{ getPositionLabel(employee.position) }}</span>
                        <span class="skill-match" :class="getSkillMatchClass(employee.skillMatch)">
                          {{ employee.skillMatch }}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="shift-metrics">
                    <small>Kosten: €{{ shift.cost.toFixed(2) }} | Effizienz: {{ shift.efficiency }}%</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 🚀 IMPROVED Employee Availability Modal -->
    <el-dialog
      v-model="showEmployeeModal"
      title="Mitarbeiter-Verfügbarkeit bearbeiten"
      width="90%"
      top="5vh"
      :show-close="true"
      class="availability-modal"
    >
      <template #default>
        <div v-if="selectedEmployee" class="availability-editor-improved">
          
          <!-- 👤 Employee Header -->
          <div class="employee-header">
            <div class="employee-info-card">
              <div class="employee-avatar">
                {{ selectedEmployee.firstName.charAt(0) }}{{ selectedEmployee.lastName.charAt(0) }}
              </div>
              <div class="employee-details">
                <h3>{{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}</h3>
                <p>{{ getPositionLabel(selectedEmployee.position) }}</p>
                <el-tag size="small" type="info">ID: {{ selectedEmployee.id.slice(0, 8) }}</el-tag>
              </div>
            </div>

            <!-- 📅 Week Navigation -->
            <div class="week-info">
              <div class="week-display">
                <el-icon><Calendar /></el-icon>
                Woche {{ getWeekNumber() }} - {{ formatWeekRange() }}
              </div>
              <div class="quick-actions">
                <el-button size="small" @click="copyFromPreviousWeek">
                  📋 Vorwoche kopieren
                </el-button>
                <el-button size="small" disabled>
  🎯 Vorlage anwenden (noch nicht aktiv)
</el-button>
              </div>
            </div>
          </div>

          <!-- ⚡ Quick Templates -->
          <div class="templates-section">
            <h4>⚡ Schnell-Vorlagen</h4>
            <div class="template-buttons">
              <el-button 
                size="small" 
                type="primary" 
                plain
                @click="applyQuickTemplate('fulltime')"
              >
                🕘 Vollzeit (Mo-Fr 8-17h)
              </el-button>
              <el-button 
                size="small" 
                type="success" 
                plain
                @click="applyQuickTemplate('parttime')"
              >
                ⏰ Teilzeit (Mo/Mi/Fr 9-15h)
              </el-button>
              <el-button 
                size="small" 
                type="warning" 
                plain
                @click="applyQuickTemplate('weekend')"
              >
                🌅 Wochenende (Sa/So 10-20h)
              </el-button>
              <el-button 
                size="small" 
                type="info" 
                plain
                @click="applyQuickTemplate('flexible')"
              >
                🔄 Flexibel (nach Bedarf)
              </el-button>
            </div>
          </div>

          <!-- 📅 Day-by-Day Cards (Much Better UX) -->
            <!-- ✅ KOMBINIERTE UX-VERBESSERUNG: Ersetzen Sie den Tag-Karten Bereich (ca. Zeile 331-464) -->

<!-- 📅 Day-by-Day Cards (VERBESSERTE VERSION) -->
<div class="days-grid">
  <div 
    v-for="day in weekDays" 
    :key="day.date" 
    class="day-card enhanced"
    :class="{ 
      'day-weekend': isWeekend(day.date),
      'day-has-slots': getDaySlots(day.date).length > 0,
      'day-full': getTotalHours(day.date) >= 8,
      'day-empty': getDaySlots(day.date).length === 0
    }"
  >
    <!-- ✅ VERBESSERTER Day Header -->
    <div class="day-header enhanced">
      <div class="day-info">
        <h4>{{ day.dayName }}</h4>
        <span class="day-date">{{ formatDate(day.date) }}</span>
        <div class="day-stats">
          <span class="hours-badge" :class="getHoursBadgeClass(day.date)">
            {{ getTotalHours(day.date) }}h
          </span>
        </div>
      </div>
      
      <!-- ✅ FEATURE 3: Copy/Paste Actions -->
      <div class="day-actions">
        <el-tooltip content="Tag kopieren" placement="top">
          <el-button 
            size="small" 
            text 
            @click="copyDayData(day.date)"
            :disabled="getDaySlots(day.date).length === 0"
          >
            📋
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="Einfügen" placement="top">
          <el-button 
            size="small" 
            text 
            @click="pasteDayData(day.date)"
            :disabled="!copiedDayData"
            :type="copiedDayData ? 'primary' : ''"
          >
            📌
          </el-button>
        </el-tooltip>
        
        <el-dropdown @command="handleDayAction" trigger="click">
          <el-button size="small" text>
            <el-icon><More /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="`clear-${day.date}`">
                🗑️ Tag leeren
              </el-dropdown-item>
              <el-dropdown-item :command="`duplicate-${day.date}`">
                📋 Tag duplizieren
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- ✅ FEATURE 1: Quick Templates (direkt unter Header) -->
    <div class="quick-templates" v-if="getDaySlots(day.date).length === 0">
      <el-button-group size="small">
        <el-button 
          @click="addQuickSlot(day.date, '08:00', '17:00', 'working')"
          type="primary"
          plain
        >
          🕘 8-17h
        </el-button>
        <el-button 
          @click="addQuickSlot(day.date, '09:00', '15:00', 'working')"
          type="success"
          plain
        >
          ⏰ 9-15h
        </el-button>
        <el-button 
          @click="addQuickSlot(day.date, '', '', 'vacation')"
          type="warning"
          plain
        >
          🏖️ Frei
        </el-button>
      </el-button-group>
    </div>

    <!-- Time Slots -->
    <div class="time-slots enhanced">
      <div 
        v-for="(slot, index) in getDaySlots(day.date)" 
        :key="index"
        class="time-slot enhanced"
        :class="getEnhancedSlotClass(slot)"
      >
        <!-- ✅ FEATURE 4: Bessere visuelle Hierarchie -->
        <div class="slot-header enhanced">
          <div class="slot-type-wrapper">
            <div class="slot-icon">{{ getSlotIcon(slot.availability_type) }}</div>
            <el-select
              v-model="slot.availability_type"
              size="small"
              style="width: 140px;"
              @change="updateSlotType(day.date, index, slot.availability_type)"
            >
              <el-option label="🕘 Arbeitszeit" value="working" />
              <el-option label="🏖️ Urlaub" value="vacation" />
              <el-option label="😷 Krank" value="sick" />
              <el-option label="☕ Pause" value="break" />
              <el-option label="📋 Meeting" value="meeting" />
              <el-option label="❌ Nicht verfügbar" value="unavailable" />
            </el-select>
          </div>
          
          <el-button
            size="small"
            type="danger"
            text
            @click="removeSlot(day.date, index)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>

        <!-- ✅ FEATURE 2: Verbesserte Zeit-Eingabe -->
        <div class="time-inputs enhanced" v-if="slot.availability_type === 'working'">
          <div class="time-range-container">
            <el-time-picker
              v-model="slot.timeRange"
              is-range
              range-separator="bis"
              start-placeholder="Start"
              end-placeholder="Ende"
              format="HH:mm"
              value-format="HH:mm"
              size="small"
              @change="updateTimeRange(slot, day.date, index)"
              style="width: 100%"
            />
          </div>
          
          <!-- Fallback einzelne Inputs falls Range-Picker Probleme macht -->
          <div class="time-inputs-fallback" v-if="!slot.timeRange">
            <div class="time-input-group">
              <label>Von:</label>
              <el-time-select
                v-model="slot.start_time"
                :picker-options="timePickerOptions"
                placeholder="Start"
                size="small"
              />
            </div>
            <div class="time-input-group">
              <label>Bis:</label>
              <el-time-select
                v-model="slot.end_time"
                :picker-options="timePickerOptions"
                placeholder="Ende"
                size="small"
              />
            </div>
          </div>
        </div>

        <!-- ✅ VERBESSERTE Duration Display -->
        <div class="slot-info enhanced" v-if="slot.start_time && slot.end_time">
          <div class="duration-display">
            <span class="duration-icon">⏱️</span>
            <span class="duration-text">{{ calculateDuration(slot.start_time, slot.end_time) }}</span>
          </div>
          <div class="time-range-display">
            {{ slot.start_time }} - {{ slot.end_time }}
          </div>
        </div>

        <!-- Notes für spezielle Typen -->
        <div class="slot-notes enhanced" v-if="slot.availability_type !== 'working'">
          <el-input
            v-model="slot.notes"
            placeholder="Grund/Notiz (optional)"
            size="small"
            maxlength="100"
            show-word-limit
          />
        </div>
      </div>

      <!-- ✅ VERBESSERTE Add Slot Button -->
      <el-button
        class="add-slot-btn enhanced"
        type="primary"
        text
        @click="addSlot(day.date)"
      >
        <el-icon><Plus /></el-icon>
        Zeitfenster hinzufügen
      </el-button>

      <!-- ✅ VERBESSERTE Empty State -->
      <div v-if="getDaySlots(day.date).length === 0" class="empty-day enhanced">
        <div class="empty-icon">📅</div>
        <p>Keine Verfügbarkeit</p>
        <div class="empty-actions">
          <el-button 
            size="small" 
            type="primary" 
            @click="addQuickSlot(day.date, '09:00', '17:00', 'working')"
          >
            🕘 Standard-Tag hinzufügen
          </el-button>
        </div>
      </div>
    </div>

    <!-- ✅ NEUE: Visual Progress Bar -->
    <div class="day-progress" v-if="getDaySlots(day.date).length > 0">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: Math.min(getTotalHours(day.date) / 8 * 100, 100) + '%' }"
          :class="getProgressClass(day.date)"
        ></div>
      </div>
      <div class="progress-text">
        {{ getTotalHours(day.date) }}/8h
        <span v-if="getTotalHours(day.date) > 8" class="overtime-warning">⚠️ Überstunden</span>
      </div>
    </div>
  </div>
</div>

          <!-- 📊 Week Summary -->
          <div class="week-summary">
            <div class="summary-card">
              <h4>📊 Wochensummary</h4>
              <div class="summary-stats">
                <div class="stat">
                  <span class="stat-value">{{ getTotalWorkingDays() }}</span>
                  <span class="stat-label">Arbeitstage</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ getTotalHours() }}h</span>
                  <span class="stat-label">Gesamtstunden</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ getAverageHoursPerDay() }}h</span>
                  <span class="stat-label">Ø Stunden/Tag</span>
                </div>
              </div>
            </div>

            <!-- Validation Messages -->
            <div class="validation-messages" v-if="validationErrors.length > 0">
              <el-alert
                v-for="error in validationErrors"
                :key="error"
                :title="error"
                type="warning"
                size="small"
                :closable="false"
              />
            </div>
          </div>

        </div>
      </template>

      <!-- 💾 Improved Footer -->
      <template #footer>
        <div class="modal-footer">
          <div class="footer-info">
            <el-icon><InfoFilled /></el-icon>
            <span>Änderungen werden für die ausgewählte Woche gespeichert</span>
          </div>
          
          <div class="footer-actions">
            <el-button @click="showEmployeeModal = false">
              Abbrechen
            </el-button>
            <el-button 
              type="primary" 
              @click="saveEmployeeAvailability"
              :loading="saving"
              :disabled="validationErrors.length > 0"
            >
              <el-icon><Check /></el-icon>
              Speichern ({{ getTotalSlots() }} Einträge)
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, More, Delete, Plus, Clock, Check, InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'

// Import local components
import SchedulingNavigation from './components/SchedulingNavigation.vue'
import AISchedulingHeader from './components/AISchedulingHeader.vue'
import ForecastMetricsCards from './components/ForecastMetricsCards.vue'
import BusinessSummaryCard from './components/BusinessSummaryCard.vue'
import DemandForecastChart from './components/DemandForecastChart.vue'

dayjs.extend(weekOfYear)
const store = useStore()

// Debug mode
const debugMode = ref(true) // Set to false in production

// State
const selectedWeek = ref(dayjs().startOf('week').toDate())
const forecastLoading = ref(false)
const optimizationLoading = ref(false)
const employeesLoading = ref(false)
const showEmployeeModal = ref(false)
const selectedEmployee = ref(null)
const allEmployeeAvailabilities = ref({}) // Format: { employeeId: { date: [slots] } }

// 🚀 NEW: Enhanced state for improved modal
const saving = ref(false)
const validationErrors = ref([])
const timePickerOptions = {
  start: '06:00',
  step: '00:30', 
  end: '23:30'
}

// Data
const forecastData = ref({
  avgCustomers: 0,
  confidence: 0,
  weeklyData: []
})

const optimizationData = ref({
  efficiency: 0,
  improvement: 0,
  savings: 0,
  satisfaction: 0
})

const scheduleMetrics = ref({
  efficiencyScore: 0,
  totalCost: 0,
  totalHours: 0
})

const optimizedSchedule = ref([])
const employees = ref([])
const influenceFactors = ref([])
const recommendations = ref([])
const eventHighlights = ref([])
const realEventsData = ref(null)
const businessSummary = ref('')
const detailedMetrics = ref(null)

// Computed
const hasOptimizedSchedule = computed(() => optimizedSchedule.value.length > 0)
// ✅ DEUTSCHE WOCHENTAGE - Ersetzen Sie die bestehende weekDays computed:
const weekDays = computed(() => {
  const start = dayjs(selectedWeek.value).startOf('week')
  const germanDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const germanDayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = start.add(i, 'day')
    return {
      date: date.format('YYYY-MM-DD'),
      label: germanDays[i],          // ✅ Deutsche Kurzform: Mo, Di, Mi...
      dayName: germanDayNames[i]     // ✅ Deutsche Vollform: Montag, Dienstag...
    }
  })
})

// ✅ FEATURE 3: Copy/Paste State
const copiedDayData = ref(null)

// ✅ FEATURE 1: Quick Slot Functions
const addQuickSlot = (date, startTime, endTime, type) => {
  if (!availabilityByDate.value[date]) {
    availabilityByDate.value[date] = []
  }
  
  const newSlot = {
    start_time: startTime,
    end_time: endTime,
    availability_type: type,
    is_available: type === 'working',
    notes: type === 'vacation' ? 'Ganztagsfrei' : ''
  }
  
  // ✅ FEATURE 2: TimeRange für neue Slots
  if (startTime && endTime) {
    newSlot.timeRange = [startTime, endTime]
  }
  
  availabilityByDate.value[date].push(newSlot)
  
  const typeLabels = {
    working: 'Arbeitszeit',
    vacation: 'Urlaub', 
    sick: 'Krankheit'
  }
  
  ElMessage.success(`${typeLabels[type]} für ${formatDate(date)} hinzugefügt`)
}

// ✅ FEATURE 3: Copy Day Data
const copyDayData = (date) => {
  const slots = getDaySlots(date)
  if (slots.length === 0) {
    ElMessage.warning('Keine Daten zum Kopieren vorhanden')
    return
  }
  
  copiedDayData.value = JSON.parse(JSON.stringify(slots))
  ElMessage.success(`Tag ${formatDate(date)} kopiert (${slots.length} Einträge)`)
}

// ✅ FEATURE 3: Paste Day Data  
const pasteDayData = (date) => {
  if (!copiedDayData.value) {
    ElMessage.warning('Keine kopierten Daten vorhanden')
    return
  }
  
  ElMessageBox.confirm(
    `Bestehende Einträge für ${formatDate(date)} überschreiben?`,
    'Einfügen bestätigen',
    {
      confirmButtonText: 'Ja, einfügen',
      cancelButtonText: 'Abbrechen',
      type: 'warning'
    }
  ).then(() => {
    availabilityByDate.value[date] = JSON.parse(JSON.stringify(copiedDayData.value))
    ElMessage.success(`${copiedDayData.value.length} Einträge eingefügt`)
  }).catch(() => {
    // User cancelled
  })
}

// ✅ FEATURE 2: Update Time Range (für Range-Picker)
const updateTimeRange = (slot, date, index) => {
  if (slot.timeRange && slot.timeRange.length === 2) {
    slot.start_time = slot.timeRange[0]
    slot.end_time = slot.timeRange[1]
    validateAvailability()
  }
}

// ✅ FEATURE 4: Enhanced Visual Classes
const getEnhancedSlotClass = (slot) => {
  const baseClass = getSlotTypeClass(slot.availability_type)
  const enhanced = 'enhanced-slot'
  return `${baseClass} ${enhanced}`
}

const getSlotIcon = (type) => {
  const icons = {
    working: '🕘',
    vacation: '🏖️',
    sick: '😷',
    break: '☕',
    meeting: '📋',
    unavailable: '❌'
  }
  return icons[type] || '🕘'
}

const getHoursBadgeClass = (date) => {
  const hours = getTotalHours(date)
  if (hours === 0) return 'empty'
  if (hours >= 8) return 'full'
  if (hours >= 6) return 'good'
  return 'partial'
}

const getProgressClass = (date) => {
  const hours = getTotalHours(date)
  if (hours > 8) return 'overtime'
  if (hours >= 7) return 'full'
  if (hours >= 4) return 'partial'
  return 'low'
}


const handleDayAction = (command) => {
  const [action, date] = command.split('-')
  
  switch (action) {
    case 'clear':
      clearDay(date)
      break
    case 'duplicate':
      duplicateDay(date)
      break
  }
}

const duplicateDay = (sourceDate) => {
  const sourceSlots = getDaySlots(sourceDate)
  if (sourceSlots.length === 0) {
    ElMessage.warning('Keine Daten zum Duplizieren')
    return
  }
  
  // Zeige Dialog mit verfügbaren Tagen
  const availableDays = weekDays.value
    .filter(day => day.date !== sourceDate)
    .map(day => ({
      value: day.date,
      label: `${day.dayName} (${formatDate(day.date)})`
    }))
    
  // Hier würden Sie einen Dialog zeigen - vereinfacht:
  ElMessageBox.prompt(
    'Zu welchem Tag duplizieren?',
    'Tag duplizieren',
    {
      inputType: 'text',
      inputPlaceholder: 'Ziel-Datum (YYYY-MM-DD)'
    }
  ).then(({ value: targetDate }) => {
    if (weekDays.value.find(day => day.date === targetDate)) {
      availabilityByDate.value[targetDate] = JSON.parse(JSON.stringify(sourceSlots))
      ElMessage.success(`Tag zu ${formatDate(targetDate)} dupliziert`)
    } else {
      ElMessage.error('Ungültiges Datum')
    }
  }).catch(() => {
    // User cancelled
  })
}

// Event handlers
const handleWeekChange = (newWeek) => {
  console.log('🔄 Week changed to:', newWeek)
  selectedWeek.value = newWeek
  loadWeekData()
}
const loadWeekData = async () => {
  console.log('📅 Loading week data...')
  employeesLoading.value = true
  
  try {
    // Lade Mitarbeiter
    const employeeResponse = await store.dispatch('employees/fetchEmployees')
    employees.value = Array.isArray(employeeResponse) ? employeeResponse : 
                     employeeResponse?.data || []
    
    console.log('✅ Loaded employees:', employees.value.length)
    
    // ✅ NEU: Lade Verfügbarkeitsdaten für alle Mitarbeiter
    await loadAllEmployeeAvailabilities()

// ✅ NEU: Aktualisiere Verfügbarkeitsdaten für einen spezifischen Mitarbeiter

    forecastData.value = { avgCustomers: 0, confidence: 0, weeklyData: [] }
    optimizedSchedule.value = []
    
  } catch (error) {
    console.error('❌ Error loading week data:', error)
    ElMessage.error('Fehler beim Laden der Wochendaten: ' + error.message)
  } finally {
    employeesLoading.value = false
  }
}

const refreshEmployeeAvailability = async (employeeId) => {
  const start = dayjs(selectedWeek.value).startOf('week').format('YYYY-MM-DD')
  const end = dayjs(selectedWeek.value).endOf('week').format('YYYY-MM-DD')
  
  console.log('🔄 Refreshing availability for employee:', employeeId)
  
  try {
    const data = await store.dispatch('availability/fetchEmployeeAvailability', {
      employeeId: employeeId,
      startDate: start,
      endDate: end
    })
    
    // Strukturiere Daten nach Datum
    const employeeAvailability = {}
    if (data && data.length > 0) {
      data.forEach(entry => {
        const normalizedDate = dayjs(entry.date).format('YYYY-MM-DD')
        if (!employeeAvailability[normalizedDate]) {
          employeeAvailability[normalizedDate] = []
        }
        employeeAvailability[normalizedDate].push({
          start_time: entry.start_time,
          end_time: entry.end_time,
          availability_type: entry.availability_type || 'working',
          is_available: entry.is_available !== false
        })
      })
    }
    
    // ✅ WICHTIG: Aktualisiere nur diesen Mitarbeiter in den allEmployeeAvailabilities
    allEmployeeAvailabilities.value[employeeId] = employeeAvailability
    
    console.log('✅ Refreshed availability for employee:', employeeId, employeeAvailability)
    
  } catch (error) {
    console.error(`❌ Error refreshing availability for employee ${employeeId}:`, error)
  }
}

// ✅ NEU: Lade Verfügbarkeitsdaten für alle Mitarbeiter
const loadAllEmployeeAvailabilities = async () => {
  const start = dayjs(selectedWeek.value).startOf('week').format('YYYY-MM-DD')
  const end = dayjs(selectedWeek.value).endOf('week').format('YYYY-MM-DD')
  
  console.log('📊 Loading availabilities for all employees...')
  
  const newAvailabilities = {}
  
  for (const employee of employees.value) {
    try {
      const data = await store.dispatch('availability/fetchEmployeeAvailability', {
        employeeId: employee.id,
        startDate: start,
        endDate: end
      })
      
      // Strukturiere Daten nach Datum
      const employeeAvailability = {}
      if (data && data.length > 0) {
        data.forEach(entry => {
          const normalizedDate = dayjs(entry.date).format('YYYY-MM-DD')
          if (!employeeAvailability[normalizedDate]) {
            employeeAvailability[normalizedDate] = []
          }
          employeeAvailability[normalizedDate].push({
            start_time: entry.start_time,
            end_time: entry.end_time,
            availability_type: entry.availability_type || 'working',
            is_available: entry.is_available !== false
          })
        })
      }
      
      newAvailabilities[employee.id] = employeeAvailability
      
    } catch (error) {
      console.error(`❌ Error loading availability for ${employee.firstName}:`, error)
      newAvailabilities[employee.id] = {}
    }
  }
  
  allEmployeeAvailabilities.value = newAvailabilities
  console.log('✅ Loaded availabilities for all employees:', newAvailabilities)
}

const generateForecast = async () => {
  console.log('🔮 Starting forecast generation...')
  forecastLoading.value = true
  
  try {
    console.log('📡 Calling aiScheduling/fetchForecast...')
    await store.dispatch('aiScheduling/fetchForecast')
    
    const raw = store.getters['aiScheduling/forecastData']
    console.log('📊 Raw forecast data received:', raw)

    if (!raw) {
      throw new Error('Keine Forecast-Daten vom Server erhalten')
    }

    const data = {
      avgCustomers: raw.avgCustomers || 0,
      confidence: raw.confidence || 0,
      weeklyData: raw.weeklyData || [],
      
      influenceFactors: (raw.influences || raw.influenceFactors || []).map(factor => {
        console.log('🎯 Processing influence factor:', factor)
        return {
          name: factor.factor || factor.name,
          impact: factor.impact,
          description: factor.description || `${factor.factor || factor.name}: ${factor.impact > 0 ? '+' : ''}${factor.impact}%`
        }
      }),
      
      recommendations: raw.recommendations || [],
      eventHighlights: raw.eventHighlights || [],
      summary: raw.summary || '',
      realEventsData: raw.realEventsData || null
    }

    console.log('✅ Processed forecast data:', data)

    forecastData.value = data
    influenceFactors.value = data.influenceFactors
    recommendations.value = data.recommendations
    eventHighlights.value = data.eventHighlights
    realEventsData.value = data.realEventsData
    businessSummary.value = data.summary
    detailedMetrics.value = parseDetailedMetrics(raw)

    console.log('📈 Final state - influenceFactors:', influenceFactors.value.length)

    ElMessage.success(`🎯 KI-Analyse komplett! ${data.influenceFactors.length} Faktoren, ${data.recommendations.length} Empfehlungen`)
    
  } catch (error) {
    console.error('❌ Forecast generation failed:', error)
    
    if (error.response?.status === 404) {
      ElMessage.error('🔍 Forecast-Service nicht verfügbar')
    } else if (error.response?.status === 500) {
      ElMessage.error('⚙️ Server-Fehler beim Generieren der Vorhersage')
    } else {
      ElMessage.error('❌ Fehler beim Laden der Vorhersage: ' + error.message)
    }
  } finally {
    forecastLoading.value = false
  }
}

const parseDetailedMetrics = (raw) => {
  const summary = raw.summary || ''
  console.log('🔍 Parsing metrics from summary:', summary.substring(0, 100) + '...')
  
  const tempMatch = summary.match(/(\d+)°C/)
  const temperature = tempMatch ? tempMatch[1] : '0'
  
  const humidityMatch = summary.match(/(\d+)%\s+Luftfeuchtigkeit/i)
  const humidity = humidityMatch ? humidityMatch[1] : '0'
  
  const salesMatch = summary.match(/(\d+)\s+Verkäufen?\s+in\s+(\d+)\s+Wochen/)
  let dailyRevenue = '0.00'
  if (salesMatch) {
    const sales = parseInt(salesMatch[1])
    const weeks = parseInt(salesMatch[2])
    const avgSalesPerWeek = sales / weeks
    const estimatedWeeklyRevenue = avgSalesPerWeek * 20
    const estimatedDailyRevenue = estimatedWeeklyRevenue / 7
    dailyRevenue = estimatedDailyRevenue.toFixed(2)
  }
  
  const lastSaleMatch = summary.match(/(\d+)\s+Wochen/)
  const lastSale = lastSaleMatch ? `${lastSaleMatch[1]} Wochen` : '8 Wochen'
  
  let weeklyTrend = 0
  if (raw.weeklyData && raw.weeklyData.length > 0) {
    const predictions = raw.weeklyData.map(d => d.predictedCustomers || 0)
    const historical = raw.weeklyData.map(d => d.historicalAvg || 0)
    const predAvg = predictions.reduce((sum, val) => sum + val, 0) / predictions.length
    const histAvg = historical.reduce((sum, val) => sum + val, 0) / historical.length
    if (histAvg > 0) {
      weeklyTrend = Math.round(((predAvg - histAvg) / histAvg) * 100)
    }
  }
  
  const metrics = {
    dailyRevenue,
    weeklyTrend,
    temperature,
    humidity, 
    eventsCount: raw.realEventsData?.totalEvents || 0,
    lastSale
  }
  
  console.log('📊 Extracted detailed metrics:', metrics)
  return metrics
}

const optimizeSchedule = async () => {
  console.log('⚡ Starting schedule optimization...')
  
  if (forecastData.value.weeklyData.length === 0) {
    ElMessage.warning('⚠️ Bitte erst Nachfrage-Vorhersage generieren')
    return
  }
  
  optimizationLoading.value = true
  
  try {
    ElMessage.info('⚡ KI optimiert Schichtpläne basierend auf Vorhersage...')
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const mockSchedule = weekDays.value.map(day => ({
      date: day.date,
      predictedCustomers: forecastData.value.weeklyData.find(d => d.date === day.date)?.predictedCustomers || Math.floor(Math.random() * 50) + 20,
      totalStaff: Math.floor(Math.random() * 4) + 3,
      shifts: [
        {
          id: `morning-${day.date}`,
          shiftType: 'morning',
          startTime: '08:00',
          endTime: '16:00',
          cost: Math.floor(Math.random() * 200) + 150,
          efficiency: Math.floor(Math.random() * 20) + 75,
          employees: employees.value.slice(0, 2).map(emp => ({
            ...emp,
            skillMatch: Math.floor(Math.random() * 30) + 70
          }))
        },
        {
          id: `evening-${day.date}`,
          shiftType: 'evening', 
          startTime: '16:00',
          endTime: '24:00',
          cost: Math.floor(Math.random() * 250) + 200,
          efficiency: Math.floor(Math.random() * 20) + 80,
          employees: employees.value.slice(1, 3).map(emp => ({
            ...emp,
            skillMatch: Math.floor(Math.random() * 25) + 75
          }))
        }
      ]
    }))
    
    optimizedSchedule.value = mockSchedule
    
    optimizationData.value = {
      efficiency: Math.floor(Math.random() * 15) + 80,
      improvement: Math.floor(Math.random() * 10) + 15,
      savings: Math.floor(Math.random() * 200) + 150,
      satisfaction: Math.floor(Math.random() * 2) + 8
    }
    
    scheduleMetrics.value = {
      efficiencyScore: optimizationData.value.efficiency,
      totalCost: mockSchedule.reduce((sum, day) => 
        sum + day.shifts.reduce((daySum, shift) => daySum + shift.cost, 0), 0
      ),
      totalHours: mockSchedule.length * 16
    }
    
    console.log('✅ Schedule optimization complete:', {
      days: mockSchedule.length,
      totalCost: scheduleMetrics.value.totalCost
    })
    
    ElMessage.success('🚀 Optimaler Schichtplan wurde generiert!')
    
  } catch (error) {
    console.error('❌ Schedule optimization failed:', error)
    ElMessage.error('Fehler bei der Schichtplan-Optimierung: ' + error.message)
  } finally {
    optimizationLoading.value = false
  }
}

const saveSchedule = async () => {
  console.log('💾 Saving optimized schedule...')
  
  if (!hasOptimizedSchedule.value) {
    ElMessage.warning('⚠️ Kein optimierter Schichtplan vorhanden')
    return
  }
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('📅 Schichtplan wurde erfolgreich gespeichert!')
    console.log('✅ Schedule saved successfully')
    
  } catch (error) {
    console.error('❌ Schedule save failed:', error)
    ElMessage.error('Fehler beim Speichern des Schichtplans: ' + error.message)
  }
}

// Helper methods
const getRecommendationPriority = (rec, index) => {
  if (index === 0) return 'priority-high'
  if (index < 3) return 'priority-medium'
  return 'priority-normal'
}

const getRecommendationLabel = (index) => {
  const labels = ['🔥 Sofort', '⚡ Hoch', '📌 Normal', '💡 Optional']
  return labels[index] || labels[3]
}

const getRecommendationIcon = (recommendation) => {
  const text = recommendation.toLowerCase()
  if (text.includes('event') || text.includes('konzert')) return '🎪'
  if (text.includes('marketing') || text.includes('bewerbung')) return '📱'
  if (text.includes('personal') || text.includes('mitarbeiter')) return '👥'
  if (text.includes('menü') || text.includes('spezial')) return '🍽️'
  if (text.includes('kooperation') || text.includes('cross')) return '🤝'
  if (text.includes('strukturelle') || text.includes('geschäft')) return '⚙️'
  return '💡'
}

const markRecommendationDone = (index) => {
  ElMessage.success(`Empfehlung "${recommendations.value[index].substring(0, 30)}..." als erledigt markiert`)
}

const shareRecommendation = (recommendation) => {
  navigator.clipboard.writeText(recommendation)
  ElMessage.success('Empfehlung in Zwischenablage kopiert')
}

const exportRecommendations = () => {
  const text = recommendations.value.join('\n\n')
  navigator.clipboard.writeText(text)
  ElMessage.success('Alle Empfehlungen exportiert')
}

const getPositionLabel = (position) => {
  const labels = {
    chef: 'Küchenchef',
    cook: 'Koch',
    waiter: 'Kellner',
    bartender: 'Barkeeper',
    manager: 'Manager',
    cleaner: 'Reinigung',
    cashier: 'Kasse',
    host: 'Gastgeber'
  }
  return labels[position] || position
}

const getShiftTypeLabel = (type) => {
  const labels = {
    morning: 'Frühschicht',
    afternoon: 'Mittagsschicht', 
    evening: 'Abendschicht',
    night: 'Nachtschicht'
  }
  return labels[type] || type
}

const getShiftTypeClass = (type) => `shift-${type}`

const getSkillMatchClass = (match) => {
  if (match >= 85) return 'excellent'
  if (match >= 70) return 'good'
  return 'fair'
}

// ✅ ECHTE VERFÜGBARKEITSDATEN: Ersetzen Sie die 3 Mock-Funktionen
const getAvailabilityClass = (employee, day) => {
  const employeeData = allEmployeeAvailabilities.value[employee.id]
  if (!employeeData || !employeeData[day.date] || employeeData[day.date].length === 0) {
    return 'unavailable'
  }
  
  const hasWorkingSlots = employeeData[day.date].some(slot => 
    slot.availability_type === 'working' && slot.start_time && slot.end_time
  )
  
  return hasWorkingSlots ? 'available' : 'unavailable'
}

const getAvailabilityTime = (employee, day) => {
  const employeeData = allEmployeeAvailabilities.value[employee.id]
  if (!employeeData || !employeeData[day.date] || employeeData[day.date].length === 0) {
    return 'Nicht verfügbar'
  }
  
  const workingSlots = employeeData[day.date].filter(slot => 
    slot.availability_type === 'working' && slot.start_time && slot.end_time
  )
  
  if (workingSlots.length === 0) {
    const otherSlots = employeeData[day.date]
    if (otherSlots.some(slot => slot.availability_type === 'vacation')) {
      return '🏖️ Urlaub'
    }
    if (otherSlots.some(slot => slot.availability_type === 'sick')) {
      return '😷 Krank'
    }
    return 'Nicht verfügbar'
  }
  
  // Zeige erste und letzte Arbeitszeit
  const startTimes = workingSlots.map(slot => slot.start_time).sort()
  const endTimes = workingSlots.map(slot => slot.end_time).sort()
  const earliestStart = startTimes[0]
  const latestEnd = endTimes[endTimes.length - 1]
  
  return `${earliestStart}-${latestEnd}`
}

const getAvailabilityStatus = (employee, day) => {
  const employeeData = allEmployeeAvailabilities.value[employee.id]
  if (!employeeData || !employeeData[day.date] || employeeData[day.date].length === 0) {
    return 'Nicht verfügbar'
  }
  
  const workingSlots = employeeData[day.date].filter(slot => 
    slot.availability_type === 'working'
  )
  
  if (workingSlots.length > 0) {
    const totalHours = workingSlots.reduce((total, slot) => {
      if (slot.start_time && slot.end_time) {
        return total + calculateMinutesBetween(slot.start_time, slot.end_time)
      }
      return total
    }, 0) / 60
    
    return `Verfügbar (${Math.round(totalHours * 10) / 10}h)`
  }
  
  const specialSlots = employeeData[day.date]
  if (specialSlots.some(slot => slot.availability_type === 'vacation')) {
    return 'Urlaub'
  }
  if (specialSlots.some(slot => slot.availability_type === 'sick')) {
    return 'Krank'
  }
  
  return 'Nicht verfügbar'
}

const formatDate = (date) => dayjs(date).format('DD.MM')
const formatDayHeader = (date) => dayjs(date).format('dddd, DD.MM')

const toggleEmployeeDay = (employeeId, date) => {
  console.log('Toggle availability:', employeeId, date)
}

// 🚀 NEW: Enhanced Availability Modal Methods
const employeeAvailability = ref([])
const availabilityByDate = ref({})

// 🧮 Computed Properties for Better UX
const getTotalWorkingDays = () => {
  let count = 0
  weekDays.value.forEach(day => {
    const slots = getDaySlots(day.date)
    if (slots.some(slot => slot.availability_type === 'working' && slot.start_time && slot.end_time)) {
      count++
    }
  })
  return count
}

// ✅ VERBESSERTE VERSION: Unterstützt sowohl Woche als auch einzelne Tage
const getTotalHours = (specificDate = null) => {
  if (specificDate) {
    // Für einen spezifischen Tag
    const slots = getDaySlots(specificDate)
    let totalMinutes = 0
    
    slots.forEach(slot => {
      if (slot.availability_type === 'working' && slot.start_time && slot.end_time) {
        totalMinutes += calculateMinutesBetween(slot.start_time, slot.end_time)
      }
    })
    
    return Math.round(totalMinutes / 60 * 10) / 10
  } else {
    // Für die ganze Woche (original logic)
    let totalMinutes = 0
    weekDays.value.forEach(day => {
      const slots = getDaySlots(day.date)
      slots.forEach(slot => {
        if (slot.availability_type === 'working' && slot.start_time && slot.end_time) {
          totalMinutes += calculateMinutesBetween(slot.start_time, slot.end_time)
        }
      })
    })
    return Math.round(totalMinutes / 60 * 10) / 10
  }
}

const getAverageHoursPerDay = () => {
  const totalHours = getTotalHours()
  const workingDays = getTotalWorkingDays()
  return workingDays > 0 ? Math.round(totalHours / workingDays * 10) / 10 : 0
}

const getTotalSlots = () => {
  let count = 0
  weekDays.value.forEach(day => {
    count += getDaySlots(day.date).length
  })
  return count
}

// Helper Functions
const calculateMinutesBetween = (start, end) => {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  return endMinutes - startMinutes
}

const calculateDuration = (start, end) => {
  const minutes = calculateMinutesBetween(start, end)
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

const isWeekend = (date) => {
  const day = dayjs(date).day()
  return day === 0 || day === 6
}

const getWeekNumber = () => {
  return dayjs(selectedWeek.value).week()
}

const formatWeekRange = () => {
  const start = dayjs(selectedWeek.value).startOf('week')
  const end = dayjs(selectedWeek.value).endOf('week')
  return `${start.format('DD.MM')} - ${end.format('DD.MM.YYYY')}`
}

const getSlotTypeClass = (type) => {
  return type || 'working'
}

// Quick Template Functions
const applyQuickTemplate = (templateType) => {
  ElMessageBox.confirm(
    'Dies überschreibt alle bestehenden Einträge für diese Woche. Fortfahren?',
    'Vorlage anwenden',
    {
      confirmButtonText: 'Ja, anwenden',
      cancelButtonText: 'Abbrechen',
      type: 'warning'
    }
  ).then(() => {
    clearAllAvailability()
    
    switch (templateType) {
      case 'fulltime':
        applyFulltimeTemplate()
        break
      case 'parttime':
        applyParttimeTemplate()
        break
      case 'weekend':
        applyWeekendTemplate()
        break
      case 'flexible':
        applyFlexibleTemplate()
        break
    }
    
    ElMessage.success('Vorlage erfolgreich angewendet!')
  }).catch(() => {
    // User cancelled
  })
}

const applyFulltimeTemplate = () => {
  const workDays = weekDays.value.filter((_, index) => index < 5)
  
  workDays.forEach(day => {
    availabilityByDate.value[day.date] = [{
      start_time: '08:00',
      end_time: '17:00',
      availability_type: 'working',
      is_available: true
    }]
  })
}

const applyParttimeTemplate = () => {
  const partDays = [0, 2, 4]
  
  partDays.forEach(dayIndex => {
    const day = weekDays.value[dayIndex]
    availabilityByDate.value[day.date] = [{
      start_time: '09:00',
      end_time: '15:00',
      availability_type: 'working',
      is_available: true
    }]
  })
}

const applyWeekendTemplate = () => {
  const weekendDays = [5, 6]
  
  weekendDays.forEach(dayIndex => {
    const day = weekDays.value[dayIndex]
    availabilityByDate.value[day.date] = [{
      start_time: '10:00',
      end_time: '20:00',
      availability_type: 'working',
      is_available: true
    }]
  })
}

const applyFlexibleTemplate = () => {
  weekDays.value.forEach(day => {
    availabilityByDate.value[day.date] = [
      {
        start_time: '08:00',
        end_time: '14:00',
        availability_type: 'working',
        is_available: true
      },
      {
        start_time: '17:00',
        end_time: '21:00',
        availability_type: 'working',
        is_available: true
      }
    ]
  })
}

const copyFromPreviousWeek = async () => {
  try {
    const previousWeek = dayjs(selectedWeek.value).subtract(1, 'week')
    const start = previousWeek.startOf('week').format('YYYY-MM-DD')
    const end = previousWeek.endOf('week').format('YYYY-MM-DD')
    
    ElMessage.info('Lade Daten der Vorwoche...')
    
    const data = await store.dispatch('availability/fetchEmployeeAvailability', {
      employeeId: selectedEmployee.value.id,
      startDate: start,
      endDate: end
    })
    
    if (data && data.length > 0) {
      clearAllAvailability()
      
      data.forEach(entry => {
        const currentWeekDate = dayjs(entry.date).add(1, 'week').format('YYYY-MM-DD')
        
        if (!availabilityByDate.value[currentWeekDate]) {
          availabilityByDate.value[currentWeekDate] = []
        }
        
        availabilityByDate.value[currentWeekDate].push({
          start_time: entry.start_time,
          end_time: entry.end_time,
          availability_type: entry.availability_type,
          is_available: entry.is_available
        })
      })
      
      ElMessage.success('Vorwoche erfolgreich kopiert!')
    } else {
      ElMessage.warning('Keine Daten in der Vorwoche gefunden')
    }
  } catch (error) {
    console.error('Error copying previous week:', error)
    ElMessage.error('Fehler beim Kopieren der Vorwoche')
  }
}

const clearDay = (date) => {
  ElMessageBox.confirm(
    'Alle Einträge für diesen Tag löschen?',
    'Tag leeren',
    {
      confirmButtonText: 'Ja, löschen',
      cancelButtonText: 'Abbrechen',
      type: 'warning'
    }
  ).then(() => {
    availabilityByDate.value[date] = []
    ElMessage.success('Tag geleert')
  }).catch(() => {
    // User cancelled
  })
}

const addStandardWorkingDay = (date) => {
  if (!availabilityByDate.value[date]) {
    availabilityByDate.value[date] = []
  }
  
  availabilityByDate.value[date].push({
    start_time: '09:00',
    end_time: '17:00',
    availability_type: 'working',
    is_available: true
  })
  
  ElMessage.success('Standard-Arbeitszeit hinzugefügt')
}

const addWorkingDay = (date) => {
  addStandardWorkingDay(date)
}

const clearAllAvailability = () => {
  weekDays.value.forEach(day => {
    availabilityByDate.value[day.date] = []
  })
}

const updateSlotType = (date, slotIndex, newType) => {
  const slot = availabilityByDate.value[date][slotIndex]
  
  if (newType !== 'working') {
    slot.start_time = ''
    slot.end_time = ''
  } else if (!slot.start_time || !slot.end_time) {
    slot.start_time = '09:00'
    slot.end_time = '17:00'
  }
  
  validateAvailability()
}

// Validation
const validateAvailability = () => {
  validationErrors.value = []
  
  weekDays.value.forEach(day => {
    const slots = getDaySlots(day.date)
    
    slots.forEach((slot, index) => {
      if (slot.availability_type === 'working') {
        if (!slot.start_time || !slot.end_time) {
          validationErrors.value.push(
            `${day.dayName}: Startzeit und Endzeit sind erforderlich`
          )
          return
        }
        
        if (slot.start_time >= slot.end_time) {
          validationErrors.value.push(
            `${day.dayName}: Startzeit muss vor Endzeit liegen`
          )
        }
        
        slots.forEach((otherSlot, otherIndex) => {
          if (index !== otherIndex && 
              otherSlot.availability_type === 'working' &&
              otherSlot.start_time && otherSlot.end_time) {
            
            const slotStart = slot.start_time
            const slotEnd = slot.end_time
            const otherStart = otherSlot.start_time
            const otherEnd = otherSlot.end_time
            
            if ((slotStart < otherEnd && slotEnd > otherStart)) {
              validationErrors.value.push(
                `${day.dayName}: Überschneidende Zeiten`
              )
            }
          }
        })
      }
    })
  })
  
  validationErrors.value = [...new Set(validationErrors.value)]
}

// Watch for changes to trigger validation
watch(availabilityByDate, () => {
  validateAvailability()
}, { deep: true })

// ✅ COPY & PASTE: Ersetzen Sie die openEmployeeModal Funktion (Zeile 1281-1322)
// ✅ FINAL FIX: Ersetzen Sie die openEmployeeModal Funktion mit dieser korrigierten Version

const openEmployeeModal = async (employee) => {
  // Wenn schon offen: kurz schließen, damit die Daten neu aufgebaut werden
  if (showEmployeeModal.value) {
    showEmployeeModal.value = false
    await nextTick()
  }

  selectedEmployee.value = employee
  showEmployeeModal.value = true

  try {
    const start = dayjs(selectedWeek.value).startOf('week').format('YYYY-MM-DD')
    const end = dayjs(selectedWeek.value).endOf('week').format('YYYY-MM-DD')

    ElMessage.info('📅 Lade Verfügbarkeiten...')

    // Lade alle Verfügbarkeiten für die Woche
    const weekAvailabilities = await store.dispatch('availability/fetchEmployeeAvailability', {
      employeeId: employee.id,
      startDate: start,
      endDate: end
    })

    // ✅ FIX: Reset availabilityByDate komplett
    availabilityByDate.value = {}
    
    // ✅ FIX: Neue Variable für korrekte Datums-Formatierung
    const newAvailabilityByDate = {}

    if (weekAvailabilities && weekAvailabilities.length > 0) {
      weekAvailabilities.forEach((entry) => {
        // ✅ CRITICAL FIX: Datums-Normalisierung
        const normalizedDate = dayjs(entry.date).format('YYYY-MM-DD')
        
        console.log('🔍 Processing entry:', {
          originalDate: entry.date,
          normalizedDate: normalizedDate,
          start_time: entry.start_time,
          end_time: entry.end_time
        })
        
        if (!newAvailabilityByDate[normalizedDate]) {
          newAvailabilityByDate[normalizedDate] = []
        }
        
        newAvailabilityByDate[normalizedDate].push({
          id: entry.id, // Für Updates
          start_time: entry.start_time,
          end_time: entry.end_time,
          availability_type: entry.availability_type || 'working',
          is_available: entry.is_available !== false,
          notes: entry.notes || ''
        })
      })

      console.log('✅ Loaded availability for', employee.firstName, weekAvailabilities.length, 'entries')
      console.log('📋 Final normalized availability by date:', newAvailabilityByDate)
      
      // ✅ Setze alle Daten auf einmal
      availabilityByDate.value = newAvailabilityByDate
      
      ElMessage.success(`✅ ${weekAvailabilities.length} Verfügbarkeiten geladen und angezeigt`)
      
    } else {
      // Keine bestehenden Daten
      availabilityByDate.value = {}
      console.log('📝 No existing availability found - starting fresh')
      ElMessage.info('Keine bestehende Verfügbarkeit - kann neue erstellen')
    }

  } catch (err) {
    console.error('❌ Fehler beim Laden:', err)
    ElMessage.error('Fehler beim Laden der Verfügbarkeiten: ' + err.message)
    availabilityByDate.value = {}
  }
}



const getDaySlots = (date) => {
  if (!availabilityByDate.value[date]) {
    availabilityByDate.value[date] = []
  }
  return availabilityByDate.value[date]
}


const addSlot = (date) => {
  if (!availabilityByDate.value[date]) availabilityByDate.value[date] = []
  availabilityByDate.value[date].push({
    start_time: '',
    end_time: '',
    availability_type: 'working',
    is_available: true
  })
}

const removeSlot = (date, index) => {
  availabilityByDate.value[date].splice(index, 1)
}

// 💾 Enhanced Save Function
const saveEmployeeAvailability = async () => {
  // Final validation
  validateAvailability()
  
  if (validationErrors.value.length > 0) {
    ElMessage.error('Bitte korrigieren Sie die Fehler vor dem Speichern')
    return
  }
  
  saving.value = true
  
  try {
    const allEntries = []
    Object.entries(availabilityByDate.value).forEach(([date, slots]) => {
      slots.forEach(slot => {
        if (slot.start_time && slot.end_time) {
          allEntries.push({
            employee_id: selectedEmployee.value.id,
            date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            availability_type: slot.availability_type,
            is_available: true
          })
        }
      })
    })

    // ✅ ERLAUBEN: Auch leere Verfügbarkeiten speichern (= Mitarbeiter nicht verfügbar)
if (allEntries.length === 0) {
  console.log('💾 Saving empty availability (employee not available this week)')
}
    await store.dispatch('availability/saveEmployeeAvailability', {
      employee_id: selectedEmployee.value.id,
      availability_entries: allEntries
    })

    ElMessage.success(`✅ ${allEntries.length} Verfügbarkeiten gespeichert`)
    await refreshEmployeeAvailability(selectedEmployee.value.id)
    showEmployeeModal.value = false
  } catch (error) {
    console.error('❌ Fehler beim Speichern:', error)
    ElMessage.error('Fehler beim Speichern der Verfügbarkeit')
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  console.log('🚀 Scheduling dashboard mounted')
  await loadWeekData()
  
  document.addEventListener('trigger-ai-forecast', () => {
    console.log('🎯 AI forecast triggered from navigation!')
    generateForecast()
  })
})

</script>

<style scoped>
.ai-scheduling-dashboard {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Enhanced recommendations styles */
.recommendations-container,
.events-container {
  max-height: 280px;
  overflow-y: auto;
}

.recommendation-item.enhanced {
  padding: 15px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.recommendation-item.enhanced:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.recommendation-priority {
  font-size: 11px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
}

.priority-high {
  border-left: 4px solid #f56c6c;
}

.priority-high .recommendation-priority {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.priority-medium {
  border-left: 4px solid #e6a23c;
}

.priority-medium .recommendation-priority {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.recommendation-item,
.event-highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.recommendation-text,
.event-text {
  flex: 1;
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
}

.recommendation-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.recommendations-footer {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.events-summary {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.availability-grid {
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  gap: 1px;
  background: #f0f0f0;
  border: 1px solid #e0e0e0;
}

.day-header {
  display: contents;
}

.day-header > div {
  background: #f8f9fa;
  padding: 10px;
  font-weight: bold;
  text-align: center;
  border-bottom: 2px solid #e0e0e0;
}

.employee-row {
  display: contents;
}

.employee-info {
  background: #fff;
  padding: 15px;
  border-right: 1px solid #e0e0e0;
}

.employee-name {
  font-weight: 500;
  color: #303133;
}

.employee-position {
  font-size: 12px;
  color: #909399;
  margin: 2px 0;
}

.employee-score {
  font-size: 11px;
  color: #67c23a;
  font-weight: bold;
}

.availability-cell {
  background: #fff;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.availability-cell:hover {
  background: #f0f9ff;
}

.availability-cell.available {
  background: rgba(103, 194, 58, 0.1);
  border-left: 3px solid #67c23a;
}

.availability-cell.unavailable {
  background: rgba(245, 108, 108, 0.1);
  border-left: 3px solid #f56c6c;
}

.availability-time {
  font-size: 11px;
  font-weight: 500;
  color: #303133;
}

.availability-status {
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.schedule-metrics {
  display: flex;
  gap: 10px;
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.day-schedule {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.day-schedule .day-header {
  background: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.day-schedule .day-header h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.day-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

.shifts-container {
  padding: 15px;
}

.shift-card {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  transition: box-shadow 0.2s;
}

.shift-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.shift-card:last-child {
  margin-bottom: 0;
}

.shift-morning { border-left: 4px solid #e6a23c; }
.shift-afternoon { border-left: 4px solid #409eff; }
.shift-evening { border-left: 4px solid #9c27b0; }
.shift-night { border-left: 4px solid #5f6368; }

.shift-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.shift-time {
  font-weight: bold;
  color: #303133;
}

.shift-type {
  font-size: 12px;
  color: #909399;
  text-transform: uppercase;
}

.shift-employees {
  margin-bottom: 8px;
}

.employee-assignment {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.employee-assignment:last-child {
  border-bottom: none;
}

.employee-assignment .employee-name {
  font-weight: 500;
  color: #303133;
}

.employee-details {
  display: flex;
  gap: 10px;
  align-items: center;
}

.position {
  font-size: 11px;
  color: #909399;
}

.skill-match {
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
}

.skill-match.excellent {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

.skill-match.good {
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.1);
}

.skill-match.fair {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}

.shift-metrics {
  text-align: center;
  color: #909399;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}

/* 🚀 IMPROVED MODAL STYLES */
.availability-modal {
  --el-dialog-border-radius: 12px;
}

.availability-editor-improved {
  padding: 0;
}

.employee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
}

.employee-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.employee-avatar {
  width: 60px;
  height: 60px;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  border-radius: 12px;
}

.employee-details h3 {
  margin: 0 0 4px 0;
  color: #303133;
}

.employee-details p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.week-info {
  text-align: right;
}

.week-display {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.templates-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.templates-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.template-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.day-card {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: #fff;
  transition: all 0.2s;
}

.day-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.day-weekend {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
  border-color: #f5c6cb;
}

.day-has-slots {
  border-color: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.1);
}

.day-card .day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafbfc;
  border-radius: 12px 12px 0 0;
}

.day-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.day-date {
  color: #909399;
  font-size: 12px;
}

.time-slots {
  padding: 16px;
  min-height: 120px;
}

.time-slot {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.time-slot:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.time-slot.working { border-left: 4px solid #67c23a; }
.time-slot.vacation { border-left: 4px solid #e6a23c; }
.time-slot.sick { border-left: 4px solid #f56c6c; }
.time-slot.meeting { border-left: 4px solid #409eff; }
.time-slot.unavailable { border-left: 4px solid #909399; }

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.time-inputs {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.time-input-group {
  flex: 1;
}

.time-input-group label {
  display: block;
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.slot-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.duration {
  font-weight: 500;
  color: #67c23a;
}

.add-slot-btn {
  width: 100%;
  border: 2px dashed #e4e7ed;
  margin-top: 8px;
  padding: 12px;
}

.add-slot-btn:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.empty-day {
  text-align: center;
  color: #c0c4cc;
  padding: 24px;
}

.empty-day .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.week-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.summary-card h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.summary-stats {
  display: flex;
  gap: 24px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.validation-messages {
  margin-top: 12px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 0 0;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .ai-scheduling-dashboard {
    padding: 10px;
  }
  
  .availability-grid {
    grid-template-columns: 150px repeat(7, 1fr);
    font-size: 12px;
  }
  
  .schedule-grid {
    grid-template-columns: 1fr;
  }

  .availability-modal :deep(.el-dialog) {
    width: 95% !important;
    margin: 0;
    border-radius: 16px 16px 0 0;
    position: fixed;
    bottom: 0;
    top: auto;
    transform: translateX(-50%);
  }

  .employee-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .days-grid {
    grid-template-columns: 1fr;
  }

  .summary-stats {
    justify-content: space-around;
  }

  .template-buttons {
    flex-direction: column;
  }

  .modal-footer {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}

/* ✅ ENHANCED CSS STYLES - Fügen Sie diese zu Ihrer <style scoped> hinzu */

/* ✅ FEATURE 4: Erweiterte Day Cards */
.day-card.enhanced {
  transition: all 0.3s ease;
  border: 2px solid #e4e7ed;
  position: relative;
  overflow: hidden;
}

.day-card.enhanced:hover {
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.day-card.day-empty {
  border-style: dashed;
  opacity: 0.7;
}

.day-card.day-full {
  border-color: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.1);
}

.day-card.day-weekend {
  background: linear-gradient(135deg, #fef7f0 0%, #fed7aa 100%);
  border-color: #f59e0b;
}

/* ✅ FEATURE 4: Enhanced Day Header */
.day-header.enhanced {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.day-info {
  flex: 1;
}

.day-info h4 {
  margin: 0 0 4px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
}

.day-date {
  color: #64748b;
  font-size: 12px;
  display: block;
  margin-bottom: 8px;
}

.day-stats {
  display: flex;
  gap: 8px;
}

.hours-badge {
  font-size: 11px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.hours-badge.empty {
  background: #f1f5f9;
  color: #64748b;
}

.hours-badge.partial {
  background: rgba(251, 191, 36, 0.1);
  color: #f59e0b;
}

.hours-badge.good {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.hours-badge.full {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

/* ✅ FEATURE 3: Copy/Paste Actions */
.day-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.day-actions .el-button {
  border: none !important;
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

.day-actions .el-button:hover {
  background: rgba(64, 158, 255, 0.1) !important;
  transform: scale(1.1);
}

/* ✅ FEATURE 1: Quick Templates */
.quick-templates {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e4e7ed;
}

.quick-templates .el-button-group {
  width: 100%;
  display: flex;
}

.quick-templates .el-button {
  flex: 1;
  font-size: 11px;
  padding: 8px 4px;
  border-radius: 6px;
}

/* ✅ FEATURE 4: Enhanced Time Slots */
.time-slots.enhanced {
  padding: 16px;
  min-height: 120px;
}

.time-slot.enhanced {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
  transition: all 0.2s;
}

.time-slot.enhanced:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #d1d5db;
}

/* ✅ FEATURE 4: Slot Type Colors */
.time-slot.working { 
  border-left: 4px solid #3b82f6;
  background: linear-gradient(90deg, #eff6ff, #ffffff);
}

.time-slot.vacation { 
  border-left: 4px solid #f59e0b;
  background: linear-gradient(90deg, #fefce8, #ffffff);
}

.time-slot.sick { 
  border-left: 4px solid #ef4444;
  background: linear-gradient(90deg, #fef2f2, #ffffff);
}

.time-slot.meeting { 
  border-left: 4px solid #8b5cf6;
  background: linear-gradient(90deg, #f5f3ff, #ffffff);
}

.time-slot.break { 
  border-left: 4px solid #06b6d4;
  background: linear-gradient(90deg, #f0fdff, #ffffff);
}

.time-slot.unavailable { 
  border-left: 4px solid #6b7280;
  background: linear-gradient(90deg, #f9fafb, #ffffff);
  opacity: 0.7;
}

/* ✅ Enhanced Slot Header */
.slot-header.enhanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.slot-type-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slot-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

/* ✅ FEATURE 2: Enhanced Time Inputs */
.time-inputs.enhanced {
  margin-bottom: 12px;
}

.time-range-container {
  width: 100%;
}

.time-inputs-fallback {
  display: flex;
  gap: 12px;
}

.time-input-group {
  flex: 1;
}

.time-input-group label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
  font-weight: 500;
}

/* ✅ Enhanced Slot Info */
.slot-info.enhanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 6px;
  margin-top: 8px;
}

.duration-display {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #3b82f6;
}

.duration-icon {
  font-size: 14px;
}

.time-range-display {
  color: #6b7280;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* ✅ Enhanced Notes */
.slot-notes.enhanced {
  margin-top: 8px;
}

.slot-notes.enhanced .el-input {
  --el-input-border-color: #e5e7eb;
  --el-input-hover-border-color: #d1d5db;
}

/* ✅ Enhanced Add Button */
.add-slot-btn.enhanced {
  width: 100%;
  border: 2px dashed #d1d5db;
  margin-top: 12px;
  padding: 16px;
  background: rgba(248, 250, 252, 0.5);
  transition: all 0.2s;
}

.add-slot-btn.enhanced:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
  color: #3b82f6;
}

/* ✅ Enhanced Empty State */
.empty-day.enhanced {
  text-align: center;
  padding: 32px 16px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-day.enhanced p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.empty-actions {
  margin-top: 16px;
}

/* ✅ NEUE: Progress Bar */
.day-progress {
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e4e7ed;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.progress-fill.low {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.progress-fill.partial {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.progress-fill.full {
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.progress-fill.overtime {
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overtime-warning {
  color: #8b5cf6;
  font-weight: 600;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

/* ✅ Responsive Anpassungen */
@media (max-width: 768px) {
  .day-header.enhanced {
    padding: 12px;
  }
  
  .quick-templates .el-button {
    font-size: 10px;
    padding: 6px 2px;
  }
  
  .time-inputs-fallback {
    flex-direction: column;
  }
  
  .slot-info.enhanced {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
  
  .day-actions {
    gap: 2px;
  }
}

.employee-info.clickable-row {
  cursor: pointer;
  transition: all 0.2s ease;
}

.employee-info.clickable-row:hover {
  background: #f8f9fa !important;
  transform: translateX(4px);
  box-shadow: 2px 0 8px rgba(64, 158, 255, 0.2);
}

</style>