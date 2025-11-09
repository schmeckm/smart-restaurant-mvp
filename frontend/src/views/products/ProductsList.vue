<template>
  <div class="product-list">
    <div class="page-header">
      <h1>Produkte</h1>
      <div class="header-actions">
        <!-- Bulk Delete Button -->
        <el-button 
          v-if="selectedProducts.length > 0" 
          type="danger" 
          @click="handleBulkDelete"
          :disabled="loading"
        >
          <el-icon><Delete /></el-icon>
          {{ selectedProducts.length }} löschen
        </el-button>
        
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          Neues Produkt
        </el-button>
      </div>
    </div>

    <!-- 🔍 SUCHFELD SEKTION -->
    <div class="search-section">
      <el-row :gutter="16" class="mb-4">
        <el-col :span="8">
          <el-input
            v-model="search"
            placeholder="Suche nach Produktname oder Beschreibung..."
            prefix-icon="el-icon-search"
            clearable
            @input="handleSearchInput"
          />
        </el-col>
        <el-col :span="6">
          <el-select 
            v-model="searchCategory" 
            placeholder="Kategorie filtern"
            clearable
            style="width: 100%"
          >
            <el-option label="Alle Kategorien" value="" />
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            >
              <span 
                style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px;"
                :style="{ backgroundColor: cat.color || '#409EFF' }"
              ></span>
              <span>{{ cat.name }}</span>
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select 
            v-model="searchStatus" 
            placeholder="Status"
            clearable
            style="width: 100%"
          >
            <el-option label="Alle" value="" />
            <el-option label="Verfügbar" value="available" />
            <el-option label="Nicht verfügbar" value="unavailable" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button @click="resetFilters" style="margin-right: 10px;">Filter zurücksetzen</el-button>
          <span class="search-results">{{ filteredProducts.length }} von {{ products.length }}</span>
        </el-col>
      </el-row>
    </div>

    <!-- Products Table - GEÄNDERT: filteredProducts statt products -->
    <el-card>
      <el-table 
        :data="filteredProducts" 
        v-loading="loading" 
        stripe
        @selection-change="handleSelectionChange"
      >
        <!-- Selection Column -->
        <el-table-column type="selection" width="55" />

        <el-table-column prop="name" label="Produktname" min-width="150">
          <template #default="{ row }">
            {{ row?.name || '-' }}
          </template>
        </el-table-column>

        <!-- Fixed Category Column -->
        <el-table-column prop="category" label="Kategorie" width="130">
          <template #default="{ row }">
            <el-tag 
              v-if="getCategoryName(row.category)" 
              :color="getCategoryColor(row.category)"
              :style="{ color: getCategoryTextColor(row.category) }"
            >
              {{ getCategoryName(row.category) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="Preis" width="100" align="right">
          <template #default="{ row }">
            <span class="price">{{ formatPrice(row?.price) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Kosten" width="100" align="right">
          <template #default="{ row }">
            <span>{{ formatPrice(row?.cost) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Status" width="110" align="center">
          <template #default="{ row }">
            <el-switch
              v-if="row"
              v-model="row.is_available"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="Aktionen" width="250" align="center">
          <template #default="{ row }">
            <el-button v-if="row" type="success" size="small" @click="handleCreateRecipe(row)">
              🤖 KI-Rezept
            </el-button>
            <el-button v-if="row" type="primary" size="small" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button v-if="row" type="danger" size="small" link @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Selection Info -->
      <div v-if="selectedProducts.length > 0" class="selection-info">
        <el-alert
          :title="`${selectedProducts.length} Produkt(e) ausgewählt`"
          type="info"
          show-icon
          :closable="false"
        >
          <template #default>
            {{ selectedProducts.map(p => p.name).join(', ') }}
          </template>
        </el-alert>
      </div>

      <!-- Debug Info - ERWEITERT mit Suche -->
      <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
        <strong>Debug:</strong> 
        {{ filteredProducts.length }}/{{ products.length }} Products angezeigt | 
        {{ categories.length }} Kategorien | 
        Token: {{ !!tokenExists ? 'vorhanden' : 'fehlt' }} | 
        Ausgewählt: {{ selectedProducts.length }} |
        Suchbegriff: "{{ search }}" |
        Kategorie-Filter: {{ searchCategory ? getCategoryNameById(searchCategory) : 'Alle' }} |
        Status-Filter: {{ searchStatus || 'Alle' }}
      </div>

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
      :title="editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'"
      width="500px"
    >
      <el-form :model="productForm" label-width="100px">
        <el-form-item label="Name">
          <el-input v-model="productForm.name" placeholder="z.B. Pizza Margherita" />
        </el-form-item>
        
        <el-form-item label="Kategorie">
          <el-select 
            v-model="productForm.category" 
            placeholder="Kategorie wählen oder eingeben" 
            style="width: 100%"
            filterable
            allow-create
            clearable
            @change="onCategoryChange"
          >
            <!-- ✅ FIXED: Use category ID as value -->
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            >
              <span 
                style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px;"
                :style="{ backgroundColor: cat.color || '#409EFF' }"
              ></span>
              <span>{{ cat.name }}</span>
            </el-option>
            
            <!-- Fallback Categories wenn API fehlschlägt -->
            <el-option-group v-if="categories.length === 0" label="Standard Kategorien">
              <el-option label="Hauptspeise" value="Hauptspeise" />
              <el-option label="Vorspeise" value="Vorspeise" />
              <el-option label="Beilage" value="Beilage" />
              <el-option label="Dessert" value="Dessert" />
              <el-option label="Getränk" value="Getränk" />
              <el-option label="Pizza" value="Pizza" />
              <el-option label="Pasta" value="Pasta" />
              <el-option label="Salat" value="Salat" />
              <el-option label="Suppe" value="Suppe" />
              <el-option label="Fleisch" value="Fleisch" />
              <el-option label="Fisch" value="Fisch" />
              <el-option label="Vegetarisch" value="Vegetarisch" />
            </el-option-group>
          </el-select>
          
          <!-- Enhanced Debug Info -->
          <div style="margin-top: 5px; font-size: 12px;">
            <div style="background: #f0f0f0; padding: 8px; border-radius: 4px; margin-bottom: 5px;">
              <strong>🔍 Categories Debug:</strong><br>
              All Categories: {{ $store.getters['categories/categories'].length }} | 
              Active Categories: {{ $store.getters['categories/activeCategories'].length }} | 
              Loading: {{ $store.getters['categories/loading'] }}<br>
              Selected: {{ productForm.category }} | 
              Category Name: {{ getCategoryNameById(productForm.category) }}
            </div>
            
            <span v-if="categories.length === 0" style="color: #f56c6c;">
              ⚠️ Kategorien-API nicht erreichbar ({{ categories.length }} geladen) - Standard-Kategorien verfügbar
            </span>
            <span v-else style="color: #67c23a;">
              ✅ {{ categories.length }} Kategorien von API geladen
            </span>
            <router-link to="/categories" style="margin-left: 8px;">Kategorien verwalten</router-link>
          </div>
        </el-form-item>

        <el-form-item label="Preis">
          <el-input-number v-model="productForm.price" :min="0" :step="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Kosten">
          <el-input-number v-model="productForm.cost" :min="0" :step="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Beschreibung">
          <el-input v-model="productForm.description" type="textarea" :rows="3" />
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, UserFilled as Robot } from '@element-plus/icons-vue'

const store = useStore()
const router = useRouter()

const products = computed(() => store.getters['products/products'] || [])
const loading = computed(() => store.getters['products/loading'])
const pagination = computed(() => store.getters['products/pagination'])
const categories = computed(() => {
  const allCategories = store.getters['categories/categories'] || []
  const activeCategories = store.getters['categories/activeCategories'] || []
  
  console.log('🔍 Categories Computed:')
  console.log('- All categories:', allCategories.length)
  console.log('- Active categories:', activeCategories.length)
  if (allCategories.length > 0) {
    console.log('- First category:', allCategories[0])
    console.log('- Categories is_active states:', allCategories.map(c => `${c.name}: ${c.is_active}`))
  }
  
  // Return all categories (not just active ones)
  return allCategories
})
const tokenExists = computed(() => !!localStorage.getItem('token'))

const showCreateDialog = ref(false)
const editingProduct = ref(null)
const selectedProducts = ref([]) // For bulk selection

// 🔍 NEUE SUCHVARIABLEN
const search = ref('')
const searchCategory = ref('')
const searchStatus = ref('')

const productForm = reactive({
  name: '',
  category: '',  // ✅ Now stores category ID (UUID)
  price: 0,
  cost: 0,
  description: ''
})

// ==========================================
// 🔍 FILTER & SEARCH LOGIC
// ==========================================
const filteredProducts = computed(() => {
  let filtered = products.value

  // Text-Suche (Name und Beschreibung)
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    filtered = filtered.filter(product => 
      product.name?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm)
    )
  }

  // Kategorie-Filter
  if (searchCategory.value) {
    filtered = filtered.filter(product => 
      product.categoryId === searchCategory.value
    )
  }

  // Status-Filter
  if (searchStatus.value === 'available') {
    filtered = filtered.filter(product => product.is_available === true)
  } else if (searchStatus.value === 'unavailable') {
    filtered = filtered.filter(product => product.is_available === false)
  }

  console.log('🔍 Filter Results:', filtered.length, 'of', products.value.length)
  return filtered
})

// Debounced Search für Performance
const handleSearchInput = debounce(() => {
  console.log('🔍 Searching for:', search.value)
  console.log('📊 Results:', filteredProducts.value.length, 'of', products.value.length)
}, 300)

// Filter zurücksetzen
const resetFilters = () => {
  search.value = ''
  searchCategory.value = ''
  searchStatus.value = ''
  console.log('🔄 Filters reset')
}

// Debounce Helper
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// ==========================================
// CATEGORY HELPER FUNCTIONS
// ==========================================
const getCategoryNameById = (categoryId) => {
  if (!categoryId) return 'Keine'
  
  const category = categories.value.find(cat => cat.id === categoryId)
  return category ? category.name : categoryId // Show ID if name not found
}

const getCategoryName = (category) => {
  if (!category) return null
  
  // If category is object (from API)
  if (typeof category === 'object' && category.name) {
    return category.name
  }
  
  // If category is string (fallback)
  if (typeof category === 'string') {
    return category
  }
  
  return null
}

const getCategoryColor = (category) => {
  if (!category) return '#909399'
  
  if (typeof category === 'object' && category.color) {
    return category.color
  }
  
  // Fallback colors for string categories
  const colorMap = {
    'Pizza': '#ff6b35',
    'Pasta': '#f7931e', 
    'Salat': '#4caf50',
    'Getränk': '#2196f3',
    'Dessert': '#e91e63'
  }
  
  return colorMap[category] || '#409eff'
}

const getCategoryTextColor = (category) => {
  const bgColor = getCategoryColor(category)
  // Simple contrast logic
  return bgColor === '#4caf50' || bgColor === '#2196f3' ? 'white' : 'black'
}

const getCategoryIcon = (category) => {
  if (!category) return '●'
  
  if (typeof category === 'object' && category.icon) {
    return category.icon
  }
  
  // Fallback icons
  const iconMap = {
    'Pizza': '🍕',
    'Pasta': '🍝',
    'Salat': '🥗',
    'Getränk': '🥤',
    'Dessert': '🍰'
  }
  
  return iconMap[category] || '●'
}

// Category change handler for debugging
const onCategoryChange = (categoryId) => {
  console.log('🔄 Category changed to ID:', categoryId)
  const category = categories.value.find(c => c.id === categoryId)
  console.log('🔄 Category name:', category?.name || 'Not found')
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const resetForm = () => {
  Object.assign(productForm, {
    name: '',
    category: '',
    price: 0,
    cost: 0,
    description: ''
  })
  editingProduct.value = null
  console.log('📝 Form reset')
}

const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(price)) return '-'
  return `${parseFloat(price).toFixed(2)} €`
}

const handleSelectionChange = (selection) => {
  selectedProducts.value = selection
  console.log('🔘 Selection changed:', selection.length, 'products selected')
}

const handleBulkDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `Möchten Sie ${selectedProducts.value.length} Produkt(e) wirklich löschen?`,
      'Bulk Löschen',
      {
        confirmButtonText: 'Löschen',
        cancelButtonText: 'Abbrechen',
        type: 'warning'
      }
    )
    
    console.log('🗑️ Bulk deleting products:', selectedProducts.value.map(p => p.name))
    
    // Delete each product
    for (const product of selectedProducts.value) {
      await store.dispatch('products/deleteProduct', product.id)
    }
    
    ElMessage.success(`${selectedProducts.value.length} Produkt(e) gelöscht`)
    selectedProducts.value = []
    console.log('✅ Bulk delete completed')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ Bulk delete error:', error)
      ElMessage.error('Fehler beim Löschen: ' + (error.response?.data?.message || error.message))
    }
  }
}

// ==========================================
// CRUD FUNCTIONS
// ==========================================
const handleSearch = () => {
  console.log('🔍 Fetching products...')
  store.dispatch('products/fetchProducts', {
    page: pagination.value.page,
    limit: pagination.value.limit
  }).then(() => {
    console.log('✅ Products loaded:', products.value.length)
  }).catch(err => {
    console.error('❌ Error loading products:', err)
  })
}

const handleCreate = () => {
  resetForm()
  
  console.log('📝 Creating new product - Categories available:', categories.value.length)
  
  if (categories.value.length === 0) {
    console.log('🔄 Loading categories for create dialog...')
    store.dispatch('categories/fetchCategories')
      .then(() => {
        console.log('✅ Categories loaded for create:', categories.value.length)
      })
      .catch(err => {
        console.error('❌ Categories load failed in create:', err)
        ElMessage.warning('Kategorien konnten nicht geladen werden - Standard-Kategorien verfügbar')
      })
  }
  
  showCreateDialog.value = true
}

const handleEdit = (product) => {
  editingProduct.value = product
  
  // ✅ FIXED: Use categoryId (camelCase) to match backend
  Object.assign(productForm, {
    name: product.name || '',
    category: product.categoryId || '',  // ✅ FIXED: Use categoryId (camelCase)
    price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
    cost: typeof product.cost === 'number' ? product.cost : parseFloat(product.cost) || 0,
    description: product.description || ''
  })
  
  // Debug logging
  console.log('✏️ Editing product:', product.name)
  console.log('Original categoryId:', product.categoryId)  // ✅ camelCase
  console.log('Original category object:', product.category)
  console.log('Form category (ID):', productForm.category)
  console.log('Category name:', getCategoryNameById(productForm.category))
  
  // Categories loading logic...
  if (categories.value.length === 0) {
    console.log('🔄 Loading categories for edit dialog...')
    store.dispatch('categories/fetchCategories')
      .then(() => {
        console.log('✅ Categories loaded successfully:', categories.value.length)
      })
      .catch(err => {
        console.error('❌ Categories load failed:', err)
        if (err.response?.status === 401) {
          ElMessage.warning('Authentifizierung fehlgeschlagen - Standard-Kategorien verfügbar')
        } else {
          ElMessage.warning('Kategorien konnten nicht geladen werden - Standard-Kategorien verfügbar')
        }
      })
  }
  
  showCreateDialog.value = true
}

// ✅ FIXED SAVE FUNCTION - Using camelCase to match backend
// ✅ FIXED SAVE FUNCTION - Safe and stable version
const handleSave = async () => {
  try {
    console.log('💾 === SAVING PRODUCT DEBUG ===');
    console.log('💾 Form data:', productForm);
    console.log('💾 Selected category ID:', productForm.category);
    console.log('💾 Category name:', getCategoryNameById(productForm.category));

    const saveData = {
      name: productForm.name.trim(),
      price: parseFloat(productForm.price) || 0,
      cost: parseFloat(productForm.cost) || 0,
      description: productForm.description?.trim() || '',
      categoryId: productForm.category || null, // ✅ camelCase
      isActive: true
    };

    console.log('💾 Transformed save data:', saveData);

    // ✅ Safely check editing state
    if (editingProduct.value && editingProduct.value.id) {
      console.log('💾 Updating product ID:', editingProduct.value.id);

      const dispatchData = {
        id: editingProduct.value.id,
        data: saveData
      };

      console.log('💾 Dispatch data:', dispatchData);
      const result = await store.dispatch('products/updateProduct', dispatchData);
      console.log('💾 Update result:', result);
      ElMessage.success('Produkt aktualisiert');
    } else {
      console.log('💾 Creating new product...');
      const result = await store.dispatch('products/createProduct', saveData);
      console.log('💾 Create result:', result);
      ElMessage.success('Produkt erstellt');
    }

    // ✅ Reset dialog and reload
    showCreateDialog.value = false;
    resetForm();
    await handleSearch();

  } catch (error) {
    console.error('❌ Save error:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    ElMessage.error('Fehler beim Speichern: ' + (error.response?.data?.message || error.message));
  }
};

const handleDelete = async (product) => {
  try {
    await ElMessageBox.confirm(
      `Möchten Sie "${product.name}" wirklich löschen?`,
      'Löschen',
      {
        confirmButtonText: 'Löschen',
        cancelButtonText: 'Abbrechen',
        type: 'warning'
      }
    )
    
    console.log('🗑️ Deleting product:', product.name)
    await store.dispatch('products/deleteProduct', product.id)
    ElMessage.success('Produkt gelöscht')
    console.log('✅ Product deleted successfully')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ Delete error:', error)
      ElMessage.error('Fehler beim Löschen: ' + (error.response?.data?.message || error.message))
    }
  }
}

const handleStatusChange = async (product) => {
  const originalStatus = product.is_available
  const newStatus = !originalStatus
  
  console.log(`🔄 Changing status for "${product.name}" from ${originalStatus} to ${newStatus}`)
  
  try {
    await store.dispatch('products/updateProduct', {
      id: product.id,
      data: { is_available: product.is_available }
    })
    
    console.log('✅ Product status updated successfully')
    ElMessage.success('Status aktualisiert')
  } catch (error) {
    console.error('❌ Status update failed:', error)
    
    // Revert den Switch
    product.is_available = originalStatus
    
    ElMessage.error('Fehler beim Aktualisieren: ' + (error.response?.data?.message || error.message))
  }
}

const handleCreateRecipe = (product) => {
  console.log('🤖 Opening AI Recipe Generator for:', product.name)
  
  router.push({
    path: '/ai-recipe-chat',
    query: { product_id: product.id }
  })
  ElMessage.success(`Öffne AI-Generator für "${product.name}"`)
}

// Auth debugging helper
const checkAuthStatus = () => {
  const token = localStorage.getItem('token')
  console.log('🔑 Auth Status Check:')
  console.log('- Token exists:', !!token)
  console.log('- Token preview:', token?.substring(0, 30) + '...')
  console.log('- User data:', localStorage.getItem('user'))
}

onMounted(() => {
  console.log('🚀 ProductsList mounted')
  checkAuthStatus()
  handleSearch()
  
  store.dispatch('categories/fetchCategories')
    .then(() => {
      console.log('✅ Categories loaded on mount:', categories.value.length)
    })
    .catch(err => {
      console.error('❌ Categories load failed on mount:', err)
    })
})
</script>

<style scoped>
.product-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

/* 🔍 NEUE STYLES FÜR SUCHFELD */
.search-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.search-results {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
  line-height: 32px;
}

.mb-4 {
  margin-bottom: 16px;
}

.price {
  font-weight: bold;
  color: #67c23a;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.selection-info {
  margin-top: 15px;
}

.el-select-group__title {
  color: #909399;
  font-size: 12px;
}

.el-option-group .el-option {
  padding-left: 20px;
}

/* Custom tag styling for categories */
.el-tag {
  border: none;
  font-weight: 500;
}
</style>