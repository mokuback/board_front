import { ref, computed, onMounted, onUnmounted } from 'vue';

export function useTokenCountdown() {
  const remainingTime = ref<number>(0);
  let countdownInterval: number | null = null;

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
    startCountdown,
    stopCountdown,
  };
}
