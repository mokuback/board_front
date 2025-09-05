<template>
  <el-form :model="form" :rules="rules" ref="formRef">
    <el-form-item prop="image">
      <ImageUpload
        v-model="form.imagePreview"
        @image-selected="handleImageSelected"
      />
    </el-form-item>
    
    <el-form-item prop="content">
      <el-input
        v-model="form.content"
        type="textarea"
        :rows="4"
        placeholder="请输入留言内容..."
      />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submitForm" :loading="loading">
        发布留言
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import ImageUpload from './ImageUpload.vue'
import { uploadToCloudinary } from '../utils/imageUpload'

interface FormData {
  content: string
  imagePreview: string
  imageFile: File | null
}

export default defineComponent({
  name: 'MessageForm',
  components: { ImageUpload },
  emits: ['submit'],
  setup(props, { emit }) {
    const formRef = ref()
    const loading = ref(false)

    const form = reactive<FormData>({
      content: '',
      imagePreview: '',
      imageFile: null
    })

    const rules = {
      content: [
        { required: true, message: '请输入留言内容', trigger: 'blur' },
        { min: 1, max: 500, message: '长度在 1 到 500 个字符', trigger: 'blur' }
      ]
    }

    const handleImageSelected = (file: File) => {
      form.imageFile = file
    }

    const submitForm = async () => {
      if (!formRef.value) return
      
      await formRef.value.validate(async (valid: boolean) => {
        if (valid) {
          loading.value = true
          try {
            let imageUrl = ''
            if (form.imageFile) {
              imageUrl = await uploadToCloudinary(form.imageFile)
            }

            emit('submit', {
              content: form.content,
              image: imageUrl
            })

            // 重置表单
            form.content = ''
            form.imagePreview = ''
            form.imageFile = null
            ElMessage.success('留言发布成功')
          } catch (error) {
            ElMessage.error('留言发布失败')
          } finally {
            loading.value = false
          }
        }
      })
    }

    return {
      form,
      rules,
      formRef,
      loading,
      handleImageSelected,
      submitForm
    }
  }
})
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
