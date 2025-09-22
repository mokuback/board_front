<template>
  <div class="login-container">
    <h2>使用者登錄</h2>
    <div v-if="statusMessage" class="line-info">
        <p>LINE ID: {{ username }}</p>
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
    
    <button @click="handleLogin" :disabled="isLoading">
      {{ isLoading ? '登入中...' : '登入' }}
    </button>
      <button 
        v-if="!isLineLoggedIn" 
        class="line-id-btn" 
        @click="initializeLiff"
      >
        LINE ID
      </button>    
   
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

const router = useRouter();
const username = ref('');
const password = ref('');
const displayName = ref('測試');
const pictureUrl = ref<string>('');
const statusMessage = ref<string>('');
const isLoading = ref(false);
const errorMessage = ref('');
const responseData = ref('');
const isLineLoggedIn = ref(false); 

// 初始化 LIFF 并获取用户资料
const initializeLiff = async () => {
  try {
    await liff.init({ liffId: '2008056298-jBr2y22v' });
    
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      username.value = profile.userId;
      displayName.value = profile.displayName;
      pictureUrl.value = profile.pictureUrl || '';
      statusMessage.value = profile.statusMessage || '';
      isLineLoggedIn.value = true;
    } else {
      liff.login();
    }
  } catch (err) {
    console.error('LIFF initialization failed', err);
    errorMessage.value = '獲取 LINE 用户訊息失敗';
  } finally {
    isLoading.value = false;
  }
};

// 处理 LINE 退出登录
const handleLineLogout = () => {
  if (liff.isLoggedIn()) {
    liff.logout();
    isLineLoggedIn.value = false;
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
    errorMessage.value = '使用者名稱和密碼不能為空';
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
      errorMessage.value = data.detail || '登入失敗，請檢查帳號密碼';
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登入過程發生錯誤';
    // 由 axiosInterceptor.ts 處理錯誤
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  // 检查是否是 LINE 登录回调
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  // 如果是 LINE 登录回调或者已经在 LINE 客户端中，初始化 LIFF
  if (code || state || liff.isInClient()) {
    await initializeLiff();
  } else {
    // 检查 LINE 登录状态
    try {
      await liff.init({ liffId: '2008056298-jBr2y22v' });
      if (liff.isLoggedIn()) {
        isLineLoggedIn.value = true;
        await initializeLiff();
      } else {
        isLineLoggedIn.value = false;
      }
    } catch (err) {
      console.error('LIFF initialization failed', err);
      isLineLoggedIn.value = false;
    }
  }
});
</script>

<style scoped>
/* 保留原有的基础样式 */
.login-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 新增 LINE 讯息区块样式 */
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

.avatar {
  margin: 15px auto;
  text-align: center;
}

.avatar img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 其他样式保持不变 */
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
