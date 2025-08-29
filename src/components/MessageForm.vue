<template>
  <el-form :model="form" :rules="rules" ref="formRef">
    <el-form-item prop="content">
      <el-input
        v-model="form.content"
        type="textarea"
        :rows="4"
        placeholder="请输入留言内容..."
      />
    </el-form-item>
    
    <el-form-item prop="image">
      <el-upload
        class="image-uploader"
        action="#"
        :show-file-list="false"
        :before-upload="beforeImageUpload"
        :http-request="handleImageUpload"
      >
        <img v-if="form.image" :src="form.image" class="uploaded-image" />
        <el-icon v-else class="upload-icon"><Plus /></el-icon>
      </el-upload>
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submitForm" :loading="loading">
        发布留言
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['submit'])
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  content: '',
  image: ''
})

const rules = {
  content: [
    { required: true, message: '请输入留言内容', trigger: 'blur' },
    { min: 1, max: 500, message: '长度在 1 到 500 个字符', trigger: 'blur' }
  ]
}

const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleImageUpload = async ({ file }) => {
  // 这里后续会集成 Cloudinary 上传
  // 暂时使用本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    form.image = e.target.result
  }
  reader.readAsDataURL(file)
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      try {
        emit('submit', { ...form })
        // 重置表单
        form.content = ''
        form.image = ''
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-uploader:hover {
  border-color: #409EFF;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
}

.uploaded-image {
  width: 178px;
  height: 178px;
  object-fit: cover;
}
</style>
