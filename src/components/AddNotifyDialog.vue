<template>
  <transition name="dialog-fade">
    <div v-show="modelValue" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-content">
        <h3>{{ title }}</h3>
        <form @submit.prevent="handleSubmit">
          <!-- 执行模式 -->
          <div class="form-group">
            <label>執行模式 <span class="required">*</span></label>
            <div class="status-options">
              <label v-for="(text, value) in NOTIFY_RUN_MODE_TEXT" :key="value" class="status-option">
                <input type="radio" v-model="formData.run_mode" :value="Number(value)" />
                <span class="status-label">{{ text }}</span>
              </label>
            </div>
          </div>

          <!-- 星期选择（仅在run_mode=2时显示） -->
          <div v-if="formData.run_mode === NOTIFY_RUN_MODE.WEEKLY" class="form-group">
            <label>選擇星期 <span class="required">*</span></label>
            <div class="week-days">
              <label v-for="(text, value) in WEEK_DAYS_TEXT" :key="value" class="week-day-option">
                <input type="checkbox" v-model="selectedWeekDays" :value="Number(value)" />
                <span>{{ text }}</span>
              </label>
            </div>
          </div>

          <!-- 开始时间 -->
          <div class="form-group">
            <label>開始時間 <span class="required">*</span></label>
            <input type="datetime-local" v-model="formData.start_at" required />
          </div>

          <!-- 停止时间 -->
          <div class="form-group">
            <label>停止時間</label>
            <input
              type="datetime-local"
              v-model="formData.stop_at"
              :disabled="formData.run_mode === NOTIFY_RUN_MODE.ONCE"
            />
          </div>

          <!-- 时间选择 -->
          <div class="form-group">
            <label>
              執行時間
              <span v-if="formData.run_mode !== NOTIFY_RUN_MODE.ONCE" class="required">*</span>
            </label>
            <input
              type="time"
              v-model="formData.time_at"
              :disabled="formData.run_mode === NOTIFY_RUN_MODE.ONCE"
              :required="formData.run_mode !== NOTIFY_RUN_MODE.ONCE"
            />
          </div>

          <!-- 按钮组 -->
          <div class="button-group">
            <button type="button" class="btn btn-cancel" @click="handleCancel">取消</button>
            <button type="button" class="btn btn-clear" @click="handleClear">清除</button>
            <button type="submit" class="btn btn-confirm">確定</button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { reactive, watch, ref, type PropType } from 'vue';
  import { showNotification } from '../services/notificationService';
  import type { TaskNotify, TaskProgress } from '../types/task';

  import {
    NOTIFY_RUN_MODE,
    NOTIFY_RUN_MODE_TEXT,
    WEEK_DAYS,
    WEEK_DAYS_TEXT,
    type NotifyRunMode,
  } from '../utils/constants';
  import { getDefaultDateTime, getDefaultTime } from '../utils/dateUtils';

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    isEdit: {
      type: Boolean,
      default: false,
    },
    progress: {
      type: Object as PropType<TaskProgress | null>,
      default: null,
    },
    editData: {
      type: Object as PropType<TaskNotify | null>,
      default: null,
    },
    title: {
      type: String,
      default: '設定通知',
    },
  });

  const emit = defineEmits(['update:modelValue', 'submit', 'clear']);

  // 星期选择数组
  const selectedWeekDays = ref<number[]>([]);

  // 表单数据
  const formData = reactive({
    id: props.editData?.id || 0,
    progress_id: props.progress?.id,
    start_at: props.progress?.notifies?.[0]?.start_at || props.progress?.progress_at || getDefaultDateTime(),
    stop_at: props.progress?.notifies?.[0]?.stop_at
      ? getStopDateTime(props.progress.progress_at)
      : getStopDateTime(getDefaultDateTime()),
    run_mode: props.progress?.notifies?.[0]?.run_mode || (NOTIFY_RUN_MODE.ONCE as NotifyRunMode),
    run_code: props.progress?.notifies?.[0]?.run_code || 0,
    time_at: props.progress?.notifies?.[0]?.time_at || getDefaultTime(),
    week_at: props.progress?.notifies?.[0]?.week_at || 0,
  });

  // 获取停止时间（开始时间 + 7天）
  function getStopDateTime(startAt: string): string {
    const date = new Date(startAt);
    date.setDate(date.getDate() + 7);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  // 处理取消
  const handleCancel = () => {
    emit('update:modelValue', false);
  };

  // 处理清除
  const handleClear = () => {
    if (props.isEdit && props.editData) {
      // 还原所有字段到编辑数据的原始值
      formData.id = props.editData.id;
      formData.progress_id = props.editData.progress_id;
      formData.run_mode = props.editData.run_mode;
      formData.run_code = props.editData.run_code;
      formData.time_at = props.editData.time_at || '';
      formData.week_at = props.editData.week_at || 0;

      // 如果是每周模式，设置选中的星期
      if (props.editData.run_mode === NOTIFY_RUN_MODE.WEEKLY && props.editData.week_at) {
        selectedWeekDays.value = String(props.editData.week_at).split('').map(Number);
      }
      if (props.editData.start_at) {
        const date = new Date(props.editData.start_at);
        formData.start_at = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
      if (props.editData.stop_at) {
        const date = new Date(props.editData.stop_at);
        formData.stop_at = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
    } else {
      resetForm();
    }
  };

  // 重置表单
  const resetForm = () => {
    if (props.progress?.progress_at) {
      const date = new Date(props.progress.progress_at);
      formData.start_at = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } else {
      formData.start_at = getDefaultDateTime();
    }
    formData.id = 0;
    formData.stop_at = getStopDateTime(formData.start_at);
    formData.run_mode = NOTIFY_RUN_MODE.ONCE;
    formData.run_code = 0;
    formData.time_at = getDefaultTime();
    formData.week_at = 0;
    selectedWeekDays.value = [];
  };

  // 处理提交
  const handleSubmit = () => {
    // 後端每分鐘檢查一次，要晚於當前時間至少十分鐘，避免剛好跟後端檢查時間重疊

    const now = new Date();
    const startTime = new Date(formData.start_at);
    const minTime = new Date(now.getTime() + 10 * 60 * 1000); // 当前时间 + 10分钟

    /*正式版時，此處註解要拿掉，發揮檢驗的功能-------------------------------------    
    if (startTime <= minTime) {
      showNotification('開始時間必須晚於當前時間至少十分鐘', 'error');
      return;
    }

    // 验证停止时间（仅在非单次模式下验证且有值时验证）
    if ((formData.run_mode !== NOTIFY_RUN_MODE.ONCE && formData.stop_at)) {
      const startTime = new Date(formData.start_at);
      const stopTime = new Date(formData.stop_at);

      // 計算最小停止時間
      let minStopTime;
      if (formData.run_mode === NOTIFY_RUN_MODE.DAILY) {
        // 每日模式：至少晚一天
        minStopTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
        if (stopTime < minStopTime) {
          showNotification('每日循環模式，停止時間必須晚於開始時間至少一天', 'error');
          return;
        }
      } else if (formData.run_mode === NOTIFY_RUN_MODE.WEEKLY) {
        // 每周模式：至少晚七天
        minStopTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (stopTime < minStopTime) {
          showNotification('指定星期模式，停止時間必須晚於開始時間至少七天', 'error');
          return;
        }
      }

      // 確保停止時間晚於當前時間
      if (stopTime <= new Date()) {
        showNotification('停止時間必須晚於當前時間', 'error');
        return;
      }
    }
---------------------------------------------------------------------------*/

    // 如果是每周模式，验证是否选择了星期
    if (formData.run_mode === NOTIFY_RUN_MODE.WEEKLY && selectedWeekDays.value.length === 0) {
      showNotification('請至少選擇一個星期', 'error');
      return;
    }

    // 组装week_at
    if (formData.run_mode === NOTIFY_RUN_MODE.WEEKLY) {
      formData.week_at = Number(selectedWeekDays.value.sort().join(''));
    }

    const submitData = { ...formData };
    if (submitData.start_at) {
      const date = new Date(submitData.start_at);
      submitData.start_at = date.toISOString();
    }
    if (submitData.stop_at) {
      const date = new Date(submitData.stop_at);
      submitData.stop_at = date.toISOString();
    }

    emit('submit', { ...submitData });
    emit('update:modelValue', false);
  };

  watch(
    () => props.editData,
    newData => {
      if (newData && newData.id > 0) {
        // 更新表单数据
        formData.id = newData.id;
        formData.progress_id = newData.progress_id;
        formData.run_mode = newData.run_mode;
        formData.run_code = newData.run_code;

        // 处理开始时间
        if (newData.start_at) {
          const date = new Date(newData.start_at);
          formData.start_at = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }

        // 处理停止时间
        if (newData.stop_at) {
          const date = new Date(newData.stop_at);
          formData.stop_at = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        } else {
          formData.stop_at = getStopDateTime(formData.start_at);
        }

        // 处理时间和星期
        formData.time_at = newData.time_at || '';
        formData.week_at = newData.week_at || 0;

        // 如果是每周模式，设置选中的星期
        if (newData.run_mode === NOTIFY_RUN_MODE.WEEKLY && newData.week_at) {
          selectedWeekDays.value = String(newData.week_at).split('').map(Number);
        }
      }
    },
    { immediate: true }, // 立即执行一次，确保初始值正确设置
  );

  watch(
    () => props.isEdit,
    newIsEdit => {
      if (!newIsEdit) {
        resetForm();
      }
    },
    { immediate: true },
  );

  defineExpose({
    handleClear,
  });
</script>

<style>
  @import '../assets/styles/components/dialog.css';
</style>
<style scoped>
  .week-days {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .week-day-option {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }

  .week-day-option input[type='checkbox'] {
    cursor: pointer;
  }

  .status-options {
    display: flex;
    gap: 15px;
  }

  .status-option {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }

  .status-option input[type='radio'] {
    cursor: pointer;
  }

  .required {
    color: red;
  }
</style>
