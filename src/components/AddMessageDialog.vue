<script setup lang="ts">
import { ref, watch } from 'vue';
import { showLoading, hideLoading } from '../services/loadingService';
import { showNotification } from '../services/notificationService';
import axios from '../services/axiosInterceptor';

// 定义组件的属性
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

// 定义组件的事件
const emit = defineEmits(['update:modelValue', 'message-created']);

// 对话框内部状态
const messageContent = ref('');
const selectedImage = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isSubmitting = ref(false);

// 图片预览URL
const imagePreviewUrl = ref<string | null>(null);

// 文件大小限制 (5MB)
const MAX_FILE_SIZE = 1 * 1024 * 1024;

// 允许的文件类型
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// 监听对话框的打开/关闭
watch(() => props.modelValue, (newVal) => {
  // 当对话框打开时，不清空任何内容
  // 当对话框关闭时，保持原有内容
});

// 处理图片上传
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    
    // 检查文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      showNotification('只支援 JPEG、PNG 和 GIF 格式的圖片', 'error');
      if (fileInput.value) {
        fileInput.value.value = '';
      }
      return;
    }
    
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      showNotification('圖片大小不能超過1MB', 'error');
      if (fileInput.value) {
        fileInput.value.value = '';
      }
      return;
    }
    
    selectedImage.value = file;
    
    // 创建图片预览URL
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreviewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(selectedImage.value);
  }
};

// 图片移除
const removeImage = () => {
  selectedImage.value = null;
  imagePreviewUrl.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 清除表单（只有清除按钮会调用此函数）
const handleClear = () => {
  messageContent.value = '';
  removeImage();
};


// 关闭对话框（取消按钮和点击外部区域会调用此函数）
const handleClose = () => {
  // 不清除表单内容，只关闭对话框
  emit('update:modelValue', false);
};

// 提交留言
const handleSubmit = async () => {
    if (!messageContent.value.trim()) {
        showNotification('請輸入留言内容', 'error');
        return;
    }


    isSubmitting.value = true;
    showLoading('新增留言中...');
  
    try {
        const formData = new FormData();
        formData.append('content', messageContent.value.trim())
        
        if (selectedImage.value) {
            formData.append('file', selectedImage.value);
      }
        
      const response = await axios.post('/messages/', formData);

      if (response.data.ok) {   
        handleClear();
        handleClose();
        emit('message-created');
        showNotification('留言新增成功', 'success')
      } else {
        showNotification('留言新增失敗', 'error');
      }
    } catch (error) {
        // 由 axiosInterceptor.ts 處理錯誤
    } finally {
        hideLoading();
        isSubmitting.value = false;
    }
};


</script>

<template>
  <div v-show="modelValue" class="dialog-overlay" @click.self="handleClose">
    <div class="dialog-content">
      <h3>新增留言</h3>
      
      <!-- 图片上传 -->
      <div class="form-group">
        <label>上傳圖片</label>
        <input 
          type="file" 
          accept="image/*"
          @change="handleImageUpload"
          ref="fileInput"
        >
        
        <!-- 图片预览区域 -->
        <div v-if="imagePreviewUrl" class="image-preview">
          <img :src="imagePreviewUrl" alt="圖片預覽" />
          <button type="button" class="remove-image" @click="removeImage">移除圖片</button>
        </div>
      </div>

      <!-- 留言内容 -->
      <div class="form-group">
        <label>留言内容</label>
        <textarea 
          v-model="messageContent"
          rows="4"
          placeholder="請輸入留言内容..."
        ></textarea>
      </div>

      <!-- 按钮组 -->
      <div class="button-group">
        <button class="btn btn-cancel" @click="handleClose">取消</button>        
        <button class="btn btn-clear" @click="handleClear">清除</button>        
        <button class="btn btn-confirm" @click="handleSubmit" :disabled="isSubmitting">
          {{ isSubmitting ? '提交中...' : '確定' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@import '../assets/styles/components/dialog.css';
</style>

<style scoped>
/* 组件特有样式 */
.image-preview {
  margin-top: 10px;
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.remove-image:hover {
  background-color: rgba(255, 255, 255, 0.9);
}
</style>
