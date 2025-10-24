<template>
  <div id="app">
    <el-container v-if="isAuthenticated" class="layout-container">
      <!-- Sidebar -->
      <el-aside width="250px" class="sidebar">
        <div class="logo">
          <h2>🍽️ Restaurant</h2>
        </div>

        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          @select="handleMenuSelect"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>Dashboard</span>
          </el-menu-item>

          <el-menu-item index="/products">
            <el-icon><ShoppingBag /></el-icon>
            <span>Produkte</span>
          </el-menu-item>

          <el-menu-item index="/categories">
            <el-icon><Grid /></el-icon>
            <span>Kategorien</span>
          </el-menu-item>

          <el-menu-item index="/ingredients">
            <el-icon><Box /></el-icon>
            <span>Zutaten</span>
          </el-menu-item>

          <el-menu-item index="/recipes">
            <el-icon><Reading /></el-icon>
            <span>Rezepte</span>
          </el-menu-item>

          <el-menu-item index="/forecasting">
            <el-icon><TrendCharts /></el-icon>
            <span>Forecasting</span>
          </el-menu-item>

          <el-menu-item index="/sales">
            <el-icon><ShoppingCart /></el-icon>
            <span>Verkäufe</span>
          </el-menu-item>

          <el-menu-item index="/profile">
            <el-icon><User /></el-icon>
            <span>Profil</span>
          </el-menu-item>
        </el-menu>

        <div class="sidebar-footer">
          <el-button type="danger" plain @click="handleLogout" style="width: 100%">
            <el-icon><SwitchButton /></el-icon>
            Abmelden
          </el-button>
        </div>
      </el-aside>

      <!-- Main Content -->
      <el-container>
        <el-header class="header">
          <div class="header-left">
            <h3>{{ pageTitle }}</h3>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                <span class="user-name">{{ user?.name || 'User' }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    Profil
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    Abmelden
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>

    <!-- Login Page (no layout) -->
    <router-view v-else />
  </div>
</template>

<script>
import { computed, watch, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { 
  Odometer, 
  ShoppingBag,
  Grid,
  Box, 
  Reading,
  TrendCharts,
  ShoppingCart, 
  User, 
  SwitchButton 
} from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: {
    Odometer,
    ShoppingBag,
    Grid,
    Box,
    Reading,
    TrendCharts,
    ShoppingCart,
    User,
    SwitchButton
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    const isAuthenticated = computed(() => store.getters['user/isAuthenticated'])
    const user = computed(() => store.getters['user/user'])
    const activeMenu = ref(route.path)

    const pageTitle = computed(() => {
      const titles = {
        '/dashboard': 'Dashboard',
        '/products': 'Produkte',
        '/categories': 'Kategorien',
        '/ingredients': 'Zutaten',
        '/recipes': 'Rezepte',
        '/forecasting': 'Forecasting Board',
        '/sales': 'Verkäufe',
        '/profile': 'Profil'
      }
      return titles[route.path] || 'Smart Restaurant'
    })

    watch(route, (newRoute) => {
      activeMenu.value = newRoute.path
    })

    const handleMenuSelect = (index) => {
      activeMenu.value = index
    }

    const handleCommand = (command) => {
      if (command === 'logout') {
        handleLogout()
      } else if (command === 'profile') {
        router.push('/profile')
      }
    }

    const handleLogout = () => {
      store.dispatch('user/logout').then(() => {
        router.push('/login')
      }).catch((error) => {
        console.error('Logout error:', error)
        // Bei Fehler trotzdem zur Login-Seite
        router.push('/login')
      })
    }

    return {
      isAuthenticated,
      user,
      activeMenu,
      pageTitle,
      handleMenuSelect,
      handleCommand,
      handleLogout
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

#app {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.layout-container {
  height: 100%;
}

.sidebar {
  background: #304156;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  color: #fff;
  margin: 0;
  font-size: 20px;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background: #304156;
}

.sidebar-menu .el-menu-item {
  color: #bfcbd9;
}

.sidebar-menu .el-menu-item:hover {
  background: #263445 !important;
  color: #fff;
}

.sidebar-menu .el-menu-item.is-active {
  background: #409eff !important;
  color: #fff;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.user-name {
  color: #303133;
  font-size: 14px;
}

.main-content {
  background: #f0f2f5;
  overflow-y: auto;
}
</style>