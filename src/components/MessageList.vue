<template>
  <div class="message-list">
    <div v-if="messages.length === 0" class="empty-message">
      暂无留言
    </div>
    
    <div v-else>
      <el-card v-for="message in messages" 
               :key="message.id" 
               class="message-item">
        <div class="message-content">
          <!-- 先显示图片，后显示文字 -->
          <img v-if="message.image" 
               :src="message.image" 
               class="message-image"
               @click="previewImage(message.image)" />
          <p>{{ message.content }}</p>
        </div>
        
        <div class="message-footer">
          <span class="message-time">
            {{ formatTime(message.timestamp) }}
          </span>
          <el-button type="danger" 
                     size="small" 
                     @click="handleDelete(message.id)">
            删除
          </el-button>
        </div>
      </el-card>
    </div>
    
    <!-- 图片预览 -->
    <el-dialog v-model="previewVisible" title="图片预览">
      <img :src="previewUrl" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { ElMessageBox } from 'element-plus'

interface Message {
  id: number
  content: string
  image?: string
  timestamp: string
}

export default defineComponent({
  name: 'MessageList',
  props: {
    messages: {
      type: Array as () => Message[],
      required: true
    }
  },
  setup(props, { emit }) {
    const previewVisible = ref(false)
    const previewUrl = ref('')

    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp)
      return date.toLocaleString()
    }

    const previewImage = (url: string) => {
      previewUrl.value = url
      previewVisible.value = true
    }

    const handleDelete = (messageId: number) => {
      ElMessageBox.confirm(
        '确定要删除这条留言吗？',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        emit('delete', messageId)
      }).catch(() => {})
    }

    return {
      previewVisible,
      previewUrl,
      formatTime,
      previewImage,
      handleDelete
    }
  }
})
</script>

<style scoped>
.message-list {
  max-height: 600px;
  overflow-y: auto;
}

.empty-message {
  text-align: center;
  color: #999;
  padding: 20px;
}

.message-item {
  margin-bottom: 15px;
}

.message-content {
  margin-bottom: 10px;
}

.message-content p {
  margin: 10px 0 0 0;
  white-space: pre-wrap;
}

.message-image {
  max-width: 200px;
  max-height: 200px;
  cursor: pointer;
  border-radius: 4px;
}

.message-image:hover {
  opacity: 0.8;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #999;
  font-size: 14px;
}

.message-time {
  color: #999;
}
</style>
