<template>
  <el-card shadow="hover" class="availability-card">
    <template #header>
      <div class="card-header">
        <el-icon><Calendar /></el-icon>
        <span>🗓️ Mitarbeiterverfügbarkeiten</span>
        <el-button
          type="info"
          plain
          size="small"
          class="ml-auto"
          @click="exportAvailabilityPDF"
        >
          📄 Exportieren
        </el-button>
      </div>
    </template>

    <!-- 📋 Tabelle der Mitarbeiter -->
    <el-table
      v-loading="loading"
      :data="filteredEmployees"
      border
      stripe
      style="width: 100%"
      @row-dblclick="editShift"
    >
      <el-table-column prop="name" label="Name" width="200" />
      <el-table-column prop="department" label="Abteilung" width="180" />
      <el-table-column prop="role" label="Rolle" width="180" />
      <el-table-column label="Verfügbarkeit">
        <template #default="{ row }">
          <div class="availability-week">
            <span
              v-for="(day, idx) in days"
              :key="idx"
              class="day"
              :class="{ available: row.availability[day] }"
            >
              {{ day.substring(0, 2) }}
            </span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-empty
      v-if="!filteredEmployees.length && !loading"
      description="Keine Mitarbeiter gefunden"
    />
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Calendar } from '@element-plus/icons-vue'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({})
  }
})
const emit = defineEmits(['editShift'])
const loading = ref(false)
const employees = ref([])

// Beispiel-Daten
const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

onMounted(() => loadEmployees())

async function loadEmployees() {
  loading.value = true
  employees.value = [
    {
      id: 1,
      name: 'Anna Müller',
      department: 'Service',
      role: 'Kellnerin',
      availability: { Montag: true, Dienstag: true, Mittwoch: false, Donnerstag: true, Freitag: true, Samstag: false, Sonntag: false }
    },
    {
      id: 2,
      name: 'Lukas Steiner',
      department: 'Küche',
      role: 'Koch',
      availability: { Montag: false, Dienstag: true, Mittwoch: true, Donnerstag: true, Freitag: true, Samstag: true, Sonntag: false }
    },
    {
      id: 3,
      name: 'Sara Keller',
      department: 'Bar',
      role: 'Barista',
      availability: { Montag: true, Dienstag: true, Mittwoch: true, Donnerstag: false, Freitag: false, Samstag: true, Sonntag: true }
    }
  ]
  loading.value = false
}

const filteredEmployees = computed(() => {
  const f = props.filters
  return employees.value.filter(e =>
    (!f.department || e.department === f.department) &&
    (!f.role || e.role === f.role) &&
    (!f.employeeId || e.id === f.employeeId)
  )
})

// 📄 PDF Export
function exportAvailabilityPDF() {
  const doc = new jsPDF()
  doc.text('Mitarbeiterverfügbarkeiten', 14, 16)

  const body = filteredEmployees.value.map(emp => {
    const daysStr = days.map(d => (emp.availability[d] ? d.substring(0, 2) : '—')).join(', ')
    return [emp.name, emp.department, emp.role, daysStr]
  })

  doc.autoTable({
    head: [['Name', 'Abteilung', 'Rolle', 'Verfügbare Tage']],
    body
  })
  doc.save('availability.pdf')
}

// 🖱️ Doppelklick öffnet ShiftEditor
function editShift(row) {
  emit('editShift', row)
}
</script>

<style scoped>
.availability-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}
.availability-week {
  display: flex;
  gap: 5px;
}
.day {
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 4px;
  background: #f2f2f2;
  font-size: 12px;
  color: #999;
}
.day.available {
  background: #67c23a;
  color: #fff;
  font-weight: bold;
}
</style>
