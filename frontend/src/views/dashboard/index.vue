<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff;">
              <el-icon :size="32"><ShoppingBag /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.products }}</div>
              <div class="stat-label">Produkte</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a;">
              <el-icon :size="32"><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.ingredients }}</div>
              <div class="stat-label">Zutaten</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c;">
              <el-icon :size="32"><Reading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.recipes }}</div>
              <div class="stat-label">Rezepte</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c;">
              <el-icon :size="32"><ShoppingCart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">€{{ stats.totalSales }}</div>
              <div class="stat-label">Verkäufe Heute</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <span>Letzte Verkäufe</span>
          </template>
          <el-empty v-if="recentSales.length === 0" description="Keine Verkäufe" />
          <el-table v-else :data="recentSales" style="width: 100%">
            <el-table-column prop="product" label="Produkt" />
            <el-table-column prop="quantity" label="Menge" width="100" />
            <el-table-column prop="total" label="Betrag" width="100" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <span>Niedrige Bestände</span>
          </template>
          <el-empty v-if="lowStock.length === 0" description="Alle Bestände OK" />
          <el-table v-else :data="lowStock" style="width: 100%">
            <el-table-column prop="name" label="Zutat" />
            <el-table-column prop="current" label="Aktuell" width="100" />
            <el-table-column prop="min" label="Minimum" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ShoppingBag, Box, Reading, ShoppingCart } from '@element-plus/icons-vue'

const stats = ref({
  products: 0,
  ingredients: 0,
  recipes: 0,
  totalSales: 0
})

const recentSales = ref([])
const lowStock = ref([])

onMounted(() => {
  // TODO: Load real data from API
  stats.value = {
    products: 12,
    ingredients: 45,
    recipes: 8,
    totalSales: 1250
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>