// useSSE.ts
import { ref, type Ref } from 'vue';
import { showNotification } from '../services/notificationService';
import axios from 'axios';
import type { TaskCategory } from '../types/task';

// 全局状态管理
const eventSource = ref<EventSource | null>(null);
const MAX_RETRIES = 3; // 最大重试次数
const RETRY_DELAY = 10000; // 基础重试延迟（毫秒）
const LINE_NOTIFY = 'line_notify'; // 通知类型常量
let retryCount = 0; // 当前重试次数
let tokenRefreshInterval: number | null = null; // token刷新定时器
let isConnecting = false; // 连接状态标记
let lastErrorTime: number | null = null; // 上次错误时间
const ERROR_COOLDOWN = 5000; // 错误冷却时间（毫秒）

export const useSSE = (tasks: Ref<TaskCategory[]>) => {
  // 生成并缓存设备ID
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

  // 检查连接状态是否健康
  const isConnectionHealthy = () => {
    if (!eventSource.value) return false;
    const state = eventSource.value.readyState;
    return state === EventSource.OPEN || state === EventSource.CONNECTING;
  };

  // 心跳检测
  const startHeartbeat = () => {
    const heartbeatInterval = window.setInterval(async () => {
      if (eventSource.value && eventSource.value.readyState === EventSource.OPEN) {
        try {
          await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/health`);
        } catch (error) {
          console.error('Heartbeat failed:', error);
          clearInterval(heartbeatInterval);
          connect();
        }
      }
    }, 30000); // 每30秒检查一次
    return heartbeatInterval;
  };

  // 启动 token 刷新机制
  const startTokenRefresh = () => {
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }

    let lastTokenRefresh = Date.now();
    tokenRefreshInterval = window.setInterval(async () => {
      try {
        const now = Date.now();
        if (now - lastTokenRefresh < 2 * 60 * 1000) {
          return;
        }

        if (isConnectionHealthy()) {
          const newToken = await getSSEToken();
          if (eventSource.value) {
            const url = new URL(eventSource.value.url);
            url.searchParams.set('sse_token', newToken);
            eventSource.value.close();
            eventSource.value = new EventSource(url.toString());
          }
          lastTokenRefresh = now;
        } else {
          await connect();
          lastTokenRefresh = now;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 4 * 60 * 1000);
  };

  // 建立 SSE 连接
  const connect = async () => {
    if (!localStorage.getItem('token')) {
      console.log('用户未登录，停止SSE连接');
      disconnect();
      return;
    }

    if (isConnecting) {
      console.log('正在连接中，跳过重复连接');
      return;
    }

    isConnecting = true;

    try {
      if (!isConnectionHealthy()) {
        disconnect();
      }

      showNotification('正在與推送服務連線，請稍候...', 'info');

      const sseToken = await getSSEToken();
      const deviceId = getDeviceId();

      eventSource.value = new EventSource(
        `${import.meta.env.VITE_API_BASE_URL}/sse/notify?sse_token=${sseToken}&device_id=${deviceId}`,
      );

      eventSource.value.onopen = () => {
        showNotification('已連線，開始接收通知');
        retryCount = 0;
        isConnecting = false;
        startTokenRefresh();
        startHeartbeat();
      };

      eventSource.value.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === LINE_NOTIFY) {
            const { id, category_id, item_id, progress_id, last_executed } = data.message;

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
        } catch (error) {
          console.error('Message processing error:', error);
        }
      };

      eventSource.value.onerror = error => {
        console.error('SSE Error:', error);
        isConnecting = false;

        const now = Date.now();
        if (!lastErrorTime || now - lastErrorTime > ERROR_COOLDOWN) {
          lastErrorTime = now;
          disconnect();

          if (retryCount < MAX_RETRIES) {
            retryCount++;
            showNotification(`連線發生錯誤，正在進行第 ${retryCount} 次重連...`, 'error');

            const delay = Math.max(RETRY_DELAY * Math.pow(2, retryCount - 1), ERROR_COOLDOWN);
            setTimeout(() => connect(), delay);
          } else {
            showNotification('已達最大重連次數，請重新整理頁面', 'error');
          }
        }
      };
    } catch (error) {
      console.error('SSE Error:', error);
      isConnecting = false;
      showNotification('建立 SSE 連線失敗', 'error');
      disconnect();
    }
  };

  // 断开连接并清理资源
  const disconnect = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }

    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
      tokenRefreshInterval = null;
    }

    retryCount = 0;
    isConnecting = false;
    lastErrorTime = null;

    showNotification('已斷開 SSE 連線');
  };

  return {
    connect,
    disconnect,
  };
};
