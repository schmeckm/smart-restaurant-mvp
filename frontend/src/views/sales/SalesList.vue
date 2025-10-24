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

    <!-- Filters -->
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
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            Suchen
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Sales Table -->
    <el-card>
      <el-table 
        :data="sales" 
        v-loading="loading" 
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="Produkt" min-width="150">
          <template #default="{ row }">
            {{ getProductName(row.product_id) }}
          </template>
        </el-table-column>

        <el-table-column label="Datum" width="180">
          <template #default="{ row }">
            {{ formatDate(row.sale_date) }}
          </template>
        </el-table-column>

        <el-table-column label="Menge" width="100" align="center">
          <template #default="{ row }">
            {{ row.quantity }}
          </template>
        </el-table-column>

        <el-table-column label="Einzelpreis" width="120" align="right">
          <template #default="{ row }">
            €{{ Number(row.unit_price).toFixed(2) }}
          </template>
        </el-table-column>

        <el-table-column label="Gesamt" width="120" align="right">
          <template #default="{ row }">
            <span class="total-price">€{{ Number(row.total_price).toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Zahlung" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getPaymentLabel(row.payment_method) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Aktionen-Spalte -->
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

    <!-- Create Sale Dialog -->
    <el-dialog v-model="showCreateDialog" title="Neuer Verkauf" width="500px">
      <el-form :model="saleForm" label-width="120px">
        <el-form-item label="Produkt">
          <el-select v-model="saleForm.product_id" placeholder="Produkt wählen" filterable>
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

        <el-form-item label="Zahlungsart">
          <el-select v-model="saleForm.payment_method">
            <el-option label="Bar" value="cash" />
            <el-option label="Karte" value="card" />
            <el-option label="Online" value="online" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">Abbrechen</el-button>
        <el-button type="primary" @click="handleCreateSale">Verkauf erfassen</el-button>
      </template>
    </el-dialog>

    <!-- Edit Sale Dialog -->
    <el-dialog v-model="showEditDialog" title="Verkauf bearbeiten" width="500px">
      <el-form :model="saleForm" label-width="120px">
        <el-form-item label="Produkt">
          <el-select v-model="saleForm.product_id" placeholder="Produkt wählen" filterable>
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

        <el-form-item label="Zahlungsart">
          <el-select v-model="saleForm.payment_method">
            <el-option label="Bar" value="cash" />
            <el-option label="Karte" value="card" />
            <el-option label="Online" value="online" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">Abbrechen</el-button>
        <el-button type="primary" @click="handleSaveEdit">Speichern</el-button>
      </template>
    </el-dialog>

    <!-- Upload Dialog -->
    <el-dialog v-model="showUploadDialog" title="Verkäufe importieren" width="600px">
      <el-alert 
        title="CSV-Format" 
        type="info" 
        :closable="false"
        style="margin-bottom: 20px"
      >
        <p>Die CSV-Datei sollte folgende Spalten enthalten:</p>
        <ul>
          <li><strong>product_name</strong> oder <strong>product_id</strong>: Produktname oder ID</li>
          <li><strong>quantity</strong>: Verkaufte Menge</li>
          <li><strong>sale_date</strong>: Datum (Format: YYYY-MM-DD HH:mm:ss oder DD.MM.YYYY)</li>
          <li><strong>payment_method</strong>: cash, card oder online (optional, Standard: cash)</li>
          <li><strong>unit_price</strong>: Einzelpreis (optional, wird aus Produkt übernommen)</li>
        </ul>
      </el-alert>

      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        accept=".csv"
        drag
        :limit="1"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          CSV-Datei hier ablegen oder <em>klicken zum Auswählen</em>
        </div>
      </el-upload>

      <div v-if="uploadPreview.length > 0" style="margin-top: 20px">
        <h4>Vorschau (erste 5 Einträge):</h4>
        <el-table :data="uploadPreview" size="small" max-height="300">
          <el-table-column prop="product_name" label="Produkt" />
          <el-table-column prop="quantity" label="Menge" width="80" />
          <el-table-column prop="sale_date" label="Datum" width="150" />
          <el-table-column prop="payment_method" label="Zahlung" width="100" />
          <el-table-column label="Status" width="100">
            <template #default="{ row }">
              <el-tag :type="row.valid ? 'success' : 'danger'" size="small">
                {{ row.valid ? 'OK' : 'Fehler' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <p style="margin-top: 10px">
          <strong>{{ validRecords }}</strong> von {{ uploadPreview.length }} Einträgen gültig
        </p>
      </div>

      <template #footer>
        <el-button @click="handleCancelUpload">Abbrechen</el-button>
        <el-button 
          type="primary" 
          @click="handleUploadSales"
          :disabled="uploadPreview.length === 0 || validRecords === 0"
          :loading="uploading"
        >
          {{ validRecords }} Verkäufe importieren
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete, Upload, Download } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

export default {
  name: 'SalesList',
  components: {
    Plus,
    Search,
    Edit,
    Delete,
    Upload,
    Download
  },
  setup() {
    const store = useStore()

    const sales = computed(() => store.getters['sales/sales'])
    const loading = computed(() => store.getters['sales/loading'])
    const pagination = computed(() => store.getters['sales/pagination'])
    const availableProducts = computed(() =>
      store.getters['products/products'].filter(p => p.is_available)
    )

    const showCreateDialog = ref(false)
    const showEditDialog = ref(false)
    const showUploadDialog = ref(false)
    const editingSale = ref(null)
    const fileList = ref([])
    const uploadPreview = ref([])
    const uploading = ref(false)
    const selectedSales = ref([])
    
    const dateRange = ref([
      dayjs().subtract(7, 'day').toDate(),
      dayjs().toDate()
    ])
    const filters = reactive({
      status: ''
    })

    const saleForm = reactive({
      product_id: '',
      quantity: 1,
      payment_method: 'cash'
    })

    const formatDate = (date) => {
      return dayjs(date).format('DD.MM.YYYY HH:mm')
    }

    const getStatusType = (status) => {
      const types = {
        completed: 'success',
        pending: 'warning',
        cancelled: 'danger'
      }
      return types[status] || 'info'
    }

    const getStatusLabel = (status) => {
      const labels = {
        completed: 'Abgeschlossen',
        pending: 'Ausstehend',
        cancelled: 'Storniert'
      }
      return labels[status] || status
    }

    const getPaymentLabel = (method) => {
      const labels = {
        cash: 'Bar',
        card: 'Karte',
        online: 'Online'
      }
      return labels[method] || method
    }

    const getProductName = (productId) => {
      const product = availableProducts.value.find(p => p.id === productId)
      return product ? product.name : 'Unbekanntes Produkt'
    }

    const validRecords = computed(() => {
      return uploadPreview.value.filter(r => r.valid).length
    })

    const parseCSV = (text) => {
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) return []

      const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase())
      const records = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/[,;]/).map(v => v.trim())
        const record = {}
        
        headers.forEach((header, index) => {
          record[header] = values[index] || ''
        })
        
        records.push(record)
      }

      return records
    }

    const validateAndMapRecord = (record) => {
      const mapped = {
        valid: true,
        errors: []
      }

      // Produkt-Zuordnung
      if (record.product_id) {
        mapped.product_id = parseInt(record.product_id)
        const product = availableProducts.value.find(p => p.id === mapped.product_id)
        if (!product) {
          mapped.valid = false
          mapped.errors.push('Produkt-ID nicht gefunden')
        }
        mapped.product_name = product?.name || 'Unbekannt'
      } else if (record.product_name || record.produkt) {
        const name = (record.product_name || record.produkt).toLowerCase()
        const product = availableProducts.value.find(p => 
          p.name.toLowerCase().includes(name) || name.includes(p.name.toLowerCase())
        )
        if (product) {
          mapped.product_id = product.id
          mapped.product_name = product.name
        } else {
          mapped.valid = false
          mapped.errors.push('Produkt nicht gefunden')
          mapped.product_name = record.product_name || record.produkt
        }
      } else {
        mapped.valid = false
        mapped.errors.push('Produkt fehlt')
      }

      // Menge
      mapped.quantity = parseInt(record.quantity || record.menge) || 1
      if (mapped.quantity < 1) {
        mapped.valid = false
        mapped.errors.push('Ungültige Menge')
      }

      // Datum
      if (record.sale_date || record.datum) {
        const dateStr = record.sale_date || record.datum
        // Versuche verschiedene Formate
        let date = dayjs(dateStr, ['YYYY-MM-DD HH:mm:ss', 'DD.MM.YYYY HH:mm', 'YYYY-MM-DD', 'DD.MM.YYYY'])
        if (date.isValid()) {
          mapped.sale_date = date.format('DD.MM.YYYY HH:mm')
        } else {
          mapped.valid = false
          mapped.errors.push('Ungültiges Datum')
          mapped.sale_date = dateStr
        }
      } else {
        mapped.sale_date = dayjs().format('DD.MM.YYYY HH:mm')
      }

      // Zahlungsart
      const paymentMap = {
        'cash': 'cash',
        'bar': 'cash',
        'bargeld': 'cash',
        'card': 'card',
        'karte': 'card',
        'ec': 'card',
        'online': 'online',
        'paypal': 'online'
      }
      const payment = (record.payment_method || record.zahlungsart || 'cash').toLowerCase()
      mapped.payment_method = paymentMap[payment] || 'cash'

      // Preis (optional)
      if (record.unit_price || record.preis) {
        mapped.unit_price = parseFloat(record.unit_price || record.preis)
      }

      return mapped
    }

    const handleFileChange = (file) => {
      fileList.value = [file]
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const records = parseCSV(text)
          uploadPreview.value = records.slice(0, 100).map(validateAndMapRecord)
        } catch (error) {
          ElMessage.error('Fehler beim Lesen der Datei')
          console.error(error)
        }
      }
      
      reader.readAsText(file.raw)
    }

    const handleUploadSales = async () => {
      const validSales = uploadPreview.value.filter(r => r.valid)
      
      if (validSales.length === 0) {
        ElMessage.warning('Keine gültigen Einträge zum Importieren')
        return
      }

      uploading.value = true
      
      try {
        let successCount = 0
        let errorCount = 0

        // Verkäufe einzeln erstellen
        for (const sale of validSales) {
          try {
            await store.dispatch('sales/createSale', {
              product_id: sale.product_id,
              quantity: sale.quantity,
              payment_method: sale.payment_method,
              unit_price: sale.unit_price
            })
            successCount++
          } catch (error) {
            errorCount++
            console.error('Fehler bei Sale:', sale, error)
          }
        }

        if (successCount > 0) {
          ElMessage.success(`${successCount} Verkäufe erfolgreich importiert${errorCount > 0 ? `, ${errorCount} fehlgeschlagen` : ''}`)
        } else {
          ElMessage.error('Alle Importe fehlgeschlagen')
        }

        showUploadDialog.value = false
        handleCancelUpload()
        handleSearch()
      } catch (error) {
        ElMessage.error('Fehler beim Importieren der Verkäufe')
        console.error(error)
      } finally {
        uploading.value = false
      }
    }

    const handleCancelUpload = () => {
      showUploadDialog.value = false
      fileList.value = []
      uploadPreview.value = []
    }

    const handleExportSales = async () => {
      try {
        // Verwende die aktuell geladenen Verkäufe
        const exportSales = sales.value

        if (!exportSales || exportSales.length === 0) {
          ElMessage.warning('Keine Verkäufe zum Exportieren vorhanden')
          return
        }

        // CSV erstellen
        const headers = [
          'ID',
          'Produkt-ID',
          'Produkt',
          'Menge',
          'Einzelpreis',
          'Gesamtpreis',
          'Datum',
          'Zahlungsart',
          'Status'
        ]

        const csvRows = [headers.join(';')]

        exportSales.forEach(sale => {
          const row = [
            sale.id,
            sale.product_id,
            getProductName(sale.product_id).replace(/;/g, ','), // Semikolons entfernen
            sale.quantity,
            Number(sale.unit_price).toFixed(2),
            Number(sale.total_price).toFixed(2),
            dayjs(sale.sale_date).format('DD.MM.YYYY HH:mm:ss'),
            getPaymentLabel(sale.payment_method),
            getStatusLabel(sale.status)
          ]
          csvRows.push(row.join(';'))
        })

        const csvContent = csvRows.join('\n')
        
        // BOM für Excel UTF-8 Unterstützung
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        
        // Download triggern
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        const filename = `verkaeufe_${dayjs().format('YYYY-MM-DD_HH-mm')}.csv`
        
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        ElMessage.success(`${exportSales.length} Verkäufe exportiert`)
      } catch (error) {
        ElMessage.error('Fehler beim Exportieren')
        console.error(error)
      }
    }

    const handleSearch = () => {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.limit
      }

      if (dateRange.value && dateRange.value.length === 2) {
        params.startDate = dayjs(dateRange.value[0]).startOf('day').format('YYYY-MM-DD')
        params.endDate = dayjs(dateRange.value[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss')
      }

      if (filters.status) {
        params.status = filters.status
      }

      store.dispatch('sales/fetchSales', params)
    }

    const handleCreateSale = async () => {
      try {
        await store.dispatch('sales/createSale', saleForm)
        ElMessage.success('Verkauf erfasst')
        showCreateDialog.value = false
        
        // Reset Form
        saleForm.product_id = ''
        saleForm.quantity = 1
        saleForm.payment_method = 'cash'
        
        // Datumsfilter zurücksetzen um neuen Sale zu sehen
        dateRange.value = [
          dayjs().subtract(7, 'day').toDate(),
          dayjs().endOf('day').toDate()
        ]
        handleSearch()
      } catch (error) {
        ElMessage.error('Fehler beim Erfassen')
      }
    }

    const handleEdit = (sale) => {
      editingSale.value = sale
      Object.assign(saleForm, {
        product_id: sale.product_id,
        quantity: sale.quantity,
        payment_method: sale.payment_method
      })
      showEditDialog.value = true
    }

    const handleSaveEdit = async () => {
      try {
        await store.dispatch('sales/updateSale', {
          id: editingSale.value.id,
          data: saleForm
        })
        ElMessage.success('Verkauf aktualisiert')
        showEditDialog.value = false
        editingSale.value = null
        
        // Reset Form
        saleForm.product_id = ''
        saleForm.quantity = 1
        saleForm.payment_method = 'cash'
      } catch (error) {
        ElMessage.error('Fehler beim Aktualisieren')
      }
    }

    const handleDelete = async (sale) => {
      try {
        await ElMessageBox.confirm(
          `Verkauf von ${getProductName(sale.product_id)} wirklich löschen?`,
          'Löschen',
          {
            confirmButtonText: 'Löschen',
            cancelButtonText: 'Abbrechen',
            type: 'warning'
          }
        )
        await store.dispatch('sales/deleteSale', sale.id)
        ElMessage.success('Verkauf gelöscht')
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('Fehler beim Löschen')
        }
      }
    }

    const handleSelectionChange = (selection) => {
      selectedSales.value = selection
    }

    const handleBulkDelete = async () => {
      if (selectedSales.value.length === 0) {
        ElMessage.warning('Bitte wählen Sie Verkäufe aus')
        return
      }

      try {
        await ElMessageBox.confirm(
          `${selectedSales.value.length} Verkäufe wirklich löschen?`,
          'Mehrere löschen',
          {
            confirmButtonText: 'Alle löschen',
            cancelButtonText: 'Abbrechen',
            type: 'warning'
          }
        )

        let successCount = 0
        let errorCount = 0

        for (const sale of selectedSales.value) {
          try {
            await store.dispatch('sales/deleteSale', sale.id)
            successCount++
          } catch (error) {
            errorCount++
            console.error('Fehler beim Löschen:', sale.id, error)
          }
        }

        if (successCount > 0) {
          ElMessage.success(`${successCount} Verkäufe gelöscht${errorCount > 0 ? `, ${errorCount} fehlgeschlagen` : ''}`)
        } else {
          ElMessage.error('Alle Löschvorgänge fehlgeschlagen')
        }

        selectedSales.value = []
        handleSearch()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('Fehler beim Löschen')
        }
      }
    }

    onMounted(() => {
      store.dispatch('products/fetchProducts', { limit: 100 })
      handleSearch()
    })

    return {
      sales,
      loading,
      pagination,
      availableProducts,
      showCreateDialog,
      showEditDialog,
      showUploadDialog,
      editingSale,
      dateRange,
      filters,
      saleForm,
      fileList,
      uploadPreview,
      uploading,
      validRecords,
      selectedSales,
      formatDate,
      getStatusType,
      getStatusLabel,
      getPaymentLabel,
      getProductName,
      handleSearch,
      handleCreateSale,
      handleEdit,
      handleSaveEdit,
      handleDelete,
      handleSelectionChange,
      handleBulkDelete,
      handleFileChange,
      handleUploadSales,
      handleCancelUpload,
      handleExportSales
    }
  }
}
</script>

<style scoped>
.sales-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.total-price {
  font-weight: bold;
  color: #67c23a;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>