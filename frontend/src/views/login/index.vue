<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span class="title">🍽️ Restaurant Planner</span>
        </div>
      </template>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="E-Mail"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Passwort"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button
          :loading="loading"
          type="primary"
          size="large"
          style="width: 100%"
          @click="handleLogin"
        >
          Anmelden
        </el-button>

        <div class="tips">
          <span>Demo: admin@example.com / admin123</span>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const store = useStore()
const router = useRouter()
const route = useRoute()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const loginRules = {
  email: [
    { required: true, message: 'Bitte E-Mail eingeben', trigger: 'blur' },
    { type: 'email', message: 'Bitte gültige E-Mail eingeben', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Bitte Passwort eingeben', trigger: 'blur' },
    { min: 6, message: 'Passwort muss mindestens 6 Zeichen haben', trigger: 'blur' }
  ]
}

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await store.dispatch('user/login', loginForm)
        await store.dispatch('user/getInfo')
        
        ElMessage.success('Erfolgreich angemeldet!')
        
        const redirect = route.query.redirect || '/dashboard'
        router.push(redirect)
      } catch (error) {
        ElMessage.error(error.message || 'Anmeldung fehlgeschlagen')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 450px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.card-header {
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.login-form {
  margin-top: 20px;
}

.tips {
  margin-top: 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>