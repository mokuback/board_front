<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-content">
        <h3>{{ title }}</h3>
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
import { reactive, watch, type PropType } from 'vue';
import { showNotification } from '../services/notificationService';

interface TaskCategory {
  id: number;
  category_name: string;
  content: string;
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: '新增分類'
  },

  isEdit: {
    type: Boolean,
    default: false
  },
  editData: {
    type: Object as PropType<TaskCategory | null>,
    default: null
  },  
  categories: {
    type: Array as PropType<TaskCategory[]>,
    default: () => []
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
  if (props.isEdit && props.editData) {
    // 编辑模式下恢复原始值
    formData.id = props.editData.id;
    formData.category_name = props.editData.category_name;
    formData.content = props.editData.content;
  } else {
    // 新增模式下清空
    resetForm();
  }
};

const handleSubmit = () => {
  if (!formData.category_name.trim()) {
    return;
  }

  // 检查分类名称是否已存在（排除自己）
  const nameExists = props.categories.some(
    cat => cat.category_name.toLowerCase() === formData.category_name.trim().toLowerCase() && cat.id !== formData.id
  );
  
  if (nameExists) {
    // 显示警告通知
    showNotification('分類名稱已存在，請使用其他名稱', 'error');
    return;
  }
  
  emit('submit', { ...formData });
};

const resetForm = () => {
  formData.id = 0; 
  formData.category_name = '';
  formData.content = '';
};

watch(() => props.editData, (newData) => {
  if (newData) {
    formData.id = newData.id;
    formData.category_name = newData.category_name;
    formData.content = newData.content;
  }
}, { immediate: true });

watch(() => props.isEdit, (newIsEdit) => {
  if (!newIsEdit) {
    // 从编辑模式切换到新增模式时，重置表单
    resetForm();
  }
}, { immediate: true });

defineExpose({
  handleClear
});
</script>

<style>
@import '../assets/styles/components/dialog.css';
</style>
