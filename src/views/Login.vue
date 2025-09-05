<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>留言板登录</h2>
      </template>
      
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
        <!-- 登录类型选择 -->
        <el-form-item prop="loginType">
          <el-select v-model="loginForm.loginType" @change="handleLoginTypeChange">
            <el-option label="Line" value="line" />
            <el-option label="其它" value="other" />
          </el-select>
        </el-form-item>

        <!-- 帐号输入框 -->
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            :placeholder="loginForm.loginType === 'line' ? 'Line ID' : '请输入帐号'"
            :disabled="loginForm.loginType === 'line'"
          />
        </el-form-item>
        
        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <!-- LINE 登录按钮 -->
        <el-form-item v-if="loginForm.loginType === 'line'">
          <el-button type="primary" @click="handleLineLogin" style="width: 100%">
            使用 LINE 获取账号
          </el-button>
        </el-form-item>
        
        <!-- 普通登录按钮 -->
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
import { defineComponent, ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { liff } from '@line/liff'
import type { FormInstance } from 'element-plus'

export default defineComponent({
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const loginFormRef = ref<FormInstance>()
    const loading = ref(false)
    const savedLineId = ref(localStorage.getItem('lineId') || '')

    const loginForm = reactive({
      loginType: savedLineId.value ? 'line' : 'other',
      username: savedLineId.value || '',
      password: ''
    })

    const rules = {
      loginType: [{ required: true, message: '请选择登录类型', trigger: 'change' }],
      username: [{ required: true, message: '请输入帐号', trigger: 'blur' }],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
      ]
    }

    const handleLoginTypeChange = (value: string) => {
      if (value === 'line') {
        loginForm.username = savedLineId.value || ''
      } else {
        loginForm.username = ''
        loginForm.password = ''
      }
    }

    const handleLineLogin = () => {
      if (liff.isInClient()) {
        // 在 LINE 内部，使用 LIFF 登录
        liff.login()
      } else {
        // 在外部浏览器，使用 OAuth 登录
        const LINE_AUTH_URL = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${import.meta.env.VITE_LINE_CHANNEL_ID}&redirect_uri=${import.meta.env.VITE_LINE_REDIRECT_URI}&state=12345&scope=openid profile`
        window.location.href = LINE_AUTH_URL
      }
    }

    const handleLogin = async () => {
      if (!loginFormRef.value) return
      
      await loginFormRef.value.validate(async (valid: boolean) => {
        if (valid) {
          loading.value = true
          try {
            const response = await fetch('/api/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                loginType: loginForm.loginType,
                username: loginForm.username,
                password: loginForm.password
              })
            })

            const data = await response.json()
            
            if (data.success) {
              authStore.setToken(data.token)
              if (loginForm.loginType === 'line') {
                localStorage.setItem('lineId', loginForm.username)
              }
              ElMessage.success('登录成功')
              router.push('/board')
            } else {
              ElMessage.error(data.message || '登录失败')
            }
          } catch (error) {
            ElMessage.error('登录失败')
          } finally {
            loading.value = false
          }
        }
      })
    }

    onMounted(async () => {
      // 处理 LINE 登录回调
      if (route.query.code) {
        handleLineCallback(route.query.code as string)
      }

      // 初始化 LIFF
      try {
        await liff.init({ liffId: '2008056298-jBr2y22v' })
        if (liff.isInClient() && liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          savedLineId.value = profile.userId
          loginForm.loginType = 'line'
          loginForm.username = profile.userId
        }
      } catch (error) {
        console.error('LIFF initialization failed', error)
      }
    })

    const handleLineCallback = async (code: string) => {
      try {
        const response = await fetch('/api/line/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        })

        const data = await response.json()
        
        if (data.success) {
          savedLineId.value = data.lineId
          loginForm.loginType = 'line'
          loginForm.username = data.lineId
          ElMessage.success('LINE ID 获取成功')
        } else {
          ElMessage.error(data.message || '获取 LINE ID 失败')
        }
      } catch (error) {
        ElMessage.error('获取 LINE ID 失败')
      }
    }

    return {
      loginForm,
      rules,
      loginFormRef,
      loading,
      handleLogin,
      handleLoginTypeChange,
      handleLineLogin
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
