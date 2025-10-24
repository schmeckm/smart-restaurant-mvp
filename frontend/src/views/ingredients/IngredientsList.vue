<template>
  <div class="app-container">
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
      <el-button
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
      >
        Suchen
      </el-button>
      <el-button
        class="filter-item"
        type="success"
        icon="el-icon-plus"
        @click="handleCreate"
      >
        Neue Zutat
      </el-button>
      <el-button
        v-if="multipleSelection.length > 0"
        class="filter-item"
        type="danger"
        icon="el-icon-delete"
        @click="handleBulkDelete"
      >
        Ausgewählte löschen ({{ multipleSelection.length }})
      </el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <!-- Checkbox Column -->
      <el-table-column type="selection" width="55" align="center" />

      <el-table-column label="Name" min-width="150">
        <template #default="{ row }">
          <span class="link-type" @click="handleUpdate(row)">{{ row.name }}</span>
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

      <el-table-column prop="cost_per_unit" label="Kosten/Einheit" width="130" align="right">
        <template #default="{ row }">
          {{ formatCost(row.cost_per_unit, row.unit) }}
        </template>
      </el-table-column>

      <el-table-column prop="current_stock" label="Bestand" width="100" align="right">
        <template #default="{ row }">
          {{ row.current_stock }} {{ row.unit }}
        </template>
      </el-table-column>

      <el-table-column prop="min_stock" label="Min. Bestand" width="110" align="right">
        <template #default="{ row }">
          {{ row.min_stock }} {{ row.unit }}
        </template>
      </el-table-column>

      <el-table-column label="Status" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStockStatusType(row)">
            {{ getStockStatus(row) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="Aktionen" align="center" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleUpdate(row)">
            Bearbeiten
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">
            Löschen
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="listQuery.page"
      v-model:limit="listQuery.limit"
      @pagination="getList"
    />

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

        <el-form-item label="Kosten/Einheit" prop="cost_per_unit">
          <el-input-number
            v-model="temp.cost_per_unit"
            :precision="2"
            :step="0.1"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Aktueller Bestand" prop="current_stock">
          <el-input-number
            v-model="temp.current_stock"
            :precision="2"
            :step="1"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Min. Bestand" prop="min_stock">
          <el-input-number
            v-model="temp.min_stock"
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
        <el-button @click="dialogFormVisible = false">
          Abbrechen
        </el-button>
        <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
          Speichern
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getIngredients, createIngredient, updateIngredient, deleteIngredient } from '@/api/ingredients'
import Pagination from '@/components/Pagination'

export default {
  name: 'IngredientsList',
  components: { Pagination },
  data() {
    return {
      list: [],
      total: 0,
      listLoading: true,
      multipleSelection: [],  // ⬅️ NEU!
      listQuery: {
        page: 1,
        limit: 20,
        search: '',
        category: ''
      },
      temp: {
        id: undefined,
        name: '',
        category: 'other',
        unit: 'kg',
        cost_per_unit: 0,
        current_stock: 0,
        min_stock: 0,
        supplier: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      rules: {
        name: [{ required: true, message: 'Name ist erforderlich', trigger: 'blur' }],
        category: [{ required: true, message: 'Kategorie ist erforderlich', trigger: 'change' }],
        unit: [{ required: true, message: 'Einheit ist erforderlich', trigger: 'change' }],
        cost_per_unit: [{ required: true, message: 'Kosten sind erforderlich', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async getList() {
      this.listLoading = true
      try {
        const { data } = await getIngredients(this.listQuery)
        this.list = data.ingredients
        this.total = data.total
      } catch (error) {
        this.$message.error('Fehler beim Laden der Zutaten')
      } finally {
        this.listLoading = false
      }
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleSelectionChange(val) {  // ⬅️ NEU!
      this.multipleSelection = val
    },
    handleBulkDelete() {  // ⬅️ NEU!
      const count = this.multipleSelection.length
      this.$confirm(`${count} Zutat(en) wirklich löschen?`, 'Warnung', {
        confirmButtonText: 'Ja',
        cancelButtonText: 'Abbrechen',
        type: 'warning'
      }).then(async () => {
        try {
          // Delete all selected items
          await Promise.all(
            this.multipleSelection.map(item => deleteIngredient(item.id))
          )
          this.getList()
          this.multipleSelection = []
          this.$message.success(`${count} Zutat(en) erfolgreich gelöscht`)
        } catch (error) {
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
        cost_per_unit: 0,
        current_stock: 0,
        min_stock: 0,
        supplier: ''
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate()
      })
    },
    async createData() {
      this.$refs.dataForm.validate(async valid => {
        if (valid) {
          try {
            await createIngredient(this.temp)
            this.getList()
            this.dialogFormVisible = false
            this.$message.success('Zutat erfolgreich erstellt')
          } catch (error) {
            this.$message.error('Fehler beim Erstellen der Zutat')
          }
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate()
      })
    },
    async updateData() {
      this.$refs.dataForm.validate(async valid => {
        if (valid) {
          try {
            await updateIngredient(this.temp.id, this.temp)
            this.getList()
            this.dialogFormVisible = false
            this.$message.success('Zutat erfolgreich aktualisiert')
          } catch (error) {
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
        } catch (error) {
          this.$message.error('Fehler beim Löschen der Zutat')
        }
      })
    },
    formatCost(cost, unit) {
      return `€${Number(cost).toFixed(2)}/${unit}`
    },
    getCategoryLabel(category) {
      const labels = {
        vegetable: 'Gemüse',
        meat: 'Fleisch',
        dairy: 'Milch',
        spice: 'Gewürz',
        other: 'Sonstiges'
      }
      return labels[category] || category
    },
    getCategoryType(category) {
      const types = {
        vegetable: 'success',
        meat: 'danger',
        dairy: 'info',
        spice: 'warning',
        other: ''
      }
      return types[category] || ''
    },
    getStockStatus(row) {
      if (row.current_stock <= row.min_stock) return 'Niedrig'
      if (row.current_stock <= row.min_stock * 2) return 'OK'
      return 'Gut'
    },
    getStockStatusType(row) {
      if (row.current_stock <= row.min_stock) return 'danger'
      if (row.current_stock <= row.min_stock * 2) return 'warning'
      return 'success'
    }
  }
}
</script>

<style scoped>
.link-type {
  color: #409EFF;
  cursor: pointer;
}
.link-type:hover {
  color: #66b1ff;
}
.filter-container {
  padding-bottom: 20px;
}
.filter-item {
  margin-right: 10px;
}
</style>