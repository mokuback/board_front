<script setup lang="ts">
import { ref, onMounted, onUnmounted, handleError } from 'vue';
import { useRouter } from 'vue-router';
import AddMessageDialog from './AddMessageDialog.vue'; // 导入新增留言对话框组件
import { showNotification } from '../services/notificationService';
import { showLoading, hideLoading } from '../services/loadingService';
import axios from '../services/axiosInterceptor';

const COUNTDOWN_SECONDS = 600;

const router = useRouter();
const userId = ref<string>('');
const displayName = ref<string>('');
const isAdmin = ref<boolean>(false);
const isLoading = ref<boolean>(true);
const showUserId = ref<boolean>(false);
const countdown = ref<number>(COUNTDOWN_SECONDS);
let timer: number | null = null;

// 消息列表相关状态
const messages = ref<Array<any>>([]);
const isMessagesLoading = ref<boolean>(true);

// 新增：控制新增留言对话框的显示状态
const showAddMessageDialog = ref(false);

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

// 日期时间格式化函数
// const formatDateTime = (dateTimeString: string) => {
//   const date = new Date(dateTimeString);
//   return date.toLocaleString();
// };

// 日期时间格式化函数
const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  date.setHours(date.getHours() + Number(import.meta.env.VITE_TIME_OFFSET));
  return date.toLocaleString(import.meta.env.VITE_LOCALE, {
    timeZone: import.meta.env.VITE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
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
        <div class="countdown">
          <span class="countdown-timer">{{ countdown }}秒</span>
        </div>
        <div class="title-section">
          <h1>Message Board</h1>
          <span class="display-name" @click="showUserId = !showUserId">
            <span class="user-icon">{{ isAdmin ? '👑' : '👤' }}</span>
            {{ displayName }}
            <span v-if="showUserId" class="user-id">({{ userId }})</span>
          </span>
        </div>
        <button @click="logout" class="logout-button">登出</button>
      </div>

      
      <!-- 可滚动消息区域 -->
      <div class="messages-container">
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

      <!-- 新增：浮动按钮 -->
      <button class="float-button" @click="showAddMessageDialog = true">
        新增留言
      </button>

      <!-- 新增：留言对话框组件 -->
      <AddMessageDialog 
        v-model="showAddMessageDialog"
        @message-created="fetchLatestMessages"
      />
    </div>
  </div>
</template>

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
  z-index: 1000;
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
  margin-top: 6rem;
  height: calc(100vh - 8rem);
  overflow-y: auto;
  padding: 1rem;
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

@media (max-width: 768px) {
  .header {
    padding: 0.8rem 1rem;
  }

  h1 {
    font-size: 1.4rem;
  }

  .display-name {
    color: #666;
    font-size: 1rem;
    font-weight: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
    cursor: pointer;  
  }

  .countdown {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .logout-button {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
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
</style>
