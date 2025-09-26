<template>
  <div class="login-container">
    <h2>使用者登錄</h2>
    <div v-if="displayName" class="line-info">
        <!--<p>LINE ID: {{ username }}</p>-->
        <p>顯示名稱: {{ displayName }}</p>
        <div class="avatar" v-if="pictureUrl">
          <img :src="pictureUrl" alt="使用者頭像" />
        </div>
        <p>狀態訊息: {{ statusMessage || '未設置' }}</p>
        <button class="logout-line-btn" @click="handleLineLogout">退出 LINE</button>
    </div>    
    <div class="form-group">
      <label for="username">使用者名稱：</label>
      <input 
        type="text" 
        id="username" 
        v-model="username" 
        placeholder="請輸入使用者名稱"
        @keyup.enter="handleLogin"
        :disabled="displayName ? true : false"
      >
    </div>
    
    <div class="form-group">
      <label for="password">密碼：</label>
      <input 
        type="password" 
        id="password" 
        v-model="password" 
        placeholder="請輸入密碼"
        @keyup.enter="handleLogin"
      >
    </div>
    
    <div class="button-container">
      <button @click="handleLogin" class="login-btn">
        登入
      </button>
      <button 
        v-if="!displayName || displayName === ''" 
        @click="handleLineLogin" 
        class="line-btn"
      >
        LINE
      </button>
    </div>
   
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    
    <div v-if="responseData" class="response-container">
      <h3>後端回應資料：</h3>
      <pre>{{ responseData }}</pre>
    </div>
    <router-view></router-view>
  </div> 
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import liff from '@line/liff';
import { useRouter } from 'vue-router'; 
import axios from '../services/axiosInterceptor';
import { showNotification } from '../services/notificationService';
import { createApiError } from '../services/errorService';
import { showLoading, hideLoading, useLoading } from '../services/loadingService';

const router = useRouter();
const username = ref('');
const password = ref('');
const displayName = ref('');
const pictureUrl = ref<string>('');
const statusMessage = ref<string>('');
// const isLoading = ref(false);
const errorMessage = ref('');
const responseData = ref('');

const handleLineLogin = () => {
  initializeLiff();
};

// 初始化 LIFF 并获取用户资料
const initializeLiff = async () => {
  showLoading('正在獲取 LINE 用戶資訊，請稍候...')
  try {
    await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
    
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      username.value = profile.userId;
      displayName.value = profile.displayName;
      pictureUrl.value = profile.pictureUrl || '';
      statusMessage.value = profile.statusMessage || '';
    } else {
      liff.login();
    }
  } catch (err) {
    console.error('LIFF initialization failed', err);
    showNotification('獲取 LINE 用户訊息失敗', 'error');
    errorMessage.value = '獲取 LINE 用户訊息失敗';
  } finally {
    hideLoading();
  }
};

// 处理 LINE 退出登录
const handleLineLogout = () => {
  if (liff.isLoggedIn()) {
    liff.logout();
  }
  // 清除 LINE 相关信息
  username.value = '';
  displayName.value = '';
  pictureUrl.value = '';
  statusMessage.value = '';
};

// 处理登录
const handleLogin = async () => {
  // 表单验证
  if (!username.value || !password.value) {
    errorMessage.value = '使用者名稱和密码不能为空';
    showNotification('使用者名稱和密码不能为空', 'error');
    
    return;
  }

  showLoading('正在登入，請稍候...')
  errorMessage.value = '';
  responseData.value = '';

  try {
      // 发送登录请求到后端
      const response = await axios.post('/token', {
      username: username.value,
      password: password.value,
      displayname: displayName.value || '訪客'
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
      errorMessage.value = data.detail || '登入失敗';
      showNotification(data.detail || '登入失敗', 'error');
    }
  } catch (error) {
    const apiError = createApiError(error);
    errorMessage.value = apiError.details?.detail || '登入過程發生錯誤';
    //errorMessage.value = error instanceof Error ? error.message : '登入過程發生錯誤';
    // showNotification(error instanceof Error ? error.message : '登入過程發生錯誤', 'error');
    // 由 axiosInterceptor.ts 處理錯誤
  } finally {
    hideLoading();
  }
};

onMounted(() => {
  initializeLiff();
});

</script>

<style scoped>
.login-container {
  max-width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 15px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
}

.button-container {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.login-btn {
  flex: 1;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.line-btn {
  width: auto;
  padding: 10px 20px;
  background-color: #00C300;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.line-info {
  background: linear-gradient(135deg, #00C300 0%, #00B900 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.line-info p {
  margin: 10px 0;
  font-size: 16px;
}

.line-btn:hover {
  background-color: #00B900;
}

.avatar {
  margin: 10px auto;
  text-align: center;
}

.avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
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

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
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

.logout-line-btn {
  background-color: rgba(0, 249, 0, 0.6);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s ease;
}

.logout-line-btn:hover {
  background-color: rgba(0, 249, 0, 0.4);
}

/* 响应式设计 */
@media screen and (max-width: 375px) {
  .login-container {
    padding: 10px;
  }
  
  .form-group {
    margin-bottom: 10px;
  }
  
  .button-container {
    flex-direction: column;
    gap: 8px;
  }
  
  .line-btn {
    width: 100%;
  }
}

@media screen and (min-width: 376px) {
  .login-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
}

</style>
