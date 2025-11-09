<template>
  <el-card shadow="hover" class="recommendations-card">
    <template #header>
      <div class="card-header">
        <el-icon><Bulb /></el-icon>
        <span>💡 KI-Empfehlungen & Hinweise</span>
      </div>
    </template>

    <!-- 📋 Empfehlungen -->
    <div v-if="recommendations.length" class="recommendation-list">
      <el-timeline>
        <el-timeline-item
          v-for="(rec, index) in recommendations"
          :key="index"
          :type="rec.type"
          :timestamp="rec.timestamp"
        >
          <div class="rec-item">
            <strong>{{ rec.title }}</strong>
            <p>{{ rec.message }}</p>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 📭 Leerzustand -->
    <div v-else class="empty-state">
      <el-empty description="Keine Vorhersagen verfügbar." />
    </div>
  </el-card>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Bulb } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  forecast: {
    type: Array,
    default: () => []
  }
})

const recommendations = ref([])

// 🔮 Beobachte Forecast-Daten und generiere Empfehlungen
watch(
  () => props.forecast,
  (newForecast) => {
    if (!newForecast || !newForecast.length) {
      recommendations.value = []
      return
    }

    generateAIRecommendations(newForecast)
  },
  { deep: true, immediate: true }
)

// 🧠 KI-Empfehlungslogik (vereinfachtes Beispiel)
function generateAIRecommendations(forecastData) {
  const recs = []

  forecastData.forEach((entry) => {
    if (entry.demand > 110) {
      recs.push({
        title: `Hohe Nachfrage am ${entry.day}`,
        message: `Plane zusätzliches Personal in der Küche ein. Prognostizierte Nachfrage liegt bei ${entry.demand}.`,
        type: 'warning',
        timestamp: new Date().toLocaleTimeString()
      })
    } else if (entry.demand < 90) {
      recs.push({
        title: `Geringe Nachfrage am ${entry.day}`,
        message: `Reduziere Personal oder plane Reinigung/Schulungsschichten.`,
        type: 'info',
        timestamp: new Date().toLocaleTimeString()
      })
    } else {
      recs.push({
        title: `Optimale Auslastung am ${entry.day}`,
        message: `Personalplanung ist im idealen Bereich (${entry.demand} Gäste erwartet).`,
        type: 'success',
        timestamp: new Date().toLocaleTimeString()
      })
    }
  })

  recommendations.value = recs
  ElMessage.success('Neue KI-Empfehlungen generiert!')
}
</script>

<style scoped>
.recommendations-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.rec-item {
  background: #f9f9f9;
  padding: 10px 15px;
  border-radius: 6px;
}

.rec-item strong {
  color: #303133;
}

.rec-item p {
  margin: 4px 0 0;
  color: #666;
  font-size: 13px;
}

.empty-state {
  padding: 20px;
}
</style>
