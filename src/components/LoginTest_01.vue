<template>
  <div class="login-container">
    <h2>后端登录测试</h2>
    
    <div class="form-group">
      <label for="username">用户名:</label>
      <input 
        type="text" 
        id="username" 
        v-model="username" 
        placeholder="请输入用户名"
        @keyup.enter="handleLogin"
      >
    </div>
    
    <div class="form-group">
      <label for="password">密码:</label>
      <input 
        type="password" 
        id="password" 
        v-model="password" 
        placeholder="请输入密码"
        @keyup.enter="handleLogin"
      >
    </div>
    
    <button @click="handleLogin" :disabled="isLoading">
      {{ isLoading ? '登录中...' : '登录' }}
    </button>
    
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    
    <div v-if="responseData" class="response-container">
      <h3>后端响应:</h3>
      <pre>{{ responseData }}</pre>
    </div>
    <router-view></router-view>
  </div> 
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router'; 
import axios from '../services/axiosInterceptor';

const router = useRouter();
const username = ref('');
const password = ref('');
const displayName = ref('測試');
const isLoading = ref(false);
const errorMessage = ref('');
const responseData = ref('');

// 处理登录
const handleLogin = async () => {
  // 表单验证
  if (!username.value || !password.value) {
    errorMessage.value = '用户名和密码不能为空';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  responseData.value = '';

  try {
    // 发送登录请求到后端
    const response = await axios.post('/token', {
      username: username.value,
      password: password.value,
      displayname: displayName.value
    });

    const data = response.data;
    
    // 显示后端响应数据
    responseData.value = JSON.stringify(data, null, 2);    
    
    if (data.ok) {
      // 保存token和保存token和用户信息到localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userId', username.value); //LINE ID
      localStorage.setItem('displayName', displayName.value); 
      localStorage.setItem('isAdmin', data.is_admin);

      // 跳转到留言板
      router.push('/messages');
    } else {      
      errorMessage.value = data.detail || '登录失败';
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录过程中发生错误';
    // 由 axiosInterceptor.ts 處理錯誤
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: red;
  margin-top: 10px;
  text-align: center;
}

.response-container {
  margin-top: 20px;
  text-align: left;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.response-container h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}
</style>
