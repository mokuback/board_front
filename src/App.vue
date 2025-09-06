<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import liff from '@line/liff';

const router = useRouter();
const userId = ref<string>('');
const displayName = ref<string>('');
const password = ref<string>('');
const loginType = ref<'line' | 'other'>('line');
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');

// LIFF 初始化
const initializeLiff = async () => {
  try {
    await liff.init({ liffId: '2008056298-jBr2y22v' });
    
    // 检查是否在 LINE 应用内打开
    if (liff.isInClient()) {
      // 获取用户资料
      const profile = await liff.getProfile();
      userId.value = profile.userId;
      displayName.value = profile.displayName;
    }
  } catch (error) {
    console.error('LIFF initialization failed', error);
    errorMessage.value = 'LINE 登入初始化失败，请稍后再试';
  }
};

// 处理登录
const handleLogin = async () => {
  if (!userId.value || !password.value) {
    errorMessage.value = '请输入账号和密码';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch('https://boardback-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userId.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // 验证返回的数据完整性
      if (!data.token || !userId.value) {
        errorMessage.value = '登录数据不完整';
        isLoading.value = false;
        return;
      }
      
      // 清除旧的认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('displayName');
      
      // 保存新的认证信息
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', userId.value);
      localStorage.setItem('displayName', displayName.value);
      
      // 使用路由名称而不是硬编码路径
      router.push({ name: 'MessageBoard' }).catch(err => {
        console.error('路由导航错误:', err);
        errorMessage.value = '页面跳转失败，请重试';
        isLoading.value = false;
      });
    } else {
      // 清除可能存在的旧认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('displayName');
      
      errorMessage.value = data.message || '登录失败，请检查账号和密码';
      isLoading.value = false;
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = '登录请求失败，请稍后再试';
    isLoading.value = false;
  }
};

// 切换登录类型
const switchLoginType = (type: 'line' | 'other') => {
  loginType.value = type;
  if (type === 'line') {
    // 如果切换回LINE登录，尝试重新获取LINE ID
    initializeLiff();
  } else {
    // 如果切换到其他登录方式，清空用户ID
    userId.value = '';
  }
};

// 组件挂载时初始化LIFF
onMounted(() => {
  initializeLiff();
});
</script>

<template>
  <div class="login-container">
    <h1>留言板登录</h1>
    
    <div class="login-type-selector">
      <button 
        :class="['type-button', { active: loginType === 'line' }]"
        @click="switchLoginType('line')"
      >
        LINE 登录
      </button>
      <button 
        :class="['type-button', { active: loginType === 'other' }]"
        @click="switchLoginType('other')"
      >
        其他登录
      </button>
    </div>

    <div class="login-form">
      <div class="form-group">
        <label for="userId">账号</label>
        <input
          id="userId"
          v-model="userId"
          type="text"
          :placeholder="loginType === 'line' ? 'LINE ID' : '请输入账号'"
          :readonly="loginType === 'line'"
        />
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="请输入密码"
        />
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <button 
        class="login-button" 
        @click="handleLogin"
        :disabled="isLoading"
      >
        {{ isLoading ? '登录中...' : '登录' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
}

.login-type-selector {
  display: flex;
  margin-bottom: 1.5rem;
  background-color: #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.type-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.type-button.active {
  background-color: #06c755;
  color: white;
}

.login-form {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input[readonly] {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #06c755;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #05b452;
}

.login-button:disabled {
  background-color: #a0e0c0;
  cursor: not-allowed;
}
</style>
