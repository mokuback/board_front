// useSSE.ts
import { ref, type Ref } from 'vue';
import { showNotification } from '../services/notificationService';
import axios from 'axios';
import type { TaskCategory } from '../types/task';

const eventSource = ref<EventSource | null>(null);
const MAX_RETRIES = 3;
const RETRY_DELAY = 10000;
const LINE_NOTIFY = 'line_notify';
let retryCount = 0;
let tokenRefreshInterval: number | null = null;

export const useSSE = (tasks: Ref<TaskCategory[]>) => {
  // 生成设备ID
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  // 获取短期 SSE token
  const getSSEToken = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/sse/token`);
      return response.data.sse_token;
    } catch (error) {
      console.error('获取 SSE token 失败:', error);
      throw error;
    }
  };

  // 定期刷新 token
  const startTokenRefresh = () => {
    // 每4分钟刷新一次 token（token 有效期为5分钟）
    tokenRefreshInterval = window.setInterval(async () => {
      try {
        await connect();
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 4 * 60 * 1000);
  };

  const connect = async () => {
    if (!localStorage.getItem('token')) {
      console.log('用户未登录，停止SSE连接');
      disconnect(); // 确保完全断开
      return;
    }

    // 先断开现有连接并清理定时器
    disconnect();

    try {
      showNotification('正在與推送服務連線，請稍候...', 'info');

      // 获取短期 token
      const sseToken = await getSSEToken();
      const deviceId = getDeviceId();

      // 使用短期 token 建立 SSE 连接
      eventSource.value = new EventSource(
        `${import.meta.env.VITE_API_BASE_URL}/sse/notify?sse_token=${sseToken}&device_id=${deviceId}`,
      );

      eventSource.value.onopen = () => {
        showNotification('已連線，開始接收通知');
        retryCount = 0; // 重置重试计数器
        startTokenRefresh(); // 开始定期刷新 token
      };

      eventSource.value.onmessage = event => {
        const data = JSON.parse(event.data);
        if (data.type === LINE_NOTIFY) {
          const { id, category_id, item_id, progress_id, last_executed } = data.message;

          // 直接更新传入的 tasks
          if (tasks.value && tasks.value.length > 0) {
            const category = tasks.value.find(c => c.id === category_id);
            if (category?.items) {
              const item = category.items.find(i => i.id === item_id);
              if (item?.progresses) {
                const progress = item.progresses.find(p => p.id === progress_id);
                if (progress && progress.notifies && progress.notifies.length > 0) {
                  progress.notifies[0].last_executed = last_executed;
                }
              }
            }
          }

          showNotification(
            `(後端 SSE 推送): ${category_id} - ${item_id} - ${progress_id} (${last_executed})`,
            'info',
            3000,
          );
        }
      };

      eventSource.value.onerror = error => {
        console.error('SSE Error:', error);
        // 完全断开连接
        disconnect();
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          showNotification(`連線發生錯誤，正在進行第 ${retryCount} 次重連...`, 'error');

          const delay = RETRY_DELAY * Math.pow(2, retryCount - 1);
          setTimeout(() => connect(), delay);
        } else {
          showNotification('已達最大重連次數，請重新整理頁面', 'error');
        }
      };
    } catch (error) {
      console.error('SSE Error:', error);
      showNotification('建立 SSE 連線失敗', 'error');
      disconnect(); // 确保出错时也完全断开
    }
  };

  const disconnect = () => {
    // 清理 EventSource
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }

    // 清理定时器
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
      tokenRefreshInterval = null;
    }

    // 重置重试计数
    retryCount = 0;

    showNotification('已斷開 SSE 連線');
  };

  return {
    connect,
    disconnect,
  };
};
