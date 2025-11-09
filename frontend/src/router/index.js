import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import { getToken } from '@/utils/auth'

// 🟢 Öffentliche Routen
const publicRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: 'Login', requiresAuth: false }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', requiresAuth: false }
  }
]

// 🔒 Geschützte Routen
const protectedRoutes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: 'Dashboard', requiresAuth: true }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/products/ProductsList.vue'),
    meta: { title: 'Produkte', requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('@/views/categories/CategoriesList.vue'),
    meta: { title: 'Kategorien', requiresAuth: true }
  },
  {
    path: '/ingredients',
    name: 'Ingredients',
    component: () => import('@/views/ingredients/IngredientsList.vue'),
    meta: { title: 'Zutaten', requiresAuth: true }
  },
  {
    path: '/recipes',
    name: 'Recipes',
    component: () => import('@/views/recipes/RecipesList.vue'),
    meta: { title: 'Rezepte', requiresAuth: true }
  },
  {
    path: '/restaurant',
    name: 'Restaurant',
    component: () => import('@/views/restaurant/RestaurantView.vue'),
    meta: { title: 'Restaurant-Stammdaten', requiresAuth: true }
  },

  // 👥 Mitarbeiter (Dateiname korrigiert)
  {
    path: '/employees',
    name: 'Employees',
    component: () => import('@/views/employees/EmployeeList.vue'),
    meta: { title: 'Mitarbeiter', requiresAuth: true }
  },

  // 🕒 Zeitmanagement (dein neuer View)
  {
    path: '/timemanagement/scheduling',
    name: 'Scheduling',
    component: () => import('@/views/timemanagement/Scheduling.vue'),
    meta: { title: 'Zeitmanagement & Schichtplanung', requiresAuth: true }
  },

  // 📊 Forecasting (Pfad korrigiert)
  {
    path: '/forecasting',
    name: 'Forecasting',
    component: () => import('@/views/forecasting/ForecastingBoard.vue'),
    meta: { title: 'Forecasting Board', requiresAuth: true }
  },

  // 💰 Financial (Pfad korrigiert)
  {
    path: '/financial',
    name: 'Financial',
    component: () => import('@/views/financial/FinancialDashboard.vue'),
    meta: { title: 'Financial Insights', requiresAuth: true }
  },
{
  path: '/ai-scheduling',
  name: 'AIScheduling',
  component: () => import('@/views/scheduling/AIScheduling.vue'),
  meta: { title: '🤖 KI-Schichtplanung', requiresAuth: true }
},


  {
    path: '/sales',
    name: 'Sales',
    component: () => import('@/views/sales/SalesList.vue'),
    meta: { title: 'Verkäufe', requiresAuth: true }
  },

  // 👤 Profil (Pfad korrigiert)
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: { title: 'Profil', requiresAuth: true }
  }
]

// 🧭 Router erstellen (Vue CLI kompatibel)
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [...publicRoutes, ...protectedRoutes]
})

// 🛡️ Navigation Guard
router.beforeEach((to, from, next) => {
  const token = getToken()

  if (to.meta.requiresAuth && !token) {
    next({ path: '/login' })
  } else if (token && to.path === '/login') {
    next({ path: '/dashboard' })
  } else {
    next()
  }
})

export default router
