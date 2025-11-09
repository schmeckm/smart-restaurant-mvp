<template>
  <div class="forecasting-board">
    <!-- Header Controls -->
    <div class="board-header">
      <div class="header-left">
        <h2>Forecasting Board</h2>
        
        <!-- Version Selector -->
        <div class="version-selector">
          <el-select 
            v-model="selectedVersionId" 
            @change="loadVersion"
            placeholder="Version wählen"
            style="width: 300px;"
            v-if="versions && versions.length > 0"
          >
            <el-option
              v-for="version in versions"
              :key="version.id"
              :label="version.name"
              :value="version.id"
            >
              <span>{{ version.name }}</span>
              <el-tag 
                v-if="version.isBaseline" 
                type="success" 
                size="small" 
                style="margin-left: 10px;"
              >
                Aktiv
              </el-tag>
              <el-tag 
                v-else-if="version.status === 'draft'" 
                type="info" 
                size="small"
                style="margin-left: 10px;"
              >
                Entwurf
              </el-tag>
            </el-option>
          </el-select>
          
          <span v-else style="color: #909399; font-size: 14px;">
            Keine Versionen vorhanden
          </span>
          
          <el-button @click="showNewVersionDialog = true" type="primary" plain size="small">
            + Neue Version
          </el-button>
          
          <el-dropdown v-if="currentVersion" @command="handleVersionAction">
            <el-button size="small">
              Aktionen ▼
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="clone">📋 Duplizieren</el-dropdown-item>
                <el-dropdown-item command="rename">✏️ Umbenennen</el-dropdown-item>
                <el-dropdown-item command="setBaseline" :disabled="currentVersion.isBaseline">
                  ⭐ Als Aktiv setzen
                </el-dropdown-item>
                <el-dropdown-item command="delete" :disabled="currentVersion.isBaseline" divided>
                  🗑️ Löschen
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="controls">
        <select v-model="timeUnit" @change="generateTimeColumns" class="time-unit-select">
          <option value="weeks">Wochen</option>
          <option value="months">Monate</option>
          <option value="quarters">Quartale</option>
        </select>
        <input 
          type="number" 
          v-model="columnCount" 
          @change="generateTimeColumns"
          min="4" 
          max="12" 
          class="column-count-input"
          placeholder="Anzahl Perioden"
        >
        <button @click="showImportDialog = true" class="import-btn">
          📥 Importieren
        </button>
        <button @click="showUploadDialog = true" class="ai-upload-btn">
          🤖 KI/CSV Upload
        </button>
        <button @click="exportForecast" class="export-btn">
          📤 Exportieren
        </button>
        <button @click="clearAllForecasts" class="clear-btn">
          🗑️ Alles löschen
        </button>
        <button @click="calculateIngredientNeeds" class="calculate-btn">
          Zutaten berechnen
        </button>
        <button @click="generateShoppingList" class="shopping-btn" :disabled="!showIngredients">
          🛒 Einkaufsliste
        </button>
        <button @click="saveCurrentVersion" class="save-btn" :disabled="!currentVersion || !hasChanges">
          💾 Speichern
        </button>
      </div>
    </div>

    <!-- New Version Dialog -->
    <el-dialog v-model="showNewVersionDialog" title="Neue Forecast-Version erstellen" width="500px">
      <el-form :model="newVersionForm" label-width="120px">
        <el-form-item label="Name">
          <el-input v-model="newVersionForm.name" placeholder="z.B. Sommer 2025 - Optimistisch" />
        </el-form-item>
        <el-form-item label="Beschreibung">
          <el-input 
            v-model="newVersionForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="Optional: Beschreibung der Version"
          />
        </el-form-item>
        <el-form-item label="Als Aktiv">
          <el-checkbox v-model="newVersionForm.isBaseline">
            Diese Version als aktive Planung setzen
          </el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewVersionDialog = false">Abbrechen</el-button>
        <el-button type="primary" @click="createNewVersion">Erstellen</el-button>
      </template>
    </el-dialog>

    <!-- Rename Dialog -->
    <el-dialog v-model="showRenameDialog" title="Version umbenennen" width="400px">
      <el-input v-model="renameForm.name" placeholder="Neuer Name" />
      <template #footer>
        <el-button @click="showRenameDialog = false">Abbrechen</el-button>
        <el-button type="primary" @click="renameVersion">Speichern</el-button>
      </template>
    </el-dialog>

    <!-- Import Dialog -->
    <el-dialog v-model="showImportDialog" title="Forecast importieren" width="600px">
      <el-alert 
        title="CSV-Format" 
        type="info" 
        :closable="false"
        style="margin-bottom: 20px"
      >
        <p>Die CSV-Datei sollte folgende Spalten enthalten:</p>
        <ul>
          <li><strong>product_name</strong> oder <strong>product_id</strong>: Produktname oder ID</li>
          <li><strong>period_0, period_1, period_2, ...</strong>: Mengen für jede Periode</li>
        </ul>
        <p style="margin-top: 10px;">Oder verwende die Spalten des aktuellen Zeitraums (z.B. KW 43, KW 44, ...)</p>
      </el-alert>

      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleImportFile"
        :file-list="importFileList"
        accept=".csv"
        drag
        :limit="1"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          CSV-Datei hier ablegen oder <em>klicken zum Auswählen</em>
        </div>
      </el-upload>

      <div v-if="importPreview.length > 0" style="margin-top: 20px">
        <h4>Vorschau (erste 5 Zeilen):</h4>
        <el-table :data="importPreview" size="small" max-height="300">
          <el-table-column prop="product_name" label="Produkt" />
          <el-table-column prop="total" label="Gesamt" width="100" />
          <el-table-column label="Status" width="100">
            <template #default="{ row }">
              <el-tag :type="row.valid ? 'success' : 'danger'" size="small">
                {{ row.valid ? 'OK' : 'Fehler' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <p style="margin-top: 10px">
          <strong>{{ validImports }}</strong> von {{ importPreview.length }} Einträgen gültig
        </p>
      </div>

      <template #footer>
        <el-button @click="handleCancelImport">Abbrechen</el-button>
        <el-button 
          type="primary" 
          @click="handleImportForecast"
          :disabled="importPreview.length === 0 || validImports === 0"
          :loading="importing"
        >
          {{ validImports }} Forecasts importieren
        </el-button>
      </template>
    </el-dialog>

    <!-- AI/CSV Upload Dialog -->
    <el-dialog v-model="showUploadDialog" title="Forecast Upload (AI / CSV)" width="600px">
      <el-alert
        title="Forecast Upload"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <p>Hier kannst du Forecast-Daten pro Produkt hochladen (z. B. aus einer KI oder CSV-Datei).</p>
        <ul>
          <li><strong>product_id</strong> oder <strong>product_name</strong></li>
          <li><strong>KW 45, KW 46, KW 47, ...</strong></li>
        </ul>
      </el-alert>

      <el-upload
        ref="uploadAIRef"
        :auto-upload="false"
        :on-change="handleAIUploadFile"
        :file-list="uploadFileList"
        accept=".csv"
        drag
        :limit="1"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          CSV-Datei hier ablegen oder <em>klicken zum Auswählen</em>
        </div>
      </el-upload>

      <div v-if="uploadPreview.length > 0" style="margin-top: 20px">
        <h4>Vorschau (erste 5 Zeilen):</h4>
        <el-table :data="uploadPreview.slice(0, 5)" size="small" max-height="250">
          <el-table-column prop="product_name" label="Produkt" />
          <el-table-column prop="total" label="Gesamt" width="100" />
          <el-table-column label="Status" width="100">
            <template #default="{ row }">
              <el-tag :type="row.valid ? 'success' : 'danger'" size="small">
                {{ row.valid ? 'OK' : 'Fehler' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="handleCancelUpload">Abbrechen</el-button>
        <el-button
          type="primary"
          @click="uploadForecastToServer"
          :loading="uploading"
          :disabled="uploadPreview.length === 0"
        >
          📤 Hochladen
        </el-button>
      </template>
    </el-dialog>

    <!-- Forecasting Grid -->
    <div class="grid-container">
      <table class="forecast-table">
        <thead>
          <tr>
            <th class="product-header">Produkt</th>
            <th v-for="column in timeColumns" :key="column.id" class="time-header">
              {{ column.label }}
            </th>
            <th class="total-header">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id" class="product-row">
            <td class="product-cell">
              <div class="product-info">
                <span class="product-name">{{ product.name }}</span>
                <span class="product-category">{{ getProductCategory(product) }}</span>
              </div>
            </td>
            <td v-for="column in timeColumns" :key="`${product.id}-${column.id}`" class="forecast-cell">
              <input 
                type="number" 
                :value="getForecastValue(product.id, column.id)"
                @input="updateForecast(product.id, column.id, $event.target.value)"
                @blur="calculateRowTotal(product.id)"
                class="forecast-input"
                min="0"
                step="1"
                placeholder="0"
              >
            </td>
            <td class="total-cell">
              <span class="total-value">{{ getRowTotal(product.id) }}</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="totals-row">
            <td class="total-label">Gesamt</td>
            <td v-for="column in timeColumns" :key="`total-${column.id}`" class="column-total">
              {{ getColumnTotal(column.id) }}
            </td>
            <td class="grand-total">
              {{ grandTotal }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Ingredient Requirements Panel -->
    <div v-if="showIngredients" class="ingredients-panel">
      <h3>Zutaten-Bedarf</h3>
      <div class="ingredients-grid">
        <div v-for="ingredient in ingredientNeeds" :key="ingredient.id" class="ingredient-card">
          <h4>{{ ingredient.name }}</h4>
          <div class="requirement-details">
            <span class="quantity">{{ ingredient.totalRequired }} {{ ingredient.unit }}</span>
            <span class="cost">≈ {{ ingredient.estimatedCost }}€</span>
          </div>
          <div class="stock-info">
            <span class="current-stock">Lager: {{ ingredient.currentStock }} {{ ingredient.unit }}</span>
            <span class="shortage" v-if="ingredient.shortage > 0">
              Fehlmenge: {{ ingredient.shortage }} {{ ingredient.unit }}
            </span>
          </div>
        </div>
      </div>
      <div class="total-cost">
        <strong>Geschätzte Gesamtkosten: {{ totalIngredientCost }}€</strong>
      </div>
    </div>

    <!-- Shopping List Panel -->
    <div v-if="showShoppingList" class="shopping-list-panel">
      <div class="panel-header">
        <h3>🛒 Einkaufsliste</h3>
        <div class="actions">
          <button @click="exportShoppingListCSV" class="action-btn csv-btn">
            📊 CSV Export
          </button>
          <button @click="printShoppingList" class="action-btn print-btn">
            🖨️ Drucken
          </button>
          <button @click="emailShoppingList" class="action-btn email-btn">
            📧 E-Mail
          </button>
        </div>
      </div>

      <div v-if="shoppingList.length === 0" class="empty-state">
        <p>✅ Alle Zutaten sind ausreichend vorhanden!</p>
        <p class="sub-text">Keine Bestellungen erforderlich.</p>
      </div>

      <div v-else class="shopping-items">
        <div v-for="item in shoppingList" :key="item.id" class="shopping-item">
          <div class="item-header">
            <h4>{{ item.name }}</h4>
            <span class="item-cost">{{ item.orderCost }}€</span>
          </div>
          
          <div class="item-details">
            <div class="detail-row">
              <span class="label">Zu bestellen:</span>
              <span class="value highlight">{{ item.orderQuantity }} {{ item.unit }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Benötigt:</span>
              <span class="value">{{ item.required }} {{ item.unit }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Aktueller Bestand:</span>
              <span class="value">{{ item.currentStock }} {{ item.unit }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Fehlmenge:</span>
              <span class="value shortage-val">{{ item.shortage }} {{ item.unit }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Lieferant:</span>
              <span class="value">{{ item.supplier }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Preis/Einheit:</span>
              <span class="value">{{ item.costPerUnit }}€</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="shoppingList.length > 0" class="shopping-summary">
        <div class="summary-row">
          <span class="summary-label">Anzahl Positionen:</span>
          <span class="summary-value">{{ shoppingList.length }}</span>
        </div>
        <div class="summary-row total">
          <span class="summary-label">Gesamtkosten:</span>
          <span class="summary-value">{{ totalShoppingCost }}€</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { UploadFilled } from '@element-plus/icons-vue'

export default {
  name: 'ForecastingBoard',
  components: {
    UploadFilled
  },
  data() {
    return {
      timeUnit: 'weeks',
      columnCount: 8,
      timeColumns: [],
      products: [],
      forecasts: {},
      rowTotals: {},
      showIngredients: false,
      ingredientNeeds: [],
      totalIngredientCost: 0,
      showShoppingList: false,
      shoppingList: [],
      totalShoppingCost: 0,
      loading: false,
      
      // Import/Export
      showImportDialog: false,
      importFileList: [],
      importPreview: [],
      importing: false,
      showUploadDialog: false,
      uploadFileList: [],
      uploadPreview: [],
      uploading: false,
      
      // Version management
      selectedVersionId: null,
      currentVersion: null,
      hasChanges: false,
      showNewVersionDialog: false,
      showRenameDialog: false,
      newVersionForm: {
        name: '',
        description: '',
        isBaseline: false
      },
      renameForm: {
        name: ''
      }
    }
  },
  computed: {
    versions() {
      const v = this.$store.getters['forecasts/versions']
      return Array.isArray(v) ? v : []
    },
    grandTotal() {
      return Object.values(this.rowTotals).reduce((sum, total) => sum + (total || 0), 0)
    },
    validImports() {
      return this.importPreview.filter(r => r.valid).length
    }
  },
  mounted() {
    this.loadProducts()
    this.loadVersions()
    this.generateTimeColumns()
  },
  methods: {
    // 🔥 CORRECTED: Category display helper
    getProductCategory(product) {
      if (product.category && typeof product.category === 'object') {
        return product.category.name || ''
      }
      return product.category || product.categoryName || ''
    },

    // Version Management
    async loadVersions() {
      try {
        console.log('🔍 Loading versions...')
        await this.$store.dispatch('forecasts/fetchVersions')
        console.log('✅ Versions loaded:', this.versions)
        
        if (!this.versions || !Array.isArray(this.versions)) {
          console.warn('⚠️ Versions is not an array:', this.versions)
          return
        }
        
        const baseline = this.versions.find(v => v && v.isBaseline)
        if (baseline) {
          this.selectedVersionId = baseline.id
          await this.loadVersion(baseline.id)
        } else if (this.versions.length > 0) {
          this.selectedVersionId = this.versions[0].id
          await this.loadVersion(this.versions[0].id)
        }
      } catch (error) {
        console.error('❌ Error loading versions:', error)
        this.$message.error('Fehler beim Laden der Versionen: ' + error.message)
      }
    },

    async loadVersion(versionId) {
      if (!versionId) return
      
      try {
        this.loading = true
        const version = await this.$store.dispatch('forecasts/fetchVersion', versionId)
        
        if (!version) {
          throw new Error('Version not found')
        }
        
        this.currentVersion = version
        this.timeUnit = version.timeUnit || 'weeks'
        this.columnCount = version.periodCount || 8
        this.generateTimeColumns()
        this.loadForecastData(version.items || [])
        this.hasChanges = false
        
        this.$message.success(`Version "${version.name}" geladen`)
      } catch (error) {
        console.error('❌ Error loading version:', error)
        this.$message.error('Fehler beim Laden der Version')
      } finally {
        this.loading = false
      }
    },

    loadForecastData(items) {
      this.initializeForecasts()
      
      items.forEach(item => {
        const columnId = `${this.timeUnit}_${item.periodIndex}`
        if (this.forecasts[item.productId]) {
          this.forecasts[item.productId][columnId] = item.quantity
        }
      })
      
      this.products.forEach(product => {
        this.calculateRowTotal(product.id)
      })
    },

    async createNewVersion() {
      if (!this.newVersionForm.name) {
        this.$message.warning('Bitte gib einen Namen ein')
        return
      }

      try {
        this.loading = true
        
        const versionData = {
          name: this.newVersionForm.name,
          description: this.newVersionForm.description,
          timeUnit: this.timeUnit,
          periodCount: this.columnCount,
          startDate: new Date().toISOString(),
          isBaseline: this.newVersionForm.isBaseline,
          items: []
        }

        const newVersion = await this.$store.dispatch('forecasts/createVersion', versionData)
        
        this.showNewVersionDialog = false
        this.newVersionForm = { name: '', description: '', isBaseline: false }
        
        this.selectedVersionId = newVersion.id
        await this.loadVersion(newVersion.id)
        
        this.$message.success('Version erfolgreich erstellt')
      } catch (error) {
        console.error('Error creating version:', error)
        this.$message.error('Fehler beim Erstellen der Version')
      } finally {
        this.loading = false
      }
    },

    async handleVersionAction(command) {
      switch (command) {
        case 'clone':
          await this.cloneVersion()
          break
        case 'rename':
          this.showRenameDialog = true
          this.renameForm.name = this.currentVersion.name
          break
        case 'setBaseline':
          await this.setAsBaseline()
          break
        case 'delete':
          await this.deleteVersion()
          break
      }
    },

    async cloneVersion() {
      try {
        const { value: name } = await this.$prompt('Name für die Kopie:', 'Version duplizieren', {
          confirmButtonText: 'Duplizieren',
          cancelButtonText: 'Abbrechen',
          inputValue: `${this.currentVersion.name} (Kopie)`,
          inputPattern: /.+/,
          inputErrorMessage: 'Bitte gib einen Namen ein'
        })

        this.loading = true
        const clonedVersion = await this.$store.dispatch('forecasts/cloneVersion', {
          id: this.currentVersion.id,
          name
        })

        this.selectedVersionId = clonedVersion.id
        await this.loadVersion(clonedVersion.id)

        this.$message.success('Version erfolgreich dupliziert')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error cloning version:', error)
          this.$message.error('Fehler beim Duplizieren')
        }
      } finally {
        this.loading = false
      }
    },

    async renameVersion() {
      if (!this.renameForm.name) {
        this.$message.warning('Bitte gib einen Namen ein')
        return
      }

      try {
        this.loading = true
        await this.$store.dispatch('forecasts/updateVersion', {
          id: this.currentVersion.id,
          data: { name: this.renameForm.name }
        })

        this.showRenameDialog = false
        this.$message.success('Version umbenannt')
      } catch (error) {
        console.error('Error renaming version:', error)
        this.$message.error('Fehler beim Umbenennen')
      } finally {
        this.loading = false
      }
    },

    async setAsBaseline() {
      try {
        await this.$confirm(
          `"${this.currentVersion.name}" als aktive Planung setzen?`,
          'Bestätigung',
          {
            confirmButtonText: 'Ja',
            cancelButtonText: 'Abbrechen',
            type: 'warning'
          }
        )

        this.loading = true
        await this.$store.dispatch('forecasts/updateVersion', {
          id: this.currentVersion.id,
          data: { isBaseline: true }
        })

        await this.loadVersions()
        this.$message.success('Version als Aktiv gesetzt')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error setting baseline:', error)
          this.$message.error('Fehler beim Setzen')
        }
      } finally {
        this.loading = false
      }
    },

    async deleteVersion() {
      try {
        await this.$confirm(
          `Version "${this.currentVersion.name}" wirklich löschen?`,
          'Löschen',
          {
            confirmButtonText: 'Löschen',
            cancelButtonText: 'Abbrechen',
            type: 'warning'
          }
        )

        this.loading = true
        await this.$store.dispatch('forecasts/deleteVersion', this.currentVersion.id)

        this.selectedVersionId = null
        this.currentVersion = null
        await this.loadVersions()

        this.$message.success('Version gelöscht')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error deleting version:', error)
          this.$message.error('Fehler beim Löschen')
        }
      } finally {
        this.loading = false
      }
    },

    async saveCurrentVersion() {
      if (!this.currentVersion) {
        this.$message.warning('Keine Version ausgewählt')
        return
      }

      try {
        this.loading = true
        
        const items = []
        this.products.forEach(product => {
          this.timeColumns.forEach((column, index) => {
            const quantity = this.getForecastValue(product.id, column.id)
            if (quantity > 0) {
              items.push({
                productId: product.id,
                periodIndex: index,
                periodLabel: column.label,
                quantity: quantity
              })
            }
          })
        })

        await this.$store.dispatch('forecasts/updateVersion', {
          id: this.currentVersion.id,
          data: { items }
        })

        this.hasChanges = false
        this.$message.success('Forecast gespeichert')
      } catch (error) {
        console.error('Error saving forecast:', error)
        this.$message.error('Fehler beim Speichern')
      } finally {
        this.loading = false
      }
    },

    // 🔥 CORRECTED: Products loading
    async loadProducts() {
      try {
        this.loading = true
        const response = await this.$store.dispatch('products/fetchProducts', { limit: 100 })
        
        // 🔥 CORRECTED: Handle different response formats like in Sales
        this.products = Array.isArray(response.data) ? response.data : 
                       Array.isArray(response.data?.products) ? response.data.products :
                       Array.isArray(response.data?.data) ? response.data.data : 
                       Array.isArray(response) ? response : []
        
        console.log('✅ Loaded products:', this.products.length)
        this.initializeForecasts()
      } catch (error) {
        console.error('Error loading products:', error)
        this.$message.error('Fehler beim Laden der Produkte')
      } finally {
        this.loading = false
      }
    },

    generateTimeColumns() {
      this.timeColumns = []
      const now = new Date()
      
      for (let i = 0; i < this.columnCount; i++) {
        const date = new Date(now)
        let label = ''
        
        switch (this.timeUnit) {
          case 'weeks':
            date.setDate(date.getDate() + (i * 7))
            const weekNum = this.getWeekNumber(date)
            label = `KW ${weekNum}`
            break
          case 'months':
            date.setMonth(date.getMonth() + i)
            label = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
            break
          case 'quarters':
            date.setMonth(date.getMonth() + (i * 3))
            const quarter = Math.floor(date.getMonth() / 3) + 1
            label = `Q${quarter} ${date.getFullYear().toString().slice(-2)}`
            break
        }
        
        this.timeColumns.push({
          id: `${this.timeUnit}_${i}`,
          label: label,
          date: new Date(date)
        })
      }
      
      this.initializeForecasts()
    },

    getWeekNumber(date) {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
    },

    initializeForecasts() {
      this.forecasts = {}
      this.rowTotals = {}
      
      this.products.forEach(product => {
        this.forecasts[product.id] = {}
        this.rowTotals[product.id] = 0
        
        this.timeColumns.forEach(column => {
          this.forecasts[product.id][column.id] = 0
        })
      })
    },

    getForecastValue(productId, columnId) {
      return this.forecasts[productId]?.[columnId] || 0
    },

    updateForecast(productId, columnId, value) {
      if (!this.forecasts[productId]) {
        this.forecasts[productId] = {}
      }
      this.forecasts[productId][columnId] = parseInt(value) || 0
      this.calculateRowTotal(productId)
      this.hasChanges = true
    },

    calculateRowTotal(productId) {
      const productForecasts = this.forecasts[productId] || {}
      const total = Object.values(productForecasts).reduce((sum, val) => sum + (val || 0), 0)
      this.rowTotals[productId] = total
    },

    getRowTotal(productId) {
      return this.rowTotals[productId] || 0
    },

    getColumnTotal(columnId) {
      return this.products.reduce((sum, product) => {
        return sum + (this.getForecastValue(product.id, columnId) || 0)
      }, 0)
    },

    async calculateIngredientNeeds() {
      try {
        this.loading = true
        const ingredientMap = new Map()
        
        for (const product of this.products) {
          const productTotal = this.getRowTotal(product.id)
          if (productTotal > 0) {
            try {
              const recipe = await this.$store.dispatch('recipes/fetchRecipeByProduct', product.id)
              
              if (recipe && recipe.ingredients) {
                recipe.ingredients.forEach(ingredient => {
                  const key = ingredient.id
                  const requiredQuantity = (ingredient.RecipeIngredient?.quantity || 0) * productTotal
                  
                  if (ingredientMap.has(key)) {
                    const existing = ingredientMap.get(key)
                    existing.totalRequired += requiredQuantity
                  } else {
                    ingredientMap.set(key, {
                      id: ingredient.id,
                      name: ingredient.name,
                      unit: ingredient.RecipeIngredient?.unit || ingredient.unit,
                      totalRequired: requiredQuantity,
                      currentStock: ingredient.stock_quantity || ingredient.stock || 0,
                      costPerUnit: ingredient.cost_per_unit || ingredient.costPerUnit || 0,
                      supplier: ingredient.supplier || 'Nicht zugewiesen'
                    })
                  }
                })
              }
            } catch (error) {
              console.warn(`No recipe found for product ${product.name}`)
            }
          }
        }
        
        this.ingredientNeeds = Array.from(ingredientMap.values()).map(ingredient => {
          const shortage = Math.max(0, ingredient.totalRequired - ingredient.currentStock)
          const estimatedCost = (ingredient.totalRequired * ingredient.costPerUnit).toFixed(2)
          
          return {
            ...ingredient,
            totalRequired: Math.round(ingredient.totalRequired * 100) / 100,
            shortage,
            estimatedCost
          }
        })
        
        this.totalIngredientCost = this.ingredientNeeds
          .reduce((sum, ing) => sum + parseFloat(ing.estimatedCost), 0)
          .toFixed(2)
        
        this.showIngredients = true
        
      } catch (error) {
        console.error('Error calculating ingredient needs:', error)
        this.$message.error('Fehler bei der Zutaten-Berechnung')
      } finally {
        this.loading = false
      }
    },

    generateShoppingList() {
      if (!this.ingredientNeeds || this.ingredientNeeds.length === 0) {
        this.$message.warning('Bitte zuerst Zutaten berechnen!')
        return
      }

      this.shoppingList = this.ingredientNeeds
        .filter(ingredient => ingredient.shortage > 0)
        .map(ingredient => {
          const orderQuantity = this.roundToOrderUnit(ingredient.shortage, ingredient.unit)
          const orderCost = (orderQuantity * ingredient.costPerUnit).toFixed(2)

          return {
            id: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            required: ingredient.totalRequired,
            currentStock: ingredient.currentStock,
            shortage: ingredient.shortage,
            orderQuantity: orderQuantity,
            orderCost: orderCost,
            costPerUnit: ingredient.costPerUnit,
            supplier: ingredient.supplier
          }
        })
        .sort((a, b) => b.orderCost - a.orderCost)

      this.totalShoppingCost = this.shoppingList
        .reduce((sum, item) => sum + parseFloat(item.orderCost), 0)
        .toFixed(2)

      this.showShoppingList = true
      this.$message.success(`Einkaufsliste mit ${this.shoppingList.length} Positionen erstellt`)
    },

    roundToOrderUnit(quantity, unit) {
      switch(unit) {
        case 'g':
          return Math.ceil(quantity / 100) * 100
        case 'kg':
          return Math.ceil(quantity * 2) / 2
        case 'ml':
          return Math.ceil(quantity / 100) * 100
        case 'l':
          return Math.ceil(quantity * 2) / 2
        case 'stk':
        case 'Stück':
          return Math.ceil(quantity)
        default:
          return Math.ceil(quantity * 100) / 100
      }
    },

    exportShoppingListCSV() {
      if (this.shoppingList.length === 0) {
        this.$message.warning('Keine Einkaufsliste vorhanden!')
        return
      }

      let csv = 'Zutat,Benötigt,Lagerbestand,Fehlmenge,Bestellmenge,Einheit,Kosten pro Einheit,Gesamtkosten,Lieferant\n'

      this.shoppingList.forEach(item => {
        csv += `"${item.name}",${item.required},${item.currentStock},${item.shortage},${item.orderQuantity},"${item.unit}",${item.costPerUnit},${item.orderCost},"${item.supplier}"\n`
      })

      csv += `\n"GESAMT",,,,,,,${this.totalShoppingCost},\n`

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `einkaufsliste_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      this.$message.success('Einkaufsliste als CSV exportiert')
    },

    printShoppingList() {
      if (this.shoppingList.length === 0) {
        this.$message.warning('Keine Einkaufsliste vorhanden!')
        return
      }

      const printWindow = window.open('', '_blank')
      const date = new Date().toLocaleDateString('de-DE')
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Einkaufsliste - ${date}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .total-row { background-color: #e9ecef; font-weight: bold; }
              .right { text-align: right; }
              @media print {
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>🛒 Einkaufsliste</h1>
            <p><strong>Datum:</strong> ${date}</p>
            <p><strong>Positionen:</strong> ${this.shoppingList.length}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Zutat</th>
                  <th class="right">Benötigt</th>
                  <th class="right">Lagerbestand</th>
                  <th class="right">Bestellmenge</th>
                  <th>Einheit</th>
                  <th class="right">Kosten/Einheit</th>
                  <th class="right">Gesamtkosten</th>
                  <th>Lieferant</th>
                </tr>
              </thead>
              <tbody>
                ${this.shoppingList.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td class="right">${item.required}</td>
                    <td class="right">${item.currentStock}</td>
                    <td class="right"><strong>${item.orderQuantity}</strong></td>
                    <td>${item.unit}</td>
                    <td class="right">${item.costPerUnit}€</td>
                    <td class="right"><strong>${item.orderCost}€</strong></td>
                    <td>${item.supplier}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="6"><strong>GESAMT</strong></td>
                  <td class="right"><strong>${this.totalShoppingCost}€</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
            
            <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;">
              Drucken
            </button>
          </body>
        </html>
      `)
      
      printWindow.document.close()
    },

    emailShoppingList() {
      if (this.shoppingList.length === 0) {
        this.$message.warning('Keine Einkaufsliste vorhanden!')
        return
      }

      const date = new Date().toLocaleDateString('de-DE')
      let body = `Einkaufsliste vom ${date}\n\n`
      body += `Positionen: ${this.shoppingList.length}\n\n`
      body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

      this.shoppingList.forEach(item => {
        body += `${item.name}\n`
        body += `  Bestellen: ${item.orderQuantity} ${item.unit}\n`
        body += `  Kosten: ${item.orderCost}€\n`
        body += `  Lieferant: ${item.supplier}\n\n`
      })

      body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      body += `GESAMTKOSTEN: ${this.totalShoppingCost}€\n`

      const subject = `Einkaufsliste ${date}`
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      window.location.href = mailtoLink
    },

    exportForecast() {
      if (!this.currentVersion) {
        this.$message.warning('Bitte wähle eine Version aus')
        return
      }

      if (this.products.length === 0) {
        this.$message.warning('Keine Produkte vorhanden')
        return
      }

      const headers = ['Produkt-ID', 'Produktname', 'Kategorie']
      this.timeColumns.forEach(col => headers.push(col.label))
      headers.push('Gesamt')

      const csvRows = [headers.join(';')]

      this.products.forEach(product => {
        const row = [
          product.id,
          product.name.replace(/;/g, ','),
          this.getProductCategory(product).replace(/;/g, ',')
        ]
        
        this.timeColumns.forEach(col => {
          row.push(this.getForecastValue(product.id, col.id) || 0)
        })
        
        row.push(this.getRowTotal(product.id))
        csvRows.push(row.join(';'))
      })

      const totalRow = ['', 'GESAMT', '']
      this.timeColumns.forEach(col => {
        totalRow.push(this.getColumnTotal(col.id))
      })
      totalRow.push(this.grandTotal)
      csvRows.push(totalRow.join(';'))

      const BOM = '\uFEFF'
      const csv = BOM + csvRows.join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      const versionName = this.currentVersion.name.replace(/[^a-zA-Z0-9]/g, '_')
      const filename = `forecast_${versionName}_${new Date().toISOString().split('T')[0]}.csv`
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      this.$message.success('Forecast exportiert')
    },

    parseCSV(text) {
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) return { headers: [], rows: [] }

      const headers = lines[0].split(/[,;]/).map(h => h.trim())
      const rows = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/[,;]/).map(v => v.trim())
        const row = {}
        
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        
        rows.push(row)
      }

      return { headers, rows }
    },

    handleImportFile(file) {
      this.importFileList = [file]
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const { headers, rows } = this.parseCSV(text)
          
          this.importPreview = rows.slice(0, 100).map(row => {
            const preview = {
              valid: true,
              errors: [],
              product_name: row.product_name || row.Produktname || '',
              product_id: row.product_id || null,
              values: [],
              total: 0
            }

            let product = null
            if (row.product_id) {
              product = this.products.find(p => p.id === parseInt(row.product_id))
            } else if (preview.product_name) {
              const name = preview.product_name.toLowerCase()
              product = this.products.find(p => 
                p.name.toLowerCase().includes(name) || name.includes(p.name.toLowerCase())
              )
            }

            if (!product) {
              preview.valid = false
              preview.errors.push('Produkt nicht gefunden')
            } else {
              preview.product_id = product.id
              preview.product_name = product.name
            }

            headers.forEach(header => {
              if (header.startsWith('period_') || 
                  header.startsWith('KW ') || 
                  header.startsWith('Q') ||
                  /^[A-Z][a-z]{2} \d{2}$/.test(header)) {
                const value = parseInt(row[header]) || 0
                preview.values.push(value)
                preview.total += value
              }
            })

            return preview
          })

        } catch (error) {
          this.$message.error('Fehler beim Lesen der Datei')
          console.error(error)
        }
      }
      
      reader.readAsText(file.raw)
    },

    // ======================================================
    // 🐛 BUGFIX: Fehlende handleAIUploadFile Methode hinzugefügt
    // ======================================================
    handleAIUploadFile(file) {
      this.uploadFileList = [file]
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const { headers, rows } = this.parseCSV(text)
          
          this.uploadPreview = rows.slice(0, 100).map(row => {
            const preview = {
              valid: true,
              errors: [],
              product_name: row.product_name || row.Produktname || '',
              product_id: row.product_id || null,
              values: [],
              total: 0
            }

            // Produkt-Matching
            let product = null
            if (row.product_id) {
              product = this.products.find(p => p.id === parseInt(row.product_id))
            } else if (preview.product_name) {
              const name = preview.product_name.toLowerCase()
              product = this.products.find(p => 
                p.name.toLowerCase().includes(name) || name.includes(p.name.toLowerCase())
              )
            }

            if (!product) {
              preview.valid = false
              preview.errors.push('Produkt nicht gefunden')
            } else {
              preview.product_id = product.id
              preview.product_name = product.name
            }

            // Werte für aktuelle Zeiträume extrahieren
            this.timeColumns.forEach((column, index) => {
              const value = parseInt(row[column.label] || row[`period_${index}`] || 0) || 0
              preview.values.push(value)
              preview.total += value
            })

            return preview
          })

        } catch (error) {
          this.$message.error('Fehler beim Lesen der AI/CSV-Datei')
          console.error(error)
        }
      }
      
      reader.readAsText(file.raw)
    },

    handleImportForecast() {
      const validImports = this.importPreview.filter(r => r.valid)
      
      if (validImports.length === 0) {
        this.$message.warning('Keine gültigen Einträge zum Importieren')
        return
      }

      this.importing = true

      try {
        validImports.forEach(item => {
          item.values.forEach((value, index) => {
            if (index < this.timeColumns.length) {
              const columnId = this.timeColumns[index].id
              this.updateForecast(item.product_id, columnId, value)
            }
          })
        })

        this.$message.success(`${validImports.length} Forecasts importiert`)
        this.showImportDialog = false
        this.handleCancelImport()
        this.hasChanges = true
      } catch (error) {
        this.$message.error('Fehler beim Importieren')
        console.error(error)
      } finally {
        this.importing = false
      }
    },

    handleCancelImport() {
      this.showImportDialog = false
      this.importFileList = []
      this.importPreview = []
    },

    // ======================================================
    // 🐛 BUGFIX: Verbesserte uploadForecastToServer Methode
    // ======================================================
    async uploadForecastToServer() {
      if (!this.currentVersion) {
        this.$message.warning('Bitte zuerst eine Version auswählen!')
        return
      }

      if (this.uploadPreview.length === 0) {
        this.$message.warning('Bitte zuerst eine Datei importieren!')
        return
      }

      try {
        this.uploading = true

        const validItems = this.uploadPreview.filter(r => r.valid)
        
        if (validItems.length === 0) {
          this.$message.warning('Keine gültigen Einträge zum Hochladen!')
          return
        }

        const items = validItems.flatMap(row =>
          row.values.map((quantity, idx) => ({
            productId: row.product_id,
            periodIndex: idx,
            periodLabel: this.timeColumns[idx]?.label || `Period ${idx + 1}`,
            quantity: quantity || 0
          })).filter(item => item.quantity > 0)
        )

        console.log('📤 Uploading forecast items:', items.length)

        // Verwende Store-Action oder direkten API-Call
        try {
          await this.$store.dispatch('forecasts/uploadForecastItems', {
            versionId: this.currentVersion.id,
            items
          })
        } catch (storeError) {
          // Fallback zu direktem API-Call
          const baseUrl = import.meta.env.VITE_API_URL || 'https://iotshowroom.de/api/v1'
          const response = await this.$axios.post(
            `${baseUrl}/forecasts/${this.currentVersion.id}/items`,
            { items }
          )
        }

        this.$message.success('Forecast erfolgreich hochgeladen')
        this.handleCancelUpload()
        this.hasChanges = false
        await this.loadVersion(this.currentVersion.id)
        
      } catch (error) {
        console.error('❌ Upload-Fehler:', error)
        
        if (error.response?.status === 404) {
          this.$message.error('Version nicht gefunden')
        } else if (error.response?.status === 422) {
          this.$message.error('Ungültige Daten')
        } else {
          this.$message.error('Fehler beim Upload')
        }
      } finally {
        this.uploading = false
      }
    },

    // ======================================================
    // 🐛 BUGFIX: Fehlende Cancel-Methode für AI-Upload hinzugefügt
    // ======================================================
    handleCancelUpload() {
      this.showUploadDialog = false
      this.uploadFileList = []
      this.uploadPreview = []
      this.uploading = false
    },

    async clearAllForecasts() {
      try {
        await this.$confirm(
          'Alle Forecast-Werte wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
          'Alle Forecasts löschen',
          {
            confirmButtonText: 'Ja, alles löschen',
            cancelButtonText: 'Abbrechen',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        )

        // Alle Werte auf 0 setzen
        this.products.forEach(product => {
          this.timeColumns.forEach(column => {
            if (this.forecasts[product.id]) {
              this.forecasts[product.id][column.id] = 0
            }
          })
          this.calculateRowTotal(product.id)
        })

        this.hasChanges = true
        this.$message.success('Alle Forecasts gelöscht')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error clearing forecasts:', error)
        }
      }
    }
  }
}
</script>

<style scoped>
.forecasting-board {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.board-header {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left h2 {
  margin: 0;
  color: #333;
}

.version-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.time-unit-select, .column-count-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.calculate-btn, .save-btn, .shopping-btn, .import-btn, .export-btn, .clear-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.import-btn {
  background: #67c23a;
  color: white;
}

.import-btn:hover {
  background: #85ce61;
}

.export-btn {
  background: #909399;
  color: white;
}

.export-btn:hover {
  background: #a6a9ad;
}

.clear-btn {
  background: #f56c6c;
  color: white;
}

.clear-btn:hover {
  background: #f78989;
}

.calculate-btn {
  background: #409eff;
  color: white;
}

.calculate-btn:hover {
  background: #66b1ff;
}

.shopping-btn {
  background: #e6a23c;
  color: white;
}

.shopping-btn:hover:not(:disabled) {
  background: #ebb563;
}

.shopping-btn:disabled {
  background: #dcdfe6;
  cursor: not-allowed;
}

.save-btn {
  background: #67c23a;
  color: white;
}

.save-btn:hover {
  background: #85ce61;
}

.save-btn:disabled {
  background: #dcdfe6;
  cursor: not-allowed;
}

.grid-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.forecast-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.forecast-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 10;
}

.product-header {
  min-width: 200px;
  background: #e9ecef;
}

.time-header {
  min-width: 100px;
  text-align: center;
}

.total-header {
  min-width: 80px;
  text-align: center;
  background: #e9ecef;
}

.product-row {
  border-bottom: 1px solid #dee2e6;
}

.product-row:hover {
  background: #f8f9fa;
}

.product-cell {
  padding: 12px;
  border-right: 1px solid #dee2e6;
  background: #f8f9fa;
}

.product-info {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 500;
  color: #333;
}

.product-category {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.forecast-cell {
  padding: 4px;
  text-align: center;
  border-right: 1px solid #dee2e6;
}

.forecast-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  transition: border-color 0.2s;
}

.forecast-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.total-cell {
  padding: 12px;
  text-align: center;
  background: #f8f9fa;
  font-weight: 600;
}

.total-value {
  color: #333;
}

.totals-row {
  background: #e9ecef;
  font-weight: 600;
}

.totals-row td {
  padding: 12px;
  text-align: center;
  border-top: 2px solid #dee2e6;
}

.total-label {
  text-align: left;
  background: #dee2e6;
}

.grand-total {
  background: #dee2e6;
  color: #333;
  font-size: 16px;
}

.ingredients-panel {
  margin-top: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ingredients-panel h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.ingredient-card {
  padding: 15px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #f8f9fa;
}

.ingredient-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.requirement-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.quantity {
  font-weight: 600;
  color: #409eff;
}

.cost {
  color: #67c23a;
  font-weight: 500;
}

.stock-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.current-stock {
  color: #666;
}

.shortage {
  color: #f56c6c;
  font-weight: 500;
}

.total-cost {
  text-align: right;
  font-size: 18px;
  color: #333;
  padding-top: 15px;
  border-top: 2px solid #dee2e6;
}

.shopping-list-panel {
  margin-top: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e9ecef;
}

.panel-header h3 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 14px;
}

.csv-btn {
  background: #67c23a;
  color: white;
}

.csv-btn:hover {
  background: #85ce61;
}

.print-btn {
  background: #409eff;
  color: white;
}

.print-btn:hover {
  background: #66b1ff;
}

.email-btn {
  background: #e6a23c;
  color: white;
}

.email-btn:hover {
  background: #ebb563;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #67c23a;
}

.empty-state p {
  margin: 0;
  font-size: 18px;
}

.empty-state .sub-text {
  margin-top: 10px;
  font-size: 14px;
  color: #909399;
}

.shopping-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.shopping-item {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  background: #f8f9fa;
  transition: box-shadow 0.2s;
}

.shopping-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.item-header h4 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.item-cost {
  font-size: 20px;
  font-weight: bold;
  color: #67c23a;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.value.highlight {
  color: #409eff;
  font-size: 16px;
  font-weight: 600;
}

.value.shortage-val {
  color: #f56c6c;
}

.shopping-summary {
  margin-top: 20px;
  padding: 20px;
  background: #e9ecef;
  border-radius: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 16px;
}

.summary-row.total {
  margin-top: 10px;
  padding-top: 15px;
  border-top: 2px solid #dee2e6;
  font-size: 20px;
  font-weight: bold;
}

.summary-label {
  color: #333;
}

.summary-value {
  color: #409eff;
  font-weight: 600;
}

.summary-row.total .summary-value {
  color: #67c23a;
  font-size: 24px;
}

.ai-upload-btn {
  background: #909399;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.ai-upload-btn:hover {
  background: #a6a9ad;
}
</style>