<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>使用者登錄</h2>
        <button class="task-panel-btn" @click="handleTaskPanelLogin">工作面板</button>
      </div>

      <div v-if="displayName" class="line-info">
        <div class="avatar" v-if="pictureUrl">
          <img :src="pictureUrl" alt="使用者頭像" />
        </div>
        <p>{{ displayName }}</p>
        <button class="logout-line-btn" @click="handleLineLogout">退出 LINE</button>
      </div>

      <div class="form-group">
        <label for="username">使用者名稱：</label>
        <div class="input-container">
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="請輸入使用者名稱"
            @keyup.enter="handleLogin"
            :disabled="displayName ? true : false"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="password">密碼：</label>
        <div class="input-container">
          <input type="password" id="password" v-model="password" placeholder="請輸入密碼" @keyup.enter="handleLogin" />
        </div>
      </div>

      <div class="button-container">
        <button @click="handleLogin" class="login-btn" :disabled="useLoading().loadingState.isVisible">
          <span v-if="!useLoading().loadingState.isVisible">登入</span>
          <span v-else class="loading-spinner"></span>
        </button>
        <button v-if="!displayName || displayName === ''" @click="handleLineLogin" class="line-btn">
          <span class="line-icon"></span>
          LINE 登入
        </button>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="responseData" class="response-container">
        <h3>後端回應資料：</h3>
        <pre>{{ responseData }}</pre>
      </div>
      <div class="base-url">
        <span>{{ baseURL }}</span>
        <span>V 1.0.2</span>
      </div>
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
  import { validateLineId } from '../utils/statusUtils';

  const router = useRouter();
  const username = ref('');
  const password = ref('');
  const displayName = ref('');
  const pictureUrl = ref<string>('');
  const statusMessage = ref<string>('');
  const errorMessage = ref('');
  const responseData = ref('');
  const baseURL = ref(import.meta.env.VITE_API_BASE_URL);
  const env = ref(import.meta.env.VITE_ENV);
  const NO_TASK_ENVS = ['vercel', 'test'];

  const handleLineLogin = () => {
    initializeLiff();
  };

  const initializeLiff = async () => {
    showLoading('正在獲取 LINE 用戶資訊，請稍候...');
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

  const handleLineLogout = () => {
    if (liff.isLoggedIn()) {
      liff.logout();
    }
    username.value = '';
    displayName.value = '';
    pictureUrl.value = '';
    statusMessage.value = '';
  };

  const handleLoginWithRoute = async (route: string) => {
    if (!username.value || !password.value) {
      errorMessage.value = '使用者名稱和密碼不能為空';
      showNotification('使用者名稱和密碼不能為空', 'error');
      return;
    }

    showLoading('正在登入，請稍候...');
    errorMessage.value = '';
    responseData.value = '';

    try {
      const response = await axios.post('/token', {
        username: username.value,
        password: password.value,
        displayname: displayName.value || '訪客',
      });

      const data = response.data;
      responseData.value = JSON.stringify(data, null, 2);

      if (data.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userId', username.value);
        localStorage.setItem('displayName', displayName.value);
        localStorage.setItem('isAdmin', data.is_admin);
        localStorage.setItem('tokenExpiresIn', data.expires_in); // 存储token有效期
        localStorage.setItem('tokenTimestamp', Date.now().toString()); // 存储获取token的时间戳
        localStorage.setItem('isLineId', validateLineId(username.value) ? 'true' : 'false');

        router.push(route); // 使用传入的路由参数
      } else {
        errorMessage.value = data.detail || '登入失敗';
        showNotification(data.detail || '登入失敗', 'error');
      }
    } catch (error) {
      const apiError = createApiError(error);
      errorMessage.value = apiError.details?.detail || '登入過程發生錯誤';
    } finally {
      hideLoading();
    }
  };

  const handleLogin = async () => {
    await handleLoginWithRoute('/messages');
  };

  const handleTaskPanelLogin = async () => {
    // 检查环境是否在 NO_TASK_ENVS 中
    if (NO_TASK_ENVS.includes(env.value)) {
      showNotification('目前環境不支援此操作', 'error');
      return;
    }
    await handleLoginWithRoute('/task');
  };

  onMounted(() => {
    // 仅在非本地环境时初始化 LIFF
    if (import.meta.env.VITE_ENV !== 'local') {
      initializeLiff();
    }
  });
</script>

<style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 20px;
    box-sizing: border-box;
  }

  .login-card {
    width: 100%;
    max-width: 420px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    padding: 30px;
    transition: transform 0.3s ease;
    position: relative;
    padding-bottom: 35px;
  }

  .base-url {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px 15px;
    background: linear-gradient(180deg, #f1f8e9 0%, #c8e6c9 100%);
    font-size: 12px;
    color: #2e7d32;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }

  .login-card:hover {
    transform: translateY(-5px);
  }

  .login-header {
    text-align: center;
    margin-bottom: 25px;
    position: relative;
  }

  .login-header h2 {
    color: #333;
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    position: relative;
    display: inline-block;
  }

  .login-header h2:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 3px;
    background: linear-gradient(90deg, #4caf50, #45a049);
    border-radius: 3px;
  }

  .line-info {
    background: linear-gradient(135deg, #00c300 0%, #00b900 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 25px;
    box-shadow: 0 4px 12px rgba(0, 195, 0, 0.2);
    text-align: center;
  }

  .line-info p {
    margin: 15px 0 5px;
    font-size: 18px;
    font-weight: 500;
  }

  .avatar {
    margin: 0 auto 10px;
    text-align: center;
  }

  .avatar img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
    font-size: 14px;
  }

  .input-container {
    position: relative;
  }

  input {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-sizing: border-box;
    font-size: 15px;
    transition: all 0.3s ease;
    background-color: #f9f9f9;
  }

  input:focus {
    border-color: #4caf50;
    background-color: #fff;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
    outline: none;
  }

  input:disabled {
    background-color: #f0f0f0;
    color: #888;
    cursor: not-allowed;
  }

  .button-container {
    display: flex;
    gap: 12px;
    margin-top: 25px;
  }

  .login-btn,
  .line-btn {
    flex: 1;
    padding: 12px 15px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-btn {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    color: white;
    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
  }

  .login-btn:hover {
    background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(76, 175, 80, 0.4);
  }

  .login-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .line-btn {
    background: linear-gradient(135deg, #00c300 0%, #00b900 100%);
    color: white;
    box-shadow: 0 4px 10px rgba(0, 195, 0, 0.3);
  }

  .line-btn:hover {
    background: linear-gradient(135deg, #00b900 0%, #00a800 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 195, 0, 0.4);
  }

  .line-icon {
    display: inline-block;
    width: 20px;
    height: 20px;
    margin-right: 8px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M18.284 10.065c-.016-.05-.032-.1-.05-.148-.027-.075-.057-.15-.088-.224l-.05-.114c-.032-.07-.067-.14-.103-.208l-.06-.114c-.038-.07-.08-.138-.123-.205l-.07-.11c-.045-.068-.092-.134-.14-.2l-.077-.105c-.05-.065-.102-.13-.156-.193l-.085-.1c-.055-.063-.112-.125-.17-.186l-.09-.095c-.06-.06-.12-.12-.183-.177-.03-.03-.062-.057-.094-.085-.064-.057-.13-.112-.197-.166-.032-.026-.065-.05-.098-.075-.068-.052-.137-.102-.208-.15-.033-.023-.067-.045-.1-.067-.072-.046-.145-.09-.22-.132-.035-.02-.07-.04-.106-.058-.075-.04-.15-.077-.227-.112-.037-.017-.074-.033-.112-.048-.077-.033-.155-.063-.234-.092-.04-.015-.08-.028-.12-.042-.08-.027-.16-.052-.242-.075-.042-.012-.084-.023-.127-.034-.083-.022-.167-.042-.252-.06-.043-.01-.087-.017-.13-.025-.087-.015-.174-.027-.262-.037-.044-.006-.088-.01-.133-.014-.09-.01-.18-.016-.27-.02-.044-.003-.088-.005-.132-.006-.093-.003-.186-.003-.28 0-.044 0-.088.003-.132.006-.09.004-.18.01-.27.02-.045.004-.09.008-.133.014-.088.01-.175.022-.262.037-.043.008-.087.015-.13.025-.085.018-.17.038-.252.06-.043.01-.085.022-.127.034-.082.023-.162.048-.242.075-.04.014-.08.027-.12.042-.078.03-.156.06-.234.092-.038.015-.075.03-.112.048-.076.035-.152.072-.227.112-.036.018-.07.038-.106.058-.075.042-.148.086-.22.132-.033.022-.067.044-.1.067-.07.048-.14.098-.208.15-.033.025-.066.05-.098.075-.067.054-.133.11-.197.166-.032.028-.064.055-.094.085-.062.057-.123.117-.183.177-.03.032-.06.063-.09.095-.058.06-.115.123-.17.186-.028.033-.056.067-.083.1-.054.064-.106.128-.156.193-.026.035-.052.07-.077.106-.048.065-.095.13-.14.2-.023.036-.047.072-.07.11-.043.067-.085.135-.123.205-.02.037-.04.074-.06.114-.036.068-.07.138-.103.208-.017.037-.034.075-.05.114-.03.074-.06.15-.088.224-.017.048-.034.098-.05.148-.025.078-.048.157-.07.236-.013.05-.026.1-.038.15-.02.08-.038.16-.054.24-.01.05-.02.1-.028.15-.013.082-.024.164-.033.246-.006.05-.012.1-.016.15-.008.085-.013.17-.017.255-.002.05-.004.1-.005.15 0 .087 0 .174.003.26 0 .05.002.1.005.15.004.085.01.17.017.255.004.05.01.1.016.15.01.082.02.164.033.246.01.05.02.1.028.15.016.08.035.16.054.24.012.05.025.1.038.15.022.08.045.158.07.236.016.05.033.1.05.148.027.075.057.15.088.224l.05.114c.032.07.067.14.103.208l.06.114c.038.07.08.138.123.205l.07.11c.045.068.092.134.14.2l.077.105c.05.065.102.13.156.193l.085.1c.055.063.112.125.17.186l.09.095c.06.06.12.12.183.177.03.03.062.057.094.085.064.057.13.112.197.166.032.026.065.05.098.075.068.052.137.102.208.15.033.023.067.045.1.067.072.046.145.09.22.132.035.02.07.04.106.058.075.04.15.077.227.112.037.017.074.033.112.048.077.033.155.063.234.092.04.015.08.028.12.042.08.027.16.052.242.075.042.012.084.023.127.034.083.022.167.042.252.06.043.01.087.017.13.025.087.015.174.027.262.037.044.006.088.01.133.014.09.01.18.016.27.02.044.003.088.005.132.006.093.003.186.003.28 0 .044 0 .088-.003.132-.006.09-.004.18-.01.27-.02.045-.004.09-.008.133-.014.088-.01.175-.022.262-.037.043-.008.087-.015.13-.025.085-.018.17-.038.252-.06.043-.01.085-.022.127-.034.082-.023.162-.048.242-.075.04-.014.08-.027.12-.042.078-.03.156-.06.234-.092.038-.015.075-.03.112-.048.076-.035.152-.072.227-.112.036-.018.07-.038.106-.058.075-.042.148-.086.22-.132.033-.022.067-.044.1-.067.07-.048.14-.098.208-.15.033-.025.066-.05.098-.075.067-.054.133-.11.197-.166.032-.028.064-.055.094-.085.062-.057.123-.117.183-.177.03-.032.06-.063.09-.095.058-.06.115-.123.17-.186.028-.033.056-.067.083-.1.054-.064.106-.128.156-.193.026-.035.052-.07.077-.106.048-.065.095-.13.14-.2.023-.036.047-.072.07-.11.043-.067.085-.135.123-.205.02-.037.04-.074.06-.114.036-.068.07-.138.103-.208.017-.037.034-.075.05-.114.03-.074.06-.15.088-.224.017-.048.034-.098.05-.148.025-.078.048-.157.07-.236.013-.05.026-.1.038-.15.02-.08.038-.16.054-.24.01-.05.02-.1.028-.15.013-.082.024-.164.033-.246.006-.05.012-.1.016-.15.008-.085.013-.17.017-.255.002-.05.004-.1.005-.15 0-.087 0-.174-.003-.26 0-.05-.002-.1-.005-.15-.004-.085-.01-.17-.017-.255-.004-.05-.01-.1-.016-.15-.01-.082-.02-.164-.033-.246-.01-.05-.02-.1-.028-.15-.016-.08-.035-.16-.054-.24-.012-.05-.025-.1-.038-.15-.022-.08-.045-.158-.07-.236zM12 3.8c-4.518 0-8.2 3.682-8.2 8.2s3.682 8.2 8.2 8.2 8.2-3.682 8.2-8.2-3.682-8.2-8.2-8.2zm0 15.2c-3.858 0-7-3.142-7-7s3.142-7 7-7 7 3.142 7 7-3.142 7-7 7z'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .logout-line-btn {
    background-color: rgba(255, 255, 255, 0.25);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.4);
    padding: 8px 15px;
    border-radius: 20px;
    cursor: pointer;
    margin-top: 15px;
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 500;
  }

  .logout-line-btn:hover {
    background-color: rgba(255, 255, 255, 0.35);
    transform: translateY(-2px);
  }

  .task-panel-btn {
    position: absolute;
    right: 0;
    top: 0;
    padding: 8px 15px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%);
    color: #555;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .task-panel-btn:hover {
    background: linear-gradient(135deg, #d0d0d0 0%, #c0c0c0 100%);
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }

  .error-message {
    color: #e53935;
    margin-top: 20px;
    padding: 10px 15px;
    background-color: rgba(229, 57, 53, 0.1);
    border-radius: 8px;
    border-left: 3px solid #e53935;
    font-size: 14px;
    text-align: center;
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    10%,
    30%,
    50%,
    70%,
    90% {
      transform: translateX(-5px);
    }
    20%,
    40%,
    60%,
    80% {
      transform: translateX(5px);
    }
  }

  .response-container {
    margin-top: 20px;
    text-align: left;
    border: 1px solid #e0e0e0;
    padding: 15px;
    border-radius: 8px;
    background-color: #f9f9f9;
    max-height: 200px;
    overflow-y: auto;
  }

  .response-container h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 16px;
    color: #555;
  }

  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
    font-size: 13px;
    color: #333;
  }

  .loading-spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* 响应式设计 */
  @media screen and (max-width: 480px) {
    .login-card {
      padding: 20px;
    }

    .login-header h2 {
      font-size: 22px;
    }

    .button-container {
      flex-direction: column;
      gap: 10px;
    }

    .line-btn {
      width: 100%;
    }
  }

  @media screen and (min-width: 481px) {
    .login-container {
      padding: 30px;
    }
  }
</style>
