<template>
  <el-card shadow="hover" class="filter-card">
    <template #header>
      <div class="card-header">
        <el-icon><Filter /></el-icon>
        <span>👥 Mitarbeiterfilter</span>
      </div>
    </template>

    <!-- ✅ Loading State hinzugefügt -->
    <div v-loading="loading" element-loading-text="Mitarbeiter werden geladen...">
      <el-form :model="filters" inline label-position="left" class="filter-form">
        <!-- Abteilung -->
        <el-form-item label="Abteilung">
          <el-select
            v-model="filters.department"
            placeholder="Abteilung auswählen"
            clearable
            style="width: 200px"
            @change="emitFilter"
          >
            <el-option
              v-for="dept in uniqueDepartments"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </el-select>
        </el-form-item>

        <!-- Rolle/Position -->
        <el-form-item label="Position">
          <el-select
            v-model="filters.position"
            placeholder="Position auswählen"
            clearable
            style="width: 200px"
            @change="emitFilter"
          >
            <el-option
              v-for="pos in uniquePositions"
              :key="pos"
              :label="pos"
              :value="pos"
            />
          </el-select>
        </el-form-item>

        <!-- Mitarbeiter -->
        <el-form-item label="Mitarbeiter">
          <el-select
            v-model="filters.employeeId"
            placeholder="Mitarbeiter auswählen"
            clearable
            filterable
            style="width: 220px"
            @change="emitFilter"
          >
            <!-- ✅ FIXED: firstName, lastName (CamelCase) -->
            <el-option
              v-for="emp in filteredEmployees"
              :key="emp.id"
              :label="`${emp.firstName} ${emp.lastName}`"
              :value="emp.id"
            />
          </el-select>
        </el-form-item>

        <!-- Reset -->
        <el-form-item>
          <el-button
            type="warning"
            plain
            @click="resetFilters"
          >
            Filter zurücksetzen
          </el-button>
        </el-form-item>

        <!-- ✅ Info Badge für Debugging -->
        <el-form-item v-if="employees.length">
          <el-tag type="success" size="small">
            {{ employees.length }} Mitarbeiter geladen
          </el-tag>
        </el-form-item>
      </el-form>
    </div>

    <!-- ✅ Error State -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      class="error-alert"
    />
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Filter } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const emit = defineEmits(['filter'])

const filters = ref({
  department: '',
  position: '',
  employeeId: ''
})

const employees = ref([])
const loading = ref(false)  // ✅ Loading state hinzugefügt
const error = ref('')       // ✅ Error state hinzugefügt

onMounted(() => {
  loadEmployees()
})

// 🔒 SICHERE Mitarbeiter-Ladung (Backend filtert automatisch nach Restaurant)
async function loadEmployees() {
  loading.value = true
  error.value = ''
  
  try {
    console.log('🔄 Lade Mitarbeiter...')
    
    const res = await request({
      url: '/employees', // ← Ruft Ihren sicheren Controller auf
      method: 'get'
    })

    console.log('📦 Backend Response:', res)

    if (res.success && Array.isArray(res.data)) {
      // ✅ ENTFERNT: .filter(emp => emp.is_active) 
      // Backend Controller filtert bereits nach Restaurant
      employees.value = res.data
      
      console.log(`✅ ${employees.value.length} Mitarbeiter geladen`)
      
      if (employees.value.length > 0) {
        console.log('👤 Erste Mitarbeiter:', employees.value.slice(0, 2))
        ElMessage.success(`${employees.value.length} Mitarbeiter geladen`)
      }
    } else {
      console.warn('⚠️ Keine Mitarbeiterdaten erhalten:', res)
      error.value = 'Keine Mitarbeiterdaten verfügbar'
    }
  } catch (error) {
    console.error('❌ Fehler beim Laden der Mitarbeiter:', error)
    
    if (error.response?.status === 401) {
      error.value = 'Nicht autorisiert. Bitte melden Sie sich an.'
      ElMessage.error('Session abgelaufen')
    } else if (error.response?.status === 403) {
      error.value = 'Keine Berechtigung für Mitarbeiterdaten.'
      ElMessage.error('Zugriff verweigert')
    } else {
      error.value = 'Fehler beim Laden der Mitarbeiter'
      ElMessage.error('Ladefehler')
    }
  } finally {
    loading.value = false
  }
}

// 🔹 Dynamisch Abteilungen und Positionen extrahieren
const uniqueDepartments = computed(() => {
  return [...new Set(employees.value.map(e => e.department).filter(Boolean))]
})

const uniquePositions = computed(() => {
  return [...new Set(employees.value.map(e => e.position).filter(Boolean))]
})

// 🔹 Mitarbeiter nach Abteilung & Position filtern
const filteredEmployees = computed(() => {
  return employees.value.filter(emp => {
    const matchDept = !filters.value.department || emp.department === filters.value.department
    const matchPos = !filters.value.position || emp.position === filters.value.position
    return matchDept && matchPos
  })
})

// 🔹 Filter nach oben emittieren
function emitFilter() {
  emit('filter', { ...filters.value })
}

// 🔹 Filter zurücksetzen
function resetFilters() {
  filters.value = { department: '', position: '', employeeId: '' }
  emitFilter()
}

// ✅ Expose für Parent Components
defineExpose({
  loadEmployees,
  resetFilters
})
</script>

<style scoped>
.filter-card {
  margin-bottom: 15px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: end;
}
.error-alert {
  margin-top: 15px;
}
</style>