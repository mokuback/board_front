<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleClose">
      <div class="dialog-content">
        <h3>登入記錄</h3>
        <div class="login-records-container">
          <div v-if="useLoading().loadingState.isVisible" class="loading">載入中...</div>
          <div v-else-if="records.length === 0" class="no-records">暫無登入記錄</div>
          <div v-else class="records-list">
            <div v-for="record in records" :key="record.id" class="record-item">
              <div class="record-info">
                <span class="display-name">{{ record.display_name }}</span>
                <span class="login-time">{{ formatDateTime(record.login_datetime) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="button-group">
          <button type="button" class="btn btn-cancel" @click="handleClose">
            取消
          </button>          
          <button type="button" class="btn btn-confirm" @click="fetchLoginRecords">
            取回
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from '../services/axiosInterceptor';
import { showLoading, hideLoading, useLoading } from '../services/loadingService';
import { formatDateTime } from '../utils/dateUtils';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);
interface LoginRecord {
  id: number;
  display_name: string;
  login_datetime: string;
}
const records = ref<LoginRecord[]>([]);

const fetchLoginRecords = async () => {
  showLoading('記錄讀取中...');
  try {
    const response = await axios.get('/admin/login-records/');
    records.value = response.data;
  } catch (error) {
    console.error('獲取登入記錄失敗', error);
  } finally {
    hideLoading();
  }
};

const handleClose = () => {
  emit('update:modelValue', false);
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    fetchLoginRecords();
  }
});

onMounted(() => {
  if (props.modelValue) {
      fetchLoginRecords();
  }
});
</script>

<style scoped>
.login-records-container {
  max-height: 400px;
  overflow-y: auto;
  margin: 1rem 0;
}

.loading, .no-records {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.record-item {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
}

.record-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.display-name {
  font-weight: 600;
  color: #333;
}

.login-time {
  color: #666;
  font-size: 0.9rem;
}

.button-group {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
</style>

<style>
@import '../assets/styles/components/dialog.css';
</style>
