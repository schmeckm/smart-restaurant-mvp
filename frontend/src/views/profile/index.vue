<template>
  <div class="profile-container">
    <!-- 🧍 Benutzerprofil -->
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>Benutzerprofil</h2>
        </div>
      </template>

      <el-form :model="profileForm" label-width="140px">
        <!-- Name -->
        <el-form-item label="Name">
          <el-input v-model="profileForm.name" :disabled="!editing" />
        </el-form-item>

        <!-- E-Mail -->
        <el-form-item label="E-Mail">
          <el-input v-model="profileForm.email" disabled />
        </el-form-item>

        <!-- Telefon -->
        <el-form-item label="Telefon">
          <el-input v-model="profileForm.phone" :disabled="!editing" />
        </el-form-item>

        <!-- Rolle -->
        <el-form-item label="Rolle">
          <el-tag :type="getRoleType(profileForm.role)">
            {{ getRoleLabel(profileForm.role) }}
          </el-tag>
        </el-form-item>

        <!-- Restaurant -->
        <el-form-item label="Restaurant">
          <div>
            <div><strong>{{ profileForm.restaurantName }}</strong></div>
            <div class="text-muted" style="font-size: 13px">
              ID: {{ profileForm.restaurantId }}
            </div>
          </div>
        </el-form-item>

        <!-- Sprache -->
        <el-form-item label="Sprache">
          <el-select
            v-model="profileForm.uiLanguage"
            placeholder="Sprache wählen"
            :disabled="!editing"
          >
            <el-option label="Deutsch" value="de" />
            <el-option label="Englisch" value="en" />
            <el-option label="Französisch" value="fr" />
            <el-option label="Italienisch" value="it" />
            <el-option label="Spanisch" value="es" />
          </el-select>
        </el-form-item>

        <!-- Erstellungsdatum -->
        <el-form-item label="Erstellt am">
          <span>{{ formatDate(profileForm.createdAt) }}</span>
        </el-form-item>
      </el-form>

      <!-- Aktionen -->
      <div class="action-buttons">
        <template v-if="!editing">
          <el-button type="primary" @click="startEditing">Bearbeiten</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="handleSave">Speichern</el-button>
          <el-button @click="handleCancel">Abbrechen</el-button>
        </template>
      </div>
    </el-card>

    <!-- 🔒 Passwort ändern -->
    <el-card class="password-card">
      <template #header>
        <h3>Passwort ändern</h3>
      </template>

      <el-form :model="passwordForm" label-width="150px">
        <el-form-item label="Aktuelles Passwort">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password />
        </el-form-item>

        <el-form-item label="Neues Passwort">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>

        <el-form-item label="Passwort bestätigen">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handlePasswordChange">Passwort ändern</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

// Vuex Store
const store = useStore()

// Reaktiver Zustand
const editing = ref(false)
const user = computed(() => store.getters['user/user'])

// Formulare
const profileForm = reactive({
  name: '',
  email: '',
  phone: '',
  role: '',
  createdAt: null,
  restaurantId: '',
  restaurantName: '',
  uiLanguage: 'de'
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const originalProfile = ref({})

// Profil-Daten laden
const loadProfile = () => {
  if (!user.value) return
  console.log('🔄 Lade Profil-Daten:', user.value)

  Object.assign(profileForm, {
    name: user.value.name || '',
    email: user.value.email || '',
    phone: user.value.phone || '',
    role: user.value.role || 'user',
    createdAt: user.value.createdAt || null,
    restaurantId: user.value.restaurant?.id || '',
    restaurantName: user.value.restaurant?.name || '',
    uiLanguage: user.value.uiLanguage || 'de'
  })

  originalProfile.value = { ...profileForm }
  console.log('✅ Profil geladen:', profileForm)
}

// Editmodus starten
const startEditing = () => {
  console.log('🟢 Editmodus aktiviert')
  editing.value = true
}

// Datum formatieren
const formatDate = (date) => (date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '-')

// Rollentyp (Tag Farbe)
const getRoleType = (role) =>
  ({ admin: 'danger', manager: 'warning', employee: 'info' }[role] || 'info')

// Rollenlabel
const getRoleLabel = (role) =>
  ({ admin: 'Administrator', manager: 'Manager', employee: 'Mitarbeiter' }[role] || role)

// Speichern
const handleSave = async () => {
  try {
    console.log('📤 Profil speichern:', profileForm)
    await store.dispatch('user/updateProfile', {
      name: profileForm.name,
      uiLanguage: profileForm.uiLanguage,
      phone: profileForm.phone
    })
    ElMessage.success('Profil erfolgreich aktualisiert')
    editing.value = false
    originalProfile.value = { ...profileForm }
  } catch (error) {
    console.error('❌ Fehler beim Speichern:', error)
    ElMessage.error('Fehler beim Speichern')
  }
}

// Abbrechen
const handleCancel = () => {
  Object.assign(profileForm, originalProfile.value)
  editing.value = false
}

// Passwort ändern
const handlePasswordChange = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('Passwörter stimmen nicht überein')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.error('Passwort muss mindestens 6 Zeichen lang sein')
    return
  }

  try {
    await store.dispatch('user/changePassword', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('Passwort geändert')
    Object.assign(passwordForm, { currentPassword: '', newPassword: '', confirmPassword: '' })
  } catch (error) {
    console.error('❌ Fehler beim Ändern des Passworts:', error)
    ElMessage.error('Fehler beim Ändern des Passworts')
  }
}

// Beobachten, wenn Userdaten neu geladen werden
watch(
  user,
  (newUser) => {
    if (newUser) {
      console.log('👀 User-Änderung erkannt – Profil neu laden')
      loadProfile()
    }
  },
  { immediate: true }
)

onMounted(() => {
  console.log('🟢 Profile-Komponente geladen')
  loadProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.action-buttons {
  margin-top: 20px;
  text-align: right;
}
.password-card {
  margin-top: 20px;
}
</style>
