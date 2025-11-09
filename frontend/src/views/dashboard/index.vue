<template>
  <div class="dashboard">
    <!-- 🔍 DEBUG PANEL (temporär - nach dem Fix entfernen) -->
    <div style="background: #f0f0f0; padding: 10px; margin-bottom: 20px; border: 2px solid red; font-family: monospace;">
      <h4>🔍 DEBUG INFO:</h4>
      <p><strong>Today Analytics:</strong> {{ JSON.stringify(todayAnalytics) }}</p>
      <p><strong>Daily Sales Data:</strong> {{ JSON.stringify(dailySalesData) }}</p>
      <p><strong>Top Products:</strong> {{ JSON.stringify(topProducts) }}</p>
      <p><strong>Low Stock:</strong> {{ JSON.stringify(lowStockIngredients) }}</p>
      <p><strong>Loading States:</strong> Analytics: {{ analyticsLoading }}, Daily: {{ dailySalesLoading }}, Products: {{ topProductsLoading }}, Stock: {{ lowStockLoading }}</p>
      <p><strong>Chart Data Length:</strong> {{ dailySalesData?.length || 0 }}</p>
      <p><strong>Has Chart Data:</strong> {{ hasChartData }}</p>
    </div>

    <div class="page-header">
      <h1>Dashboard</h1>
      <el-button 
        type="primary" 
        @click="refreshData" 
        :loading="isRefreshing"
        :disabled="isRefreshing"
      >
        <el-icon><Refresh /></el-icon>
        {{ isRefreshing ? 'Aktualisiert...' : 'Aktualisieren' }}
      </el-button>
    </div>

    <!-- KPI CARDS -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.label">
        <el-card class="stat-card" v-loading="analyticsLoading">
          <div class="stat-content">
            <div class="stat-icon" :class="card.class">
              <el-icon><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- CHARTS -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Umsatzentwicklung</span>
              <el-radio-group v-model="chartPeriod" size="small" @change="loadChartData">
                <el-radio-button label="7d">7 Tage</el-radio-button>
                <el-radio-button label="30d">30 Tage</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div v-loading="dailySalesLoading" style="height: 300px">
            <div v-if="hasChartData" class="chart-container">
              <Line :data="salesChartData" :options="chartOptions" />
            </div>
            <el-empty v-else description="Keine Daten verfügbar" />
          </div>
        </el-card>
      </el-col>

      <!-- TOP PRODUCTS -->
      <el-col :xs="24" :lg="8">
        <el-card>
          <template #header>
            <span>Top 5 Produkte</span>
          </template>
          <div v-loading="topProductsLoading">
            <el-table :data="topProducts" :show-header="false" style="width: 100%">
              <el-table-column>
                <template #default="{ row }">
                  <div class="product-name">{{ row.name }}</div>
                </template>
              </el-table-column>
              <el-table-column width="100" align="right">
                <template #default="{ row }">
                  <el-tag type="success" size="small">{{ row.sales }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!topProductsLoading && !topProducts.length" description="Keine Daten" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- LOW STOCK -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Zutaten mit niedrigem Bestand</span>
              <el-tag v-if="criticalStockCount > 0" type="danger" size="small">
                {{ criticalStockCount }} kritisch
              </el-tag>
            </div>
          </template>
          <div v-loading="lowStockLoading">
            <el-table :data="lowStockIngredients" style="width: 100%">
              <el-table-column prop="name" label="Zutat" />
              <el-table-column prop="stockQuantity" label="Bestand" align="right">
                <template #default="{ row }">
                  {{ row.stockQuantity }} {{ row.unit }}
                </template>
              </el-table-column>
              <el-table-column prop="minStockLevel" label="Mindestbestand" align="right">
                <template #default="{ row }">
                  {{ row.minStockLevel }} {{ row.unit }}
                </template>
              </el-table-column>
              <el-table-column label="Lagerwert" align="right" width="120">
                <template #default="{ row }">
                  €{{ row.stockValue }}
                </template>
              </el-table-column>
              <el-table-column label="Status" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.isLow ? 'danger' : 'success'" size="small">
                    {{ row.isLow ? 'Niedrig' : 'OK' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!lowStockLoading && !lowStockIngredients.length" description="Keine Daten" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Refresh, ShoppingCart, Money, Box, TrendCharts } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const store = useStore()
const isRefreshing = ref(false)
const chartPeriod = ref('7d')

// 📊 Computed properties from store
const todayAnalytics = computed(() => {
  const data = store.getters['sales/todayAnalytics']
  console.log('🔍 Component todayAnalytics:', data)
  return data
})

const dailySalesData = computed(() => {
  const data = store.getters['sales/dailySalesData']
  console.log('🔍 Component dailySalesData:', data)
  return data
})

const topProducts = computed(() => {
  const data = store.getters['sales/topProductsData']
  console.log('🔍 Component topProducts:', data)
  return data
})

const lowStockIngredients = computed(() => {
  const data = store.getters['sales/lowStockData']
  console.log('🔍 Component lowStockIngredients:', data)
  return data
})

// Loading states
const analyticsLoading = computed(() => store.getters['sales/analyticsLoading'])
const dailySalesLoading = computed(() => store.getters['sales/dailySalesLoading'])
const topProductsLoading = computed(() => store.getters['sales/topProductsLoading'])
const lowStockLoading = computed(() => store.getters['sales/lowStockLoading'])

// 📈 Chart data
const salesChartData = computed(() => {
  const data = dailySalesData.value
  console.log('🔍 Chart processing data:', data)
  
  if (!data || data.length === 0) {
    return {
      labels: [],
      datasets: [
        { label: 'Umsatz (€)', data: [], yAxisID: 'y1', borderColor: '#67c23a', backgroundColor: 'rgba(103,194,58,0.1)', fill: true, tension: 0.4 },
        { label: 'Verkäufe (Anzahl)', data: [], yAxisID: 'y2', borderColor: '#409EFF', backgroundColor: 'rgba(64,158,255,0.1)', fill: true, tension: 0.4 }
      ]
    }
  }

  return {
    labels: data.map(d => dayjs(d.date).format('DD.MM')),
    datasets: [
      {
        label: 'Umsatz (€)',
        data: data.map(d => parseFloat(d.dailyRevenue || d.revenue || 0)),
        yAxisID: 'y1',
        borderColor: '#67c23a',
        backgroundColor: 'rgba(103,194,58,0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Verkäufe (Anzahl)',
        data: data.map(d => parseInt(d.totalSales || d.sales || 0)),
        yAxisID: 'y2',
        borderColor: '#409EFF',
        backgroundColor: 'rgba(64,158,255,0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }
})

const hasChartData = computed(() => {
  const result = dailySalesData.value && dailySalesData.value.length > 0
  console.log('🔍 hasChartData:', result, 'data length:', dailySalesData.value?.length)
  return result
})

// 🎯 KPI Cards
const statCards = computed(() => {
  const analytics = todayAnalytics.value
  console.log('🔍 StatCards processing analytics:', analytics)
  
  return [
    { 
      label: 'Verkäufe (heute)', 
      value: analytics?.totalSales || 0, 
      icon: ShoppingCart, 
      class: 'sales' 
    },
    { 
      label: 'Umsatz (heute)', 
      value: `€${(analytics?.totalRevenue || 0).toFixed(2)}`, 
      icon: Money, 
      class: 'revenue' 
    },
    { 
      label: 'Aktive Produkte', 
      value: analytics?.activeProducts || 0, 
      icon: Box, 
      class: 'products' 
    },
    { 
      label: 'Ø Bestellwert', 
      value: `€${(analytics?.avgOrderValue || 0).toFixed(2)}`, 
      icon: TrendCharts, 
      class: 'avg' 
    }
  ]
})

// 🚨 Critical stock count
const criticalStockCount = computed(() => {
  return lowStockIngredients.value?.filter(item => item.isLow).length || 0
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: { 
    legend: { display: true, position: 'bottom' },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.dataset.label || ''
          const value = context.parsed.y
          if (label.includes('Umsatz')) {
            return `${label}: €${value.toFixed(2)}`
          }
          return `${label}: ${value}`
        }
      }
    }
  },
  scales: {
    y1: { 
      type: 'linear', 
      position: 'left', 
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return '€' + value.toFixed(0)
        }
      }
    },
    y2: { 
      type: 'linear', 
      position: 'right', 
      beginAtZero: true, 
      grid: { drawOnChartArea: false },
      ticks: {
        callback: function(value) {
          return Math.floor(value)
        }
      }
    }
  }
}

// 📅 Load chart data based on period
async function loadChartData() {
  console.log('🔍 Loading chart data for period:', chartPeriod.value)
  const days = chartPeriod.value === '30d' ? 30 : 7
  const endDate = dayjs()
  const startDate = endDate.subtract(days, 'day')

  try {
    await store.dispatch('sales/fetchDailySales', {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      period: chartPeriod.value
    })
    console.log('🔍 Chart data loaded successfully')
  } catch (error) {
    console.error('❌ Fehler beim Laden der Chart-Daten:', error)
    ElMessage.error('Fehler beim Laden der Umsatzdaten')
  }
}

// 🔄 Refresh all data
async function refreshData() {
  console.log('🔍 Refreshing all dashboard data...')
  isRefreshing.value = true
  try {
    // Alle Actions parallel ausführen
    await Promise.all([
      store.dispatch('sales/fetchAnalytics', { force: true }),
      store.dispatch('sales/fetchTopProducts'),
      store.dispatch('sales/fetchLowStockIngredients'),
      loadChartData()
    ])
    console.log('🔍 All data refreshed successfully')
    ElMessage.success('Dashboard aktualisiert')
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren:', error)
    ElMessage.error('Fehler beim Aktualisieren des Dashboards')
  } finally {
    isRefreshing.value = false
  }
}

// 👀 Watch for chart period changes
watch(chartPeriod, () => {
  console.log('🔍 Chart period changed to:', chartPeriod.value)
  loadChartData()
})

// 🚀 Initialize on mount
onMounted(async () => {
  console.log('🔍 Dashboard mounted, initializing...')
  await refreshData()
})
</script>

<style scoped>
.dashboard { 
  padding: 20px; 
}

.page-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 20px; 
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card { 
  height: 100%; 
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-content { 
  display: flex; 
  align-items: center; 
  gap: 15px; 
}

.stat-icon { 
  width: 60px; 
  height: 60px; 
  border-radius: 12px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 28px; 
  color: white; 
}

.stat-icon.sales { 
  background: linear-gradient(135deg, #667eea, #764ba2); 
}

.stat-icon.revenue { 
  background: linear-gradient(135deg, #f093fb, #f5576c); 
}

.stat-icon.products { 
  background: linear-gradient(135deg, #4facfe, #00f2fe); 
}

.stat-icon.avg { 
  background: linear-gradient(135deg, #43e97b, #38f9d7); 
}

.stat-value { 
  font-size: 24px; 
  font-weight: bold; 
  color: #303133; 
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.chart-container { 
  height: 300px; 
}

.charts-row {
  margin-bottom: 20px;
}

.product-name { 
  font-weight: 500; 
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
}
</style>