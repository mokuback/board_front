<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-content">
        <h3>新增分類</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>分類名稱 <span class="required">*</span></label>
            <input
              type="text"
              v-model="formData.category_name"
              placeholder="請輸入分類名稱"
              required
            />
          </div>
          <div class="form-group">
            <label>內容描述</label>
            <textarea
              v-model="formData.content"
              placeholder="請輸入分類說明"
              rows="4"
            ></textarea>
          </div>
          <div class="button-group">
            <button type="button" class="btn btn-cancel" @click="handleCancel">
              取消
            </button>
            <button type="button" class="btn btn-clear" @click="handleClear">
              清除
            </button>
            <button type="submit" class="btn btn-confirm">
              確定
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

interface TaskCategory {
  id: number;
  category_name: string;
  content: string;
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'submit', 'clear']);

const formData = reactive<TaskCategory>({
  id: 0,
  category_name: '',
  content: ''
});

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleClear = () => {
  resetForm();
  // emit('clear');
};

const handleSubmit = () => {
  if (!formData.category_name.trim()) {
    return;
  }
  emit('submit', { ...formData });
};

const resetForm = () => {
  formData.category_name = '';
  formData.content = '';
};

defineExpose({
  handleClear
});
</script>

<style>
@import '../assets/styles/components/dialog.css';
</style>
