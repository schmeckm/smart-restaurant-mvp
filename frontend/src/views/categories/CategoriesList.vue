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
      :data="localCategories" 
      border
      style="width: 100%"
    >
      <el-table-column prop="name" label="Name" width="180" />
      <el-table-column prop="description" label="Beschreibung" />
      
      <el-table-column label="Farbe" width="80" align="center">
        <template #default="{ row }">
          <div 
            :style="{ 
              width: '24px', 
              height: '24px', 
              backgroundColor: row.color || '#409EFF',
              borderRadius: '6px',
              margin: '0 auto',
              border: '1px solid #dcdfe6'
            }"
            :title="row.color || '#409EFF'"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="Aktiv" width="100" align="center">
        <template #default="{ row, $index }">
          <el-switch
            :model-value="row.activeStatus"
            @change="(val) => toggleStatus(row, $index, val)"
            :loading="row.updating"
          />
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
      :close-on-click-modal="false"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="120px"
      >
        <el-form-item label="Name" prop="name">
          <el-input 
            v-model="categoryForm.name" 
            placeholder="Kategorie Name"
            :disabled="saving"
          />
        </el-form-item>
        
        <el-form-item label="Beschreibung" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="Kategorie Beschreibung"
            :disabled="saving"
          />
        </el-form-item>
        
        <el-form-item label="Farbe">
          <div style="display: flex; align-items: center; gap: 12px;">
            <el-color-picker 
              v-model="categoryForm.color"
              :predefine="predefinedColors"
              :disabled="saving"
              :show-aplha="false"
              :color-format="'hex'"
            />
            <span style="font-size: 14px; color: #606266;">
              {{ categoryForm.color || '#409EFF' }}
            </span>
          </div>
          <div style="margin-top: 8px; font-size: 12px; color: #909399;">
            Wähle eine Farbe zur visuellen Unterscheidung der Kategorien
          </div>
        </el-form-item>
        
        <el-form-item label="Aktiv">
          <el-switch 
            v-model="categoryForm.is_active"
            active-text="Active"
            inactive-text="On Hold"
            :disabled="saving"
          />
          <div style="margin-top: 8px; font-size: 12px; color: #909399;">
            Kategorien werden nur in Reports berücksichtigt wenn sie aktiv sind
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialog" :disabled="saving">
            Abbrechen
          </el-button>
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
const categoryFormRef = ref(null)

// Local reactive data
const localCategories = ref([])

// Form data
const categoryForm = reactive({
  name: '',
  description: '',
  color: '#409EFF',
  is_active: true
})

// Predefined colors for the color picker
const predefinedColors = [
  '#409EFF', // Element Plus Blue
  '#67C23A', // Success Green
  '#E6A23C', // Warning Orange
  '#F56C6C', // Danger Red
  '#909399', // Info Gray
  '#9966CC', // Purple
  '#FF69B4', // Hot Pink
  '#20B2AA', // Light Sea Green
  '#FFD700', // Gold
  '#FF6347', // Tomato
  '#32CD32', // Lime Green
  '#1E90FF', // Dodger Blue
  '#FF1493', // Deep Pink
  '#00CED1', // Dark Turquoise
  '#FFA500', // Orange
  '#8A2BE2'  // Blue Violet
]

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
const total = computed(() => localCategories.value.length)

// Update local categories from store
const updateLocalCategories = () => {
  localCategories.value = categories.value.map(cat => ({
    ...cat,
    activeStatus: cat.isActive !== undefined ? cat.isActive : cat.is_active,
    color: cat.color || '#409EFF', // Ensure color is always set
    updating: false
  }))
}

// Fetch categories
const fetchCategories = async () => {
  loading.value = true
  
  try {
    await store.dispatch('categories/fetchCategories', {
      page: currentPage.value,
      limit: pageSize.value
    })
    updateLocalCategories()
  } catch (error) {
    ElMessage.error('Fehler beim Laden der Kategorien')
  } finally {
    loading.value = false
  }
}

// Toggle category status
const toggleStatus = async (category, index, newStatus) => {
  localCategories.value[index].activeStatus = newStatus
  localCategories.value[index].updating = true
  
  try {
    await store.dispatch('categories/updateCategory', {
      id: category.id,
      data: { is_active: newStatus }
    })
    
    ElMessage.success(`Kategorie ${newStatus ? 'aktiviert' : 'deaktiviert'}`)
  } catch (error) {
    localCategories.value[index].activeStatus = !newStatus
    ElMessage.error('Update fehlgeschlagen')
  } finally {
    localCategories.value[index].updating = false
  }
}

// Edit category
const editCategory = (category) => {
  editingCategory.value = { ...category }
  categoryForm.name = category.name
  categoryForm.description = category.description || ''
  categoryForm.color = category.color || '#409EFF'
  categoryForm.is_active = category.activeStatus
  showCreateDialog.value = true
}

// Save category
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
      await store.dispatch('categories/updateCategory', {
        id: editingCategory.value.id,
        data: { ...categoryForm }
      })
      
      ElMessage.success('Kategorie erfolgreich aktualisiert')
    } else {
      await store.dispatch('categories/createCategory', { ...categoryForm })
      ElMessage.success('Kategorie erfolgreich erstellt')
    }
    
    cancelDialog()
    await fetchCategories()
    
  } catch (error) {
    ElMessage.error('Fehler beim Speichern: ' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

// Cancel dialog
const cancelDialog = () => {
  showCreateDialog.value = false
  editingCategory.value = null
  categoryForm.name = ''
  categoryForm.description = ''
  categoryForm.color = '#409EFF'
  categoryForm.is_active = true
  
  if (categoryFormRef.value) {
    categoryFormRef.value.clearValidate()
  }
}

// Delete category
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
    await fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Fehler beim Löschen')
    }
  }
}

// Pagination
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