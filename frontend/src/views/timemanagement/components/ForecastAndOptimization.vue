<template>
  <el-card shadow="hover" class="forecast-card">
    <template #header>
      <div class="card-header">
        <el-icon><Cpu /></el-icon>
        <span>🤖 KI-gestützte Nachfrage & Schichtoptimierung</span>
      </div>
    </template>

    <div class="button-group">
      <!-- 🔮 Nachfrage-Vorhersage -->
      <el-button
        type="primary"
        :loading="loadingForecast"
        @click="handleForecast"
      >
        🔮 Nachfrage vorhersagen
      </el-button>

      <!-- ⚡ KI-Optimierung -->
      <el-button
        type="success"
        :loading="loadingSchedule"
        @click="handleOptimize"
      >
        ⚡ Schichten optimieren
      </el-button>

      <!-- 🧾 Download-Button optional -->
      <el-button
        v-if="forecastData.length"
        type="info"
        plain
        @click="exportForecastPDF"
      >
        📄 Exportieren
      </el-button>
    </div>

    <el-divider />

    <!-- 📊 Vorhersageanzeige -->
    <div v-if="forecastData.length" class="forecast-results">
      <el-table :data="forecastData" border stripe style="width: 100%">
        <el-table-column prop="day" label="Tag" width="180" />
        <el-table-column prop="demand" label="Prognostizierte Nachfrage" />
      </el-table>
    </div>

    <div v-else class="empty-state">
      <el-empty description="Noch keine Vorhersage durchgeführt" />
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Cpu } from '@element-plus/icons-vue'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const emit = defineEmits(['forecast', 'optimize', 'update:forecastData'])

// Lokale Zustände
const forecastData = ref([])
const loadingForecast = ref(false)
const loadingSchedule = ref(false)

// 📈 Vorhersage auslösen
async function handleForecast() {
  try {
    loadingForecast.value = true
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/ai/forecast`)
    const result = await response.json()
    forecastData.value = result.data || [
      { day: 'Montag', demand: 120 },
      { day: 'Dienstag', demand: 95 },
      { day: 'Mittwoch', demand: 105 }
    ]
    emit('forecast', forecastData.value)
    emit('update:forecastData', forecastData.value)
    ElMessage.success('Nachfragevorhersage erfolgreich!')
  } catch (err) {
    console.error(err)
    ElMessage.error('Fehler bei der Nachfragevorhersage.')
  } finally {
    loadingForecast.value = false
  }
}

// ⚙️ Optimierung auslösen
async function handleOptimize() {
  try {
    loadingSchedule.value = true
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/ai/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forecast: forecastData.value })
    })
    const result = await response.json()
    ElMessage.success('Schichtplan erfolgreich optimiert!')
    emit('optimize', result)
  } catch (err) {
    console.error(err)
    ElMessage.error('Fehler bei der Schichtoptimierung.')
  } finally {
    loadingSchedule.value = false
  }
}

// 🧾 Export als PDF
function exportForecastPDF() {
  const doc = new jsPDF()
  doc.text('KI-Nachfrage-Vorhersage', 14, 16)
  const tableData = forecastData.value.map((row) => [row.day, row.demand])
  doc.autoTable({
    head: [['Tag', 'Prognostizierte Nachfrage']],
    body: tableData
  })
  doc.save('forecast.pdf')
}
</script>

<style scoped>
.forecast-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.empty-state {
  padding: 20px;
}
</style>
