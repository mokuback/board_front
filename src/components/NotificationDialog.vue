<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-content">
        <h3>發送通知</h3>
        <div class="notification-content">
          <p>確定發送內容更新的通知給以下群組嗎？</p>
            <div class="channel-info">
                <div class="channel-icon">
                    <img v-if="channelIcon" :src="channelIcon" alt="Channel Icon">
                    <span v-else>📱</span>
                </div>
                <div class="channel-details">
                    <div class="channel-name">{{ channelName }}</div>
                </div>
            </div>

        </div>
        <div class="button-group">
          <button type="button" class="btn btn-cancel" @click="handleCancel">
            取消
          </button>
          <button type="button" class="btn btn-confirm" @click="handleConfirm">
            確定
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { showNotification } from '../services/notificationService';
import { showLoading, hideLoading } from '../services/loadingService';
import axios from '../services/axiosInterceptor';
import channelIconPng from '../assets/images/Finance Alert.png';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

// Channel 信息
const channelName = ref('Finance Alert');
const channelIcon = ref(channelIconPng);


const handleConfirm = async () => {

  // showLoading('發送通知中...');
  // try {
  //   // 调用发送通知的 API
  //   const response = await axios.post('/api/notifications/send', {
  //     message: '看板內容已更新，請查看最新消息。'
  //   });

  //   if (response.data.ok) {
  //     showNotification('通知發送成功', 'success');
  //     emit('update:modelValue', false);
  //   } else {
  //     showNotification('通知發送失敗', 'error');
  //   }
  // } catch (error) {
  //   showNotification('通知發送失敗', 'error');
  // } finally {
  //   hideLoading();
  // }
};

const handleCancel = () => {
  emit('update:modelValue', false);
};

</script>

<style scoped>
@import '../assets/styles/components/dialog.css';

.notification-content {
  margin: 1.5rem 0;
}

.channel-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.channel-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.channel-details {
  flex: 1;
}

.channel-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.channel-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}
</style>
