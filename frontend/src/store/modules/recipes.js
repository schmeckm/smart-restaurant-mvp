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
      
      // ✅ Robuster Zugriff auf die Daten
      const responseData = response.data
      const data = responseData.data || responseData
      const recipes = data.recipes || data || []
      
      console.log('📥 Fetched recipes:', recipes.length)
      
      commit('SET_RECIPES', recipes)
      
      // Handle pagination
      if (data.pagination) {
        commit('SET_PAGINATION', data.pagination)
      } else if (data.currentPage) {
        commit('SET_PAGINATION', {
          page: data.currentPage,
          total: data.total || recipes.length,
          limit: data.limit || params?.limit || 20
        })
      }
      
      return response
    } catch (error) {
      console.error('Error fetching recipes:', error)
      commit('SET_RECIPES', []) // ← Wichtig: Leeres Array setzen
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchRecipeByProduct({ commit }, productId) {
    try {
      const response = await request.get(`/recipes/product/${productId}`)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error fetching recipe by product:', error)
      return null
    }
  },

  async createRecipe({ commit }, recipeData) {
    try {
      console.log('📝 Creating recipe:', recipeData.name)
      console.log('📦 For product_id:', recipeData.product_id)
      
      // Validate product_id
      if (!recipeData.product_id) {
        throw new Error('product_id is required')
      }

      // Step 1: Create the base recipe
      console.log('Step 1: Creating base recipe...')
      const recipePayload = {
        name: recipeData.name,
        description: recipeData.description,
        servings: recipeData.servings,
        prep_time: recipeData.prep_time,
        cook_time: recipeData.cook_time,
        difficulty: recipeData.difficulty,
        cuisine: recipeData.cuisine,
        instructions: recipeData.instructions,
        tags: recipeData.tags,
        nutrition: recipeData.nutrition,
        product_id: recipeData.product_id // CRITICAL: Include product_id
      }

      console.log('📤 Sending payload:', recipePayload)

      const recipeResponse = await request.post('/recipes', recipePayload)
      const recipe = recipeResponse.data?.data || recipeResponse.data
      
      console.log('✅ Recipe created with ID:', recipe.id)

      // Step 2: Add ingredients to the recipe
      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        console.log(`Step 2: Adding ${recipeData.ingredients.length} ingredients...`)
        
        for (const ingredient of recipeData.ingredients) {
          try {
            console.log(`  → Adding: ${ingredient.name} (${ingredient.quantity} ${ingredient.unit})`)
            
            // First, check if ingredient exists in database
            let ingredientId = null
            
            try {
              const searchResponse = await request.get('/ingredients', {
                params: { name: ingredient.name, limit: 1 }
              })
              
              const existingIngredients = searchResponse.data?.data?.ingredients || 
                                        searchResponse.data?.data || 
                                        searchResponse.data?.ingredients || []
              
              if (existingIngredients.length > 0) {
                ingredientId = existingIngredients[0].id
                console.log(`    ✓ Found existing ingredient: ${ingredientId}`)
              }
            } catch (searchError) {
              console.log('    → Ingredient not found, will create new one')
            }

            // If ingredient doesn't exist, create it
            if (!ingredientId) {
              console.log(`    → Creating new ingredient: ${ingredient.name}`)
              const createIngredientResponse = await request.post('/ingredients', {
                name: ingredient.name,
                unit: ingredient.unit || 'g',
                category: 'Sonstiges',
                unit_price: 0
              })
              
              const newIngredient = createIngredientResponse.data?.data || createIngredientResponse.data
              ingredientId = newIngredient.id
              console.log(`    ✓ Created ingredient: ${ingredientId}`)
            }

            // Link ingredient to recipe
            console.log(`    → Linking ingredient ${ingredientId} to recipe ${recipe.id}`)
            await request.post(`/recipes/${recipe.id}/ingredients`, {
              ingredient_id: ingredientId,
              quantity: parseFloat(ingredient.quantity) || 0,
              unit: ingredient.unit || 'g',
              notes: ingredient.notes || ''
            })
            
            console.log(`    ✓ Ingredient linked successfully`)
          } catch (ingredientError) {
            console.error(`    ✗ Error with ingredient ${ingredient.name}:`, ingredientError)
            // Continue with other ingredients even if one fails
          }
        }
        
        console.log('✅ All ingredients processed')
      }

      // Step 3: Add to store
      commit('ADD_RECIPE', recipe)
      console.log('✅ Recipe added to store')

      return recipe

    } catch (error) {
      console.error('❌ Error creating recipe:', error)
      console.error('Error response:', error.response?.data)
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
  pagination: state => state.pagination
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}