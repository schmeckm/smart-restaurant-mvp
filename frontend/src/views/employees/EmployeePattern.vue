<template>
  <div class="employee-pattern-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>🧩 Arbeitsmuster bearbeiten</h2>
          <el-tag type="success" v-if="employeeName">{{ employeeName }}</el-tag>
        </div>
      </template>

      <!-- Ladezustand -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="4" animated />
      </div>

      <!-- Formular -->
      <div v-else>
        <el-form :model="patternForm" label-width="150px">
          <!-- Wochentage -->
          <el-form-item label="Wochentage">
            <div class="weekdays">
              <el-checkbox
                v-for="day in daysOfWeek"
                :key="day.key"
                v-model="patternForm[day.key]"
              >
                {{ day.label }}
              </el-checkbox>
            </div>
          </el-form-item>

          <!-- Startzeit -->
          <el-form-item label="Startzeit">
            <el-time-picker
              v-model="patternForm.preferred_start"
              placeholder="Startzeit"
              format="HH:mm"
              value-format="HH:mm"
              :disabled="saving"
              style="width: 180px"
            />
          </el-form-item>

          <!-- Endzeit -->
          <el-form-item label="Endzeit">
            <el-time-picker
              v-model="patternForm.preferred_end"
              placeholder="Endzeit"
              format="HH:mm"
              value-format="HH:mm"
              :disabled="saving"
              style="width: 180px"
            />
          </el-form-item>

          <!-- Notizen -->
          <el-form-item label="Notizen">
            <el-input
              type="textarea"
              v-model="patternForm.notes"
              :disabled="saving"
              rows="3"
              placeholder="z. B. bevorzugt Frühschicht oder keine Wochenenden"
            />
          </el-form-item>
        </el-form>

        <!-- Aktionen -->
        <div class="form-actions">
          <el-button @click="goBack">← Zurück</el-button>
          <el-button type="primary" @click="savePattern" :loading="saving">
            💾 Speichern
          </el-button>
          <el-button @click="loadPattern">🔄 Neu laden</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from '@/utils/request'

const route = useRoute()
const router = useRouter()

const employeeId = route.params.id || ''
const employeeName = ref(route.query.name || '')

const loading = ref(false)
const saving = ref(false)

const patternForm = reactive({
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
  preferred_start: null,
  preferred_end: null,
  notes: ''
})

const daysOfWeek = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
  { key: 'saturday', label: 'Samstag' },
  { key: 'sunday', label: 'Sonntag' }
]

// 🟢 Muster laden (robust)
const loadPattern = async () => {
  if (!employeeId) {
    ElMessage.warning('Keine Mitarbeiter-ID angegeben')
    return
  }

  loading.value = true
  try {
    const res = await axios.get(`/employees/${employeeId}/pattern`)

    if (res.data?.data) {
      const data = res.data.data

      // Werte übernehmen
      Object.assign(patternForm, data)

      // Prüfen ob alles leer ist
      const allEmpty =
        !(
          data.monday || data.tuesday || data.wednesday ||
          data.thursday || data.friday || data.saturday || data.sunday ||
          data.preferred_start || data.preferred_end
        )

      if (allEmpty) {
        console.warn('⚠️ Arbeitsmuster existiert, aber leer')
        ElMessage.info('Leeres Arbeitsmuster geladen — bitte bearbeiten und speichern')
      } else {
        ElMessage.success('Arbeitsmuster erfolgreich geladen')
      }
    } else {
      ElMessage.info('Kein Arbeitsmuster vorhanden — neues Muster anlegen')
    }
  } catch (err) {
    console.error('❌ Fehler beim Laden des Musters:', err)
    ElMessage.error('Fehler beim Laden des Musters')
  } finally {
    loading.value = false
  }
}

// 💾 Muster speichern
const savePattern = async () => {
  if (!employeeId) {
    ElMessage.error('Mitarbeiter-ID fehlt')
    return
  }

  saving.value = true
  try {
    const res = await axios.post(`/employees/${employeeId}/pattern`, patternForm)
    if (res.data.success) {
      ElMessage.success('Muster erfolgreich gespeichert')
    } else {
      ElMessage.warning('Speichern fehlgeschlagen')
    }
  } catch (err) {
    console.error('❌ Fehler beim Speichern:', err)
    ElMessage.error('Fehler beim Speichern')
  } finally {
    saving.value = false
  }
}

// 🔙 Zurück zur Mitarbeiterliste
const goBack = () => {
  router.push({ path: '/employees' })
}

onMounted(() => {
  loadPattern()
})
</script>

<style scoped>
.employee-pattern-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.weekdays {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.form-actions {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.loading-container {
  padding: 20px;
}
</style>
