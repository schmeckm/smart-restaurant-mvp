<template>
  <div class="sales-list">
    <div class="page-header">
      <h1>Verkäufe</h1>
      <div class="header-buttons">
        <el-button 
          v-if="selectedSales.length > 0" 
          type="danger" 
          @click="handleBulkDelete"
        >
          <el-icon><Delete /></el-icon>
          {{ selectedSales.length }} löschen
        </el-button>
        <el-button type="success" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          Importieren
        </el-button>
        <el-button type="info" @click="handleExportSales">
          <el-icon><Download /></el-icon>
          Exportieren
        </el-button>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          Neuer Verkauf
        </el-button>
      </div>
    </div>

    <!-- Filter -->
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item label="Zeitraum">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="bis"
            start-placeholder="Von"
            end-placeholder="Bis"
            @change="handleSearch"
          />
        </el-form-item>

        <el-form-item label="Status">
          <el-select v-model="filters.status" placeholder="Alle" clearable @change="handleSearch">
            <el-option label="Abgeschlossen" value="completed" />
            <el-option label="Ausstehend" value="pending" />
            <el-option label="Storniert" value="cancelled" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="default" @click="handleReset">
            <el-icon><Refresh /></el-icon>
            Filter zurücksetzen
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Tabelle -->
    <el-card>
      <el-table 
        :data="sales" 
        v-loading="loading" 
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="Produkt" min-width="150">
          <template #default="{ row }">{{ getProductName(row.productId) }}</template>
        </el-table-column>

        <el-table-column label="Datum" width="180">
          <template #default="{ row }">{{ formatDate(row.saleDate) }}</template>
        </el-table-column>

        <el-table-column label="Menge" width="100" align="center">
          <template #default="{ row }">{{ row.quantity }}</template>
        </el-table-column>

        <el-table-column label="Einzelpreis" width="120" align="right">
          <template #default="{ row }">€{{ Number(row.unitPrice).toFixed(2) }}</template>
        </el-table-column>

        <el-table-column label="Gesamt" width="120" align="right">
          <template #default="{ row }"><span class="total-price">€{{ Number(row.totalPrice).toFixed(2) }}</span></template>
        </el-table-column>

        <el-table-column label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
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

    <!-- Dialog Neuer Verkauf -->
    <el-dialog v-model="showCreateDialog" title="Neuer Verkauf" width="500px">
      <el-form :model="saleForm" label-width="120px">
        <el-form-item label="Produkt">
          <el-select v-model="saleForm.productId" placeholder="Produkt wählen" filterable>
            <el-option
              v-for="product in availableProducts"
              :key="product.id"
              :label="product.name"
              :value="product.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Menge">
          <el-input-number v-model="saleForm.quantity" :min="1" />
        </el-form-item>

        <el-form-item label="Notizen">
          <el-input v-model="saleForm.notes" type="textarea" placeholder="Optional..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">Abbrechen</el-button>
        <el-button type="primary" @click="handleCreateSale">Verkauf erfassen</el-button>
      </template>
    </el-dialog>

    <!-- Dialog Verkauf bearbeiten -->
    <el-dialog v-model="showEditDialog" title="Verkauf bearbeiten" width="500px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="Produkt">
          <el-select v-model="editForm.productId" placeholder="Produkt wählen" filterable>
            <el-option
              v-for="product in availableProducts"
              :key="product.id"
              :label="product.name"
              :value="product.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Menge">
          <el-input-number v-model="editForm.quantity" :min="1" />
        </el-form-item>

        <el-form-item label="Status">
          <el-select v-model="editForm.status">
            <el-option label="Ausstehend" value="pending" />
            <el-option label="Abgeschlossen" value="completed" />
            <el-option label="Storniert" value="cancelled" />
          </el-select>
        </el-form-item>

        <el-form-item label="Notizen">
          <el-input v-model="editForm.notes" type="textarea" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">Abbrechen</el-button>
        <el-button type="primary" @click="handleUpdateSale">Speichern</el-button>
      </template>
    </el-dialog>

    <!-- Upload/Import Dialog -->
    <el-dialog v-model="showUploadDialog" title="Verkäufe importieren" width="500px">
      <div class="upload-section">
        <el-alert
          title="CSV Format"
          description="Spalten: Produkt, Menge, Notizen (optional)"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 15px;"
        />
        
        <el-button type="text" @click="downloadTemplate" style="margin-bottom: 15px;">
          <el-icon><Download /></el-icon>
          CSV-Vorlage herunterladen
        </el-button>

        <el-upload
          class="upload-demo"
          drag
          :file-list="fileList"
          :before-upload="handleFileChange"
          :on-remove="handleRemoveFile"
          accept=".csv"
          :limit="1"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            CSV-Datei hier ablegen oder <em>klicken zum Auswählen</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">Nur CSV-Dateien bis 5MB</div>
          </template>
        </el-upload>
      </div>

      <template #footer>
        <el-button @click="showUploadDialog = false">Abbrechen</el-button>
        <el-button 
          type="primary" 
          @click="handleImport"
          :loading="uploadLoading"
          :disabled="!fileList.length"
        >
          {{ uploadLoading ? 'Importiere...' : 'Importieren' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete, Upload, Download, UploadFilled, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const store = useStore()

// ===== COMPUTED =====
const sales = computed(() => store.getters['sales/sales'] || [])
const loading = computed(() => store.getters['sales/loading'])
const pagination = computed(() => store.getters['sales/pagination'])
const availableProducts = computed(() => store.getters['products/products'] || [])

// ===== REACTIVE DATA =====
const dateRange = ref([])
const filters = reactive({ status: '' })
const selectedSales = ref([])

// ===== DIALOGS =====
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showUploadDialog = ref(false)

// ===== FORMS =====
const saleForm = reactive({ 
  productId: '', 
  quantity: 1,
  notes: ''
})

const editForm = reactive({ 
  id: '', 
  productId: '', 
  quantity: 1, 
  status: 'pending',
  notes: ''
})

// ===== UPLOAD =====
const fileList = ref([])
const uploadLoading = ref(false)

// ===== HELPER FUNCTION: Get User/Restaurant Data =====
// ===== HELPER FUNCTION: Get User/Restaurant Data =====
const getUserAndRestaurantData = () => {
  // 🔥 ERWEITERTE DEBUG für Restaurant
  console.log('🔥 Complete user state:', store.state.user)
  console.log('🔥 User keys:', Object.keys(store.state.user))
  console.log('🔥 All state keys:', Object.keys(store.state))
  
  // Restaurant könnte hier versteckt sein:
  console.log('🔥 user.restaurant:', store.state.user?.restaurant)
  console.log('🔥 user.currentRestaurant:', store.state.user?.currentRestaurant) 
  console.log('🔥 user.restaurantId:', store.state.user?.restaurantId)
  console.log('🔥 user.roles:', store.state.user?.roles)
  
  const userAttempts = [
    store.getters['user/user'],
    store.state.user
  ]
  
  const restaurantAttempts = [
    store.state.user?.restaurant,
    store.state.user?.currentRestaurant,
    store.state.user?.restaurantInfo,
    // Falls Restaurant ID direkt im User ist:
    store.state.user?.restaurantId ? { id: store.state.user.restaurantId } : null
  ]
  
  const currentUser = userAttempts.find(user => user && user.id)
  const currentRestaurant = restaurantAttempts.find(restaurant => restaurant && restaurant.id)
  
  console.log('🔥 Found User:', currentUser)
  console.log('🔥 Found Restaurant:', currentRestaurant)
  
  return { currentUser, currentRestaurant }
}

// ===== FUNKTIONEN =====

// 🔹 Suchfunktion
const handleSearch = async () => {
  const params = {
    page: pagination.value.page,
    limit: pagination.value.limit,
    status: filters.status || undefined,
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1]
  }
  await store.dispatch('sales/fetchSales', params)
}

// 🔹 Filter zurücksetzen
const handleReset = async () => {
  dateRange.value = []
  filters.status = ''
  await handleSearch()
}

// 🔹 CSV Export mit echtem Download
const handleExportSales = () => {
  if (!sales.value || sales.value.length === 0) {
    ElMessage.warning('Keine Verkäufe zum Exportieren vorhanden')
    return
  }

  // CSV Header
  const headers = ['Datum', 'Produkt', 'Menge', 'Einzelpreis', 'Gesamtpreis', 'Status', 'Notizen']
  
  // CSV Daten
  const csvData = sales.value.map(sale => [
    formatDate(sale.saleDate),
    getProductName(sale.productId),
    sale.quantity,
    `€${Number(sale.unitPrice).toFixed(2)}`,
    `€${Number(sale.totalPrice).toFixed(2)}`,
    getStatusLabel(sale.status),
    sale.notes || ''
  ])

  // CSV String erstellen
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  // BOM für UTF-8 (damit Umlaute korrekt angezeigt werden)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Download erstellen
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `verkaufe_${dayjs().format('YYYY-MM-DD_HH-mm')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('📥 CSV-Datei wurde heruntergeladen')
}

// 🔹 Verkauf anlegen - MIT DEBUG UND FALLBACK
const handleCreateSale = async () => {
  try {
    const selectedProduct = availableProducts.value.find(p => p.id === saleForm.productId)
    
    if (!selectedProduct) {
      ElMessage.error('Bitte wählen Sie ein Produkt aus')
      return
    }
    
    // 🔥 KORREKTE DATEN für Backend:
    const saleData = {
      product_id: saleForm.productId,        // ⬅️ snake_case, wie erwartet
      quantity: saleForm.quantity,
      unit_price: selectedProduct.price,     // ⬅️ optional
      payment_method: 'cash',                // ⬅️ optional  
      notes: saleForm.notes                  // ⬅️ falls unterstützt
    }
    
    console.log('🔥 CORRECT Backend Data:', saleData)
    
    await store.dispatch('sales/createSale', saleData)
    ElMessage.success('✅ Verkauf erfasst')
    showCreateDialog.value = false
    
    // Form zurücksetzen
    saleForm.productId = ''
    saleForm.quantity = 1
    saleForm.notes = ''
    await handleSearch()
  } catch (err) {
    console.error('❌ Create Sale Error:', err)
    ElMessage.error(`Fehler beim Erfassen: ${err.response?.data?.message || err.message}`)
  }
}

// 🔹 Verkauf bearbeiten
const handleEdit = (row) => {
  editForm.id = row.id
  editForm.productId = row.productId
  editForm.quantity = row.quantity
  editForm.status = row.status
  editForm.notes = row.notes || ''
  showEditDialog.value = true
}

const handleUpdateSale = async () => {
  try {
    const { currentUser, currentRestaurant } = getUserAndRestaurantData()
    const selectedProduct = availableProducts.value.find(p => p.id === editForm.productId)
    
    await store.dispatch('sales/updateSale', {
      id: editForm.id,
      data: {
        productId: editForm.productId,
        quantity: editForm.quantity,
        status: editForm.status,
        notes: editForm.notes,
        restaurantId: currentRestaurant?.id,
        userId: currentUser?.id,
        unitPrice: selectedProduct?.price
      }
    })
    ElMessage.success('✅ Verkauf aktualisiert')
    showEditDialog.value = false
  } catch (err) {
    console.error(err)
    ElMessage.error('Fehler beim Aktualisieren')
  }
}

// 🔹 Einzelnen Verkauf löschen
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Verkauf "${getProductName(row.productId)}" wirklich löschen?`,
      'Löschen bestätigen',
      { type: 'warning' }
    )
    
    await store.dispatch('sales/deleteSale', row.id)
    ElMessage.success('✅ Verkauf gelöscht')
  } catch (err) {
    if (err !== 'cancel') {
      console.error(err)
      ElMessage.error('Fehler beim Löschen')
    }
  }
}

// 🔹 Mehrere Verkäufe löschen
const handleBulkDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `${selectedSales.value.length} Verkäufe wirklich löschen?`,
      'Löschen bestätigen',
      { type: 'warning' }
    )

    const promises = selectedSales.value.map(sale => 
      store.dispatch('sales/deleteSale', sale.id)
    )
    
    await Promise.all(promises)
    ElMessage.success(`✅ ${selectedSales.value.length} Verkäufe gelöscht`)
    selectedSales.value = []
  } catch (err) {
    if (err !== 'cancel') {
      console.error(err)
      ElMessage.error('Fehler beim Löschen')
    }
  }
}

// 🔹 Import Funktionen
const handleFileChange = (file) => {
  fileList.value = [file]
  return false
}

const handleRemoveFile = () => {
  fileList.value = []
}

const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) throw new Error('CSV muss mindestens Header und eine Datenzeile enthalten')
  
  const headers = lines[0].split(',').map(h => h.replace(/['"]/g, '').trim())
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/['"]/g, '').trim())
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return row
  })
  
  return rows
}

const handleImport = async () => {
  if (!fileList.value.length) {
    ElMessage.error('Bitte wählen Sie eine Datei aus')
    return
  }

  uploadLoading.value = true
  
  try {
    const file = fileList.value[0].raw || fileList.value[0]
    const text = await readFileAsText(file)
    const importData = parseCSV(text)

    const { currentUser, currentRestaurant } = getUserAndRestaurantData()

    const validSales = []
    const errors = []

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i]
      const rowNumber = i + 2
      
      try {
        const product = availableProducts.value.find(p => 
          p.name.toLowerCase() === row.Produkt?.toLowerCase()
        )
        
        if (!product) {
          errors.push(`Zeile ${rowNumber}: Produkt "${row.Produkt}" nicht gefunden`)
          continue
        }

        const quantity = parseFloat(row.Menge)
        if (isNaN(quantity) || quantity <= 0) {
          errors.push(`Zeile ${rowNumber}: Ungültige Menge "${row.Menge}"`)
          continue
        }

        const saleData = {
          productId: product.id,
          quantity: quantity,
          notes: row.Notizen || null,
          restaurantId: currentRestaurant?.id,
          userId: currentUser?.id,
          unitPrice: product.price
        }

        validSales.push(saleData)
        
      } catch (error) {
        errors.push(`Zeile ${rowNumber}: ${error.message}`)
      }
    }

    if (errors.length > 0) {
      console.warn('Import-Fehler:', errors)
      ElMessage.warning(`${errors.length} Zeilen konnten nicht importiert werden. Siehe Konsole.`)
    }

    if (validSales.length === 0) {
      ElMessage.error('Keine gültigen Verkäufe zum Importieren gefunden')
      return
    }

    await ElMessageBox.confirm(
      `${validSales.length} Verkäufe importieren?${errors.length > 0 ? ` (${errors.length} Fehler)` : ''}`,
      'Import bestätigen',
      { type: 'info' }
    )

    let successCount = 0
    for (const saleData of validSales) {
      try {
        await store.dispatch('sales/createSale', saleData)
        successCount++
      } catch (error) {
        console.error('Fehler beim Erstellen des Verkaufs:', error)
      }
    }

    ElMessage.success(`✅ ${successCount} Verkäufe erfolgreich importiert`)
    
    showUploadDialog.value = false
    fileList.value = []
    await handleSearch()

  } catch (error) {
    console.error('Import-Fehler:', error)
    ElMessage.error(`Import-Fehler: ${error.message}`)
  } finally {
    uploadLoading.value = false
  }
}

const downloadTemplate = () => {
  const templateHeaders = ['Produkt', 'Menge', 'Notizen']
  const templateData = [
    ['KurbiskernsuppeI', '2', 'Beispiel-Verkauf'],
    ['Produkt Name 2', '1', '']
  ]
  
  const csvContent = [
    templateHeaders.join(','),
    ...templateData.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'verkaufe_template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('📥 CSV-Vorlage heruntergeladen')
}

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.readAsText(file, 'UTF-8')
  })
}

// 🔹 Hilfsfunktionen
const handleSelectionChange = val => (selectedSales.value = val)

const getProductName = id => {
  const product = availableProducts.value.find(p => p.id === id)
  return product?.name || 'Unbekannt'
}

const formatDate = date => (date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '')

const getStatusLabel = s => ({ 
  completed: 'Abgeschlossen', 
  pending: 'Ausstehend', 
  cancelled: 'Storniert' 
}[s] || 'Unbekannt')

const getStatusType = s => ({ 
  completed: 'success', 
  pending: 'warning', 
  cancelled: 'danger' 
}[s] || 'info')

// ===== LIFECYCLE =====
onMounted(async () => {
  await store.dispatch('products/fetchProducts', { limit: 100 })
  await handleSearch()
})
</script>

<style scoped>
.sales-list { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-buttons { display: flex; gap: 10px; }
.total-price { font-weight: bold; color: #67c23a; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.filter-card { margin-bottom: 20px; }
.upload-section { text-align: center; }
</style>