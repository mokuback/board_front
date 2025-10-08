<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-content">
        <h3>{{ title }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>項目名稱 <span class="required">*</span></label>
            <input type="text" v-model="formData.item_name" placeholder="請輸入項目名稱" required />
          </div>
          <div class="form-group">
            <label>內容描述</label>
            <textarea v-model="formData.content" placeholder="請輸入項目說明" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>啟動時間 <span class="required">*</span></label>
            <input type="datetime-local" v-model="formData.item_at" required />
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

  interface TaskItem {
    id: number;
    item_name: string;
    content: string;
    item_at: string;
    category_id: number;
  }

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: '新增項目',
    },
    isEdit: {
      type: Boolean,
      default: false,
    },
    editData: {
      type: Object as PropType<TaskItem | null>,
      default: null,
    },
    items: {
      type: Array as PropType<TaskItem[]>,
      default: () => [],
    },
    currentCategoryId: {
      type: Number,
      required: true,
    },
  });

  const emit = defineEmits(['update:modelValue', 'submit', 'clear']);

  // 获取当前日期时间作为默认值
  // const getDefaultDateTime = () => {
  //   const now = new Date();
  //   return now.toISOString().slice(0, 16);
  // };

  // 获取当前日期时间作为默认值（使用本地时区）
  const getDefaultDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formData = reactive<TaskItem>({
    id: 0,
    item_name: '',
    content: '',
    item_at: getDefaultDateTime(),
    category_id: props.currentCategoryId,
  });

  const handleCancel = () => {
    emit('update:modelValue', false);
  };

  const handleClear = () => {
    if (props.isEdit && props.editData) {
      // 编辑模式下恢复原始值
      formData.id = props.editData.id;
      formData.item_name = props.editData.item_name;
      formData.content = props.editData.content;
      // formData.item_at = props.editData.item_at;
      if (props.editData.item_at) {
        const date = new Date(props.editData.item_at);
        formData.item_at = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
    } else {
      // 新增模式下重置为默认值
      resetForm();
    }
  };

  const handleSubmit = () => {
    // showNotification(JSON.stringify(formData), 'success');
    if (!formData.item_name.trim()) {
      return;
    }

    // 检查项目名称是否已存在（排除自己）
    const nameExists = props.items.some(
      item =>
        item.item_name.toLowerCase() === formData.item_name.trim().toLowerCase() &&
        item.id !== formData.id &&
        item.category_id === props.currentCategoryId,
    );

    if (nameExists) {
      showNotification('項目名稱已存在於這個分類中，請使用其他名稱', 'error');
      return;
    }

    const submitData = { ...formData };
    if (submitData.item_at) {
      const date = new Date(submitData.item_at);
      submitData.item_at = date.toISOString();
    }

    emit('submit', submitData);
  };

  const resetForm = () => {
    formData.id = 0;
    formData.item_name = '';
    formData.content = '';
    formData.item_at = getDefaultDateTime();
    formData.category_id = props.currentCategoryId;
  };

  watch(
    () => props.editData,
    newData => {
      if (newData) {
        formData.id = newData.id;
        formData.item_name = newData.item_name;
        formData.content = newData.content;
        formData.item_at = newData.item_at;
        if (newData.item_at) {
          // 将UTC时间转换为本地时区时间
          const date = new Date(newData.item_at);
          // 转换为本地时区并格式化为datetime-local输入框需要的格式
          formData.item_at = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
      }
    },
    { immediate: true },
  );

  watch(
    () => props.isEdit,
    newIsEdit => {
      if (!newIsEdit) {
        // 从编辑模式切换到新增模式时，重置表单
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
