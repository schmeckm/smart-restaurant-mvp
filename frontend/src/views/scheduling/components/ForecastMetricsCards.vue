<template>
  <el-row :gutter="20" class="forecast-metrics">
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card class="insight-card ai-prediction">
        <div class="insight-content">
          <div class="insight-icon">🔮</div>
          <div class="insight-info">
            <div class="insight-value">{{ forecastData.avgCustomers }}</div>
            <div class="insight-label">Ø Kunden/Tag</div>
            <div class="insight-trend positive">
              {{ forecastData.confidence }}% Vertrauen
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card class="insight-card ai-optimization">
        <div class="insight-content">
          <div class="insight-icon">⚡</div>
          <div class="insight-info">
            <div class="insight-value">{{ optimizationData.efficiency }}%</div>
            <div class="insight-label">Effizienz-Score</div>
            <div class="insight-trend positive">
              +{{ optimizationData.improvement }}% Verbesserung
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card class="insight-card ai-cost">
        <div class="insight-content">
          <div class="insight-icon">💰</div>
          <div class="insight-info">
            <div class="insight-value">€{{ optimizationData.savings }}</div>
            <div class="insight-label">Eingesparte Kosten</div>
            <div class="insight-trend positive">Pro Woche</div>
          </div>
        </div>
      </el-card>
    </el-col>
    
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card class="insight-card ai-satisfaction">
        <div class="insight-content">
          <div class="insight-icon">😊</div>
          <div class="insight-info">
            <div class="insight-value">{{ optimizationData.satisfaction }}/10</div>
            <div class="insight-label">Mitarbeiter-Zufriedenheit</div>
            <div class="insight-trend neutral">Vorhergesagt</div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
defineProps({
  forecastData: {
    type: Object,
    default: () => ({
      avgCustomers: 0,
      confidence: 0
    })
  },
  optimizationData: {
    type: Object,
    default: () => ({
      efficiency: 0,
      improvement: 0,
      savings: 0,
      satisfaction: 0
    })
  }
})
</script>

<style scoped>
.forecast-metrics {
  margin-bottom: 20px;
}

.insight-card {
  height: 100%;
  transition: transform 0.2s ease;
}

.insight-card:hover {
  transform: translateY(-2px);
}

.insight-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.insight-icon {
  font-size: 32px;
  width: 60px;
  text-align: center;
}

.insight-info {
  flex: 1;
}

.insight-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.insight-label {
  font-size: 14px;
  color: #909399;
  margin: 5px 0;
}

.insight-trend {
  font-size: 12px;
  font-weight: 500;
}

.insight-trend.positive { color: #67c23a; }
.insight-trend.negative { color: #f56c6c; }
.insight-trend.neutral { color: #909399; }
</style>