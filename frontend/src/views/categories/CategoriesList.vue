<template>
  <div class="categories-container">
    <div class="header-section">
      <h2>Kategorien verwalten</h2>
      <el-button 
        type="primary" 
        icon="Plus" 
        @click="showCreateDialog = true"
      >
        Neue Kategorie
      </el-button>
    </div>

    <!-- Categories Table -->
    <el-table 
      v-loading="loading"
      :data="categories" 
      border
      style="width: 100%"
    >
      <el-table-column prop="name" label="Name" width="200" />
      <el-table-column prop="description" label="Beschreibung" />
      <el-table-column label="Aktiv" width="100" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.is_active"
            @change="handleStatusChange(row)"
            :loading="row.updating"
          />
        </template>
      </el-table-column>
      <el-table-column label="Erstellt" width="120" align="center">
        <template #default="{ row }">
          {{ new Date(row.created_at).toLocaleDateString() }}
        </template>
      </el-table-column>
      <el-table-column label="Aktionen" width="150" align="center">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            icon="Edit"
            @click="editCategory(row)"
          />
          <el-button
            type="danger"
            size="small"
            icon="Delete"
            @click="confirmDelete(row)"
          />
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <el-pagination
      v-if="total > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      style="margin-top: 20px; text-align: center"
    />

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie erstellen'"
      width="500px"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="120px"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="categoryForm.name" placeholder="Kategorie Name" />
        </el-form-item>
        <el-form-item label="Beschreibung" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="Kategorie Beschreibung"
          />
        </el-form-item>
        <el-form-item label="Aktiv">
          <el-switch v-model="categoryForm.is_active" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialog">Abbrechen</el-button>
          <el-button 
            type="primary" 
            @click="saveCategory"
            :loading="saving"
          >
            {{ editingCategory ? 'Aktualisieren' : 'Erstellen' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useStore()

// State
const loading = ref(false)
const saving = ref(false)
const showCreateDialog = ref(false)
const editingCategory = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const categoryFormRef = ref()

// Form data
const categoryForm = reactive({
  name: '',
  description: '',
  is_active: true
})

// Form validation rules
const categoryRules = {
  name: [
    { required: true, message: 'Name ist erforderlich', trigger: 'blur' },
    { min: 2, max: 50, message: 'Name muss zwischen 2 und 50 Zeichen lang sein', trigger: 'blur' }
  ],
  description: [
    { max: 255, message: 'Beschreibung darf nicht länger als 255 Zeichen sein', trigger: 'blur' }
  ]
}

// Computed
const categories = computed(() => store.getters['categories/categories'])
const total = computed(() => store.getters['categories/total'])

// Methods
const fetchCategories = async () => {
  loading.value = true
  try {
    await store.dispatch('categories/fetchCategories', {
      page: currentPage.value,
      limit: pageSize.value
    })
    console.log('✅ Categories fetched successfully')
  } catch (error) {
    console.error('❌ Error fetching categories:', error)
    ElMessage.error('Fehler beim Laden der Kategorien: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 🔧 FIXED: Status change with table refresh
const handleStatusChange = async (category) => {
  const originalStatus = category.is_active
  category.updating = true
  
  console.log(`🔄 Changing active status for "${category.name}" to ${category.is_active}`)
  
  try {
    await store.dispatch('categories/updateCategory', {
      id: category.id,
      data: { is_active: category.is_active }
    })
    
    console.log('✅ Category active status updated successfully')
    ElMessage.success('Aktiv-Status aktualisiert')
    
    // ✅ CRITICAL FIX: Reload categories to ensure table updates
    console.log('🔄 Reloading categories to refresh table...')
    await fetchCategories()
    console.log('✅ Categories refreshed after status update')
    
  } catch (error) {
    console.error('❌ Active status update failed:', error)
    
    // Revert the switch
    category.is_active = originalStatus
    
    ElMessage.error('Fehler beim Aktualisieren: ' + (error.response?.data?.message || error.message))
  } finally {
    category.updating = false
  }
}

const editCategory = (category) => {
  editingCategory.value = category
  categoryForm.name = category.name
  categoryForm.description = category.description || ''
  categoryForm.is_active = category.is_active
  showCreateDialog.value = true
}

const saveCategory = async () => {
  if (!categoryFormRef.value) return
  
  try {
    await categoryFormRef.value.validate()
  } catch {
    return
  }

  saving.value = true

  try {
    if (editingCategory.value) {
      // Update existing category
      await store.dispatch('categories/updateCategory', {
        id: editingCategory.value.id,
        data: categoryForm
      })
      ElMessage.success('Kategorie erfolgreich aktualisiert')
    } else {
      // Create new category
      await store.dispatch('categories/createCategory', categoryForm)
      ElMessage.success('Kategorie erfolgreich erstellt')
    }
    
    cancelDialog()
    await fetchCategories() // Refresh the list
  } catch (error) {
    console.error('❌ Error saving category:', error)
    ElMessage.error('Fehler beim Speichern: ' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (category) => {
  try {
    await ElMessageBox.confirm(
      `Möchten Sie die Kategorie "${category.name}" wirklich löschen?`,
      'Kategorie löschen',
      {
        confirmButtonText: 'Löschen',
        cancelButtonText: 'Abbrechen',
        type: 'warning',
      }
    )
    
    await store.dispatch('categories/deleteCategory', category.id)
    ElMessage.success('Kategorie erfolgreich gelöscht')
    await fetchCategories() // Refresh the list
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ Error deleting category:', error)
      ElMessage.error('Fehler beim Löschen: ' + (error.response?.data?.message || error.message))
    }
  }
}

const cancelDialog = () => {
  showCreateDialog.value = false
  editingCategory.value = null
  categoryForm.name = ''
  categoryForm.description = ''
  categoryForm.is_active = true
  if (categoryFormRef.value) {
    categoryFormRef.value.clearValidate()
  }
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  fetchCategories()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  fetchCategories()
}

// Lifecycle
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.categories-container {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-section h2 {
  margin: 0;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.el-table {
  margin-bottom: 20px;
}

.el-pagination {
  margin-top: 20px;
}
</style>