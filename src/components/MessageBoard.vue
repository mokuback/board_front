<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userId = ref<string>('');
const displayName = ref<string>('');
const isLoading = ref<boolean>(true);

// 检查登录状态
onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    // 如果没有token，重定向到登录页
    router.push('/');
    return;
  }

  // 从localStorage获取用户信息
  userId.value = localStorage.getItem('userId') || '';
  displayName.value = localStorage.getItem('displayName') || '';
  isLoading.value = false;
});
</script>

<template>
  <div class="message-board">
    <div v-if="isLoading" class="loading">加载中...</div>
    <div v-else class="user-info">
      <h1>留言板</h1>
      <div class="info-card">
        <p><strong>LINE ID:</strong> {{ userId }}</p>
        <p><strong>显示名称:</strong> {{ displayName }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-board {
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.user-info {
  width: 100%;
  max-width: 600px;
  margin-top: 2rem;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.info-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

p {
  margin: 0.75rem 0;
  color: #555;
  font-size: 1rem;
}

.loading {
  text-align: center;
  font-size: 1.2rem;
  color: #666;
  margin-top: 2rem;
}
</style>
