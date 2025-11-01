<template>
  <transition name="notification-fade">
    <div v-if="notificationState.show" class="notification" :class="notificationState.type">
      {{ notificationState.message }}
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { watch } from 'vue';
  import { useNotification } from '../services/notificationService';

  const { notificationState } = useNotification();

  // 监听通知状态变化
  watch(
    () => notificationState.show,
    newShow => {
      console.log('Notification show state changed:', newShow); // 添加日志
      if (newShow) {
        console.log('Notification message:', notificationState.message); // 添加日志
      }
    },
  );
</script>

<style scoped>
  .notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    z-index: 9999;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    max-width: 300px;
    text-align: center;
    opacity: 0.9;
    backdrop-filter: blur(5px);
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

  .notification-fade-enter-active {
    transition: all 0.3s ease-out;
  }

  .notification-fade-leave-active {
    transition: all 0.3s ease-in;
  }

  .notification-fade-enter-from {
    opacity: 0;
    transform: translateX(-50%) translateY(-100%); /* 从上方100%的位置开始 */
  }

  .notification-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px); /* 向上移动20px后消失 */
  }
</style>
