import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import { getToken } from '@/utils/auth'

// Public routes
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

// Protected routes
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
    path: '/ai-recipe-chat',
    name: 'AIRecipeChat',
    component: () => import('@/views/AIRecipeChat.vue'),
    meta: { title: 'AI Rezept-Generator', requiresAuth: true }
  },
  {
    path: '/sales',
    name: 'Sales',
    component: () => import('@/views/sales/SalesList.vue'),
    meta: { title: 'Verkäufe', requiresAuth: true }
  },
  {
    path: '/forecasting',  // ⬅️ NEU!
    name: 'Forecasting',
    component: () => import('@/views/forecasting/ForecastingBoard.vue'),
    meta: { title: 'Forecasting', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: { title: 'Profil', requiresAuth: true }
  }
]

const routes = [...publicRoutes, ...protectedRoutes]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  // Set page title
  document.title = to.meta.title ? `${to.meta.title} - Restaurant` : 'Restaurant'

  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // If logged in, redirect to dashboard
      next({ path: '/dashboard' })
    } else {
      // Check if user info exists
      const hasRoles = store.getters['user/roles'] && store.getters['user/roles'].length > 0
      
      if (hasRoles) {
        next()
      } else {
        try {
          // Get user info
          await store.dispatch('user/getInfo')
          next()
        } catch (error) {
          // Token invalid, logout
          await store.dispatch('user/resetToken')
          next(`/login?redirect=${to.path}`)
        }
      }
    }
  } else {
    // No token
    if (to.meta.requiresAuth === false) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes: routes
  })
  router.matcher = newRouter.matcher
}

export default router