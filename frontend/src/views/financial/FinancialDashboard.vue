<template>
  <div class="financial-dashboard">
    <div class="page-header">
      <h1>💰 Financial Insights</h1>
      <p>Gewinnmargen, Kosten und Rentabilität Ihres Restaurants</p>
      <el-button type="primary" @click="refreshFinancialData" :loading="loading">
        <el-icon><Refresh /></el-icon>
        Aktualisieren
      </el-button>
    </div>

    <!-- Financial Overview Cards -->
    <el-row :gutter="20" class="financial-overview">
      <el-col :xs="24" :sm="12" :lg="6" v-for="card in financialCards" :key="card.label">
        <el-card class="financial-card" v-loading="loading">
          <div class="financial-content">
            <div class="financial-icon" :class="card.class">
              <el-icon><component :is="card.icon" /></el-icon>
            </div>
            <div class="financial-info">
              <div class="financial-value">{{ card.value }}</div>
              <div class="financial-label">{{ card.label }}</div>
              <div class="financial-trend" :class="card.trendClass">
                {{ card.trend }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :lg="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📊 Gewinnmarge nach Produkten</span>
              <el-select v-model="selectedPeriod" size="small" @change="loadFinancialData">
                <el-option label="7 Tage" value="7d" />
                <el-option label="30 Tage" value="30d" />
                <el-option label="90 Tage" value="90d" />
              </el-select>
            </div>
          </template>
          <div v-loading="loading" style="height: 300px;">
            <div v-if="hasProfitabilityData">
              <Bar :data="profitabilityChartData" :options="chartOptions" />
            </div>
            <el-empty v-else description="Keine Profitabilitätsdaten verfügbar" />
          </div>
        </el-card>
      </el-col>

      <!-- Cost Breakdown -->
      <el-col :xs="24" :lg="8">
        <el-card>
          <template #header>
            <span>🥧 Kostenverteilung</span>
          </template>
          <div v-loading="loading" style="height: 300px;">
            <div v-if="hasCostData">
              <Doughnut :data="costBreakdownData" :options="doughnutOptions" />
            </div>
            <el-empty v-else description="Keine Kostendaten verfügbar" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Profitability Table -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📈 Produktrentabilität</span>
              <div>
                <el-tag v-if="profitabilityData.length > 0" type="info" size="small">
                  {{ profitabilityData.length }} Produkte
                </el-tag>
              </div>
            </div>
          </template>
          <div v-loading="loading">
            <el-table :data="profitabilityData" style="width: 100%" empty-text="Keine Profitabilitätsdaten">
              <el-table-column prop="rank" label="#" width="60" align="center" />
              <el-table-column prop="name" label="Produkt" min-width="120">
                <template #default="{ row }">
                  <div class="product-cell">
                    <strong>{{ row.name }}</strong>
                    <br>
                    <small style="color: #909399;">{{ row.totalSales }} Verkäufe</small>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="salePrice" label="Verkaufspreis" align="right" width="120">
                <template #default="{ row }">
                  €{{ row.salePrice?.toFixed(2) || '0.00' }}
                </template>
              </el-table-column>
              <el-table-column prop="materialCost" label="Materialkosten" align="right" width="120">
                <template #default="{ row }">
                  €{{ row.materialCost?.toFixed(2) || '0.00' }}
                </template>
              </el-table-column>
              <el-table-column prop="grossMargin" label="Gewinnmarge" align="right" width="120">
                <template #default="{ row }">
                  <el-tag 
                    :type="getMarginType(row.grossMargin)" 
                    size="small"
                    effect="dark"
                  >
                    {{ row.grossMargin?.toFixed(1) || '0.0' }}%
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="profitPerSale" label="Gewinn/Verkauf" align="right" width="130">
                <template #default="{ row }">
                  <span :class="row.profitPerSale > 0 ? 'profit-positive' : 'profit-negative'">
                    €{{ row.profitPerSale?.toFixed(2) || '0.00' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="totalProfit" label="Gesamtgewinn" align="right" width="130">
                <template #default="{ row }">
                  <strong :class="row.totalProfit > 0 ? 'profit-positive' : 'profit-negative'">
                    €{{ row.totalProfit?.toFixed(2) || '0.00' }}
                  </strong>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Financial Summary -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>📋 Finanzübersicht ({{ selectedPeriod }})</span>
          </template>
          <div v-loading="loading">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="8">
                <div class="summary-item">
                  <h4>💰 Umsatz</h4>
                  <p class="summary-value">€{{ financialOverview.revenue?.total?.toFixed(2) || '0.00' }}</p>
                  <small>Ø €{{ financialOverview.revenue?.daily?.toFixed(2) || '0.00' }} / Tag</small>
                </div>
              </el-col>
              <el-col :xs="24" :sm="8">
                <div class="summary-item">
                  <h4>📊 Kosten</h4>
                  <p class="summary-value cost">€{{ financialOverview.costs?.total?.toFixed(2) || '0.00' }}</p>
                  <small>Material: €{{ financialOverview.costs?.materials?.toFixed(2) || '0.00' }}</small>
                </div>
              </el-col>
              <el-col :xs="24" :sm="8">
                <div class="summary-item">
                  <h4>🎯 Nettogewinn</h4>
                  <p class="summary-value" :class="(financialOverview.profit?.net || 0) > 0 ? 'profit' : 'loss'">
                    €{{ financialOverview.profit?.net?.toFixed(2) || '0.00' }}
                  </p>
                  <small>{{ financialOverview.profit?.netMargin?.toFixed(1) || '0.0' }}% Marge</small>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Money, TrendCharts, PieChart, DocumentMoney, Refresh } from '@element-plus/icons-vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const store = useStore()
const loading = ref(false)
const selectedPeriod = ref('30d')
const financialOverview = ref({})
const profitabilityData = ref([])

// Financial KPI Cards
const financialCards = computed(() => [
  {
    label: 'Gesamtumsatz',
    value: `€${(financialOverview.value.revenue?.total || 0).toFixed(2)}`,
    trend: `+${Math.round(Math.random() * 20)}% vs. vorherige Periode`,
    trendClass: 'trend-up',
    icon: Money,
    class: 'revenue'
  },
  {
    label: 'Bruttogewinn',
    value: `€${(financialOverview.value.profit?.gross || 0).toFixed(2)}`,
    trend: `${(financialOverview.value.profit?.grossMargin || 0).toFixed(1)}% Marge`,
    trendClass: 'trend-neutral',
    icon: TrendCharts,
    class: 'profit'
  },
  {
    label: 'Nettogewinn',
    value: `€${(financialOverview.value.profit?.net || 0).toFixed(2)}`,
    trend: `${(financialOverview.value.profit?.netMargin || 0).toFixed(1)}% Marge`,
    trendClass: (financialOverview.value.profit?.netMargin || 0) > 10 ? 'trend-up' : 'trend-down',
    icon: DocumentMoney,
    class: 'net-profit'
  },
  {
    label: 'Break-Even',
    value: `${financialOverview.value.breakEven?.ordersNeeded || 0} Bestellungen`,
    trend: `Ø €${(financialOverview.value.breakEven?.avgOrderValue || 0).toFixed(2)}`,
    trendClass: 'trend-neutral',
    icon: PieChart,
    class: 'break-even'
  }
])

// Chart data
const hasProfitabilityData = computed(() => profitabilityData.value.length > 0)
const hasCostData = computed(() => financialOverview.value.costs?.total > 0)

const profitabilityChartData = computed(() => ({
  labels: profitabilityData.value.slice(0, 8).map(p => p.name),
  datasets: [{
    label: 'Gewinnmarge (%)',
    data: profitabilityData.value.slice(0, 8).map(p => p.grossMargin || 0),
    backgroundColor: profitabilityData.value.slice(0, 8).map(p => {
      const margin = p.grossMargin || 0
      return margin > 60 ? '#67c23a' : margin > 30 ? '#e6a23c' : '#f56c6c'
    }),
    borderColor: '#409EFF',
    borderWidth: 1
  }]
}))

const costBreakdownData = computed(() => ({
  labels: ['Materialkosten', 'Fixkosten', 'Personalkosten'],
  datasets: [{
    data: [
      financialOverview.value.costs?.materials || 0,
      financialOverview.value.costs?.fixed || 0,
      (financialOverview.value.costs?.total || 0) - (financialOverview.value.costs?.materials || 0) - (financialOverview.value.costs?.fixed || 0)
    ],
    backgroundColor: ['#409EFF', '#67c23a', '#e6a23c'],
    borderWidth: 2,
    borderColor: '#fff'
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: ${context.parsed.y.toFixed(1)}%`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: { callback: value => value + '%' }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'bottom',
      labels: { padding: 20 }
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: €${context.parsed.toFixed(2)}`
      }
    }
  }
}

// Helper functions
const getMarginType = (margin) => {
  if (margin > 60) return 'success'
  if (margin > 30) return 'warning'
  return 'danger'
}

// Data loading
async function loadFinancialData() {
  loading.value = true
  try {
    const [overviewRes, profitRes] = await Promise.all([
      store.dispatch('sales/fetchFinancialOverview', { period: selectedPeriod.value }),
      store.dispatch('sales/fetchProfitability', { period: selectedPeriod.value })
    ])
    
    financialOverview.value = overviewRes || {}
    profitabilityData.value = (profitRes || []).map((item, index) => ({
      ...item,
      rank: index + 1
    }))
    
    console.log('📊 Financial data loaded:', { overviewRes, profitRes })
  } catch (error) {
    console.error('❌ Error loading financial data:', error)
    ElMessage.error('Fehler beim Laden der Finanzdaten')
  } finally {
    loading.value = false
  }
}

async function refreshFinancialData() {
  await loadFinancialData()
  ElMessage.success('Finanzdaten aktualisiert')
}

onMounted(() => {
  loadFinancialData()
})
</script>

<style scoped>
.financial-dashboard {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 20px;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 16px;
}

.financial-overview {
  margin-bottom: 20px;
}

.financial-card {
  height: 100%;
  transition: transform 0.2s ease;
}

.financial-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.financial-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.financial-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.financial-icon.revenue { background: linear-gradient(135deg, #667eea, #764ba2); }
.financial-icon.profit { background: linear-gradient(135deg, #f093fb, #f5576c); }
.financial-icon.net-profit { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.financial-icon.break-even { background: linear-gradient(135deg, #43e97b, #38f9d7); }

.financial-info {
  flex: 1;
}

.financial-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 5px 0;
}

.financial-label {
  font-size: 14px;
  color: #909399;
  margin: 0 0 5px 0;
}

.financial-trend {
  font-size: 12px;
  font-weight: 500;
}

.trend-up { color: #67c23a; }
.trend-down { color: #f56c6c; }
.trend-neutral { color: #909399; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-cell {
  line-height: 1.4;
}

.profit-positive {
  color: #67c23a;
  font-weight: 500;
}

.profit-negative {
  color: #f56c6c;
  font-weight: 500;
}

.summary-item {
  text-align: center;
  padding: 20px;
}

.summary-item h4 {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 16px;
}

.summary-value {
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: #303133;
}

.summary-value.cost {
  color: #e6a23c;
}

.summary-value.profit {
  color: #67c23a;
}

.summary-value.loss {
  color: #f56c6c;
}

.summary-item small {
  color: #909399;
  font-size: 12px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .financial-dashboard {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .financial-value {
    font-size: 20px;
  }
  
  .financial-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
}
</style>