<template>
  <transition name="notification-fade">
    <div v-if="notificationState.show" 
         class="notification" 
         :class="notificationState.type">
      {{ notificationState.message }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useNotification } from '../services/notificationService';

const { notificationState } = useNotification();

// 监听通知状态变化
watch(() => notificationState.show, (newShow) => {
    console.log('Notification show state changed:', newShow); // 添加日志
    if (newShow) {
        console.log('Notification message:', notificationState.message); // 添加日志
    }
});
</script>

<style scoped>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    max-width: 300px;
}

.notification.success {
    background-color: #4caf50;
}

.notification.error {
    background-color: #f44336;
}

.notification.warning {
    background-color: #ff9800;
}

.notification.info {
    background-color: #2196f3;
}

.notification-fade-enter-active,
.notification-fade-leave-active {
    transition: opacity 0.3s, transform 0.3s;
}

.notification-fade-enter-from,
.notification-fade-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>
