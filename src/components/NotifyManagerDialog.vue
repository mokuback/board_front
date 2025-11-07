<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-content">
        <h3>通知管理</h3>
        <div class="button-group-vertical">
          <button type="button" class="status-button" @click="handleGetList">
            <span class="status-icon">📝</span>
            <span class="status-text">獲取後端通知列表</span>
          </button>
          <button type="button" class="status-button" @click="handleUpdateList">
            <span class="status-icon">🔄</span>
            <span class="status-text">更新後端通知列表</span>
          </button>
          <button type="button" class="status-button" @click="handleRemoveLastExecuted">
            <span class="status-icon">🏷️</span>
            <span class="status-text">移除所有通知戮記</span>
          </button>
          <button type="button" class="status-button" @click="handleDeleteNotify">
            <span class="status-icon">🗑️</span>
            <span class="status-text">刪除所有通知請求</span>
          </button>
        </div>
        <div class="button-group">
          <button type="button" class="btn btn-cancel" @click="handleCancel">取消</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
  });

  const emit = defineEmits(['update:modelValue', 'update-list', 'get-list', 'remove-executed', 'delete-notify']);

  const handleCancel = () => {
    emit('update:modelValue', false);
  };

  const handleUpdateList = () => {
    emit('update-list');
    //emit('update:modelValue', false);
  };

  const handleGetList = () => {
    emit('get-list');
  };

  const handleRemoveLastExecuted = () => {
    emit('remove-executed');
    //emit('update:modelValue', false);
  };

  const handleDeleteNotify = () => {
    emit('delete-notify');
    //emit('update:modelValue', false);
  };
</script>

<style scoped>
  .button-group-vertical {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0;
  }

  .button-group-vertical .status-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0.75rem 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .button-group-vertical .status-button:hover {
    background: #f5f5f5;
    border-color: #999;
  }

  .button-group-vertical .status-icon {
    margin-right: 0.5rem;
    font-size: 1.2em;
  }

  .button-group-vertical .status-text {
    flex: 1;
    text-align: left;
  }
</style>
