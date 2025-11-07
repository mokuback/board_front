<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleClose">
      <div class="dialog-content">
        <h3>{{ title }}</h3>
        <div class="table-container">
          <div v-if="loading" class="loading">載入中...</div>
          <div v-else-if="!data || Object.keys(data).length === 0" class="no-data">暫無資料</div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th v-for="(value, key) in data[0]" :key="key">{{ key }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in data" :key="index">
                <td v-for="(value, key) in row" :key="key">{{ value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="button-group">
          <button type="button" class="btn btn-cancel" @click="handleClose">關閉</button>
          <button type="button" class="btn btn-confirm" @click="handleRefresh">取回</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import type { PropType } from 'vue';
  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: '資料列表',
    },
    data: {
      type: Array as PropType<Record<string, any>[]>,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(['update:modelValue', 'refresh']);

  const handleClose = () => {
    emit('update:modelValue', false);
  };

  const handleRefresh = () => {
    emit('refresh');
  };
</script>

<style scoped>
  .dialog-content {
    width: 90vw; /* 改为视窗宽度的90% */
    max-width: 1200px; /* 设置最大宽度 */
    margin: 20px auto;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .table-container {
    max-height: 400px;
    overflow-x: auto; /* 添加水平滚动 */
    overflow-y: auto;
    margin: 1rem 0;
  }

  .loading,
  .no-data {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .data-table {
    width: 100%;
    min-width: 800px; /* 设置最小宽度，确保表格不会太窄 */
    border-collapse: collapse;
    margin: 1rem 0;
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem;
    border: 1px solid #ddd;
    text-align: left;
  }

  .data-table th {
    background-color: #f5f5f5;
    font-weight: 600;
    position: sticky;
    top: 0;
  }

  .data-table tr:hover {
    background-color: #f9f9f9;
  }

  .button-group {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
    gap: 1rem;
  }
</style>

<style>
  @import '../assets/styles/components/dialog.css';
</style>
