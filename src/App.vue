<template>
  <router-view />
  <Notification 
    :message="notificationState.message"
    :type="notificationState.type"
    :duration="notificationState.duration"
    :show="notificationState.show"
  />
  <LoadingOverlay 
    :is-visible="loadingState.isVisible"
    :message="loadingState.message"
  />  
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useNotification } from './services/notificationService.ts';
import { useLoading } from './services/loadingService.ts';
import Notification from './components/Notification.vue';
import LoadingOverlay from './components/LoadingOverlay.vue';

const { notificationState } = useNotification();
const { loadingState } = useLoading();

// 设置页面标题
onMounted(() => {
  document.title = import.meta.env.VITE_APP_TITLE || 'Message Board';
});
</script>