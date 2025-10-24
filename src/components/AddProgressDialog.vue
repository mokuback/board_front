<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-content">
        <h3>{{ title }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>進度名稱 <span class="required">*</span></label>
            <input type="text" v-model="formData.progress_name" placeholder="請輸入進度名稱" required />
          </div>
          <div class="form-group">
            <label>內容描述</label>
            <textarea v-model="formData.content" placeholder="請輸入進度說明" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>開始時間 <span class="required">*</span></label>
            <input type="datetime-local" v-model="formData.progress_at" required />
          </div>
          <div class="form-group">
            <label>狀態 <span class="required">*</span></label>
            <div class="status-options">
              <label v-for="(text, value) in TASK_STATUS_TEXT" :key="value" class="status-option">
                <input type="radio" v-model="formData.status" :value="Number(value)" />
                <span class="status-label"> {{ getStatusIcon(value) }} {{ text }} </span>
              </label>
            </div>
          </div>
          <div class="button-group">
            <button type="button" class="btn btn-cancel" @click="handleCancel">取消</button>
            <button type="button" class="btn btn-clear" @click="handleClear">清除</button>
            <button type="submit" class="btn btn-confirm">確定</button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { reactive, watch, type PropType } from 'vue';
  import { showNotification } from '../services/notificationService';
  import { TASK_STATUS_TEXT, TASK_STATUS } from '../utils/constants';
  import { getStatusIcon } from '../utils/statusUtils';
  import { getDefaultDateTime } from '../utils/dateUtils';
  import type { TaskProgress, TaskItem } from '../types/task';

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: '新增進度',
    },
    isEdit: {
      type: Boolean,
      default: false,
    },
    editData: {
      type: Object as PropType<TaskProgress | null>,
      default: null,
    },
    progresses: {
      type: Array as PropType<TaskProgress[]>,
      default: () => [],
    },
    currentItem: {
      type: Object as PropType<TaskItem | null>,
      required: true,
    },
  });

  const emit = defineEmits(['update:modelValue', 'submit', 'clear']);

  const formData = reactive<TaskProgress>({
    id: 0,
    progress_name: '',
    content: '',
    progress_at: getDefaultDateTime(),
    status: TASK_STATUS.NORMAL,
    item_id: props.currentItem?.id || 0,
  });

  const handleCancel = () => {
    emit('update:modelValue', false);
  };

  const handleClear = () => {
    if (props.isEdit && props.editData) {
      formData.id = props.editData.id;
      formData.progress_name = props.editData.progress_name;
      formData.content = props.editData.content;
      formData.status = props.editData.status;
      if (props.editData.progress_at) {
        const date = new Date(props.editData.progress_at);
        formData.progress_at = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
    } else {
      resetForm();
    }
  };

  const handleSubmit = () => {
    if (!formData.progress_name.trim()) {
      return;
    }

    const nameExists = props.progresses.some(
      progress =>
        progress.progress_name.toLowerCase() === formData.progress_name.trim().toLowerCase() &&
        progress.id !== formData.id &&
        progress.item_id === props.currentItem?.id,
    );

    if (nameExists) {
      showNotification('進度名稱已存在於這個項目中，請使用其他名稱', 'error');
      return;
    }

    const submitData = { ...formData };
    if (submitData.progress_at) {
      const date = new Date(submitData.progress_at);
      submitData.progress_at = date.toISOString();
    }

    emit('submit', submitData, props.currentItem);
  };

  const resetForm = () => {
    formData.id = 0;
    formData.progress_name = '';
    formData.content = '';
    formData.progress_at = getDefaultDateTime();
    formData.status = TASK_STATUS.NORMAL;
    formData.item_id = props.currentItem?.id || 0;
  };

  watch(
    () => props.editData,
    newData => {
      if (newData) {
        formData.id = newData.id;
        formData.progress_name = newData.progress_name;
        formData.content = newData.content;
        formData.status = newData.status;
        if (newData.progress_at) {
          const date = new Date(newData.progress_at);
          formData.progress_at = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
      }
    },
    { immediate: true },
  );

  watch(
    () => props.isEdit,
    newIsEdit => {
      if (!newIsEdit) {
        resetForm();
      }
    },
    { immediate: true },
  );

  defineExpose({
    handleClear,
  });
</script>

<style>
  @import '../assets/styles/components/dialog.css';
</style>
<style scoped>
  .status-options {
    display: flex;
    gap: 16px;
    margin-top: 8px;
  }

  .status-option {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .status-option input[type='radio'] {
    margin-right: 6px;
  }

  .status-label {
    font-size: 14px;
    color: #5f6368;
    white-space: nowrap; /* 防止文字换行 */
    display: inline-flex; /* 使用弹性布局 */
    align-items: center; /* 垂直居中对齐 */
    gap: 4px; /* 图标和文字之间的间距 */
  }

  .status-option:has(input:checked) .status-label {
    color: #1a73e8;
    font-weight: 500;
  }
</style>
