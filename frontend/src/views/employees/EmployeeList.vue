<template>
  <div class="employees-container">
    <div class="header-section">
      <h2>Mitarbeiter verwalten</h2>
      <el-button 
        type="primary" 
        icon="Plus" 
        @click="showCreateDialog = true"
      >
        Neuer Mitarbeiter
      </el-button>
    </div>

    <!-- Filter Section -->
    <el-card class="filter-section" style="margin-bottom: 20px;">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchQuery"
            placeholder="Nach Name oder Email suchen..."
            prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="selectedDepartment"
            placeholder="Abteilung"
            clearable
            @change="fetchEmployees"
          >
            <el-option label="Alle" value="" />
            <el-option label="Küche" value="kitchen" />
            <el-option label="Service" value="service" />
            <el-option label="Bar" value="bar" />
            <el-option label="Management" value="management" />
            <el-option label="Reinigung" value="cleaning" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="selectedPosition"
            placeholder="Position"
            clearable
            @change="fetchEmployees"
          >
            <el-option label="Alle" value="" />
            <el-option label="Manager" value="manager" />
            <el-option label="Küchenchef" value="chef" />
            <el-option label="Koch" value="cook" />
            <el-option label="Kellner" value="waiter" />
            <el-option label="Barkeeper" value="bartender" />
            <el-option label="Reinigung" value="cleaner" />
            <el-option label="Kassierer" value="cashier" />
            <el-option label="Gastgeber" value="host" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- Employees Table -->
    <!-- Employees Table -->
<el-table 
  v-loading="loading"
  :data="localEmployees" 
  border
  style="width: 100%"
>
  <el-table-column prop="employeeNumber" label="Nr." width="100" />
  
  <el-table-column label="Name" width="200">
    <template #default="{ row }">
      <div>
        <div style="font-weight: 500;">{{ row.firstName }} {{ row.lastName }}</div>
        <div style="font-size: 12px; color: #909399;">{{ row.email }}</div>
      </div>
    </template>
  </el-table-column>

  <!-- Abteilung zuerst -->
  <el-table-column label="Abteilung" width="140">
    <template #default="{ row }">
      <el-tag :type="getDepartmentTagType(row.department)" size="small">
        {{ getDepartmentLabel(row.department) }}
      </el-tag>
    </template>
  </el-table-column>

  <!-- Position danach -->
  <el-table-column label="Position" width="130">
    <template #default="{ row }">
      <el-tag :type="getPositionTagType(row.position)" size="small">
        {{ getPositionLabel(row.position) }}
      </el-tag>
    </template>
  </el-table-column>

  <!-- Stundenlohn -->
  <el-table-column prop="hourlyWage" label="Stundenlohn (€)" width="130" align="center">
    <template #default="{ row }">
      €{{ parseFloat(row.hourlyWage || 0).toFixed(2) }}
    </template>
  </el-table-column>

  <!-- Breitere Performance-Spalte -->
  <el-table-column label="Performance" width="170" align="center">
    <template #default="{ row }">
      <div class="performance-cell">
        <div class="score">{{ parseFloat(row.performanceScore || 0).toFixed(1) }}/10</div>
        <el-rate
          :model-value="parseFloat(row.performanceScore || 0) / 2"
          disabled
          size="small"
          :colors="['#F7BA2A', '#F7BA2A', '#F7BA2A']"
          show-score
          text-color="#ff9900"
          score-template=""
        />
      </div>
    </template>
  </el-table-column>

  <!-- Aktiv -->
  <el-table-column label="Aktiv" width="100" align="center">
    <template #default="{ row, $index }">
      <el-switch
        :model-value="row.activeStatus"
        @change="(val) => toggleStatus(row, $index, val)"
        :loading="row.updating"
      />
    </template>
  </el-table-column>

  <!-- Breitere Aktionen-Spalte -->
  <el-table-column label="Aktionen" width="300" align="center">
    <template #default="{ row }">
      <div class="action-buttons">
        <el-button
          type="info"
          size="small"
          icon="View"
          @click="viewEmployee(row)"
          title="Details anzeigen"
        />
        <el-button
          type="primary"
          size="small"
          icon="Edit"
          @click="editEmployee(row)"
          title="Bearbeiten"
        />
        <el-button
          type="warning"
          size="small"
          icon="Timer"
          @click="editAvailability(row)"
          title="Verfügbarkeit"
        />
        <el-button
          type="danger"
          size="small"
          icon="Delete"
          @click="confirmDelete(row)"
          title="Löschen"
        />
      </div>
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
      :title="editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter erstellen'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="employeeFormRef"
        :model="employeeForm"
        :rules="employeeRules"
        label-width="140px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Vorname" prop="firstName">
              <el-input 
                v-model="employeeForm.firstName" 
                placeholder="Max"
                :disabled="saving"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Nachname" prop="lastName">
              <el-input 
                v-model="employeeForm.lastName" 
                placeholder="Mustermann"
                :disabled="saving"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Email" prop="email">
              <el-input 
                v-model="employeeForm.email" 
                placeholder="max@restaurant.com"
                :disabled="saving"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Telefon">
              <el-input 
                v-model="employeeForm.phone" 
                placeholder="+49 123 456789"
                :disabled="saving"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Position" prop="position">
              <el-select v-model="employeeForm.position" placeholder="Position wählen" :disabled="saving">
                <el-option label="Manager" value="manager" />
                <el-option label="Küchenchef" value="chef" />
                <el-option label="Koch" value="cook" />
                <el-option label="Kellner" value="waiter" />
                <el-option label="Barkeeper" value="bartender" />
                <el-option label="Reinigung" value="cleaner" />
                <el-option label="Kassierer" value="cashier" />
                <el-option label="Gastgeber" value="host" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Abteilung" prop="department">
              <el-select v-model="employeeForm.department" placeholder="Abteilung wählen" :disabled="saving">
                <el-option label="Küche" value="kitchen" />
                <el-option label="Service" value="service" />
                <el-option label="Bar" value="bar" />
                <el-option label="Management" value="management" />
                <el-option label="Reinigung" value="cleaning" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Anstellungsart">
              <el-select v-model="employeeForm.employmentType" :disabled="saving">
                <el-option label="Vollzeit" value="fulltime" />
                <el-option label="Teilzeit" value="parttime" />
                <el-option label="Befristet" value="temporary" />
                <el-option label="Praktikant" value="intern" />
                <el-option label="Freelancer" value="freelance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Stundenlohn (€)" prop="hourlyWage">
              <el-input-number 
                v-model="employeeForm.hourlyWage" 
                :min="0" 
                :max="100" 
                :precision="2"
                :disabled="saving"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Max. Std./Woche">
              <el-input-number 
                v-model="employeeForm.maxHoursPerWeek" 
                :min="1" 
                :max="60"
                :disabled="saving"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Skill Level">
              <el-rate
                v-model="employeeForm.skillLevel"
                :max="10"
                show-score
                text-color="#ff9900"
                score-template="{value}/10"
                :disabled="saving"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Zertifikate">
          <el-select
            v-model="employeeForm.certifications"
            multiple
            placeholder="Zertifikate auswählen"
            :disabled="saving"
            style="width: 100%"
          >
            <el-option label="Lebensmittelhygiene" value="food_safety" />
            <el-option label="Erste Hilfe" value="first_aid" />
            <el-option label="Barkeeper-Lizenz" value="bartending" />
            <el-option label="Wein-Kenntnisse" value="wine_knowledge" />
            <el-option label="Kundenservice" value="customer_service" />
            <el-option label="Teamleitung" value="team_leadership" />
            <el-option label="Fortgeschrittenes Kochen" value="advanced_cooking" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Sprachen">
          <el-select
            v-model="employeeForm.languages"
            multiple
            placeholder="Sprachen auswählen"
            :disabled="saving"
            style="width: 100%"
          >
            <el-option label="Deutsch" value="german" />
            <el-option label="Englisch" value="english" />
            <el-option label="Französisch" value="french" />
            <el-option label="Italienisch" value="italian" />
            <el-option label="Spanisch" value="spanish" />
            <el-option label="Türkisch" value="turkish" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Einstellungsdatum">
          <el-date-picker
            v-model="employeeForm.hireDate"
            type="date"
            placeholder="Datum wählen"
            :disabled="saving"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="Notizen">
          <el-input
            v-model="employeeForm.notes"
            type="textarea"
            :rows="3"
            placeholder="Zusätzliche Informationen..."
            :disabled="saving"
          />
        </el-form-item>
        
        <el-form-item label="Aktiv">
          <el-switch 
            v-model="employeeForm.isActive"
            active-text="Aktiv"
            inactive-text="Inaktiv"
            :disabled="saving"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialog" :disabled="saving">
            Abbrechen
          </el-button>
          <el-button 
            type="primary" 
            @click="saveEmployee"
            :loading="saving"
          >
            {{ editingEmployee ? 'Aktualisieren' : 'Erstellen' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Employee Details Dialog -->
    <el-dialog
      v-model="showDetailsDialog"
      title="Mitarbeiter Details"
      width="600px"
    >
      <div v-if="selectedEmployee">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Name">
            {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}
          </el-descriptions-item>
          <el-descriptions-item label="Mitarbeiter-Nr.">
            {{ selectedEmployee.employeeNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="Email">
            {{ selectedEmployee.email || 'Nicht angegeben' }}
          </el-descriptions-item>
          <el-descriptions-item label="Telefon">
            {{ selectedEmployee.phone || 'Nicht angegeben' }}
          </el-descriptions-item>
          <el-descriptions-item label="Position">
            {{ getPositionLabel(selectedEmployee.position) }}
          </el-descriptions-item>
          <el-descriptions-item label="Abteilung">
            {{ getDepartmentLabel(selectedEmployee.department) }}
          </el-descriptions-item>
          <el-descriptions-item label="Stundenlohn">
            €{{ parseFloat(selectedEmployee.hourlyWage || 0).toFixed(2) }}
          </el-descriptions-item>
          <el-descriptions-item label="Max. Std./Woche">
            {{ selectedEmployee.maxHoursPerWeek }}
          </el-descriptions-item>
          <el-descriptions-item label="Performance Score">
            {{ parseFloat(selectedEmployee.performanceScore || 0).toFixed(1) }}/10
          </el-descriptions-item>
          <el-descriptions-item label="Zuverlässigkeit">
            {{ parseFloat(selectedEmployee.reliabilityScore || 0).toFixed(1) }}/10
          </el-descriptions-item>
          <el-descriptions-item label="Einstellungsdatum">
            {{ formatDate(selectedEmployee.hireDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="Status">
            <el-tag :type="selectedEmployee.isActive ? 'success' : 'danger'">
              {{ selectedEmployee.isActive ? 'Aktiv' : 'Inaktiv' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="selectedEmployee.certifications && selectedEmployee.certifications.length > 0" style="margin-top: 20px;">
          <h4>Zertifikate:</h4>
          <el-tag
            v-for="cert in selectedEmployee.certifications"
            :key="cert"
            style="margin-right: 8px; margin-bottom: 8px;"
            type="success"
          >
            {{ getCertificationLabel(cert) }}
          </el-tag>
        </div>
        
        <div v-if="selectedEmployee.languages && selectedEmployee.languages.length > 0" style="margin-top: 20px;">
          <h4>Sprachen:</h4>
          <el-tag
            v-for="lang in selectedEmployee.languages"
            :key="lang"
            style="margin-right: 8px; margin-bottom: 8px;"
            type="info"
          >
            {{ getLanguageLabel(lang) }}
          </el-tag>
        </div>
        
        <div v-if="selectedEmployee.notes" style="margin-top: 20px;">
          <h4>Notizen:</h4>
          <p>{{ selectedEmployee.notes }}</p>
        </div>
      </div>
    </el-dialog>
    <!-- 🗓️ Verfügbarkeit-Dialog -->
<el-dialog
  v-if="showPatternDialog"
  v-model="showPatternDialog"
  title="Arbeitsmuster bearbeiten"
  width="500px"
>
  <el-form :model="patternForm" label-width="150px">
    <el-form-item label="Wochentage">
      <el-checkbox-group>
        <el-checkbox
          v-for="day in daysOfWeek"
          :key="day.key"
          v-model="patternForm[day.key]"
        >
          {{ day.label }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <el-form-item label="Startzeit">
      <el-time-picker v-model="patternForm.preferred_start" style="width: 100%" />
    </el-form-item>

    <el-form-item label="Endzeit">
      <el-time-picker v-model="patternForm.preferred_end" style="width: 100%" />
    </el-form-item>

    <el-form-item label="Notizen">
      <el-input v-model="patternForm.notes" type="textarea" :rows="3" />
    </el-form-item>
  </el-form>

  <template #footer>
    <el-button @click="showPatternDialog = false">Abbrechen</el-button>
    <el-button type="primary" @click="savePattern">Speichern</el-button>
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
const showDetailsDialog = ref(false)
const editingEmployee = ref(null)
const selectedEmployee = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
const selectedDepartment = ref('')
const selectedPosition = ref('')
const employeeFormRef = ref(null)

// Local reactive data
const localEmployees = ref([])

// Form data
const employeeForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  employmentType: 'fulltime',
  hourlyWage: 12.00,
  maxHoursPerWeek: 40,
  skillLevel: 5,
  certifications: [],
  languages: ['german'],
  hireDate: new Date(),
  notes: '',
  isActive: true
})

const patternForm = reactive({
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
  preferred_start: '',
  preferred_end: '',
  notes: ''
})

// --- Verfügbarkeits-Dialog ---
const showPatternDialog = ref(false)

const daysOfWeek = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
  { key: 'saturday', label: 'Samstag' },
  { key: 'sunday', label: 'Sonntag' }
]

// Speichern-Funktion
const savePattern = async () => {
  try {
    await store.dispatch('employees/saveEmployeePattern', {
      employeeId: editingEmployee.value.id,
      patternData: { ...patternForm }
    })
    ElMessage.success('Arbeitsmuster gespeichert')
    showPatternDialog.value = false
  } catch (error) {
    ElMessage.error('Fehler beim Speichern')
  }
}

// Form validation rules
const employeeRules = {
  firstName: [
    { required: true, message: 'Vorname ist erforderlich', trigger: 'blur' },
    { min: 2, max: 50, message: 'Vorname muss zwischen 2 und 50 Zeichen lang sein', trigger: 'blur' }
  ],
  lastName: [
    { required: true, message: 'Nachname ist erforderlich', trigger: 'blur' },
    { min: 2, max: 50, message: 'Nachname muss zwischen 2 und 50 Zeichen lang sein', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: 'Bitte geben Sie eine gültige Email-Adresse ein', trigger: 'blur' }
  ],
  position: [
    { required: true, message: 'Position ist erforderlich', trigger: 'change' }
  ],
  department: [
    { required: true, message: 'Abteilung ist erforderlich', trigger: 'change' }
  ],
  hourlyWage: [
    { required: true, message: 'Stundenlohn ist erforderlich', trigger: 'blur' },
    { type: 'number', min: 0, message: 'Stundenlohn muss mindestens 0 sein', trigger: 'blur' }
  ]
}

// Computed
const employees = computed(() => store.getters['employees/employees'] || [])
const total = computed(() => store.getters['employees/total'] || 0)

// Update local employees from store
const updateLocalEmployees = () => {
  localEmployees.value = employees.value.map(emp => ({
    ...emp,
    activeStatus: emp.isActive !== undefined ? emp.isActive : emp.is_active,
    updating: false
  }))
}

// Fetch employees
const fetchEmployees = async () => {
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    if (searchQuery.value) params.search = searchQuery.value
    if (selectedDepartment.value) params.department = selectedDepartment.value
    if (selectedPosition.value) params.position = selectedPosition.value
    
    await store.dispatch('employees/fetchEmployees', params)
    updateLocalEmployees()
  } catch (error) {
    ElMessage.error('Fehler beim Laden der Mitarbeiter')
  } finally {
    loading.value = false
  }
}

// Search handler
let searchTimeout
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchEmployees()
  }, 500)
}

// Toggle employee status
const toggleStatus = async (employee, index, newStatus) => {
  localEmployees.value[index].activeStatus = newStatus
  localEmployees.value[index].updating = true
  
  try {
    await store.dispatch('employees/updateEmployee', {
      id: employee.id,
      data: { isActive: newStatus }
    })
    
    ElMessage.success(`Mitarbeiter ${newStatus ? 'aktiviert' : 'deaktiviert'}`)
  } catch (error) {
    localEmployees.value[index].activeStatus = !newStatus
    ElMessage.error('Update fehlgeschlagen')
  } finally {
    localEmployees.value[index].updating = false
  }
}

// View employee details
const viewEmployee = (employee) => {
  selectedEmployee.value = employee
  showDetailsDialog.value = true
}

// Edit employee
const editEmployee = (employee) => {
  editingEmployee.value = { ...employee }
  employeeForm.firstName = employee.firstName
  employeeForm.lastName = employee.lastName
  employeeForm.email = employee.email || ''
  employeeForm.phone = employee.phone || ''
  employeeForm.position = employee.position
  employeeForm.department = employee.department
  employeeForm.employmentType = employee.employmentType || 'fulltime'
  employeeForm.hourlyWage = parseFloat(employee.hourlyWage || 0)
  employeeForm.maxHoursPerWeek = employee.maxHoursPerWeek || 40
  employeeForm.skillLevel = employee.skillLevel || 5
  employeeForm.certifications = employee.certifications || []
  employeeForm.languages = employee.languages || ['german']
  employeeForm.hireDate = employee.hireDate ? new Date(employee.hireDate) : new Date()
  employeeForm.notes = employee.notes || ''
  employeeForm.isActive = employee.activeStatus
  showCreateDialog.value = true
}

// Edit availability (placeholder)
// 🧩 Arbeitsmuster / Verfügbarkeits-Editor
const editAvailability = async (employee) => {
  try {
    editingEmployee.value = employee
    showPatternDialog.value = true

    // Lade gespeichertes Wochenmuster (falls vorhanden)
    const pattern = await store.dispatch('employees/fetchEmployeePattern', employee.id)
    if (pattern) {
      Object.assign(patternForm, pattern)
      ElMessage.success(`Arbeitsmuster für ${employee.firstName} geladen`)
    } else {
      // Standardwerte setzen, wenn noch kein Muster vorhanden
      Object.keys(patternForm).forEach(k => {
        patternForm[k] = typeof patternForm[k] === 'boolean' ? false : ''
      })
      ElMessage.info(`Kein Muster gefunden – bitte neu anlegen`)
    }
  } catch (err) {
    console.error('❌ Fehler beim Laden des Musters:', err)
    ElMessage.error('Fehler beim Laden des Arbeitsmusters')
  }
}

// Save employee
const saveEmployee = async () => {
  if (!employeeFormRef.value) return
  
  try {
    await employeeFormRef.value.validate()
  } catch {
    return
  }

  saving.value = true

  try {
    if (editingEmployee.value) {
      await store.dispatch('employees/updateEmployee', {
        id: editingEmployee.value.id,
        data: { ...employeeForm }
      })
      
      ElMessage.success('Mitarbeiter erfolgreich aktualisiert')
    } else {
      await store.dispatch('employees/createEmployee', { ...employeeForm })
      ElMessage.success('Mitarbeiter erfolgreich erstellt')
    }
    
    cancelDialog()
    await fetchEmployees()
    
  } catch (error) {
    ElMessage.error('Fehler beim Speichern: ' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

// Cancel dialog
const cancelDialog = () => {
  showCreateDialog.value = false
  editingEmployee.value = null
  
  // Reset form
  Object.assign(employeeForm, {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    employmentType: 'fulltime',
    hourlyWage: 12.00,
    maxHoursPerWeek: 40,
    skillLevel: 5,
    certifications: [],
    languages: ['german'],
    hireDate: new Date(),
    notes: '',
    isActive: true
  })
  
  if (employeeFormRef.value) {
    employeeFormRef.value.clearValidate()
  }
}

// Delete employee
const confirmDelete = async (employee) => {
  try {
    await ElMessageBox.confirm(
      `Möchten Sie den Mitarbeiter "${employee.firstName} ${employee.lastName}" wirklich löschen?`,
      'Mitarbeiter löschen',
      {
        confirmButtonText: 'Löschen',
        cancelButtonText: 'Abbrechen',
        type: 'warning',
      }
    )
    
    await store.dispatch('employees/deleteEmployee', employee.id)
    ElMessage.success('Mitarbeiter erfolgreich gelöscht')
    await fetchEmployees()
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
  fetchEmployees()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  fetchEmployees()
}

// Helper functions
const getPositionLabel = (position) => {
  const labels = {
    manager: 'Manager',
    chef: 'Küchenchef',
    cook: 'Koch',
    waiter: 'Kellner',
    bartender: 'Barkeeper',
    cleaner: 'Reinigung',
    cashier: 'Kassierer',
    host: 'Gastgeber'
  }
  return labels[position] || position
}

const getDepartmentLabel = (department) => {
  const labels = {
    kitchen: 'Küche',
    service: 'Service',
    bar: 'Bar',
    management: 'Management',
    cleaning: 'Reinigung'
  }
  return labels[department] || department
}

const getPositionTagType = (position) => {
  const types = {
    manager: 'danger',
    chef: 'success',
    cook: 'warning',
    waiter: 'primary',
    bartender: 'info',
    cleaner: '',
    cashier: 'warning',
    host: 'success'
  }
  return types[position] || ''
}

const getDepartmentTagType = (department) => {
  const types = {
    kitchen: 'warning',
    service: 'primary',
    bar: 'info',
    management: 'danger',
    cleaning: ''
  }
  return types[department] || ''
}

const getCertificationLabel = (cert) => {
  const labels = {
    food_safety: 'Lebensmittelhygiene',
    first_aid: 'Erste Hilfe',
    bartending: 'Barkeeper-Lizenz',
    wine_knowledge: 'Wein-Kenntnisse',
    customer_service: 'Kundenservice',
    team_leadership: 'Teamleitung',
    advanced_cooking: 'Fortgeschrittenes Kochen'
  }
  return labels[cert] || cert
}

const getLanguageLabel = (lang) => {
  const labels = {
    german: 'Deutsch',
    english: 'Englisch',
    french: 'Französisch',
    italian: 'Italienisch',
    spanish: 'Spanisch',
    turkish: 'Türkisch'
  }
  return labels[lang] || lang
}

const formatDate = (date) => {
  if (!date) return 'Nicht angegeben'
  return new Date(date).toLocaleDateString('de-DE')
}

// Lifecycle
onMounted(() => {
  fetchEmployees()
})
</script>

<style scoped>
.employees-container {
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

.filter-section {
  padding: 15px;
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

/* Custom styling for performance rating */
.el-rate {
  height: auto;
}

.el-rate__item {
  font-size: 12px;
}
</style>