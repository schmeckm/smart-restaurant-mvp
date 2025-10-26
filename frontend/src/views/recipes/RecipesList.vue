<template>
  <div class="recipes-list">
    <div class="page-header">
      <h1>Rezepte</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        Neues Rezept
      </el-button>
    </div>

    <!-- Recipes Table -->
    <el-card>
      <el-table :data="recipes" v-loading="loading" stripe>
        <el-table-column label="Name" min-width="150">
          <template #default="{ row }">
            {{ row.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Zutaten" min-width="200">
          <template #default="{ row }">
            <!-- 🔧 FIX: Use normalized data (quantity & unit are at ingredient level) -->
            <el-tag 
              v-for="ing in row.ingredients" 
              :key="ing.id" 
              size="small" 
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ ing.name }} ({{ ing.quantity || 0 }} {{ ing.unit || 'g' }})
            </el-tag>
            <span v-if="!row.ingredients || row.ingredients.length === 0" style="color: #909399;">
              Keine Zutaten
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Zeiten" width="150">
          <template #default="{ row }">
            <div style="font-size: 12px;">
              <div>Vorbereitung: {{ row.prepTime || row.prep_time || 0 }} min</div>
              <div>Zubereitung: {{ row.cookTime || row.cook_time || 0 }} min</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Portionen" width="100" align="center">
          <template #default="{ row }">
            {{ row.servings || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Aktionen" width="150" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingRecipe ? 'Rezept bearbeiten' : 'Neues Rezept'"
      width="700px"
    >
      <el-form :model="recipeForm" label-width="120px">
        <el-form-item label="Name">
          <el-input v-model="recipeForm.name" placeholder="Rezeptname" />
        </el-form-item>

        <el-form-item label="Kategorie">
          <el-select v-model="recipeForm.categoryId" placeholder="Kategorie wählen" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Preis">
          <el-input-number v-model="recipeForm.price" :min="0" :step="0.1" :precision="2" style="width: 100%" />
          <span style="margin-left: 10px; color: #909399;">€</span>
        </el-form-item>

        <el-form-item label="Vorbereitung">
          <el-input-number v-model="recipeForm.prepTime" :min="0" style="width: 100%" />
          <span style="margin-left: 10px; color: #909399;">Minuten</span>
        </el-form-item>

        <el-form-item label="Zubereitung">
          <el-input-number v-model="recipeForm.cookTime" :min="0" style="width: 100%" />
          <span style="margin-left: 10px; color: #909399;">Minuten</span>
        </el-form-item>

        <el-form-item label="Portionen">
          <el-input-number v-model="recipeForm.servings" :min="1" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Schwierigkeit">
          <el-select v-model="recipeForm.difficulty" style="width: 100%">
            <el-option label="Einfach" value="easy" />
            <el-option label="Mittel" value="medium" />
            <el-option label="Schwer" value="hard" />
          </el-select>
        </el-form-item>

        <el-form-item label="Anleitung">
          <el-input v-model="recipeForm.instructions" type="textarea" :rows="4" />
        </el-form-item>

        <el-divider>Zutaten</el-divider>

        <el-form-item label="Zutaten">
          <div style="width: 100%;">
            <div 
              v-for="(ing, index) in recipeForm.ingredients" 
              :key="index"
              style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;"
            >
              <el-select 
                v-model="ing.ingredientId" 
                placeholder="Zutat wählen"
                filterable
                style="flex: 2;"
              >
                <el-option
                  v-for="ingredient in ingredients"
                  :key="ingredient.id"
                  :label="ingredient.name"
                  :value="ingredient.id"
                />
              </el-select>

              <el-input-number 
                v-model="ing.quantity" 
                :min="0" 
                :step="0.1"
                :precision="2"
                placeholder="Menge"
                style="flex: 1;"
              />

              <el-select 
                v-model="ing.unit" 
                placeholder="Einheit"
                style="flex: 1;"
              >
                <el-option label="g" value="g" />
                <el-option label="kg" value="kg" />
                <el-option label="ml" value="ml" />
                <el-option label="l" value="l" />
                <el-option label="Stück" value="piece" />
                <el-option label="TL" value="tsp" />
                <el-option label="EL" value="tbsp" />
              </el-select>

              <el-button 
                type="danger" 
                size="small" 
                circle
                @click="removeIngredient(index)"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>

            <el-button 
              type="primary" 
              plain 
              size="small"
              @click="addIngredient"
              style="width: 100%;"
            >
              <el-icon><Plus /></el-icon>
              Zutat hinzufügen
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">Abbrechen</el-button>
        <el-button type="primary" @click="handleSave">Speichern</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Close } from '@element-plus/icons-vue'

const store = useStore()

const recipes = computed(() => store.getters['recipes/recipes'])
const loading = computed(() => store.getters['recipes/loading'])
const pagination = computed(() => store.getters['recipes/pagination'])
const categories = computed(() => store.getters['categories/categories'] || [])
const ingredients = computed(() => store.getters['ingredients/ingredients'] || [])

const showCreateDialog = ref(false)
const editingRecipe = ref(null)
const recipeForm = reactive({
  name: '',
  categoryId: '',
  price: 0,
  prepTime: 0,
  cookTime: 0,
  servings: 1,
  difficulty: 'easy',
  instructions: '',
  ingredients: []
})

const resetForm = () => {
  Object.assign(recipeForm, {
    name: '',
    categoryId: '',
    price: 0,
    prepTime: 0,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    instructions: '',
    ingredients: []
  })
  editingRecipe.value = null
}

const addIngredient = () => {
  recipeForm.ingredients.push({
    ingredientId: '',
    quantity: 0,
    unit: 'g'
  })
}

const removeIngredient = (index) => {
  recipeForm.ingredients.splice(index, 1)
}

const handleSearch = () => {
  store.dispatch('recipes/fetchRecipes', {
    page: pagination.value.page,
    limit: pagination.value.limit
  })
}

const handleCreate = () => {
  resetForm()
  // Load data if not loaded
  if (!categories.value || categories.value.length === 0) {
    store.dispatch('categories/fetchCategories')
  }
  if (!ingredients.value || ingredients.value.length === 0) {
    store.dispatch('ingredients/fetchIngredients', { limit: 100 })
  }
  showCreateDialog.value = true
}

const handleEdit = (recipe) => {
  editingRecipe.value = recipe
  
  // Load data if not loaded
  if (!categories.value || categories.value.length === 0) {
    store.dispatch('categories/fetchCategories')
  }
  if (!ingredients.value || ingredients.value.length === 0) {
    store.dispatch('ingredients/fetchIngredients', { limit: 100 })
  }
  
  // 🔧 FIX: Ingredients are already normalized, just use them directly
  const mappedIngredients = recipe.ingredients?.map(ing => ({
    ingredientId: ing.id,
    quantity: parseFloat(ing.quantity || 0),
    unit: ing.unit || 'g'
  })) || []

  Object.assign(recipeForm, {
    name: recipe.name || '',
    categoryId: recipe.categoryId || recipe.category?.id || '',
    price: recipe.price || 0,
    prepTime: recipe.prepTime || recipe.prep_time || 0,
    cookTime: recipe.cookTime || recipe.cook_time || 0,
    servings: recipe.servings || 1,
    difficulty: recipe.difficulty || 'easy',
    instructions: recipe.instructions || '',
    ingredients: mappedIngredients
  })
  
  showCreateDialog.value = true
}

const handleSave = async () => {
  try {
    // Validate
    if (!recipeForm.name) {
      ElMessage.warning('Bitte gib einen Namen ein')
      return
    }

    const mappedIngredients = recipeForm.ingredients
      .filter(ing => ing.ingredientId && ing.quantity > 0)
      .map(ing => ({
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
        unit: ing.unit
      }))

    const payload = {
      name: recipeForm.name,
      categoryId: recipeForm.categoryId,
      price: recipeForm.price,
      prepTime: recipeForm.prepTime,
      cookTime: recipeForm.cookTime,
      servings: recipeForm.servings,
      difficulty: recipeForm.difficulty,
      instructions: recipeForm.instructions,
      ingredients: mappedIngredients
    }

    if (editingRecipe.value) {
      await store.dispatch('recipes/updateRecipe', {
        id: editingRecipe.value.id,
        data: payload
      })
      ElMessage.success('Rezept aktualisiert')
    } else {
      await store.dispatch('recipes/createRecipe', payload)
      ElMessage.success('Rezept erstellt')
    }
    
    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    console.error('Save error:', error)
    ElMessage.error('Fehler beim Speichern: ' + (error.response?.data?.message || error.message))
  }
}

const handleDelete = async (recipe) => {
  try {
    await ElMessageBox.confirm(
      `Möchten Sie das Rezept "${recipe.name}" wirklich löschen?`,
      'Löschen',
      {
        confirmButtonText: 'Löschen',
        cancelButtonText: 'Abbrechen',
        type: 'warning'
      }
    )
    await store.dispatch('recipes/deleteRecipe', recipe.id)
    ElMessage.success('Rezept gelöscht')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Fehler beim Löschen')
    }
  }
}

onMounted(() => {
  handleSearch()
  store.dispatch('categories/fetchCategories')
  store.dispatch('ingredients/fetchIngredients', { limit: 100 })
})
</script>

<style scoped>
.recipes-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>