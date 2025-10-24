<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>🍽️ Smart Restaurant Planner</h2>
          <p>Willkommen zurück!</p>
        </div>
      </template>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="E-Mail" prop="email">
          <el-input
            v-model="loginForm.email"
            type="email"
            placeholder="admin@restaurant.com"
            prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item label="Passwort" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Ihr Passwort"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            native-type="submit"
            style="width: 100%"
          >
            Anmelden
          </el-button>
        </el-form-item>

        <div class="login-hint">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <div style="font-size: 12px;">
                <strong>Demo-Zugangsdaten:</strong><br>
                E-Mail: admin@restaurant.com<br>
                Passwort: Admin123!
              </div>
            </template>
          </el-alert>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
  setup() {
    const store = useStore()
    const router = useRouter()
    const loading = ref(false)
    const loginFormRef = ref(null)

    const loginForm = reactive({
      email: '',
      password: ''
    })

    const loginRules = {
      email: [
        { required: true, message: 'Bitte E-Mail eingeben', trigger: 'blur' },
        { type: 'email', message: 'Ungültige E-Mail', trigger: 'blur' }
      ],
      password: [
        { required: true, message: 'Bitte Passwort eingeben', trigger: 'blur' },
        { min: 6, message: 'Mindestens 6 Zeichen', trigger: 'blur' }
      ]
    }

    const handleLogin = async () => {
      if (!loginFormRef.value) return
      
      try {
        await loginFormRef.value.validate()
        loading.value = true

        await store.dispatch('user/login', loginForm)
        ElMessage.success('Erfolgreich angemeldet')
        
        // Zur Dashboard weiterleiten
        router.push('/dashboard')
        
      } catch (error) {
        if (error !== false) {
          const message = error?.response?.data?.message || error.message || 'Login fehlgeschlagen'
          ElMessage.error(message)
        }
      } finally {
        loading.value = false
      }
    }

    return {
      loading,
      loginForm,
      loginRules,
      loginFormRef,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 450px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.card-header {
  text-align: center;
  margin-bottom: 10px;
}

.card-header h2 {
  margin: 0 0 10px;
  color: #303133;
  font-size: 28px;
}

.card-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.login-hint {
  margin-top: 20px;
}

:deep(.el-input__wrapper) {
  padding: 12px 15px;
}

:deep(.el-button--primary) {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}
</style>