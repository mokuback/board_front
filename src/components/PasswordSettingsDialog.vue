<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-content">
        <h3>密碼設定</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>原密碼</label>
            <input
              type="password"
              v-model="formData.oldPassword"
              placeholder="請輸入原來的密碼"
              required
            />
          </div>
          <div class="form-group">
            <label>新密碼</label>
            <input
              type="password"
              v-model="formData.newPassword"
              placeholder="請輸入至少四個字元的新密碼"
              minlength="4"
              required
            />
          </div>
          <div class="form-group">
            <label>新密碼確認</label>
            <input
              type="password"
              v-model="formData.confirmPassword"
              placeholder="請再輸入一次新密碼"
              minlength="4"
              required
            />
          </div>
          <div class="button-group">
            <button type="button" class="btn btn-cancel" @click="handleCancel">
              取消
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
import { ref, reactive } from 'vue';
import { showLoading, hideLoading } from '../services/loadingService';
import { showNotification } from '../services/notificationService';
import axios from '../services/axiosInterceptor';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const handleSubmit = async () => {
  if (formData.newPassword !== formData.confirmPassword) {
    showNotification('新密码两次输入不一致', 'error');
    return;
  }

  showLoading('修改密码中...');
  try {
    // 使用 base64 编码密码（注意：这不是加密，只是编码）
    const encodedOldPassword = btoa(formData.oldPassword);
    const encodedNewPassword = btoa(formData.newPassword);

    const response = await axios.put('/users/password', {
      old_password: encodedOldPassword,
      new_password: encodedNewPassword
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.ok) {
        showNotification('密码修改成功', 'success');
        emit('update:modelValue', false);
        resetForm();
    } else {
        showNotification('密码修改失败', 'error');
    }
  } catch (error) {
        // 由 axiosInterceptor.ts 處理錯誤
  } finally {
        hideLoading();
  }
};


const handleCancel = () => {
  emit('update:modelValue', false);
  resetForm();
};

const resetForm = () => {
  formData.oldPassword = '';
  formData.newPassword = '';
  formData.confirmPassword = '';
};
</script>

<style>
@import '../assets/styles/components/dialog.css';
</style>

<style scoped>
/* 组件特有样式 */
.form-group input {
  margin-bottom: 10px;
}
</style>
