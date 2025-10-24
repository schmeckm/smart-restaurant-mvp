<template>
  <div class="profile-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>Benutzerprofil</h2>
        </div>
      </template>

      <el-form :model="profileForm" label-width="120px" :disabled="!editing">
        <el-form-item label="Name">
          <el-input v-model="profileForm.name" />
        </el-form-item>

        <el-form-item label="E-Mail">
          <el-input v-model="profileForm.email" disabled />
        </el-form-item>

        <el-form-item label="Telefon">
          <el-input v-model="profileForm.phone" />
        </el-form-item>

        <el-form-item label="Rolle">
          <el-tag :type="getRoleType(profileForm.role)">
            {{ getRoleLabel(profileForm.role) }}
          </el-tag>
        </el-form-item>

        <el-form-item label="Erstellt am">
          <span>{{ formatDate(profileForm.createdAt) }}</span>
        </el-form-item>

        <el-form-item>
          <el-button v-if="!editing" type="primary" @click="editing = true">
            Bearbeiten
          </el-button>
          <template v-else>
            <el-button type="primary" @click="handleSave">Speichern</el-button>
            <el-button @click="handleCancel">Abbrechen</el-button>
          </template>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Password Change Card -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <h3>Passwort ändern</h3>
        </div>
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
          <el-button type="primary" @click="handlePasswordChange">
            Passwort ändern
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

export default {
  name: 'Profile',
  setup() {
    const store = useStore()
    const editing = ref(false)
    
    const user = computed(() => store.getters['user/user'])
    
    const profileForm = reactive({
      name: '',
      email: '',
      phone: '',
      role: '',
      createdAt: null
    })

    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    const originalProfile = ref({})

    const loadProfile = () => {
      if (user.value) {
        Object.assign(profileForm, {
          name: user.value.name || '',
          email: user.value.email || '',
          phone: user.value.phone || '',
          role: user.value.role || 'user',
          createdAt: user.value.createdAt || null
        })
        originalProfile.value = { ...profileForm }
      }
    }

    const formatDate = (date) => {
      return date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '-'
    }

    const getRoleType = (role) => {
      const types = {
        admin: 'danger',
        manager: 'warning',
        user: 'info'
      }
      return types[role] || 'info'
    }

    const getRoleLabel = (role) => {
      const labels = {
        admin: 'Administrator',
        manager: 'Manager',
        user: 'Benutzer'
      }
      return labels[role] || role
    }

    const handleSave = async () => {
      try {
        await store.dispatch('user/updateProfile', {
          name: profileForm.name,
          phone: profileForm.phone
        })
        ElMessage.success('Profil aktualisiert')
        editing.value = false
        originalProfile.value = { ...profileForm }
      } catch (error) {
        ElMessage.error('Fehler beim Speichern')
      }
    }

    const handleCancel = () => {
      Object.assign(profileForm, originalProfile.value)
      editing.value = false
    }

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
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
      } catch (error) {
        ElMessage.error('Fehler beim Ändern des Passworts')
      }
    }

    onMounted(() => {
      loadProfile()
    })

    return {
      editing,
      profileForm,
      passwordForm,
      formatDate,
      getRoleType,
      getRoleLabel,
      handleSave,
      handleCancel,
      handlePasswordChange
    }
  }
}
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

.card-header h2,
.card-header h3 {
  margin: 0;
}
</style>