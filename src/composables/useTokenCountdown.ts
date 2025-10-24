import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from '../services/axiosInterceptor';

export function useTokenCountdown() {
  const remainingTime = ref<number>(0);
  const isTokenLoading = ref<boolean>(false);
  let countdownInterval: number | null = null;

  // 重新獲取 token
  const refreshToken = async () => {
    try {
      isTokenLoading.value = true; // 开始加载
      stopCountdown(); // 先停止现有计时器

      const response = await axios.post('/token/refresh', {
        token: localStorage.getItem('token'),
      });

      if (response.data.ok) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('tokenExpiresIn', response.data.expires_in);
        localStorage.setItem('tokenTimestamp', Date.now().toString());
        startCountdown();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // 如果刷新失敗，重定向到登入頁面
      window.location.href = '/';
    } finally {
      isTokenLoading.value = false; // 结束加载
    }
  };

  const startCountdown = () => {
    const expiresIn = localStorage.getItem('tokenExpiresIn');
    const timestamp = localStorage.getItem('tokenTimestamp');

    if (!expiresIn || !timestamp) return;

    const initialTime = parseInt(expiresIn) * 1000; // 转换为毫秒
    const startTime = parseInt(timestamp);

    countdownInterval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      remainingTime.value = Math.max(0, initialTime - elapsed);

      if (remainingTime.value <= 0) {
        stopCountdown();
        // Token过期处理
        localStorage.removeItem('token');
        window.location.href = '/'; // 重定向到登录页
      }
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  };

  const formattedTime = computed(() => {
    const totalSeconds = Math.floor(remainingTime.value / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  onMounted(() => {
    startCountdown();
  });

  onUnmounted(() => {
    stopCountdown();
  });

  return {
    remainingTime,
    formattedTime,
    isTokenLoading,
    startCountdown,
    stopCountdown,
    refreshToken,
  };
}
