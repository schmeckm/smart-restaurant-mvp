<!-- frontend/src/layouts/MainLayout.vue -->
<template>
  <el-container class="layout-container">
    <!-- Sidebar -->
    <el-aside :width="isCollapse ? '64px' : '250px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse">🍽️ Restaurant</span>
        <span v-else>🍽️</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>Dashboard</template>
        </el-menu-item>

        <el-menu-item index="/products">
          <el-icon><ShoppingCart /></el-icon>
          <template #title>Produkte</template>
        </el-menu-item>

        <el-menu-item index="/categories">
          <el-icon><Grid /></el-icon>
          <template #title>Kategorien</template>
        </el-menu-item>

        <el-menu-item index="/sales">
          <el-icon><Coin /></el-icon>
          <template #title>Verkäufe</template>
        </el-menu-item>

        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <template #title>Profil</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- Main Content -->
    <el-container>
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>

        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="35">
                {{ currentUser?.name?.[0] || 'U' }}
              </el-avatar>
              <span class="username">{{ currentUser?.name }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  Mein Profil
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  Abmelden
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Main Content Area -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeFilled,
  ShoppingCart,
  Grid,
  Coin,
  User,
  SwitchButton,
  Fold,
  Expand
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

export default {
  name: 'MainLayout',
  components: {
    HomeFilled,
    ShoppingCart,
    Grid,
    Coin,
    User,
    SwitchButton,
    Fold,
    Expand
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()

    const isCollapse = ref(false)
    const currentUser = computed(() => store.getters['user/currentUser'])
    const activeMenu = computed(() => route.path)

    const toggleCollapse = () => {
      isCollapse.value = !isCollapse.value
    }

    const handleCommand = async (command) => {
      switch (command) {
        case 'profile':
          router.push('/profile')
          break
        case 'logout':
          try {
            await ElMessageBox.confirm(
              'Möchten Sie sich wirklich abmelden?',
              'Abmelden',
              {
                confirmButtonText: 'Ja',
                cancelButtonText: 'Abbrechen',
                type: 'warning'
              }
            )
            store.dispatch('user/logout')
          } catch {
            // User cancelled
          }
          break
      }
    }

    return {
      isCollapse,
      currentUser,
      activeMenu,
      toggleCollapse,
      handleCommand
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
  background-color: #263445;
  border-bottom: 1px solid #1f2d3d;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.collapse-icon:hover {
  color: #409EFF;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #606266;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  transition: all 0.3s;
}

:deep(.el-menu-item:hover) {
  background-color: #263445 !important;
}
</style>