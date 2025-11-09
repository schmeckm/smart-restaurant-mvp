<template>
  <div v-if="businessSummary || detailedMetrics">
    <!-- Business Summary -->
    <el-row v-if="businessSummary">
      <el-col :span="24">
        <el-card class="summary-card">
          <template #header>
            <div class="card-header">
              <span>📊 KI Geschäfts-Analyse</span>
              <el-tag :type="getSummaryType(businessSummary)" size="small">
                KI Assessment
              </el-tag>
            </div>
          </template>
          
          <div class="summary-content">
            <div class="summary-text">{{ businessSummary }}</div>
            
            <div class="summary-metrics" v-if="confidence">
              <el-progress 
                :percentage="confidence" 
                :color="getConfidenceColor(confidence)"
                :show-text="false"
                style="margin-top: 15px;"
              />
              <div class="confidence-label">
                Analysegenauigkeit: {{ confidence }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Detailed Metrics -->
    <el-row :gutter="15" style="margin-top: 15px;" v-if="detailedMetrics">
      <el-col :xs="12" :sm="8" :lg="4" v-for="metric in formattedMetrics" :key="metric.key">
        <el-card class="metric-mini">
          <div class="metric-content">
            <div class="metric-icon">{{ metric.icon }}</div>
            <div class="metric-info">
              <div class="metric-value">{{ metric.value }}</div>
              <div class="metric-label">{{ metric.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  businessSummary: {
    type: String,
    default: ''
  },
  detailedMetrics: {
    type: Object,
    default: null
  },
  confidence: {
    type: Number,
    default: 0
  }
})

const formattedMetrics = computed(() => {
  if (!props.detailedMetrics) return []
  
  const metrics = props.detailedMetrics
  return [
    {
      key: 'revenue',
      icon: '💰',
      value: `CHF ${metrics.dailyRevenue}`,
      label: 'Tagesumsatz'
    },
    {
      key: 'trend',
      icon: '📈',
      value: `${metrics.weeklyTrend}%`,
      label: 'Wochen-Trend'
    },
    {
      key: 'events',
      icon: '🎪',
      value: metrics.eventsCount,
      label: 'Lokale Events'
    },
    {
      key: 'lastSale',
      icon: '⏰',
      value: metrics.lastSale,
      label: 'Letzter Verkauf'
    }
  ]
})

const getSummaryType = (summary) => {
  if (summary.includes('kritische')) return 'danger'
  if (summary.includes('schwach')) return 'warning'
  return 'info'
}

const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return '#67c23a'
  if (confidence >= 60) return '#e6a23c'
  return '#f56c6c'
}
</script>

<style scoped>
.summary-card {
  border-left: 4px solid #409eff;
}

.summary-content {
  padding: 10px 0;
}

.summary-text {
  font-size: 15px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 15px;
}

.confidence-label {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-mini {
  height: 80px;
  margin-bottom: 10px;
}

.metric-mini :deep(.el-card__body) {
  padding: 15px 10px;
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 100%;
}

.metric-icon {
  font-size: 20px;
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.metric-label {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}
</style>