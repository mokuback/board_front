<script setup lang="ts">
import { ref, onMounted } from 'vue';
import liff from '@line/liff';

// 用户信息
const userId = ref<string>('');
const displayName = ref<string>('');
const pictureUrl = ref<string>('');
const statusMessage = ref<string>('');

// 状态控制
const isLoading = ref<boolean>(true);
const error = ref<string>('');

// 初始化 LIFF 并获取用户资料
const initializeLiff = async () => {
  try {
    await liff.init({ liffId: '2008056298-jBr2y22v' });
    
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      userId.value = profile.userId;
      displayName.value = profile.displayName;
      pictureUrl.value = profile.pictureUrl || '';
      statusMessage.value = profile.statusMessage || '';
    } else {
      liff.login();
    }
  } catch (err) {
    console.error('LIFF initialization failed', err);
    error.value = '获取 LINE 用户信息失败';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  initializeLiff();
});
</script>

<template>
  <div class="status-page">
    <div v-if="isLoading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="user-info">
      <h1>用户信息</h1>
      <div v-if="userId">
        <p>LINE ID: {{ userId }}</p>
        <p>显示名称: {{ displayName }}</p>
        <div class="avatar" v-if="pictureUrl">
          <img :src="pictureUrl" alt="用户头像" />
        </div>
        <p>状态消息: {{ statusMessage || '未设置' }}</p>
      </div>
      <p v-else>未获取到 LINE 用户信息</p>
    </div>
  </div>
</template>

<style scoped>
.status-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  flex-direction: column;
  padding: 20px;
}

h1 {
  font-size: 2rem;
  color: #333;
  margin: 0 0 1rem 0;
}

.loading, .error {
  font-size: 1.2rem;
  color: #666;
}

.user-info {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

p {
  margin: 0.5rem 0;
  font-size: 1rem;
  color: #555;
  word-break: break-word;
}

.avatar {
  margin: 1rem 0;
}

.avatar img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}
</style>
