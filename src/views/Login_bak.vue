<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>留言板登录</h2>
      </template>
      
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

export default defineComponent({
  name: 'Login',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const loginFormRef = ref<FormInstance>()
    const loading = ref(false)

    const loginForm = reactive({
      password: ''
    })

    const rules = {
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
      ]
    }

    const handleLogin = async () => {
      if (!loginFormRef.value) return
      
      await loginFormRef.value.validate(async (valid: boolean) => {
        if (valid) {
          loading.value = true
          try {
            // 这里后续会连接到后端API
            // 暂时使用模拟登录
            if (loginForm.password === 'admin123') {
              authStore.setToken('mock-token')
              ElMessage.success('登录成功')
              router.push('/board')
            } else {
              ElMessage.error('密码错误')
            }
          } catch (error) {
            ElMessage.error('登录失败')
          } finally {
            loading.value = false
          }
        }
      })
    }

    return {
      loginForm,
      rules,
      loginFormRef,
      loading,
      handleLogin
    }
  }
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.login-card {
  width: 400px;
}

h2 {
  text-align: center;
  margin: 0;
  color: #409EFF;
}
</style>
