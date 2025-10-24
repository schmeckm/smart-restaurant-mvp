<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>Dashboard</h1>
      <el-button type="primary" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        Aktualisieren
      </el-button>
    </div>

    <!-- Statistics Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon sales">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalSales }}</div>
              <div class="stat-label">Verkäufe (heute)</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon revenue">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">€{{ stats.totalRevenue.toFixed(2) }}</div>
              <div class="stat-label">Umsatz (heute)</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon products">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeProducts }}</div>
              <div class="stat-label">Aktive Produkte</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon avg">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">€{{ stats.avgOrderValue.toFixed(2) }}</div>
              <div class="stat-label">Ø Bestellwert</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Umsatzentwicklung (letzte 7 Tage)</span>
              <el-radio-group v-model="chartPeriod" size="small" @change="loadChartData">
                <el-radio-button label="7d">7 Tage</el-radio-button>
                <el-radio-button label="30d">30 Tage</el-radio-button>
                <el-radio-button label="90d">90 Tage</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div v-loading="chartLoading" style="height: 300px">
            <div v-if="!chartLoading && salesChartData.labels.length > 0" class="chart-container">
              <Line :data="salesChartData" :options="chartOptions" />
            </div>
            <el-empty v-else-if="!chartLoading" description="Keine Daten verfügbar" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card>
          <template #header>
            <span>Top 5 Produkte</span>
          </template>
          <div v-loading="loading">
            <el-table :data="topProducts" :show-header="false" style="width: 100%">
              <el-table-column prop="name" label="Produkt">
                <template #default="{ row }">
                  <div class="product-name">{{ row.name }}</div>
                </template>
              </el-table-column>
              <el-table-column prop="sales" label="Verkäufe" width="80" align="right">
                <template #default="{ row }">
                  <el-tag type="success" size="small">{{ row.sales }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!loading && topProducts.length === 0" description="Keine Daten" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent Sales -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Letzte Verkäufe</span>
              <el-link type="primary" :underline="false" @click="$router.push('/sales')">
                Alle anzeigen →
              </el-link>
            </div>
          </template>
          <div v-loading="loading">
            <el-table :data="recentSales" stripe>
              <el-table-column prop="product.name" label="Produkt" min-width="150" />
              <el-table-column label="Datum" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.sale_date) }}
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="Menge" width="100" align="center" />
              <el-table-column label="Betrag" width="120" align="right">
                <template #default="{ row }">
                  <span class="price">€{{ Number(row.total_price).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Status" width="120">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!loading && recentSales.length === 0" description="Keine Verkäufe" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { 
  Refresh, 
  ShoppingCart, 
  Money, 
  Box, 
  TrendCharts 
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
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
import { Line } from 'vue-chartjs'

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

export default {
  name: 'Dashboard',
  components: {
    Refresh,
    ShoppingCart,
    Money,
    Box,
    TrendCharts,
    Line
  },
  setup() {
    const store = useStore()
    const loading = ref(false)
    const chartLoading = ref(false)
    const chartPeriod = ref('7d')

    const stats = reactive({
      totalSales: 0,
      totalRevenue: 0,
      activeProducts: 0,
      avgOrderValue: 0
    })

    const topProducts = ref([])
    const recentSales = ref([])

    const salesChartData = reactive({
      labels: [],
      datasets: [
        {
          label: 'Umsatz (€)',
          data: [],
          backgroundColor: 'rgba(103, 194, 58, 0.1)',
          borderColor: '#67c23a',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    })

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `Umsatz: €${context.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `€${value}`
          }
        }
      }
    }

    const formatDate = (date) => {
      return dayjs(date).format('DD.MM.YYYY HH:mm')
    }

    const getStatusType = (status) => {
      const types = {
        completed: 'success',
        pending: 'warning',
        cancelled: 'danger'
      }
      return types[status] || 'info'
    }

    const getStatusLabel = (status) => {
      const labels = {
        completed: 'Abgeschlossen',
        pending: 'Ausstehend',
        cancelled: 'Storniert'
      }
      return labels[status] || status
    }

    const loadStats = async () => {
      loading.value = true
      try {
        // Lade Statistiken
        const response = await store.dispatch('sales/fetchAnalytics', {
          period: 'today'
        })
        
        if (response) {
          stats.totalSales = response.totalSales || 0
          stats.totalRevenue = response.totalRevenue || 0
          stats.avgOrderValue = response.avgOrderValue || 0
        }

        // Lade aktive Produkte
        const products = await store.dispatch('products/fetchProducts', { limit: 1000 })
        stats.activeProducts = products.filter(p => p.is_available).length || 0

      } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error)
      } finally {
        loading.value = false
      }
    }

    const loadTopProducts = async () => {
      try {
        const response = await store.dispatch('sales/fetchTopProducts', { limit: 5 })
        topProducts.value = response || []
      } catch (error) {
        console.error('Fehler beim Laden der Top-Produkte:', error)
        topProducts.value = []
      }
    }

    const loadRecentSales = async () => {
      try {
        await store.dispatch('sales/fetchSales', { 
          page: 1, 
          limit: 5,
          sort: '-createdAt'
        })
        recentSales.value = store.getters['sales/sales'] || []
      } catch (error) {
        console.error('Fehler beim Laden der Verkäufe:', error)
        recentSales.value = []
      }
    }

    const loadChartData = async () => {
      chartLoading.value = true
      try {
        const days = chartPeriod.value === '7d' ? 7 : chartPeriod.value === '30d' ? 30 : 90
        const endDate = dayjs()
        const startDate = endDate.subtract(days, 'day')

        const response = await store.dispatch('sales/fetchDailySales', {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD')
        })

        if (response && response.length > 0) {
          salesChartData.labels = response.map(d => dayjs(d.date).format('DD.MM'))
          salesChartData.datasets[0].data = response.map(d => d.revenue)
        } else {
          // Dummy-Daten für Demo
          const dummyDays = []
          const dummyData = []
          for (let i = days - 1; i >= 0; i--) {
            dummyDays.push(dayjs().subtract(i, 'day').format('DD.MM'))
            dummyData.push(Math.random() * 1000 + 500)
          }
          salesChartData.labels = dummyDays
          salesChartData.datasets[0].data = dummyData
        }
      } catch (error) {
        console.error('Fehler beim Laden der Chart-Daten:', error)
        // Fallback auf leere Daten
        salesChartData.labels = []
        salesChartData.datasets[0].data = []
      } finally {
        chartLoading.value = false
      }
    }

    const refreshData = async () => {
      try {
        await Promise.all([
          loadStats(),
          loadTopProducts(),
          loadRecentSales(),
          loadChartData()
        ])
        ElMessage.success('Daten aktualisiert')
      } catch (error) {
        ElMessage.error('Fehler beim Aktualisieren')
      }
    }

    onMounted(() => {
      refreshData()
    })

    return {
      loading,
      chartLoading,
      chartPeriod,
      stats,
      topProducts,
      recentSales,
      salesChartData,
      chartOptions,
      formatDate,
      getStatusType,
      getStatusLabel,
      loadChartData,
      refreshData
    }
  }
}
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

.page-header h1 {
  margin: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.products {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.avg {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  position: relative;
}

.product-name {
  font-weight: 500;
}

.price {
  font-weight: bold;
  color: #67c23a;
}

@media (max-width: 768px) {
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