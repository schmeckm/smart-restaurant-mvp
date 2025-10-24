<template>
  <div class="profile-container">
    <el-card>
      <div class="profile-header">
        <el-avatar :size="100" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
        <h2>{{ user?.name || 'User' }}</h2>
        <p>{{ user?.email || 'user@example.com' }}</p>
      </div>

      <el-divider />

      <el-descriptions title="Benutzerinformationen" :column="1" border>
        <el-descriptions-item label="Name">
          {{ user?.name || 'N/A' }}
        </el-descriptions-item>
        <el-descriptions-item label="E-Mail">
          {{ user?.email || 'N/A' }}
        </el-descriptions-item>
        <el-descriptions-item label="Rollen">
          <el-tag v-for="role in user?.roles" :key="role" style="margin-right: 5px;">
            {{ role }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const user = computed(() => store.getters['user/user'])
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  text-align: center;
  padding: 20px;
}

.profile-header h2 {
  margin: 15px 0 5px;
  font-size: 24px;
  color: #303133;
}

.profile-header p {
  color: #909399;
  font-size: 14px;
}
</style>