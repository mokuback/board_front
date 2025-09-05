<template>
  <div class="image-upload-container">
    <el-upload
      class="image-uploader"
      action="#"
      :show-file-list="false"
      :before-upload="beforeImageUpload"
      :http-request="handleImageSelect"
    >
      <img v-if="imageUrl" :src="imageUrl" class="uploaded-image" />
      <el-icon v-else class="upload-icon"><Plus /></el-icon>
    </el-upload>
    
    <div v-if="imageUrl" class="image-actions">
      <el-button type="danger" size="small" @click="removeImage">
        删除图片
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

export default defineComponent({
  name: 'ImageUpload',
  components: { Plus },
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'image-selected'],
  
  setup(props, { emit }) {
    const imageUrl = ref(props.modelValue)

    watch(() => props.modelValue, (newValue) => {
      imageUrl.value = newValue
    })

    const beforeImageUpload = (file: File) => {
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

    const handleImageSelect = ({ file }: { file: File }) => {
      const previewUrl = URL.createObjectURL(file)
      imageUrl.value = previewUrl
      emit('update:modelValue', previewUrl)
      emit('image-selected', file)
    }

    const removeImage = () => {
      if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl.value)
      }
      imageUrl.value = ''
      emit('update:modelValue', '')
    }

    return {
      imageUrl,
      beforeImageUpload,
      handleImageSelect,
      removeImage
    }
  }
})
</script>

<style scoped>
.image-upload-container {
  display: inline-block;
}

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
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.uploaded-image {
  width: 178px;
  height: 178px;
  object-fit: cover;
  display: block;
}

.image-actions {
  margin-top: 8px;
  text-align: center;
}
</style>
