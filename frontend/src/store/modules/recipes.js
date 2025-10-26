// frontend/src/store/modules/recipes.js
// UPDATED WITH MULTILINGUAL AI RECIPE SUPPORT

import request from '@/utils/request'

const state = {
  recipes: [],
  loading: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
}

const mutations = {
  SET_RECIPES(state, recipes) {
    state.recipes = recipes
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination }
  },
  ADD_RECIPE(state, recipe) {
    state.recipes.unshift(recipe)
  }
}

const actions = {
  async fetchRecipes({ commit }, params) {
    commit('SET_LOADING', true)
    try {
      const response = await request.get('/recipes', { params })
      
      const responseData = response.data
      const data = responseData.data || responseData
      let recipes = data.recipes || data || []
      
      // 🔧 FIX: Normalize ingredient data (flatten ProductIngredient to ingredient level)
      recipes = recipes.map(recipe => ({
        ...recipe,
        ingredients: (recipe.ingredients || []).map(ing => ({
          ...ing,
          // Flatten ProductIngredient data to top level
          quantity: ing.ProductIngredient?.quantity || ing.quantity || 0,
          unit: ing.ProductIngredient?.unit || ing.unit || 'g',
          preparationNote: ing.ProductIngredient?.preparationNote || ing.preparationNote,
          isOptional: ing.ProductIngredient?.isOptional || ing.isOptional || false,
          sortOrder: ing.ProductIngredient?.sortOrder || ing.sortOrder || 0
        }))
      }))
      
      console.log('📥 Fetched recipes:', recipes.length)
      
      commit('SET_RECIPES', recipes)
      
      // Handle pagination
      if (data.pagination) {
        commit('SET_PAGINATION', data.pagination)
      } else if (responseData.pagination) {
        commit('SET_PAGINATION', {
          page: responseData.pagination.page,
          total: responseData.pagination.total,
          limit: responseData.pagination.limit
        })
      }
      
      return response
    } catch (error) {
      console.error('Error fetching recipes:', error)
      commit('SET_RECIPES', [])
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchRecipeByProduct({ commit }, productId) {
    try {
      const response = await request.get(`/recipes/product/${productId}`)
      let recipe = response.data?.data || response.data
      
      // Normalize ingredients for this single recipe too
      if (recipe && recipe.ingredients) {
        recipe.ingredients = recipe.ingredients.map(ing => ({
          ...ing,
          quantity: ing.ProductIngredient?.quantity || ing.quantity || 0,
          unit: ing.ProductIngredient?.unit || ing.unit || 'g',
          preparationNote: ing.ProductIngredient?.preparationNote || ing.preparationNote,
          isOptional: ing.ProductIngredient?.isOptional || ing.isOptional || false
        }))
      }
      
      return recipe
    } catch (error) {
      console.error('Error fetching recipe by product:', error)
      return null
    }
  },

  async createRecipe({ commit }, recipeData) {
    try {
      console.log('📝 Creating recipe:', recipeData.name)
      
      const recipePayload = {
        name: recipeData.name,
        description: recipeData.description,
        categoryId: recipeData.categoryId,
        price: recipeData.price,
        instructions: recipeData.instructions,
        prepTime: recipeData.prepTime || recipeData.prep_time,
        cookTime: recipeData.cookTime || recipeData.cook_time,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty,
        tags: recipeData.tags,
        ingredients: recipeData.ingredients
      }

      console.log('📤 Sending payload:', recipePayload)

      const recipeResponse = await request.post('/recipes', recipePayload)
      let recipe = recipeResponse.data?.data || recipeResponse.data
      
      // Normalize ingredients
      if (recipe && recipe.ingredients) {
        recipe.ingredients = recipe.ingredients.map(ing => ({
          ...ing,
          quantity: ing.ProductIngredient?.quantity || ing.quantity || 0,
          unit: ing.ProductIngredient?.unit || ing.unit || 'g'
        }))
      }
      
      console.log('✅ Recipe created with ID:', recipe.id)
      commit('ADD_RECIPE', recipe)

      return recipe
    } catch (error) {
      console.error('❌ Error creating recipe:', error)
      console.error('Error response:', error.response?.data)
      throw error
    }
  },

  // ==========================================
  // 🌍 NEW: MULTILINGUAL AI RECIPE ACTION
  // ==========================================
  async saveAIRecipe({ commit }, recipeData) {
    try {
      const language = recipeData.language || 'de'
      console.log(`🤖 Saving ${language.toUpperCase()} AI recipe:`, recipeData.name, 'for product:', recipeData.productId)
      
      const response = await request.post('/recipes/save-ai-recipe', recipeData)
      let recipe = response.data?.data || response.data
      
      // Normalize ingredients like other recipes
      if (recipe && recipe.ingredients) {
        recipe.ingredients = recipe.ingredients.map(ing => ({
          ...ing,
          quantity: ing.ProductIngredient?.quantity || ing.quantity || 0,
          unit: ing.ProductIngredient?.unit || ing.unit || 'g',
          preparationNote: ing.ProductIngredient?.preparationNote || ing.preparationNote,
          isOptional: ing.ProductIngredient?.isOptional || ing.isOptional || false
        }))
      }
      
      console.log(`✅ ${language.toUpperCase()} AI Recipe saved successfully with ID:`, recipe.id)
      commit('ADD_RECIPE', recipe)
      
      return recipe
    } catch (error) {
      console.error('❌ Error saving AI recipe:', error)
      console.error('Error response:', error.response?.data)
      
      // Enhanced error handling for multilingual support
      if (error.response?.data?.code === 'RECIPE_EXISTS') {
        // Recipe already exists - let component handle the conflict
        throw error
      } else if (error.response?.data?.code === 'INGREDIENT_CONFLICTS') {
        // Ingredient conflicts detected - let component handle resolution
        throw error
      } else {
        // Generic error
        throw error
      }
    }
  },

  // ==========================================
  // 🔄 ENHANCED: GENERATE RECIPE WITH LANGUAGE
  // ==========================================
  async generateRecipeWithAI({ commit }, params) {
    try {
      const language = params.language || 'de'
      console.log(`🤖 Generating ${language.toUpperCase()} recipe with AI:`, params.productName)
      
      const response = await request.post('/recipes/generate-with-ai', params)
      
      if (response.data?.success) {
        console.log(`✅ ${language.toUpperCase()} AI recipe generated:`, response.data.data.name)
        return response.data.data
      } else {
        throw new Error(response.data?.message || 'Recipe generation failed')
      }
    } catch (error) {
      console.error(`❌ Error generating ${params.language || 'DE'} AI recipe:`, error)
      throw error
    }
  },

  // ==========================================
  // 🔍 NEW: ANALYZE NUTRITION
  // ==========================================
  async analyzeNutrition({ commit }, { ingredients, servings = 4 }) {
    try {
      console.log('🔬 Analyzing nutrition for', ingredients.length, 'ingredients')
      
      const response = await request.post('/recipes/analyze-nutrition', {
        ingredients,
        servings
      })
      
      if (response.data?.success) {
        console.log('✅ Nutrition analysis complete')
        return response.data.data
      } else {
        throw new Error(response.data?.message || 'Nutrition analysis failed')
      }
    } catch (error) {
      console.error('❌ Error analyzing nutrition:', error)
      throw error
    }
  },

  // ==========================================
  // 💡 NEW: SUGGEST INGREDIENTS WITH LANGUAGE
  // ==========================================
  async suggestIngredients({ commit }, { productName, servings = 4, language = 'de' }) {
    try {
      console.log(`💡 Suggesting ${language.toUpperCase()} ingredients for:`, productName)
      
      const response = await request.post('/recipes/suggest-ingredients', {
        productName,
        servings,
        language
      })
      
      if (response.data?.success) {
        console.log(`✅ ${language.toUpperCase()} ingredient suggestions generated`)
        return response.data.data
      } else {
        throw new Error(response.data?.message || 'Ingredient suggestion failed')
      }
    } catch (error) {
      console.error(`❌ Error suggesting ${language} ingredients:`, error)
      throw error
    }
  },

  async updateRecipe({ dispatch }, { id, data }) {
    try {
      await request.put(`/recipes/${id}`, data)
      await dispatch('fetchRecipes', {
        page: state.pagination.page,
        limit: state.pagination.limit
      })
    } catch (error) {
      console.error('Error updating recipe:', error)
      throw error
    }
  },

  async deleteRecipe({ dispatch }, id) {
    try {
      await request.delete(`/recipes/${id}`)
      await dispatch('fetchRecipes', {
        page: state.pagination.page,
        limit: state.pagination.limit
      })
    } catch (error) {
      console.error('Error deleting recipe:', error)
      throw error
    }
  }
}

const getters = {
  recipes: state => state.recipes,
  loading: state => state.loading,
  pagination: state => state.pagination,
  
  // ==========================================
  // 🌍 NEW: MULTILINGUAL GETTERS
  // ==========================================
  recipesByLanguage: (state) => (language) => {
    return state.recipes.filter(recipe => {
      // Check if recipe has language info in notes or custom field
      return recipe.notes?.includes(`[Recipe Language: ${language.toUpperCase()}]`) ||
             recipe.language === language
    })
  },
  
  aiGeneratedRecipes: (state) => {
    return state.recipes.filter(recipe => {
      return recipe.notes?.includes('[Generated by AI]') ||
             recipe.generatedBy?.includes('claude-ai')
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}