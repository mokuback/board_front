<script setup lang="ts">
import { ref, onMounted } from 'vue';
import liff from '@line/liff';

// 用户信息
const userId = ref<string>('');
const displayName = ref<string>('');
const pictureUrl = ref<string>('');
const statusMessage = ref<string>('');

// 登录相关
const password = ref<string>('');
const loginError = ref<string>('');
const isLoggingIn = ref<boolean>(false);

// 状态控制
const isLoading = ref<boolean>(true);
const error = ref<string>('');

// 初始化 LIFF 并获取用户资料
const initializeLiff = async () => {
  try {
    await liff.init({ liffId: '2008056298-jBr2y22v' });
    
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      userId.value = profile.userId;
      displayName.value = profile.displayName;
      pictureUrl.value = profile.pictureUrl || '';
      statusMessage.value = profile.statusMessage || '';
    } else {
      liff.login();
    }
  } catch (err) {
    console.error('LIFF initialization failed', err);
    error.value = '获取 LINE 用户信息失败';
  } finally {
    isLoading.value = false;
  }
};

// 处理登录
const handleLogin = async () => {
  if (!password.value) {
    loginError.value = '请输入密码';
    return;
  }

  isLoggingIn.value = true;
  loginError.value = '';

  try {
    const response = await fetch('https://boardback-production.up.railway.app/api/login', {
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
      // 登录成功，保存token
      localStorage.setItem('token', data.token);
      // 跳转到留言板页面
      window.location.href = '/messages';
    } else {
      loginError.value = data.message || '登录失败';
    }
  } catch (err) {
    console.error('Login failed', err);
    loginError.value = '登录请求失败';
  } finally {
    isLoggingIn.value = false;
  }
};

onMounted(() => {
  initializeLiff();
});
</script>

<template>
  <div class="status-page">
    <div v-if="isLoading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="user-info">
      <h1>用户信息</h1>
      <div v-if="userId">
        <p>LINE ID: {{ userId }}</p>
        <p>显示名称: {{ displayName }}</p>
        <div class="avatar" v-if="pictureUrl">
          <img :src="pictureUrl" alt="用户头像" />
        </div>
        <p>状态消息: {{ statusMessage || '未设置' }}</p>
        
        <div class="login-form">
          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
            />
          </div>
          <div v-if="loginError" class="error-message">{{ loginError }}</div>
          <button
            class="login-button"
            :disabled="isLoggingIn"
            @click="handleLogin"
          >
            {{ isLoggingIn ? '登录中...' : '登录' }}
          </button>
        </div>
      </div>
      <p v-else>未获取到 LINE 用户信息</p>
    </div>
  </div>
</template>

<style scoped>
.status-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  flex-direction: column;
  padding: 20px;
}

h1 {
  font-size: 2rem;
  color: #333;
  margin: 0 0 1rem 0;
}

.loading, .error {
  font-size: 1.2rem;
  color: #666;
}

.user-info {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

p {
  margin: 0.5rem 0;
  font-size: 1rem;
  color: #555;
  word-break: break-word;
}

.avatar {
  margin: 1rem 0;
}

.avatar img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}

.login-form {
  margin-top: 2rem;
  width: 100%;
}

.form-group {
  margin-bottom: 1rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.error-message {
  color: #e74c3c;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #3a7bc8;
}

.login-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
