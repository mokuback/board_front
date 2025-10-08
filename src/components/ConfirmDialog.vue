<template>
  <transition name="dialog-fade">
    <div v-show="visible" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-content">
        <h3>確認</h3>
        <div class="message">{{ message }}</div>
        <div class="button-group">
          <button type="button" class="btn btn-cancel" @click="handleCancel">
            取消
          </button>
          <button type="button" class="btn btn-confirm" @click="handleConfirm">
            確定
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  message: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['confirm', 'cancel', 'update:visible']);

const handleConfirm = () => {
  emit('update:visible', false);
  emit('confirm');
};

const handleCancel = () => {
  emit('update:visible', false);
  emit('cancel');
};
</script>
