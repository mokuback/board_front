<template>
  <div class="board-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>留言板</h1>
          <el-button type="danger" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      
      <el-main>
        <!-- 留言表单 -->
        <el-card class="message-form-card">
          <MessageForm @submit="handleMessageSubmit" />
        </el-card>

        <!-- 留言列表 -->
        <el-card class="message-list-card">
          <MessageList 
            :messages="messages" 
            @delete="handleMessageDelete"
          />
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import MessageForm from '../components/MessageForm.vue'
import MessageList from '../components/MessageList.vue'

interface Message {
  id: number
  content: string
  image?: string
  timestamp: string
}

export default defineComponent({
  name: 'Board',
  components: {
    MessageForm,
    MessageList
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const messages = ref<Message[]>([])

    // 模拟数据
    const mockMessages: Message[] = [
      {
        id: 1,
        content: '这是第一条留言',
        image: 'https://example.com/image1.jpg',
        timestamp: new Date().toISOString()
      }
    ]

    // 处理留言提交
    const handleMessageSubmit = (messageData: Omit<Message, 'id' | 'timestamp'>) => {
      const newMessage: Message = {
        id: messages.value.length + 1,
        ...messageData,
        timestamp: new Date().toISOString()
      }
      messages.value.unshift(newMessage)
      ElMessage.success('留言成功')
    }

    // 处理留言删除
    const handleMessageDelete = (messageId: number) => {
      const index = messages.value.findIndex(msg => msg.id === messageId)
      if (index > -1) {
        messages.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    }

    // 处理退出登录
    const handleLogout = () => {
      authStore.clearToken()
      router.push('/')
    }

    // 检查不活动时间
    let timeoutCheck: number
    onMounted(() => {
      messages.value = mockMessages
      
      // 每30秒检查一次不活动时间
      timeoutCheck = window.setInterval(() => {
        if (authStore.checkTimeout()) {
          ElMessage.warning('已超时自动退出')
          router.push('/')
        }
      }, 30000)
      
      // 监听用户活动
      const updateActivity = () => authStore.updateActivity()
      window.addEventListener('mousemove', updateActivity)
      window.addEventListener('keypress', updateActivity)
    })

    onUnmounted(() => {
      clearInterval(timeoutCheck)
    })

    return {
      messages,
      handleMessageSubmit,
      handleMessageDelete,
      handleLogout
    }
  }
})
</script>

<style scoped>
.board-container {
  height: 100vh;
}

.el-header {
  background-color: #409EFF;
  color: white;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

h1 {
  margin: 0;
  font-size: 24px;
}

.message-form-card {
  margin-bottom: 20px;
}

.message-list-card {
  min-height: 400px;
}
</style>
