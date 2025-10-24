<template>
  <div class="product-list">
    <div class="page-header">
      <h1>Produkte</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        Neues Produkt
      </el-button>
    </div>

    <!-- Products Table -->
    <el-card>
      <el-table :data="products" v-loading="loading" stripe>
        <el-table-column prop="name" label="Produktname" min-width="150">
          <template #default="{ row }">
            {{ row?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="category" label="Kategorie" width="130">
          <template #default="{ row }">
            <el-tag v-if="row?.category">{{ row.category }}</el-tag>
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

      <!-- Debug Info -->
      <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
        <strong>Debug:</strong> {{ products.length }} Products geladen | {{ categories.length }} Kategorien
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
            placeholder="Kategorie wählen" 
            style="width: 100%"
            filterable
            allow-create
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.name"
            >
              <span :style="{ color: cat.color, marginRight: '8px' }">●</span>
              <span>{{ cat.name }}</span>
            </el-option>
          </el-select>
          <div style="margin-top: 5px; font-size: 12px; color: #909399;">
            Keine Kategorie gefunden? Lege sie unter <router-link to="/categories">"Kategorien"</router-link> an.
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
import { Plus, Edit, Delete, Robot } from '@element-plus/icons-vue'

const store = useStore()
const router = useRouter()

const products = computed(() => store.getters['products/products'] || [])
const loading = computed(() => store.getters['products/loading'])
const pagination = computed(() => store.getters['products/pagination'])
const categories = computed(() => store.getters['categories/activeCategories'] || [])

const showCreateDialog = ref(false)
const editingProduct = ref(null)
const productForm = reactive({
  name: '',
  category: '',
  price: 0,
  cost: 0,
  description: ''
})

const formatPrice = (price) => {
  return `€${Number(price || 0).toFixed(2)}`
}

const resetForm = () => {
  Object.assign(productForm, {
    name: '',
    category: '',
    price: 0,
    cost: 0,
    description: ''
  })
  editingProduct.value = null
}

const handleSearch = () => {
  console.log('🔍 Fetching products...')
  store.dispatch('products/fetchProducts', {
    page: pagination.value.page,
    limit: pagination.value.limit
  }).then(() => {
    console.log('✅ Products loaded:', products.value)
  }).catch(err => {
    console.error('❌ Error loading products:', err)
  })
}

const handleCreate = () => {
  resetForm()
  // Kategorien laden falls noch nicht geladen
  if (!categories.value || categories.value.length === 0) {
    store.dispatch('categories/fetchCategories')
  }
  showCreateDialog.value = true
}

const handleEdit = (product) => {
  editingProduct.value = product
  Object.assign(productForm, {
    name: product.name,
    category: product.category,
    price: product.price,
    cost: product.cost,
    description: product.description || ''
  })
  showCreateDialog.value = true
}

const handleSave = async () => {
  try {
    if (editingProduct.value) {
      await store.dispatch('products/updateProduct', {
        id: editingProduct.value.id,
        data: productForm
      })
      ElMessage.success('Produkt aktualisiert')
    } else {
      await store.dispatch('products/createProduct', productForm)
      ElMessage.success('Produkt erstellt')
    }
    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    console.error('Save error:', error)
    ElMessage.error('Fehler beim Speichern')
  }
}

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
    await store.dispatch('products/deleteProduct', product.id)
    ElMessage.success('Produkt gelöscht')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Fehler beim Löschen')
    }
  }
}

const handleStatusChange = async (product) => {
  try {
    await store.dispatch('products/updateProduct', {
      id: product.id,
      data: { is_available: product.is_available }
    })
    ElMessage.success('Status aktualisiert')
  } catch (error) {
    ElMessage.error('Fehler')
    product.is_available = !product.is_available
  }
}

const handleCreateRecipe = (product) => {
  // Navigate to AI Recipe Chat with product_id
  router.push({
    path: '/ai-recipe-chat',
    query: { product_id: product.id }
  })
  ElMessage.success(`Öffne AI-Generator für "${product.name}"`)
}

onMounted(() => {
  console.log('🚀 ProductsList mounted')
  handleSearch()
  store.dispatch('categories/fetchCategories')
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

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
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
</style>