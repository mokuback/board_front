<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import AddMessageDialog from './AddMessageDialog.vue';
import PasswordSettingsDialog from './PasswordSettingsDialog.vue';
import NotificationDialog from './NotificationDialog.vue';
import LoginRecordsDialog from './LoginRecordsDialog.vue';
import { showNotification } from '../services/notificationService';
import { showLoading, hideLoading } from '../services/loadingService';
import { formatDateTime } from '../utils/dateUtils';
import axios from '../services/axiosInterceptor';


const COUNTDOWN_SECONDS = 600;

const router = useRouter();
const userId = ref<string>('');
const displayName = ref<string>('');
const isAdmin = ref<boolean>(false);
const isLoading = ref<boolean>(true);
const showUserId = ref<boolean>(false);
const countdown = ref<number>(COUNTDOWN_SECONDS);
const showSidebar = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

let timer: number | null = null;

// 消息列表相关状态
const messages = ref<Array<any>>([]);
const isMessagesLoading = ref<boolean>(true);

const showAddMessageDialog = ref(false);
const showPasswordDialog = ref(false);
const showNotificationDialog = ref(false);
const showLoginRecordsDialog = ref(false);

const appTitle = import.meta.env.VITE_APP_TITLE || 'Message Board';

// 添加切换侧边栏的函数
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
};

const scrollToBottom = () => {
  // 使用 setTimeout 确保在 DOM 完全渲染后执行滚动
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  }, 100); // 添加短暂延迟，确保所有内容都已渲染
};

// 重置倒计时
const resetTimer = () => {
  countdown.value = COUNTDOWN_SECONDS;
  if (timer !== null) {
    clearInterval(timer);
  }
  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      logout();
    }
  }, 1000);
};

// 登出操作
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('displayName');
  localStorage.removeItem('isAdmin');
  if (timer !== null) {
    clearInterval(timer);
  }
  router.push('/');
};

// 添加事件监听器来重置计时器
const setupActivityListeners = () => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.addEventListener(event, resetTimer, true);
  });
};

// 移除事件监听器
const removeActivityListeners = () => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.removeEventListener(event, resetTimer, true);
  });
};

// 获取最新消息函数
const fetchLatestMessages = async () => {
  isMessagesLoading.value = true;
  try {
    const response = await axios.get('/messages/?limit=10');
    messages.value = response.data.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // 使用 nextTick 确保DOM更新后再滚动
    await nextTick();
    scrollToBottom();     
  } catch (error) {
    // 由 axiosInterceptor.ts 處理錯誤
  } finally {
    isMessagesLoading.value = false;
  }
};


// 删除留言函数
const deleteMessage = async (messageId: number) => {
  if (!confirm('確定要刪除留言嗎？')) {
    return;
  }

  showLoading('删除留言中...');

  try {
    const response = await axios.delete(`/messages/${messageId}`);
    if (response.data.ok) {
      messages.value = messages.value.filter(msg => msg.id !== messageId);
      showNotification('删除留言成功', 'success');
    } else {
      showNotification('删除留言失敗', 'error');
    }
  } catch (error) {
    // 由 axiosInterceptor.ts 處理錯誤
  } finally {
    hideLoading();
  }
};

const handleSendNotification = () => {
  showNotificationDialog.value = true;
};

const handlePasswordSettings = () => {
  showPasswordDialog.value = true;
};

const handleLoginRecords = () => {
   showLoginRecordsDialog.value = true;
};

const handleBasicSettings = () => {
  // 根据isAdmin状态执行不同的基本设定逻辑
  if (isAdmin.value) {
    showNotification("admin preferences", 'success');
  } else {
    showNotification("user preferences", 'success');
  }
};

// 管理员特有的功能处理函数
const handleUserManagement = () => {
  showNotification("user management", 'success');
};


const handleLogout = () => {
  logout();
};

// 检查登录状态
onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/');
    return;
  }

  userId.value = localStorage.getItem('userId') || '';
  displayName.value = localStorage.getItem('displayName') || '';
  isAdmin.value = localStorage.getItem('isAdmin') === 'true';
  isLoading.value = false;
  
  resetTimer();
  setupActivityListeners();
  await fetchLatestMessages();
});

// 组件卸载时清理定时器和事件监听器
onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer);
  }
  removeActivityListeners();
});
</script>

<template>
  <div class="message-board">
    <div v-if="isLoading" class="loading">加载中...</div>
    <div v-else class="user-info">
      <div class="header">
        <button class="menu-button" @click="toggleSidebar">
          <span class="menu-icon"></span>
          <span class="menu-icon"></span>
          <span class="menu-icon"></span>
        </button>        
        <div class="countdown">
          <span class="countdown-timer">{{ countdown }}秒</span>
        </div>

        <!-- 添加侧边栏 -->
        <div class="sidebar" :class="{ 'sidebar-active': showSidebar }">
          <div class="sidebar-content">
            <h3>選單</h3>
            <ul class="menu-list">
              <li @click="handleSendNotification">
                <span class="menu-item-icon">📢</span>發送通知
              </li>              
              <li @click="handlePasswordSettings">
                <span class="menu-item-icon">🔒</span>密碼設定
              </li>
              <li @click="handleBasicSettings">
                <span class="menu-item-icon">⚙️</span>基本設定
              </li>
              <li v-if="isAdmin" @click="handleUserManagement">
                <span class="menu-item-icon">👥</span>使用者資料
              </li>
              <li v-if="isAdmin" @click="handleLoginRecords">
                <span class="menu-item-icon">📋</span>登入記錄
              </li>
              <li @click="handleLogout">
                <span class="menu-item-icon">🚪</span>離開
              </li>              
            </ul>
          </div>
        </div>

        <!-- 添加遮罩层 -->
        <div v-if="showSidebar" class="sidebar-overlay" @click="toggleSidebar"></div>

        <div class="title-section">
          <h1>{{ appTitle }}</h1>
        </div>
        <button @click="logout" class="logout-button">登出</button>
      </div>

      
      <!-- 可滚动消息区域 -->
      <div ref="messagesContainer" class="messages-container">
        <div v-if="isMessagesLoading" class="loading-messages">加载消息中...</div>
        <div v-else-if="messages.length === 0" class="no-messages">暂无留言</div>
        <div v-else class="messages-list">
          <div v-for="message in messages" :key="message.id" class="message-card">
            <div class="message-header">
              <span class="user-name" :class="{ 'admin': message.is_admin }">
                <span class="user-icon">{{ message.is_admin ? '👑' : '👤' }}</span>
                {{ message.display_name }}
              </span>
              <span class="message-time">{{ formatDateTime(message.created_at) }}</span>
            </div>
            <div v-if="message.image_url" class="message-image">
              <img :src="message.image_url" alt="留言图片" />
            </div>
            <div class="message-content">{{ message.content }}</div>
            <button 
              v-if="isAdmin" 
              @click="deleteMessage(message.id)"
              class="delete-button"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- 顯示名稱：浮動 -->
      <div class="floating-user-info">
        <span class="display-name" @click="showUserId = !showUserId">
          <span class="user-icon">{{ isAdmin ? '👑' : '👤' }}</span>
          {{ displayName }}
          <span v-if="showUserId" class="user-id">({{ userId }})</span>
        </span>
      </div>      

      <!-- 新增：浮动按钮 -->
      <button class="float-button" @click="showAddMessageDialog = true">
        新增留言
      </button>

      <!-- 新增：留言对话框组件 -->
      <AddMessageDialog 
        v-model="showAddMessageDialog"
        @message-created="fetchLatestMessages"
      />
      <PasswordSettingsDialog 
        v-model="showPasswordDialog"
      />
      <NotificationDialog
        v-model="showNotificationDialog"
      />    
      <LoginRecordsDialog 
        v-model="showLoginRecordsDialog"
      />      
    </div>
  </div>
</template>

<style>
@import '../assets/styles/components/sidebar.css';
</style>

<style scoped>
/* 原有样式保持不变 */
.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
}

.display-name {
  color: #666;
  font-size: 1rem;
  font-weight: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h1 {
  color: #333;
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  white-space: nowrap;
}

.message-board {
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-info {
  width: 100%;
  max-width: 600px;
  margin-top: 2rem;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  min-width: 0;
}

.countdown {
  background-color: #ff9800;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.countdown-timer {
  font-weight: bold;
  min-width: 45px;
  text-align: center;
}

.loading {
  text-align: center;
  font-size: 1.2rem;
  color: #666;
  margin-top: 2rem;
}

.logout-button {
  padding: 0.8rem 1.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.logout-button:hover {
  background-color: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.logout-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.messages-container {
  width: 100%;
  max-width: 600px;
  margin-top: 2rem;
  height: calc(100vh - 8rem);
  overflow-y: auto; 
  padding: 1rem;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
  scrollbar-width: thin; /* Firefox滚动条样式 */
  scrollbar-color: #888 #f1f1f1; /* Firefox滚动条颜色 */

}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.loading-messages::before {
  content: "";
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-messages, .no-messages {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-messages, .no-messages {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.message-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
}

.message-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.user-id {
  font-size: 0.8rem;
  color: #999;
  margin-left: 0.5rem;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #666;
  font-size: 1rem;
}

.user-name.admin {
  color: #ff6b6b;
  font-weight: 700;
}

.user-icon {
  font-size: 1.2em;
  margin-right: 0.3rem;
  display: inline-block;
  vertical-align: middle;
}

.admin .user-icon {
  filter: none;
  opacity: 1;
  animation: pulse 2s infinite;
}

.message-time {
  color: #888;
  font-size: 0.9rem;
}

.message-content {
  margin-bottom: 1rem;
  line-height: 1.5;
  color: #444;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-image {
  width: 100%;
}

.message-image img {
  max-width: 100%;
  border-radius: 4px;
  display: block;
}

.delete-button {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 0.4rem 0.8rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.delete-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

/* 新增样式：浮动按钮 */
.float-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 100;
  font-weight: bold;
  transition: all 0.3s ease;
}

.float-button:hover {
  background-color: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.floating-user-info {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 10px 15px;
  border-radius: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.floating-user-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.floating-user-info .display-name {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.floating-user-info .user-id {
  font-size: 0.8rem;
  color: #999;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 手机设备专用CSS */
@media (max-width: 768px) {
  /* 全局样式调整 */
  body {
    font-size: 14px; /* 减小全局字体大小，适应小屏幕 */
    line-height: 1.5; /* 增加行高，提高可读性 */
  }
  
  /* 容器调整 */
  .container {
    width: 100%;
    padding: 0 10px; /* 减小内边距，利用更多空间 */
  }
  
  /* 标题样式 */
  .title {
    font-size: 1.5rem; /* 减小标题字体大小 */
    margin-bottom: 1rem;
    text-align: center;
  }
  
  /* 留言板容器 */
  .messages-container {
    margin-top: 2rem; /* 减小顶部间距 */
    height: calc(100vh - 6rem); /* 调整高度，考虑更小的标题栏 */
    padding: 0.5rem; /* 减小内边距 */
    border-radius: 8px; /* 稍微减小圆角 */
  }
  
  /* 留言项样式 */
  .message-item {
    padding: 0.8rem; /* 减小内边距 */
    margin-bottom: 0.8rem; /* 减小间距 */
    border-radius: 6px; /* 稍微减小圆角 */
  }
  
  /* 用户名样式 */
  .username {
    font-size: 0.9rem;
    font-weight: bold;
    margin-bottom: 0.3rem;
  }
  
  /* 留言内容样式 */
  .message-content {
    font-size: 0.9rem;
    margin-bottom: 0.3rem;
  }
  
  /* 留言时间样式 */
  .message-time {
    font-size: 0.75rem;
    color: #888;
    text-align: right;
  }
  
  /* 输入区域样式 */
  .input-area {
    padding: 0.8rem;
    border-radius: 8px 8px 0 0;
  }
  
  /* 输入框样式 */
  .message-input {
    width: 100%;
    padding: 0.6rem;
    font-size: 0.9rem;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  .messages-list {
    gap: 0.8rem;
  }  
  
  /* 按钮样式 */
  .btn {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    border-radius: 4px;
    margin-top: 0.5rem;
  }
  
  .btn-primary {
    background-color: #4a90e2;
    color: white;
    border: none;
  }
  
  /* 表单元素间距 */
  .form-group {
    margin-bottom: 0.8rem;
  }
  
  /* 标签样式 */
  label {
    font-size: 0.9rem;
    margin-bottom: 0.3rem;
    display: block;
  }
  
  /* 提示信息样式 */
  .alert {
    padding: 0.6rem;
    margin-bottom: 0.8rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }
  
  /* 导航栏样式 */
  .navbar {
    padding: 0.5rem;
  }
  
  .navbar-brand {
    font-size: 1.2rem;
  }
  
  /* 卡片样式 */
  .card {
    border-radius: 8px;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .card-body {
    padding: 0.8rem;
  }
  
  .card-title {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }
  
  /* 列表样式 */
  .list-group-item {
    padding: 0.8rem;
    font-size: 0.9rem;
  }
}

</style>
