<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-content">
        <h3>{{ title }}</h3>
        <div class="status-options">
          <button
            v-for="(text, value) in TASK_STATUS_TEXT"
            :key="value"
            type="button"
            class="status-button"
            @click="handleStatusSubmit(Number(value))"
          >
            <span class="status-icon">{{ getStatusIcon(value) }}</span>
            <span class="status-text">{{ text }}</span>
          </button>
        </div>
        <div class="button-group">
          <button type="button" class="btn btn-cancel" @click="handleCancel">取消</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { defineProps, defineEmits } from 'vue';
  import { TASK_STATUS_TEXT } from '../utils/constants';
  import { getStatusIcon } from '../utils/statusUtils';

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: '設定進度狀態',
    },
    progressId: {
      type: Number,
      required: true,
    },
  });

  const emit = defineEmits(['update:modelValue', 'status-updated']);

  const handleCancel = () => {
    emit('update:modelValue', false);
  };

  const handleStatusSubmit = async (status: number) => {
    emit('status-updated', status);
    //emit('update:modelValue', false);
  };
</script>

<style scoped>
  .status-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 20px 0;
  }

  .status-button {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background-color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    text-align: left;
  }

  .status-button:hover {
    background-color: #f5f5f5;
    border-color: #999;
  }

  .status-icon {
    font-size: 1.2rem;
    margin-right: 10px;
  }

  .status-text {
    font-weight: 500;
  }

  .button-group {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-cancel {
    background-color: #f0f0f0;
    color: #333;
  }

  .btn-cancel:hover {
    background-color: #e0e0e0;
  }
</style>
