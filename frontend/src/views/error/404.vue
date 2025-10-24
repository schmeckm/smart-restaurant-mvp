<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Seite nicht gefunden</h2>
      <p class="error-description">
        Die angeforderte Seite existiert nicht.
      </p>
      <el-button type="primary" @click="goHome">
        Zurück zur Startseite
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
}

.error-content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #409eff;
  margin: 0;
  line-height: 1;
}

.error-title {
  font-size: 32px;
  color: #303133;
  margin: 20px 0 10px;
}

.error-description {
  font-size: 16px;
  color: #909399;
  margin-bottom: 30px;
}
</style>