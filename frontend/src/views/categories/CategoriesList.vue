<template>
  <div class="categories-list">
    <div class="page-header">
      <h1>Kategorien</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        Neue Kategorie
      </el-button>
    </div>

    <!-- Categories Table -->
    <el-card>
      <el-table :data="categories" v-loading="loading" stripe>
        <el-table-column prop="name" label="Name" min-width="150" />

        <el-table-column label="Farbe" width="100" align="center">
          <template #default="{ row }">
            <div class="color-preview" :style="{ backgroundColor: row.color }"></div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="Beschreibung" min-width="200" />

        <el-table-column prop="sort_order" label="Sortierung" width="100" align="center" />

        <el-table-column label="Status" width="110" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              @change="handleStatusChange(row)"
            />
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
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'"
      width="500px"
    >
      <el-form :model="categoryForm" label-width="120px">
        <el-form-item label="Name">
          <el-input v-model="categoryForm.name" />
        </el-form-item>
        <el-form-item label="Beschreibung">
          <el-input v-model="categoryForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="Farbe">
          <el-color-picker v-model="categoryForm.color" />
        </el-form-item>
        <el-form-item label="Sortierung">
          <el-input-number v-model="categoryForm.sort_order" :min="0" style="width: 100%" />
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
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

const store = useStore()

const categories = computed(() => store.getters['categories/categories'])
const loading = computed(() => store.getters['categories/loading'])

const showCreateDialog = ref(false)
const editingCategory = ref(null)
const categoryForm = reactive({
  name: '',
  description: '',
  color: '#409EFF',
  sort_order: 0
})

const resetForm = () => {
  Object.assign(categoryForm, {
    name: '',
    description: '',
    color: '#409EFF',
    sort_order: 0
  })
  editingCategory.value = null
}

const handleCreate = () => {
  resetForm()
  showCreateDialog.value = true
}

const handleEdit = (category) => {
  editingCategory.value = category
  Object.assign(categoryForm, {
    name: category.name,
    description: category.description || '',
    color: category.color,
    sort_order: category.sort_order
  })
  showCreateDialog.value = true
}

const handleSave = async () => {
  try {
    if (editingCategory.value) {
      await store.dispatch('categories/updateCategory', {
        id: editingCategory.value.id,
        data: categoryForm
      })
      ElMessage.success('Kategorie aktualisiert')
    } else {
      await store.dispatch('categories/createCategory', categoryForm)
      ElMessage.success('Kategorie erstellt')
    }
    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Fehler beim Speichern')
  }
}

const handleDelete = async (category) => {
  try {
    await ElMessageBox.confirm(
      `Möchten Sie "${category.name}" wirklich löschen?`,
      'Löschen',
      {
        confirmButtonText: 'Löschen',
        cancelButtonText: 'Abbrechen',
        type: 'warning'
      }
    )
    await store.dispatch('categories/deleteCategory', category.id)
    ElMessage.success('Kategorie gelöscht')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || 'Fehler beim Löschen')
    }
  }
}

const handleStatusChange = async (category) => {
  try {
    await store.dispatch('categories/updateCategory', {
      id: category.id,
      data: { is_active: category.is_active }
    })
    ElMessage.success('Status aktualisiert')
  } catch (error) {
    ElMessage.error('Fehler')
    category.is_active = !category.is_active
  }
}

onMounted(() => {
  store.dispatch('categories/fetchCategories')
})
</script>

<style scoped>
.categories-list {
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

.color-preview {
  width: 40px;
  height: 24px;
  border-radius: 4px;
  margin: 0 auto;
  border: 1px solid #ddd;
}
</style>