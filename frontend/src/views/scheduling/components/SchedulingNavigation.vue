<template>
  <div class="scheduling-navigation">
    <!-- Breadcrumb Navigation -->
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">
        <el-icon><house /></el-icon>
        Dashboard
      </el-breadcrumb-item>
      <el-breadcrumb-item>
        <el-icon><calendar /></el-icon>
        Personalplanung
      </el-breadcrumb-item>
      <el-breadcrumb-item class="current">KI-Schichtplanung</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- Quick Navigation Buttons -->
    <div class="navigation-buttons">
      <el-button-group>
        <el-button 
          @click="$router.push('/scheduling')"
          :type="isCurrentRoute('/scheduling') ? 'primary' : 'default'"
        >
          📋 Manuelle Planung
        </el-button>
        
        <el-button 
          @click="triggerAIPlanning"
          type="primary"
        >
          🤖 KI-Planung starten
        </el-button>
      </el-button-group>
      
      <!-- Back Button -->
      <el-button @click="goBack" plain>
        <el-icon><arrow-left /></el-icon>
        Zurück
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { House, Calendar, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const store = useStore()

const isCurrentRoute = (path) => {
  return route.path === path
}

// 🔥 FIXED: AI-Planung soll API aufrufen, nicht navigieren!
const triggerAIPlanning = async () => {
  console.log('🤖 Starting AI Planning (generateForecast)...')
  
  try {
    // Emit event to parent component to trigger forecast
    // This way we keep the business logic in the main component
    const event = new CustomEvent('trigger-ai-forecast')
    document.dispatchEvent(event)
    
    ElMessage.info('🤖 KI-Planung wird gestartet...')
    
  } catch (error) {
    console.error('❌ AI Planning trigger failed:', error)
    ElMessage.error('Fehler beim Starten der KI-Planung')
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.scheduling-navigation {
  background: white;
  padding: 15px 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 5px;
}

.breadcrumb .current {
  color: #409eff;
  font-weight: 600;
}

.navigation-buttons {
  display: flex;
  align-items: center;
  gap: 15px;
}

.navigation-buttons .el-button-group {
  margin-right: 15px;
}

.navigation-buttons .el-button {
  font-size: 14px;
  padding: 8px 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .scheduling-navigation {
    flex-direction: column;
    align-items: stretch;
  }
  
  .navigation-buttons {
    justify-content: space-between;
  }
  
  .navigation-buttons .el-button-group {
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .navigation-buttons .el-button {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>