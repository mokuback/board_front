<script setup lang="ts">
import { ref, onMounted } from 'vue';
import liff from '@line/liff';

const userId = ref<string>('');
const isLoading = ref<boolean>(true);
const error = ref<string>('');

// 初始化 LIFF 并获取用户资料
const initializeLiff = async () => {
  try {
    await liff.init({ liffId: '2008056298-jBr2y22v' });
    
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      userId.value = profile.userId;
    } else {
      liff.login();
    }
  } catch (err) {
    console.error('LIFF initialization failed', err);
    error.value = '获取 LINE ID 失败';
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
      <h1>狀態</h1>
      <p v-if="userId">LINE ID: {{ userId }}</p>
      <p v-else>未获取到 LINE ID</p>
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
}

p {
  margin: 0.5rem 0;
  font-size: 1rem;
  color: #555;
}
</style>
