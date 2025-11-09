<template>
  <div class="app-container">
    <!-- 🔍 Filterleiste -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.search"
        placeholder="Zutat suchen..."
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
      />
      <el-select
        v-model="listQuery.category"
        placeholder="Kategorie"
        clearable
        style="width: 150px"
        class="filter-item"
      >
        <el-option label="Alle" value="" />
        <el-option label="Gemüse" value="vegetable" />
        <el-option label="Fleisch" value="meat" />
        <el-option label="Milchprodukte" value="dairy" />
        <el-option label="Gewürze" value="spice" />
        <el-option label="Sonstiges" value="other" />
      </el-select>

      <el-button type="primary" icon="Search" class="filter-item" @click="handleFilter">Suchen</el-button>
      <el-button type="success" icon="Plus" class="filter-item" @click="handleCreate">Neue Zutat</el-button>
      <el-button type="warning" class="filter-item" @click="manualTest">🧩 Manual Test</el-button>
      <el-button type="success" class="filter-item" @click="reloadNutritionStatus">🔄 Status neu laden</el-button>
      
      <!-- ✅ Bulk Actions when items are selected -->
      <template v-if="multipleSelection.length > 0">
        <el-button
          type="info"
          icon="Nutrient"
          class="filter-item"
          @click="handleBulkNutrition"
        >
          Nährwerte laden ({{ multipleSelection.length }})
        </el-button>
        <el-button
          type="danger"
          icon="Delete"
          class="filter-item"
          @click="handleBulkDelete"
        >
          Löschen ({{ multipleSelection.length }})
        </el-button>
      </template>

      <!-- ✅ Nutrition Status Summary -->
      <div class="nutrition-summary" v-if="nutritionSummary.total > 0">
        <el-tag type="success" size="small">✅ {{ nutritionSummary.available }}</el-tag>
        <el-tag type="info" size="small">❌ {{ nutritionSummary.missing }}</el-tag>
        <span style="margin-left: 10px; color: #606266; font-size: 12px;">
          {{ Math.round((nutritionSummary.available / nutritionSummary.total) * 100) }}% Nährwerte verfügbar
        </span>
      </div>
    </div>

    <!-- 🧩 DEBUG BLOCK - Temporär zum Testen -->
    <div style="background: #f0f0f0; padding: 10px; margin: 10px 0; font-family: monospace; border-radius: 5px;">
      <h4>🧩 DEBUG: Ingredient Status</h4>
      <div v-for="item in list" :key="item.id" style="margin: 5px 0;">
        <strong>{{ item.name }}:</strong> 
        <span style="color: blue;">nutritionStatus = "{{ item.nutritionStatus || 'undefined' }}"</span> |
        <span style="color: green;">source = "{{ item.nutritionSource || 'null' }}"</span>
      </div>
      <p><strong>Total:</strong> {{ list.length }} | 
         <strong>Available:</strong> {{ list.filter(i => i.nutritionStatus === 'available').length }} |
         <strong>Not Loaded:</strong> {{ list.filter(i => i.nutritionStatus === 'not_loaded').length }} |
         <strong>Unknown:</strong> {{ list.filter(i => !i.nutritionStatus || i.nutritionStatus === 'unknown').length }}</p>
    </div>

    <!-- 🧾 Zutaten-Tabelle -->
    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />

      <el-table-column label="Name" min-width="150">
        <template #default="{ row }">
          <span class="link-type" @click="handleUpdate(row)">
            {{ row.name }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="Kategorie" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="getCategoryType(row.category)">
            {{ getCategoryLabel(row.category) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="unit" label="Einheit" width="100" align="center" />

      <el-table-column prop="pricePerUnit" label="Kosten/Einheit" width="130" align="right">
        <template #default="{ row }">
          {{ formatCost(row.pricePerUnit, row.unit) }}
        </template>
      </el-table-column>

      <el-table-column prop="stockQuantity" label="Bestand" width="100" align="right">
        <template #default="{ row }">
          {{ row.stockQuantity }} {{ row.unit }}
        </template>
      </el-table-column>

      <el-table-column prop="minStockLevel" label="Min. Bestand" width="110" align="right">
        <template #default="{ row }">
          {{ row.minStockLevel }} {{ row.unit }}
        </template>
      </el-table-column>

      <el-table-column label="Status" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStockStatusType(row)">
            {{ getStockStatus(row) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- ✅ NEW: Nutrition Status Column -->
      <el-table-column label="Nährwerte" width="130" align="center">
        <template #default="{ row }">
          <el-tooltip 
            :content="getNutritionTooltip(row)" 
            placement="top"
          >
            <el-tag 
              v-if="row.nutritionStatus === 'available'" 
              type="success" 
              size="small"
              style="cursor: pointer;"
              @click="loadNutrients(row)"
            >
              ✅ Verfügbar
            </el-tag>
            <el-tag 
              v-else-if="row.nutritionStatus === 'loading'" 
              type="warning" 
              size="small"
            >
              🔄 Lädt...
            </el-tag>
            <el-tag 
              v-else 
              type="info" 
              size="small"
              style="cursor: pointer;"
              @click="loadNutrients(row)"
            >
              ❌ Fehlt
            </el-tag>
          </el-tooltip>
        </template>
      </el-table-column>

      <!-- ⚙️ Enhanced Actions -->
      <el-table-column label="Aktionen" align="center" width="260" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleUpdate(row)">
            Bearbeiten
          </el-button>
          <el-button 
            :type="row.nutritionStatus === 'available' ? 'success' : 'info'" 
            size="small" 
            @click="loadNutrients(row)"
            :loading="row.nutritionStatus === 'loading'"
          >
            {{ row.nutritionStatus === 'available' ? 'Anzeigen' : 'Laden' }}
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">
            Löschen
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 📄 Pagination -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="listQuery.page"
      v-model:limit="listQuery.limit"
      @pagination="getList"
    />

    <!-- 🧩 Dialog (Erstellen/Bearbeiten) -->
    <el-dialog
      :title="dialogStatus === 'create' ? 'Neue Zutat' : 'Zutat bearbeiten'"
      v-model="dialogFormVisible"
      width="500px"
    >
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="120px"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>

        <el-form-item label="Kategorie" prop="category">
          <el-select v-model="temp.category" placeholder="Bitte wählen" style="width: 100%">
            <el-option label="Gemüse" value="vegetable" />
            <el-option label="Fleisch" value="meat" />
            <el-option label="Milchprodukte" value="dairy" />
            <el-option label="Gewürze" value="spice" />
            <el-option label="Sonstiges" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="Einheit" prop="unit">
          <el-select v-model="temp.unit" placeholder="Bitte wählen" style="width: 100%">
            <el-option label="kg" value="kg" />
            <el-option label="g" value="g" />
            <el-option label="l" value="l" />
            <el-option label="ml" value="ml" />
            <el-option label="Stück" value="piece" />
          </el-select>
        </el-form-item>

        <el-form-item label="Kosten/Einheit" prop="pricePerUnit">
          <el-input-number
            v-model="temp.pricePerUnit"
            :precision="2"
            :step="0.1"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Aktueller Bestand" prop="stockQuantity">
          <el-input-number
            v-model="temp.stockQuantity"
            :precision="2"
            :step="1"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Min. Bestand" prop="minStockLevel">
          <el-input-number
            v-model="temp.minStockLevel"
            :precision="2"
            :step="1"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Lieferant">
          <el-input v-model="temp.supplier" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogFormVisible = false">Abbrechen</el-button>
        <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">Speichern</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getIngredients, createIngredient, updateIngredient, deleteIngredient } from '@/api/ingredients'
import { getNutritionForIngredient, checkNutritionBulkStatus } from '@/api/nutrition'
import Pagination from '@/components/Pagination'

export default {
  name: 'IngredientsList',
  components: { Pagination },
  data() {
    return {
      list: [],
      total: 0,
      listLoading: true,
      multipleSelection: [],
      listQuery: { page: 1, limit: 20, search: '', category: '' },
      temp: {
        id: undefined,
        name: '',
        category: 'other',
        unit: 'kg',
        pricePerUnit: 0,
        stockQuantity: 0,
        minStockLevel: 0,
        supplier: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      rules: {
        name: [{ required: true, message: 'Name ist erforderlich', trigger: 'blur' }],
        category: [{ required: true, message: 'Kategorie ist erforderlich', trigger: 'change' }],
        unit: [{ required: true, message: 'Einheit ist erforderlich', trigger: 'change' }],
        pricePerUnit: [{ required: true, message: 'Kosten sind erforderlich', trigger: 'blur' }]
      }
    }
  },
  computed: {
    nutritionSummary() {
      const total = this.list.length
      const available = this.list.filter(item => item.nutritionStatus === 'available').length
      const missing = total - available
      return { total, available, missing }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async getList() {
      this.listLoading = true
      try {
        const response = await getIngredients(this.listQuery)
        console.log('🔍 getList Response:', response)
        this.list = response.data || []
        this.total = response.count || 0

        console.log('🔍 List loaded:', this.list.length, 'items')

        // ✅ Check nutrition status for all ingredients
        await this.checkNutritionStatusForAll()

      } catch (error) {
        console.error('❌ Error in getList:', error)
        this.$message.error('Fehler beim Laden der Zutaten')
      } finally {
        this.listLoading = false
      }
    },

    // ✅ Vue 3 compatible nutrition status check
    async checkNutritionStatusForAll() {
      try {
        if (this.list.length === 0) return

        const ingredientIds = this.list.map(item => item.id)
        console.log('🔍 Frontend: Checking nutrition status for', ingredientIds.length, 'ingredients...')
        
        const response = await checkNutritionBulkStatus(ingredientIds, 'ingredient')
        
        console.log('🧩 Frontend: Raw Response:', response)
        
        if (response && response.success && response.data) {
          const statusMap = response.data
          console.log('🧩 Frontend: Status Map:', statusMap)

          // ✅ Vue 3: Direct assignment only (no $set needed)
          this.list.forEach((ingredient, index) => {
            const status = statusMap[ingredient.id]
            console.log(`🧩 ${index}: ${ingredient.name} → ${status ? status.status : 'not_loaded'}`)
            
            if (status) {
              ingredient.nutritionStatus = status.status
              ingredient.nutritionSource = status.source
            } else {
              ingredient.nutritionStatus = 'not_loaded'
              ingredient.nutritionSource = null
            }
          })

          console.log('✅ Frontend: All nutrition statuses updated!')
          
        } else {
          console.error('❌ Frontend: Response format issue')
          console.error('❌ Response:', response)
        }
      } catch (error) {
        console.error('❌ Frontend: Error checking nutrition status:', error)
        
        // Set fallback status
        this.list.forEach(ingredient => {
          ingredient.nutritionStatus = 'unknown'
          ingredient.nutritionSource = null
        })
      }
    },

    // 🔄 Manual reload nutrition status
    async reloadNutritionStatus() {
      console.log('🔄 Manual reload nutrition status...')
      this.$message.info('Lade Nährwerte-Status neu...')
      
      try {
        await this.checkNutritionStatusForAll()
        this.$message.success('Status erfolgreich neu geladen!')
      } catch (error) {
        console.error('❌ Error reloading status:', error)
        this.$message.error('Fehler beim Neuladen: ' + error.message)
      }
    },

    // 🧩 Manual Test Function - Vue 3 compatible
    manualTest() {
      console.log('🧩 MANUAL TEST: Setting all to available...')
      
      this.list.forEach((ingredient) => {
        ingredient.nutritionStatus = 'available'
        ingredient.nutritionSource = 'manual-test'
        console.log(`🧩 Set ${ingredient.name} to available`)
      })
      
      this.$message.success('Manual test: Alle Status auf "verfügbar" gesetzt!')
    },

    getNutritionTooltip(row) {
      if (row.nutritionStatus === 'available') {
        return `Nährwerte verfügbar (${row.nutritionSource || 'unbekannt'}). Klicken zum Anzeigen.`
      } else if (row.nutritionStatus === 'loading') {
        return 'Nährwerte werden geladen...'
      } else {
        return 'Keine Nährwerte verfügbar. Klicken zum Laden.'
      }
    },

    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },

    handleSelectionChange(val) {
      this.multipleSelection = val
    },

    // ✅ Enhanced bulk nutrition loading
    async handleBulkNutrition() {
      const count = this.multipleSelection.length
      if (count === 0) return

      try {
        await this.$confirm(
          `Nährwerte für ${count} Zutat(en) laden?\n\n` +
          `Bereits vorhandene werden aus der Datenbank geladen,\n` +
          `neue werden von KI generiert.`, 
          'Nährwerte laden', 
          {
            confirmButtonText: 'Ja, laden',
            cancelButtonText: 'Abbrechen',
            type: 'info'
          }
        )

        this.$message.info(`🔍 Lade Nährwerte für ${count} Zutaten...`)

        // Mark as loading
        this.multipleSelection.forEach(ingredient => {
          ingredient.nutritionStatus = 'loading'
        })

        // Track results
        let successCount = 0
        let errorCount = 0
        let fromCache = 0
        let fromAI = 0

        // Process each ingredient
        for (const ingredient of this.multipleSelection) {
          try {
            const response = await getNutritionForIngredient(ingredient.id)
            
            // Handle response structure
            let nutritionData, source
            if (response?.data?.success && response.data.data) {
              nutritionData = response.data.data
              source = response.data.source || 'db'
            } else if (response?.success && response.data) {
              nutritionData = response.data
              source = response.source || 'db'
            } else if (response?.calories !== undefined) {
              nutritionData = response
              source = response.source || 'unknown'
            } else {
              throw new Error('Ungültige API-Antwort')
            }

            // Store nutrition data and update status
            ingredient.nutrients = nutritionData
            ingredient.nutritionStatus = 'available'
            ingredient.nutritionSource = source
            successCount++

            // Count sources
            if (source === 'ai-claude') {
              fromAI++
            } else {
              fromCache++
            }

            console.log(`✅ ${ingredient.name}: ${source}`)

          } catch (error) {
            console.error(`❌ Error loading nutrition for ${ingredient.name}:`, error)
            ingredient.nutritionStatus = 'not_loaded'
            errorCount++
          }

          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 200))
        }

        // Show results summary
        this.$alert(
          `Ergebnisse:\n\n` +
          `✅ Erfolgreich: ${successCount}\n` +
          `📦 Aus Datenbank: ${fromCache}\n` +
          `🤖 Von KI generiert: ${fromAI}\n` +
          `❌ Fehler: ${errorCount}`,
          'Nährwerte-Loading abgeschlossen',
          { 
            confirmButtonText: 'OK',
            type: successCount > 0 ? 'success' : 'warning'
          }
        )

        if (successCount > 0) {
          this.$message.success(`${successCount} Nährwerte erfolgreich geladen!`)
        }

      } catch {
        // User cancelled - reset loading status
        this.multipleSelection.forEach(ingredient => {
          if (ingredient.nutritionStatus === 'loading') {
            ingredient.nutritionStatus = 'not_loaded'
          }
        })
      }
    },

    async handleBulkDelete() {
      const count = this.multipleSelection.length
      if (count === 0) return
      this.$confirm(`${count} Zutat(en) wirklich löschen?`, 'Warnung', {
        confirmButtonText: 'Ja',
        cancelButtonText: 'Abbrechen',
        type: 'warning'
      }).then(async () => {
        try {
          await Promise.all(this.multipleSelection.map(item => deleteIngredient(item.id)))
          this.getList()
          this.multipleSelection = []
          this.$message.success(`${count} Zutat(en) erfolgreich gelöscht`)
        } catch {
          this.$message.error('Fehler beim Löschen der Zutaten')
        }
      })
    },

    resetTemp() {
      this.temp = {
        id: undefined,
        name: '',
        category: 'other',
        unit: 'kg',
        pricePerUnit: 0,
        stockQuantity: 0,
        minStockLevel: 0,
        supplier: ''
      }
    },

    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => this.$refs.dataForm?.clearValidate())
    },

    createData() {
      this.$refs.dataForm.validate(async valid => {
        if (valid) {
          try {
            await createIngredient(this.temp)
            this.getList()
            this.dialogFormVisible = false
            this.$message.success('Zutat erfolgreich erstellt')
          } catch {
            this.$message.error('Fehler beim Erstellen der Zutat')
          }
        }
      })
    },

    handleUpdate(row) {
      this.temp = { ...row }
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => this.$refs.dataForm?.clearValidate())
    },

    updateData() {
      this.$refs.dataForm.validate(async valid => {
        if (valid) {
          try {
            await updateIngredient(this.temp.id, this.temp)
            this.getList()
            this.dialogFormVisible = false
            this.$message.success('Zutat erfolgreich aktualisiert')
          } catch {
            this.$message.error('Fehler beim Aktualisieren der Zutat')
          }
        }
      })
    },

    handleDelete(row) {
      this.$confirm('Zutat wirklich löschen?', 'Warnung', {
        confirmButtonText: 'Ja',
        cancelButtonText: 'Abbrechen',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteIngredient(row.id)
          this.getList()
          this.$message.success('Zutat erfolgreich gelöscht')
        } catch {
          this.$message.error('Fehler beim Löschen der Zutat')
        }
      })
    },

    // ✅ Enhanced single nutrition loading
    async loadNutrients(row) {
      try {
        // Set loading status
        row.nutritionStatus = 'loading'
        
        this.$message.info(`🔍 Lade Nährwerte für ${row.name}...`)

        const response = await getNutritionForIngredient(row.id)
        
        // Handle multiple possible response structures
        let nutritionData, source

        if (response?.data?.success && response.data.data) {
          nutritionData = response.data.data
          source = response.data.source || 'db'
        } else if (response?.success && response.data) {
          nutritionData = response.data
          source = response.source || 'db'
        } else if (response?.calories !== undefined) {
          nutritionData = response
          source = response.source || 'unknown'
        } else {
          throw new Error('Ungültige API-Antwort: Keine Nährwerte gefunden')
        }

        if (!nutritionData || typeof nutritionData.calories === 'undefined') {
          throw new Error('Nährwerte sind unvollständig oder ungültig')
        }

        // Store nutrition data and update status
        row.nutrients = nutritionData
        row.nutritionStatus = 'available'
        row.nutritionSource = source

        // Show source information
        let sourceLabel = 'Unbekannt'
        let sourceIcon = ''
        if (source === 'ai-claude') {
          sourceLabel = 'KI generiert'
          sourceIcon = '🤖'
        } else if (source === 'db' || source === 'manual') {
          sourceLabel = 'Aus Datenbank'
          sourceIcon = '📦'
        }

        // Display nutrition information
        const formatValue = (value) => (value || 0).toFixed(1)
        
        this.$alert(
          `${sourceIcon} ${sourceLabel}\n\n` +
          `Kalorien: ${formatValue(nutritionData.calories)} kcal\n` +
          `Eiweiß: ${formatValue(nutritionData.protein)} g\n` +
          `Fett: ${formatValue(nutritionData.fat)} g\n` +
          `Kohlenhydrate: ${formatValue(nutritionData.carbohydrates)} g\n` +
          `Ballaststoffe: ${formatValue(nutritionData.fiber)} g\n` +
          `Zucker: ${formatValue(nutritionData.sugar)} g`,
          `Nährwerte für ${row.name} (pro 100g)`,
          { 
            confirmButtonText: 'OK',
            type: 'info'
          }
        )

        this.$message.success('Nährwerte erfolgreich geladen!')

      } catch (error) {
        console.error('Error loading nutrition data:', error)
        
        // Reset status on error
        row.nutritionStatus = 'not_loaded'
        
        let errorMessage = 'Fehler beim Laden der Nährwerte'
        
        if (error.message.includes('404')) {
          errorMessage = 'Zutat nicht gefunden'
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Keine Berechtigung - bitte neu anmelden'
        } else if (error.message.includes('500')) {
          errorMessage = 'Server-Fehler - bitte später versuchen'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        this.$message.error(errorMessage)
      }
    },

    formatCost(cost, unit) {
      return `€${Number(cost || 0).toFixed(2)}/${unit}`
    },

    getCategoryLabel(category) {
      const labels = { vegetable: 'Gemüse', meat: 'Fleisch', dairy: 'Milchprodukte', spice: 'Gewürze', other: 'Sonstiges' }
      return labels[category] || category
    },

    getCategoryType(category) {
      const types = { 
        vegetable: 'success', 
        meat: 'danger', 
        dairy: 'info', 
        spice: 'warning', 
        other: 'primary'
      }
      return types[category] || 'primary'
    },

    getStockStatus(row) {
      if (row.stockQuantity <= row.minStockLevel) return 'Niedrig'
      if (row.stockQuantity <= row.minStockLevel * 2) return 'OK'
      return 'Gut'
    },

    getStockStatusType(row) {
      if (row.stockQuantity <= row.minStockLevel) return 'danger'
      if (row.stockQuantity <= row.minStockLevel * 2) return 'warning'
      return 'success'
    }
  }
}
</script>

<style scoped>
.link-type { color: #409EFF; cursor: pointer; }
.link-type:hover { color: #66b1ff; }
.filter-container { 
  padding-bottom: 20px; 
}
.filter-item { 
  margin-right: 10px; 
}
.nutrition-summary {
  margin-top: 10px;
}
.nutrition-summary .el-tag {
  margin-right: 8px;
}
</style>