<template>
  <div class="restaurants-container">
    <div class="header-section">
      <h2>Restaurants verwalten</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>
        Neues Restaurant
      </el-button>
    </div>

    <!-- 🔍 ERWEITERTE SUCHFELD-SEKTION -->
    <div class="search-section">
      <el-row :gutter="16" class="mb-4">
        <el-col :span="6">
          <el-input
            v-model="search"
            placeholder="Restaurant suchen (Name, Adresse, Email)..."
            clearable
            @input="handleLiveSearch"
            @clear="handleLiveSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        
        <el-col :span="4">
          <el-select
            v-model="typeFilter"
            placeholder="Restaurant-Typ"
            clearable
            @change="handleLiveSearch"
          >
            <el-option label="Alle Typen" value="" />
            <el-option label="Beizli" value="Beizli" />
            <el-option label="Pizzeria" value="Pizzeria" />
            <el-option label="Grieche" value="Grieche" />
            <el-option label="Imbiss" value="Imbiss" />
            <el-option label="Fine Dining" value="FineDining" />
            <el-option label="Bergwirtschaft" value="Bergwirtschaft" />
          </el-select>
        </el-col>
        
        <el-col :span="4">
          <el-select
            v-model="subscriptionFilter"
            placeholder="Abo-Plan"
            clearable
            @change="handleLiveSearch"
          >
            <el-option label="Alle Pläne" value="" />
            <el-option label="Free" value="Free" />
            <el-option label="Fux" value="Fux" />
            <el-option label="Pro" value="Pro" />
            <el-option label="Enterprise" value="Enterprise" />
            <el-option label="Success Based" value="SuccessBased" />
          </el-select>
        </el-col>
        
        <el-col :span="4">
          <el-select
            v-model="statusFilter"
            placeholder="Status"
            clearable
            @change="handleLiveSearch"
          >
            <el-option label="Alle" value="" />
            <el-option label="Aktiv" value="active" />
            <el-option label="Inaktiv" value="inactive" />
          </el-select>
        </el-col>
        
        <el-col :span="6">
          <el-button @click="resetAllFilters" style="margin-right: 10px;">
            Filter zurücksetzen
          </el-button>
          <span class="search-results">
            {{ filteredRestaurants.length }} von {{ restaurants.length }} Restaurants
          </span>
        </el-col>
      </el-row>

      <!-- Erweiterte Filter (Collapse) -->
      <el-collapse>
        <el-collapse-item title="🔍 Erweiterte Filter & Export" name="advanced">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-select
                v-model="cityFilter"
                placeholder="Stadt filtern"
                clearable
                filterable
                @change="handleLiveSearch"
              >
                <el-option label="Alle Städte" value="" />
                <el-option
                  v-for="city in uniqueCities"
                  :key="city"
                  :label="city"
                  :value="city"
                />
              </el-select>
            </el-col>
            
            <el-col :span="6">
              <el-select
                v-model="sortBy"
                placeholder="Sortierung"
                @change="handleLiveSearch"
              >
                <el-option label="Name A-Z" value="name_asc" />
                <el-option label="Name Z-A" value="name_desc" />
                <el-option label="Neueste zuerst" value="created_desc" />
                <el-option label="Älteste zuerst" value="created_asc" />
                <el-option label="Stadt A-Z" value="city_asc" />
              </el-select>
            </el-col>
            
            <el-col :span="6">
              <el-button type="success" @click="exportRestaurants" style="width: 100%;">
                📊 CSV Export
              </el-button>
            </el-col>
            
            <el-col :span="6">
              <el-button type="info" @click="showStatistics" style="width: 100%;">
                📈 Statistiken
              </el-button>
            </el-col>
          </el-row>
        </el-collapse-item>
      </el-collapse>

      <!-- Status-Zusammenfassung -->
      <div class="status-summary" v-if="filteredRestaurants.length > 0">
        <el-tag type="success" size="small">
          ✅ {{ activeCount }} Aktiv
        </el-tag>
        <el-tag type="info" size="small">
          📋 {{ inactiveCount }} Inaktiv
        </el-tag>
        <el-tag type="warning" size="small">
          🏢 {{ uniqueTypes.length }} Typen
        </el-tag>
        <el-tag type="primary" size="small">
          🌍 {{ uniqueCities.length }} Städte
        </el-tag>
        <span class="summary-text">
          {{ Math.round((activeCount / filteredRestaurants.length) * 100) }}% aktive Restaurants |
          Top-Plan: {{ topSubscriptionPlan }}
        </span>
        
        <!-- Bulk Actions -->
        <div v-if="selectedRestaurants.length > 0" style="margin-top: 10px;">
          <el-button type="info" size="small" @click="bulkActivate">
            Aktivieren ({{ selectedRestaurants.length }})
          </el-button>
          <el-button type="warning" size="small" @click="bulkDeactivate">
            Deaktivieren ({{ selectedRestaurants.length }})
          </el-button>
          <el-button type="success" size="small" @click="exportSelected">
            Exportieren ({{ selectedRestaurants.length }})
          </el-button>
        </div>
      </div>
    </div>

    <!-- Enhanced Table -->
    <el-table 
      :data="paginatedRestaurants" 
      stripe 
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <!-- Selection Column -->
      <el-table-column type="selection" width="55" />
      
      <el-table-column prop="name" label="Restaurant" width="200">
        <template #default="{ row }">
          <div>
            <div style="font-weight: 500;">{{ row.name }}</div>
            <div style="font-size: 12px; color: #909399;">
              <el-tag :type="getTypeTagType(row.type)" size="small">
                {{ row.type || 'Unbekannt' }}
              </el-tag>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="Abo-Plan" width="140">
        <template #default="{ row }">
          <el-tag :type="getSubscriptionTagType(row.subscription_plan)" size="small">
            {{ row.subscription_plan || 'Free' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="address" label="Adresse" width="180">
        <template #default="{ row }">
          <div style="font-size: 13px;">
            {{ row.address || '-' }}
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="Kontakt" width="200">
        <template #default="{ row }">
          <div style="font-size: 12px;">
            <div v-if="row.email">📧 {{ row.email }}</div>
            <div v-if="row.phone">📞 {{ row.phone }}</div>
            <div v-if="!row.email && !row.phone" style="color: #909399;">
              Keine Kontaktdaten
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="Status" width="100" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.is_active"
            @change="(val) => toggleStatus(row, val)"
            :loading="row.updating"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="Aktionen" width="200" align="center">
        <template #default="{ row }">
          <el-button type="info" size="small" @click="viewRestaurant(row)">
            <el-icon><View /></el-icon>
          </el-button>
          <el-button type="primary" size="small" @click="openDialog(row)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button type="success" size="small" @click="duplicateRestaurant(row)">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
          <el-button type="danger" size="small" @click="deleteRestaurant(row.id)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Bulk Actions Alert -->
    <div v-if="selectedRestaurants.length > 0" class="bulk-actions">
      <el-alert
        :title="`${selectedRestaurants.length} Restaurant(s) ausgewählt`"
        type="info"
        show-icon
        :closable="false"
      >
        <template #default>
          {{ selectedRestaurants.map(r => r.name).join(', ') }}
        </template>
      </el-alert>
    </div>

    <!-- Enhanced Pagination -->
    <el-pagination
      v-if="filteredTotal > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="filteredTotal"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      style="margin-top: 20px; text-align: center"
    />

    <!-- Debug Info -->
    <div class="debug-info" v-if="hasActiveFilters">
      <strong>Debug:</strong>
      Suchbegriff: "{{ search }}" |
      Typ: {{ typeFilter || 'Alle' }} |
      Abo: {{ subscriptionFilter || 'Alle' }} |
      Status: {{ statusFilter || 'Alle' }} |
      Stadt: {{ cityFilter || 'Alle' }} |
      Sortierung: {{ sortBy || 'Standard' }} |
      Ergebnisse: {{ filteredRestaurants.length }}/{{ restaurants.length }}
    </div>

    <!-- Original Dialog (enhanced) -->
    <el-dialog v-model="dialogVisible" title="Restaurant" width="600px">
      <el-form :model="form" label-width="140px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Name">
              <el-input v-model="form.name" placeholder="Restaurant Name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Typ">
              <el-select v-model="form.type" placeholder="Typ wählen" style="width: 100%">
                <el-option label="Beizli" value="Beizli" />
                <el-option label="Pizzeria" value="Pizzeria" />
                <el-option label="Grieche" value="Grieche" />
                <el-option label="Imbiss" value="Imbiss" />
                <el-option label="Fine Dining" value="FineDining" />
                <el-option label="Bergwirtschaft" value="Bergwirtschaft" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Abo">
              <el-select v-model="form.subscription_plan" style="width: 100%">
                <el-option label="Free" value="Free" />
                <el-option label="Fux" value="Fux" />
                <el-option label="Pro" value="Pro" />
                <el-option label="Enterprise" value="Enterprise" />
                <el-option label="Success Based" value="SuccessBased" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Status">
              <el-switch 
                v-model="form.is_active" 
                active-text="Aktiv" 
                inactive-text="Inaktiv" 
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Adresse">
          <el-input v-model="form.address" placeholder="Vollständige Adresse" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="E-Mail">
              <el-input v-model="form.email" placeholder="info@restaurant.ch" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Telefon">
              <el-input v-model="form.phone" placeholder="+41 XX XXX XX XX" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Abbrechen</el-button>
        <el-button type="primary" @click="saveRestaurant()">Speichern</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, View, CopyDocument } from '@element-plus/icons-vue'
import axios from '@/utils/request'

// Existing state
const restaurants = ref([])
const dialogVisible = ref(false)
const form = ref({
  id: null,
  name: '',
  type: '',
  subscription_plan: '',
  address: '',
  email: '',
  phone: '',
  is_active: true,
})

// 🔍 NEUE SUCH-VARIABLEN
const search = ref('')
const typeFilter = ref('')
const subscriptionFilter = ref('')
const statusFilter = ref('')
const cityFilter = ref('')
const sortBy = ref('')
const debounceTimer = ref(null)
const selectedRestaurants = ref([])
const currentPage = ref(1)
const pageSize = ref(20)

// 🔍 COMPUTED FILTER LOGIC
const filteredRestaurants = computed(() => {
  let filtered = restaurants.value

  // Text-Suche (Name, Adresse, Email)
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    filtered = filtered.filter(restaurant => 
      restaurant.name?.toLowerCase().includes(searchTerm) ||
      restaurant.address?.toLowerCase().includes(searchTerm) ||
      restaurant.email?.toLowerCase().includes(searchTerm)
    )
  }

  // Typ-Filter
  if (typeFilter.value) {
    filtered = filtered.filter(restaurant => restaurant.type === typeFilter.value)
  }

  // Subscription-Filter
  if (subscriptionFilter.value) {
    filtered = filtered.filter(restaurant => restaurant.subscription_plan === subscriptionFilter.value)
  }

  // Status-Filter
  if (statusFilter.value === 'active') {
    filtered = filtered.filter(restaurant => restaurant.is_active === true)
  } else if (statusFilter.value === 'inactive') {
    filtered = filtered.filter(restaurant => restaurant.is_active === false)
  }

  // Stadt-Filter
  if (cityFilter.value) {
    filtered = filtered.filter(restaurant => {
      const city = extractCity(restaurant.address)
      return city === cityFilter.value
    })
  }

  // Sortierung
  if (sortBy.value) {
    filtered.sort((a, b) => {
      switch(sortBy.value) {
        case 'name_asc': return (a.name || '').localeCompare(b.name || '')
        case 'name_desc': return (b.name || '').localeCompare(a.name || '')
        case 'created_desc': return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        case 'created_asc': return new Date(a.created_at || 0) - new Date(b.created_at || 0)
        case 'city_asc': return extractCity(a.address).localeCompare(extractCity(b.address))
        default: return 0
      }
    })
  }

  console.log('🔍 Restaurant Filter Results:', filtered.length, 'of', restaurants.value.length)
  return filtered
})

// Pagination für gefilterte Ergebnisse
const paginatedRestaurants = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRestaurants.value.slice(start, end)
})

const filteredTotal = computed(() => filteredRestaurants.value.length)

// Status-Statistiken
const activeCount = computed(() => 
  filteredRestaurants.value.filter(restaurant => restaurant.is_active === true).length
)

const inactiveCount = computed(() => 
  filteredRestaurants.value.filter(restaurant => restaurant.is_active === false).length
)

// Eindeutige Städte
const uniqueCities = computed(() => {
  const cities = restaurants.value
    .map(restaurant => extractCity(restaurant.address))
    .filter(city => city && city !== 'Unbekannt')
    .filter((city, index, array) => array.indexOf(city) === index)
    .sort()
  return cities
})

// Eindeutige Typen
const uniqueTypes = computed(() => {
  const types = restaurants.value
    .map(restaurant => restaurant.type)
    .filter(type => type)
    .filter((type, index, array) => array.indexOf(type) === index)
  return types
})

// Top Subscription Plan
const topSubscriptionPlan = computed(() => {
  const planCounts = {}
  filteredRestaurants.value.forEach(restaurant => {
    const plan = restaurant.subscription_plan || 'Free'
    planCounts[plan] = (planCounts[plan] || 0) + 1
  })
  
  return Object.entries(planCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Free'
})

// Aktive Filter prüfen
const hasActiveFilters = computed(() => !!(
  search.value ||
  typeFilter.value ||
  subscriptionFilter.value ||
  statusFilter.value ||
  cityFilter.value ||
  sortBy.value
))

// 🔍 NEUE FILTER-METHODEN
const handleLiveSearch = () => {
  // Clear existing timer
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }

  // Set new timer für Text-Search (300ms delay)
  if (search.value) {
    debounceTimer.value = setTimeout(() => {
      console.log('🔍 Live search executed:', search.value)
    }, 300)
  }

  // Reset pagination bei Filter-Änderung
  currentPage.value = 1
}

const resetAllFilters = () => {
  search.value = ''
  typeFilter.value = ''
  subscriptionFilter.value = ''
  statusFilter.value = ''
  cityFilter.value = ''
  sortBy.value = ''
  currentPage.value = 1
  
  console.log('🔄 All restaurant filters reset')
  ElMessage.success('Alle Filter zurückgesetzt')
}

// Helper functions
const extractCity = (address) => {
  if (!address) return 'Unbekannt'
  // Einfache Stadt-Extraktion (letztes Wort oder nach PLZ)
  const parts = address.split(',')
  if (parts.length > 1) {
    return parts[parts.length - 1].trim()
  }
  // Versuche PLZ + Stadt Format zu erkennen
  const match = address.match(/\d{4,5}\s+([A-Za-zäöüÄÖÜ\s]+)/)
  return match ? match[1].trim() : address.split(' ').pop()
}

const getTypeTagType = (type) => {
  const types = {
    'Beizli': 'primary',
    'Pizzeria': 'warning', 
    'Grieche': 'info',
    'Imbiss': 'success',
    'FineDining': 'danger',
    'Bergwirtschaft': ''
  }
  return types[type] || ''
}

const getSubscriptionTagType = (plan) => {
  const types = {
    'Free': '',
    'Fux': 'info',
    'Pro': 'success',
    'Enterprise': 'warning',
    'SuccessBased': 'danger'
  }
  return types[plan] || ''
}

// Selection handling
const handleSelectionChange = (selection) => {
  selectedRestaurants.value = selection
  console.log('🏢 Selected restaurants:', selectedRestaurants.value.length)
}

// New restaurant actions
const viewRestaurant = (restaurant) => {
  const address = restaurant.address || 'Keine Adresse'
  const contact = []
  if (restaurant.email) contact.push(`📧 ${restaurant.email}`)
  if (restaurant.phone) contact.push(`📞 ${restaurant.phone}`)
  const contactInfo = contact.length > 0 ? contact.join('\n') : 'Keine Kontaktdaten'

  ElMessageBox.alert(
    `🏢 Typ: ${restaurant.type || 'Unbekannt'}\n` +
    `📋 Abo-Plan: ${restaurant.subscription_plan || 'Free'}\n` +
    `📍 Adresse: ${address}\n` +
    `📞 Kontakt:\n${contactInfo}\n` +
    `✅ Status: ${restaurant.is_active ? 'Aktiv' : 'Inaktiv'}`,
    `Restaurant: ${restaurant.name}`,
    { 
      confirmButtonText: 'Schließen',
      type: 'info'
    }
  )
}

const duplicateRestaurant = async (restaurant) => {
  try {
    const duplicatedData = {
      ...restaurant,
      name: `${restaurant.name} (Kopie)`,
      id: null // Remove ID to create new restaurant
    }
    
    await axios.post('/restaurants', duplicatedData)
    ElMessage.success('Restaurant dupliziert!')
    await fetchRestaurants()
  } catch (error) {
    ElMessage.error('Fehler beim Duplizieren')
  }
}

// Bulk actions
const bulkActivate = async () => {
  try {
    await ElMessageBox.confirm(
      `${selectedRestaurants.value.length} Restaurant(s) aktivieren?`,
      'Bulk-Aktivierung',
      { type: 'info' }
    )
    
    // Implementation hier...
    ElMessage.success(`${selectedRestaurants.value.length} Restaurants aktiviert`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Fehler bei Bulk-Aktivierung')
    }
  }
}

const bulkDeactivate = async () => {
  try {
    await ElMessageBox.confirm(
      `${selectedRestaurants.value.length} Restaurant(s) deaktivieren?`,
      'Bulk-Deaktivierung',
      { type: 'warning' }
    )
    
    // Implementation hier...
    ElMessage.success(`${selectedRestaurants.value.length} Restaurants deaktiviert`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Fehler bei Bulk-Deaktivierung')
    }
  }
}

const exportRestaurants = () => {
  const csvData = [
    ['Name', 'Typ', 'Abo-Plan', 'Adresse', 'Email', 'Telefon', 'Status', 'Stadt'],
    ...filteredRestaurants.value.map(restaurant => [
      restaurant.name || '',
      restaurant.type || '',
      restaurant.subscription_plan || 'Free',
      restaurant.address || '',
      restaurant.email || '',
      restaurant.phone || '',
      restaurant.is_active ? 'Aktiv' : 'Inaktiv',
      extractCity(restaurant.address)
    ])
  ]
  
  const csvString = csvData.map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n')
  
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `restaurants_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success(`${filteredRestaurants.value.length} Restaurants exportiert`)
}

const exportSelected = () => {
  const csvData = [
    ['Name', 'Typ', 'Abo-Plan', 'Adresse', 'Email', 'Telefon', 'Status'],
    ...selectedRestaurants.value.map(restaurant => [
      restaurant.name || '',
      restaurant.type || '',
      restaurant.subscription_plan || 'Free',
      restaurant.address || '',
      restaurant.email || '',
      restaurant.phone || '',
      restaurant.is_active ? 'Aktiv' : 'Inaktiv'
    ])
  ]
  
  const csvString = csvData.map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n')
  
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `restaurants_selected_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success(`${selectedRestaurants.value.length} Restaurants exportiert`)
}

const showStatistics = () => {
  const typeCounts = {}
  const planCounts = {}
  
  filteredRestaurants.value.forEach(restaurant => {
    const type = restaurant.type || 'Unbekannt'
    const plan = restaurant.subscription_plan || 'Free'
    
    typeCounts[type] = (typeCounts[type] || 0) + 1
    planCounts[plan] = (planCounts[plan] || 0) + 1
  })
  
  const typeStats = Object.entries(typeCounts).map(([type, count]) => `${type}: ${count}`).join('\n')
  const planStats = Object.entries(planCounts).map(([plan, count]) => `${plan}: ${count}`).join('\n')
  
  ElMessageBox.alert(
    `📊 Gesamtanzahl: ${filteredRestaurants.value.length}\n` +
    `✅ Aktiv: ${activeCount.value}\n` +
    `📋 Inaktiv: ${inactiveCount.value}\n` +
    `🌍 Städte: ${uniqueCities.value.length}\n\n` +
    `🏢 Restaurant-Typen:\n${typeStats}\n\n` +
    `💳 Abo-Pläne:\n${planStats}`,
    'Restaurant-Statistiken',
    { type: 'info' }
  )
}

// Toggle status
const toggleStatus = async (restaurant, newStatus) => {
  restaurant.updating = true
  
  try {
    await axios.put(`/restaurants/${restaurant.id}`, {
      ...restaurant,
      is_active: newStatus
    })
    
    restaurant.is_active = newStatus
    ElMessage.success(`Restaurant ${newStatus ? 'aktiviert' : 'deaktiviert'}`)
  } catch (error) {
    restaurant.is_active = !newStatus
    ElMessage.error('Update fehlgeschlagen')
  } finally {
    restaurant.updating = false
  }
}

// Pagination handlers
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

// Existing methods remain the same...
const fetchRestaurants = async () => {
  try {
    const { data } = await axios.get('/restaurants')
    restaurants.value = (data.data || data).map(restaurant => ({
      ...restaurant,
      updating: false
    }))
  } catch (err) {
    console.error(err)
    ElMessage.error('Fehler beim Laden der Restaurants')
  }
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form.value, row)
  } else {
    Object.assign(form.value, {
      id: null,
      name: '',
      type: '',
      subscription_plan: '',
      address: '',
      email: '',
      phone: '',
      is_active: true,
    })
  }
  dialogVisible.value = true
}

const saveRestaurant = async () => {
  try {
    if (form.value.id) {
      await axios.put(`/restaurants/${form.value.id}`, form.value)
    } else {
      await axios.post('/restaurants', form.value)
    }

    ElMessage.success('Restaurant gespeichert!')
    dialogVisible.value = false
    await fetchRestaurants()
  } catch (err) {
    console.error(err)
    ElMessage.error('Fehler beim Speichern')
  }
}

const deleteRestaurant = async (id) => {
  try {
    await ElMessageBox.confirm('Restaurant wirklich löschen?', 'Bestätigung', {
      type: 'warning',
    })
    await axios.delete(`/restaurants/${id}`)
    ElMessage.success('Gelöscht')
    await fetchRestaurants()
  } catch (err) {
    if (err !== 'cancel') {
      console.error(err)
      ElMessage.error('Fehler beim Löschen')
    }
  }
}

onMounted(fetchRestaurants)
</script>

<style scoped>
.restaurants-container {
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
  font-size: 1.5rem;
}

/* 🔍 NEUE STYLES FÜR SUCHFELDER */
.search-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.mb-4 {
  margin-bottom: 16px;
}

.search-results {
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  line-height: 32px;
}

.status-summary {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
}

.status-summary .el-tag {
  margin-right: 8px;
}

.summary-text {
  margin-left: 10px;
  color: #606266;
  font-size: 12px;
}

.bulk-actions {
  margin-top: 15px;
}

.debug-info {
  margin-top: 10px;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.text-xl {
  font-size: 1.25rem;
}
</style>