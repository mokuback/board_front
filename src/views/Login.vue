<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>留言板登录</h2>
      </template>
      
      <div class="line-id-display">
        <p>LINE ID: {{ lineId || 'none' }}</p>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { liff } from '@line/liff'

export default defineComponent({
  name: 'Login',
  setup() {
    const lineId = ref('')

    const getLineProfile = async () => {
      try {
        await liff.init({ liffId: '2008056298-jBr2y22v' })
        
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          lineId.value = profile.userId
        }
      } catch (error) {
        console.error('LIFF initialization failed', error)
      }
    }

    onMounted(() => {
      getLineProfile()
    })

    return {
      lineId
    }
  }
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.login-card {
  width: 400px;
}

h2 {
  text-align: center;
  margin: 0;
  color: #409EFF;
}

.line-id-display {
  text-align: center;
  padding: 20px 0;
}
</style>
