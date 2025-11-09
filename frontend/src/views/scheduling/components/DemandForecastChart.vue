<template>
  <el-row :gutter="20">
    <!-- Demand Forecast Chart -->
    <el-col :xs="24" :lg="16">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>📈 7-Tage Nachfrage-Vorhersage</span>
            <el-tag :type="getConfidenceType(confidence)">
              {{ confidence }}% Genauigkeit
            </el-tag>
          </div>
        </template>
        
        <div v-loading="loading" style="height: 300px;">
          <div v-if="hasDemandData">
            <Line :data="chartData" :options="chartOptions" />
          </div>
          <el-empty v-else description="Keine Vorhersagedaten verfügbar" />
        </div>
      </el-card>
    </el-col>
    
    <!-- Influence Factors -->
    <el-col :xs="24" :lg="8">
      <el-card>
        <template #header>
          <span>🎯 Einflussfaktoren</span>
        </template>
        
        <div v-loading="loading" class="factors-container">
          <div 
            v-for="factor in influenceFactors" 
            :key="factor.name" 
            class="factor-item"
          >
            <div class="factor-header">
              <span class="factor-name">{{ factor.name }}</span>
              <span class="factor-impact" :class="getImpactClass(factor.impact)">
                {{ factor.impact > 0 ? '+' : '' }}{{ factor.impact }}%
              </span>
            </div>
            <div class="factor-description">{{ factor.description }}</div>
          </div>
          
          <el-empty 
            v-if="influenceFactors.length === 0" 
            description="Keine Faktoren geladen" 
          />
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js'
import dayjs from 'dayjs'

// 🔥 FIXED: Register ALL required Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
)

const props = defineProps({
  weeklyData: {
    type: Array,
    default: () => []
  },
  influenceFactors: {
    type: Array,
    default: () => []
  },
  confidence: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  weekDays: {
    type: Array,
    default: () => []
  }
})

const hasDemandData = computed(() => props.weeklyData.length > 0)

const chartData = computed(() => ({
  labels: props.weekDays.map(day => `${day.label} ${dayjs(day.date).format('DD.MM')}`),
  datasets: [
    {
      label: 'Vorhergesagte Kunden',
      data: props.weeklyData.map(d => d.predictedCustomers || 0),
      borderColor: '#409EFF',
      backgroundColor: 'rgba(64, 158, 255, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Historischer Durchschnitt',
      data: props.weeklyData.map(d => d.historicalAvg || 0),
      borderColor: '#67C23A',
      backgroundColor: 'rgba(103, 194, 58, 0.1)',
      fill: false,
      borderDash: [5, 5]
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: (context) => `${context.dataset.label}: ${context.parsed.y} Kunden`
      }
    }
  },
  scales: {
    y: { 
      beginAtZero: true, 
      title: { display: true, text: 'Anzahl Kunden' } 
    }
  }
}

const getConfidenceType = (confidence) => {
  if (confidence >= 85) return 'success'
  if (confidence >= 70) return 'warning'
  return 'danger'
}

const getImpactClass = (impact) => {
  if (impact > 0) return 'positive'
  if (impact < 0) return 'negative'
  return 'neutral'
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.factors-container {
  max-height: 280px;
  overflow-y: auto;
}

.factor-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.factor-item:last-child {
  border-bottom: none;
}

.factor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.factor-name {
  font-weight: 500;
  color: #303133;
}

.factor-impact {
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.factor-impact.positive {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

.factor-impact.negative {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}

.factor-impact.neutral {
  color: #909399;
  background: rgba(144, 147, 153, 0.1);
}

.factor-description {
  font-size: 12px;
  color: #909399;
}
</style>