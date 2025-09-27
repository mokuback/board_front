<template>
  <div class="message-board">
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      <span>載入中...</span>
    </div>
    <div v-else class="user-info">
      <div class="header">
        <button class="menu-button" @click="toggleSidebar">
          <span class="menu-icon"></span>
          <span class="menu-icon"></span>
          <span class="menu-icon"></span>
        </button>
        
        <div class="countdown">
          <div class="countdown-icon">⏱️</div>
          <div class="countdown-timer">{{ countdown }}秒</div>
        </div>

        <!-- 侧边栏 -->
        <div class="sidebar" :class="{ 'sidebar-active': showSidebar }">
          <div class="sidebar-header">
            <h3>選單</h3>
            <button class="close-sidebar" @click="toggleSidebar">✕</button>
          </div>
          <div class="sidebar-content">
            <ul class="menu-list">
              <li @click="handleSendNotification">
                <span class="menu-item-icon">📢</span>
                <span>發送通知</span>
              </li>              
              <li @click="handlePasswordSettings">
                <span class="menu-item-icon">🔒</span>
                <span>密碼設定</span>
              </li>
              <li @click="handleBasicSettings">
                <span class="menu-item-icon">⚙️</span>
                <span>基本設定</span>
              </li>
              <li v-if="isAdmin" @click="handleUserManagement">
                <span class="menu-item-icon">👥</span>
                <span>使用者資料</span>
              </li>
              <li v-if="isAdmin" @click="handleLoginRecords">
                <span class="menu-item-icon">📋</span>
                <span>登入記錄</span>
              </li>
              <li @click="handleLogout">
                <span class="menu-item-icon">🚪</span>
                <span>離開</span>
              </li>              
            </ul>
          </div>
        </div>

        <!-- 遮罩层 -->
        <div v-if="showSidebar" class="sidebar-overlay" @click="toggleSidebar"></div>

        <div class="title-section">
          <h1>{{ appTitle }}</h1>
        </div>
        <button @click="logout" class="logout-button">
          <span class="logout-icon">🚪</span>
          <span>登出</span>
        </button>
      </div>

      
      <!-- 可滚动消息区域 -->
      <div ref="messagesContainer" class="messages-container">
        <div v-if="isMessagesLoading" class="loading-messages">
          <div class="loading-spinner"></div>
          <span>獲取訊息中...</span>
        </div>
        <div v-else-if="messages.length === 0" class="no-messages">
          <div class="no-messages-icon">📝</div>
          <span>暫無留言</span>
        </div>
        <div v-else class="messages-list">
          <div v-for="message in messages" :key="message.id" class="message-card">
            <div class="message-header">
              <div class="user-info-container">
                <div class="user-avatar" :class="{ 'admin': message.is_admin }">
                  <span class="user-icon">{{ message.is_admin ? '👑' : '👤' }}</span>
                </div>
                <div class="user-details">
                  <span class="user-name" :class="{ 'admin': message.is_admin }">
                    {{ message.display_name }}
                  </span>
                  <span class="message-time">{{ formatDateTime(message.created_at) }}</span>
                </div>
              </div>
            </div>
            <div v-if="message.image_url" class="message-image">
              <img :src="message.image_url" alt="留言圖片" @click="previewImage(message.image_url)" />
            </div>
            <div class="message-content">{{ message.content }}</div>
            <div class="message-actions">
              <button 
                v-if="isAdmin" 
                @click="deleteMessage(message.id)"
                class="delete-button"
              >
                <span class="delete-icon">🗑️</span>
                <span>删除</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 浮动用户信息 -->
      <div class="floating-user-info" @click="showUserId = !showUserId">
        <div class="user-avatar" :class="{ 'admin': isAdmin }">
          <span class="user-icon">{{ isAdmin ? '👑' : '👤' }}</span>
        </div>
        <div class="user-details">
          <span class="display-name">{{ displayName || '訪客' }}</span>
          <span v-if="showUserId" class="user-id">{{ userId }}</span>
        </div>
      </div>      

      <!-- 浮动按钮 -->
      <button class="float-button" @click="showAddMessageDialog = true">
        <span class="float-icon">✏️</span>
        <span>新增留言</span>
      </button>

      <!-- 对话框组件 -->
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

const COUNTDOWN_SECONDS = 300;

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

// 切换侧边栏
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
};

// 滚动到底部
const scrollToBottom = () => {
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  }, 100);
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
    const response = await axios.get('/messages/?limit=5');
    messages.value = response.data.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
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
       await fetchLatestMessages(); // 重新获取最新消息
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

// 预览图片
const previewImage = (imageUrl: string) => {
  window.open(imageUrl, '_blank');
};

const handleSendNotification = () => {
  showNotificationDialog.value = true;
  toggleSidebar(); // 关闭侧边栏
};

const handlePasswordSettings = () => {
  showPasswordDialog.value = true;
  toggleSidebar(); // 关闭侧边栏
};

const handleLoginRecords = () => {
   showLoginRecordsDialog.value = true;
   toggleSidebar(); // 关闭侧边栏
};

const handleBasicSettings = () => {
  if (isAdmin.value) {
    showNotification("admin preferences", 'success');
  } else {
    showNotification("user preferences", 'success');
  }
  toggleSidebar(); // 关闭侧边栏
};

// 管理员特有的功能处理函数
const handleUserManagement = () => {
  showNotification("user management", 'success');
  toggleSidebar(); // 关闭侧边栏
};

const handleLogout = () => {
  toggleSidebar(); // 关闭侧边栏
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

<style>
@import '../assets/styles/components/sidebar.css';
</style>

<style scoped>
/* 全局样式 */
.message-board {
  width: 100vw; 
  max-width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* 加载动画 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #666;
  font-size: 1.2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 15px;
}

/* 头部样式 */
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
  border-radius: 0 0 15px 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  min-width: 0;
}

/* 菜单按钮 */
.menu-button {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 1000;
}

.menu-icon {
  display: block;
  height: 2px;
  width: 100%;
  background-color: #333;
  border-radius: 2px;
  transition: all 0.3s ease-in-out;
}

/* 倒计时样式 */
.countdown {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.countdown-icon {
  margin-right: 5px;
  font-size: 1rem;
}

.countdown-timer {
  font-weight: bold;
  min-width: 45px;
  text-align: center;
}

/* 标题区域 */
.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
  padding: 0 2rem;
  max-width: calc(100% - 100px);
  margin: 0 auto;
}

h1 {
  color: #333;
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  white-space: nowrap;
  text-align: center;
  background: linear-gradient(90deg, #3498db, #2c3e50);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 登出按钮 */
.logout-button {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
  white-space: nowrap;
}

.logout-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

.logout-icon {
  margin-right: 5px;
}

/* 消息容器 */
.messages-container {
  width: 100%;
  max-width: 100%;
  margin-top: 5rem;
  height: calc(100vh - 6rem);
  overflow-y: auto;
  padding: 0.5rem;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
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

/* 加载消息和无消息状态 */
.loading-messages, .no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem;
  color: #666;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin: 2rem auto;
  max-width: 80%;
}

.loading-messages .loading-spinner {
  width: 30px;
  height: 30px;
  border-width: 3px;
}

.no-messages-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

/* 消息列表 */
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

/* 消息卡片 */
.message-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  width: 90%;
  margin: 0 auto;
  overflow: hidden;
}

.message-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 消息头部 */
.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid #f0f0f0;
}

.user-info-container {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-avatar.admin {
  background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #555;
  font-size: 1rem;
}

.user-name.admin {
  color: #ff6b6b;
  font-weight: 700;
}

.user-icon {
  font-size: 1.2rem;
}

.message-time {
  color: #999;
  font-size: 0.85rem;
  margin-top: 2px;
}

/* 消息图片 */
.message-image {
  width: 100%;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  padding: 0 10px;
}

.message-image img {
  max-width: 100%; 
  height: auto;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease;
  object-fit: contain; 
  width: auto;
}

.message-image img:hover {
  transform: scale(1.02);
}

/* 消息内容 */
.message-content {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: #444;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 1rem;
}

/* 消息操作区 */
.message-actions {
  display: flex;
  justify-content: flex-end;
}

.delete-button {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.delete-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.delete-icon {
  margin-right: 5px;
}

/* 浮动按钮 */
.float-button {
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  z-index: 100;
  font-weight: 500;
  transition: all 0.3s ease;
}

.float-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}

.float-icon {
  margin-right: 8px;
}

/* 浮动用户信息 */
.floating-user-info {
  position: fixed;
  bottom: 80px;
  left: 20px;
  display: flex;
  align-items: center;
  background: white;
  padding: 10px 15px;
  border-radius: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  cursor: pointer;
  transition: all 0.3s ease;
}

.floating-user-info:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.floating-user-info .user-avatar {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}

.floating-user-info .user-details {
  flex-direction: row;
  align-items: center;
}

.floating-user-info .display-name {
  color: #555;
  font-size: 0.95rem;
  font-weight: 500;
}

.floating-user-info .user-id {
  font-size: 0.8rem;
  color: #999;
  margin-left: 5px;
}

/* 侧边栏关闭按钮 */
.close-sidebar {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #777;
  transition: color 0.3s ease;
}

.close-sidebar:hover {
  color: #333;
}

/* 侧边栏头部 */
.sidebar-header {
  position: relative;
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
  text-align: center;
}

/* 菜单列表 */
.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-list li {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f5f5f5;
}

.menu-list li:hover {
  background-color: #f9f9f9;
}

.menu-list li:last-child {
  border-bottom: none;
}

.menu-item-icon {
  margin-right: 12px;
  font-size: 1.2rem;
}

/* 动画效果 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 0.8rem 1rem;
  }
  
  .title-section {
    padding: 0 1rem;
    max-width: calc(100% - 120px);
  }
  
  h1 {
    font-size: 1.5rem;
  }
  
  .logout-button {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }
  
  .messages-container {
    margin-top: 4rem;
    height: calc(100vh - 5rem);
  }
  
  .message-card {
    width: 95%;
    padding: 1.2rem;
  }
  
  .floating-user-info {
    bottom: 70px;
    left: 15px;
    padding: 8px 12px;
  }
  
  .floating-user-info .user-avatar {
    width: 32px;
    height: 32px;
  }
  
  .float-button {
    bottom: 70px;
    right: 15px;
    padding: 10px 16px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0.6rem 0.8rem;
  }
  
  .title-section {
    padding: 0 0.5rem;
    max-width: calc(100% - 100px);
  }
  
  h1 {
    font-size: 1.3rem;
  }
  
  .logout-button {
    padding: 0.5rem 0.8rem;
  }
  
  .logout-icon {
    margin-right: 0;
  }
  
  .logout-button span:last-child {
    display: none;
  }
  
  .message-card {
    width: 98%;
    padding: 1rem;
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
  }
  
  .floating-user-info {
    bottom: 60px;
    left: 10px;
    padding: 6px 10px;
  }
  
  .floating-user-info .display-name {
    font-size: 0.9rem;
  }
  
  .float-button {
    bottom: 60px;
    right: 10px;
    padding: 8px 14px;
  }
  
  .float-icon {
    margin-right: 5px;
  }
  
  .float-button span:last-child {
    font-size: 0.9rem;
  }
}
</style>
