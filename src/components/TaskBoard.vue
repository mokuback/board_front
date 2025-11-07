<script setup lang="ts">
  import { useTaskBoard } from '../composables/useTaskBoard';
  import type { TaskProgress, TaskItem, TaskCategory } from '../types/task';
  import AddCategoryDialog from './AddCategoryDialog.vue';
  import AddItemDialog from './AddItemDialog.vue';
  import AddProgressDialog from './AddProgressDialog.vue';
  import { formatDateTime } from '../utils/dateUtils';
  import { ref, nextTick } from 'vue';
  import { getStatusIcon, getStatusText } from '../utils/statusUtils';
  import { useTokenCountdown } from '../composables/useTokenCountdown';
  import ProgressDialogStatus from './ProgressDialogStatus.vue';
  import AddNotifyDialog from './AddNotifyDialog.vue';
  import DataTableDialog from './DataTableDialog.vue';
  import { showNotification } from '../services/notificationService';
  import { NOTIFY_RUN_MODE_TEXT, getWeekDaysText, type TaskStatus } from '../utils/constants';
  import NotifyManagerDialog from './NotifyManagerDialog.vue';

  const addCategoryDialogRef = ref<InstanceType<typeof AddCategoryDialog> | null>(null);
  const addItemDialogRef = ref<InstanceType<typeof AddItemDialog> | null>(null);
  const addProgressDialogRef = ref<InstanceType<typeof AddProgressDialog> | null>(null);
  const addNotifyDialogRef = ref<InstanceType<typeof AddNotifyDialog> | null>(null);

  const { formattedTime, refreshToken, isTokenLoading } = useTokenCountdown();

  const handleNotifySubmit = async (formData: any) => {
    let success;
    // showNotification(JSON.stringify(formData.id), 'success');
    // return;
    if (formData.id > 0) {
      // 编辑模式
      success = await handleUpdateNotify({ ...formData, id: formData.id });
    } else {
      // 新增模式
      success = await handleAddNewNotify(formData);
    }

    if (success) {
      showNotifyDialog.value = false;
      nextTick(() => {
        if (addNotifyDialogRef.value) {
          addNotifyDialogRef.value.handleClear();
        }
      });
    }
  };

  const handleProgressSubmit = async (progressData: TaskProgress, item: TaskItem) => {
    let success;
    if (progressData.id) {
      // 编辑模式
      success = await handleUpdateProgress(progressData, item);
    } else {
      // 新增模式
      success = await handleAddNewProgress(progressData, item);
    }

    if (success) {
      showAddProgressDialog.value = false;
      nextTick(() => {
        if (addProgressDialogRef.value) {
          addProgressDialogRef.value.handleClear();
        }
      });
    }
  };

  const handleItemSubmit = async (itemData: TaskItem) => {
    let success;
    if (itemData.id) {
      // 编辑模式
      success = await handleUpdateItem(itemData);
    } else {
      // 新增模式
      success = await handleAddNewItem(itemData);
    }

    if (success) {
      showAddItemDialog.value = false;
      nextTick(() => {
        if (addItemDialogRef.value) {
          addItemDialogRef.value.handleClear();
        }
      });
    }
  };

  const handleCategorySubmit = async (categoryData: TaskCategory) => {
    let success;
    if (categoryData.id) {
      // 编辑模式
      success = await handleUpdateCategory(categoryData);
    } else {
      // 新增模式
      success = await handleAddNewCategory(categoryData);
    }

    if (success) {
      showAddCategoryDialog.value = false;
      nextTick(() => {
        if (addCategoryDialogRef.value) {
          addCategoryDialogRef.value.handleClear();
        }
      });
    }
  };

  const handleCategoryClear = () => {
    // 清除逻辑已在对话框组件中处理
  };

  const handleItemClear = () => {
    // 清除逻辑已在对话框组件中处理
  };

  const handleProgressClear = () => {
    // 清除逻辑已在对话框组件中处理
  };

  const {
    isAdmin,
    tasks,
    currentCategory,
    categories,
    filteredTasks,
    error,
    showSidebar,
    showAddCategoryDialog,
    showContextMenu,
    selectedCategory,
    contextMenuPosition,
    dialogTitle,
    dialogIsEdit,
    dialogEditData,
    getCurrentCategoryName,
    getCurrentCategory,
    showAddItemDialog,
    itemDialogTitle,
    itemDialogIsEdit,
    itemDialogEditData,
    currentCategoryId,
    showAddProgressDialog,
    progressDialogTitle,
    progressDialogIsEdit,
    progressDialogEditData,
    notifyDialogTitle,
    notifyDialogIsEdit,
    notifyDialogEditData,
    currentItemId,
    getCurrentItem,
    showStatusDialog,
    selectedProgress,
    showNotifyDialog,
    showNotifyManagerDialog,
    taskNotifyServiceState,
    showDataTableDialog,
    listData,
    isLoadingList,
    toggleTaskItems,
    toggleItemProgress,
    expandAllProgress,
    collapseAllProgress,
    handleCategoryClick,
    toggleSidebar,
    refreshData,
    logout,
    handleAddNewCategory,
    handleContextMenu,
    closeContextMenu,
    handleDeleteCategory,
    handleEditCategory,
    openAddCategoryDialog,
    handleUpdateCategory,
    handleCategoryAction,
    handleItemAction,
    handleProgressAction,
    openAddItemDialog,
    handleAddNewItem,
    handleUpdateItem,
    handleDeleteItem,
    openAddProgressDialog,
    handleUpdateProgress,
    handleAddNewProgress,
    handleAddNewNotify,
    handleUpdateNotify,
    openStatusDialog,
    handleStatusChange,
    openNotifyDialog,
    handleDeleteNotify,
    exportTaskData,
    getBackDetails,
    openNotifyManagerDialog,
    updateNotifyListForBack,
    getNotifyListForBack,
    removeLastExecuted,
    deleteNotify,
    testSendToUser,
    controlTaskNotifyService,
    handleControlTaskNotifyService,
    openListDataDialog,
    getListForBack,
  } = useTaskBoard();
</script>

<template>
  <div class="task-board">
    <div
      v-if="isAdmin"
      class="notify-status-btn"
      :class="{ disabled: !taskNotifyServiceState.running }"
      @click="handleControlTaskNotifyService(!taskNotifyServiceState.running)"
    >
      <span :class="{ 'bell-vibrating': taskNotifyServiceState.running }">
        {{ taskNotifyServiceState.running ? '🔔' : '🔕' }}
      </span>
    </div>
    <!-- 漂浮的token计时器 -->
    <div class="token-countdown" @click="refreshToken">
      <span v-if="isTokenLoading" class="loading-spinner"></span>
      <span v-else>{{ formattedTime }}</span>
    </div>
    <!-- 浮动菜单按钮 -->
    <button class="floating-menu-btn" @click="toggleSidebar" title="菜单">
      <span class="menu-icon"></span>
      <span class="menu-icon"></span>
      <span class="menu-icon"></span>
    </button>
    <div
      v-if="showContextMenu"
      class="context-menu"
      :style="{
        left: contextMenuPosition.x + 'px',
        top: contextMenuPosition.y + 'px',
      }"
    >
      <h4>{{ selectedCategory?.category_name }}</h4>
      <div class="menu-item" @click="selectedCategory?.id && handleEditCategory(selectedCategory)">修改分類</div>
      <div class="menu-item" @click="selectedCategory?.id && handleDeleteCategory(selectedCategory)">刪除分類</div>
    </div>
    <AddCategoryDialog
      ref="addCategoryDialogRef"
      v-model="showAddCategoryDialog"
      :title="dialogTitle"
      :is-edit="dialogIsEdit"
      :edit-data="dialogEditData"
      :categories="categories"
      @submit="handleCategorySubmit"
      @clear="handleCategoryClear"
    />
    <!-- 在模板中适当位置添加 -->
    <AddItemDialog
      ref="addItemDialogRef"
      v-model="showAddItemDialog"
      :title="itemDialogTitle"
      :isEdit="itemDialogIsEdit"
      :editData="itemDialogEditData"
      :currentCategoryId="currentCategoryId"
      :items="getCurrentCategory?.items || []"
      @submit="handleItemSubmit"
      @clear="handleItemClear"
    />
    <AddProgressDialog
      ref="addProgressDialogRef"
      v-model="showAddProgressDialog"
      :title="progressDialogTitle"
      :isEdit="progressDialogIsEdit"
      :editData="progressDialogEditData"
      :currentItem="getCurrentItem ?? null"
      :progresses="getCurrentItem?.progresses || []"
      @submit="handleProgressSubmit"
      @clear="handleProgressClear"
    />
    <ProgressDialogStatus
      v-model="showStatusDialog"
      :progress-id="selectedProgress?.id ?? 0"
      @status-updated="handleStatusChange"
    />
    <AddNotifyDialog
      ref="addNotifyDialogRef"
      v-model="showNotifyDialog"
      :title="notifyDialogTitle"
      :isEdit="notifyDialogIsEdit"
      :editData="notifyDialogEditData"
      :progress="selectedProgress"
      @submit="handleNotifySubmit"
    />
    <NotifyManagerDialog
      v-model="showNotifyManagerDialog"
      @update-list="updateNotifyListForBack"
      @get-list="openListDataDialog(getNotifyListForBack)"
      @remove-executed="() => removeLastExecuted(null)"
      @delete-notify="() => deleteNotify(null)"
    />
    <DataTableDialog
      v-model="showDataTableDialog"
      title="数据列表"
      :data="listData"
      :loading="isLoadingList"
      @refresh="getListForBack"
    />
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ 'sidebar-active': showSidebar }">
      <div class="sidebar-content">
        <h3>選單</h3>
        <ul class="menu-list">
          <li
            @click="
              openAddCategoryDialog(true);
              toggleSidebar();
            "
          >
            <span class="menu-item-icon">📁</span>新增分類
          </li>
          <li @click="refreshData"><span class="menu-item-icon">🔄</span>重讀工作</li>
          <li @click="exportTaskData"><span class="menu-item-icon">📥</span>匯出工作</li>
          <li v-if="isAdmin" @click="openNotifyManagerDialog"><span class="menu-item-icon">🔔</span>通知管理</li>
          <li @click="logout"><span class="menu-item-icon">🚪</span>離開</li>
        </ul>
      </div>
    </div>
    <!-- 遮罩层 -->
    <div v-if="showSidebar" class="sidebar-overlay" @click="toggleSidebar"></div>

    <nav class="categories-nav">
      <div class="nav-buttons"></div>

      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['category-btn', { active: currentCategory === cat.id }]"
        @click="handleCategoryClick(cat)"
        @contextmenu="handleContextMenu($event, cat)"
      >
        {{ cat.category_name }}
      </button>
    </nav>

    <!-- 悬浮按钮移到这里 -->
    <button class="floating-add-btn" @click="openAddCategoryDialog(true)" title="新增分類">
      <span class="add-icon">+</span>
    </button>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <div class="category-header">
        <h2 class="category-title">{{ getCurrentCategoryName }}</h2>
        <div class="category-actions">
          <!-- 展开/收起按钮 -->
          <button class="category-action-btn-btn" @click="expandAllProgress" title="展开所有进度">
            <span class="arrow-icon down">▼</span>
          </button>
          <button class="category-action-btn-btn" @click="collapseAllProgress" title="收起所有进度">
            <span class="arrow-icon up">▲</span>
          </button>
          <button
            v-if="getCurrentCategory"
            class="category-action-btn"
            @click="handleCategoryAction('add', getCurrentCategory)"
            title="新增項目"
          >
            <span class="btn-icon">➕</span>
          </button>
          <button
            v-if="getCurrentCategory"
            class="category-action-btn"
            @click="handleCategoryAction('edit', getCurrentCategory)"
            title="修改分類"
          >
            <span class="btn-icon">✏️</span>
          </button>
          <button
            v-if="getCurrentCategory"
            class="category-action-btn"
            @click="handleCategoryAction('delete', getCurrentCategory)"
            title="刪除分類"
          >
            <span class="btn-icon">🗑️</span>
          </button>
        </div>
      </div>
      <div v-for="task in filteredTasks" :key="task.id" class="task-container">
        <!-- Items列表 -->
        <div v-if="task.showItems" class="items-container">
          <div v-for="item in task.items" :key="item.id" class="item-wrapper">
            <!-- Item卡片 -->
            <div class="item-card" @click="toggleItemProgress(item)">
              <div class="item-header">
                <span class="item-name">{{ item.item_name }}</span>
                <div class="item-meta">
                  <span class="item-date">{{ formatDateTime(item.item_at) }}</span>
                  <span class="progress-count">({{ item?.progresses?.length || 0 }})</span>
                </div>
              </div>
              <p class="item-content">{{ item.content }}</p>
              <!-- Item卡片按钮组 -->
              <div class="item-actions" @click.stop>
                <button class="action-btn" @click="handleItemAction('add', item, task)" title="新增進度">
                  <span class="btn-icon">📊</span>
                </button>
                <button class="action-btn" @click="handleItemAction('edit', item, task)" title="修改項目">
                  <span class="btn-icon">📝</span>
                </button>
                <button class="action-btn" @click="handleItemAction('delete', item, task)" title="刪除項目">
                  <span class="btn-icon">❌</span>
                </button>
              </div>
            </div>

            <!-- Progresses列表 -->
            <div v-if="item.showProgress" class="progresses-container">
              <div
                v-for="progress in item.progresses"
                :key="progress.id"
                class="progress-wrapper"
                :data-status="progress.status"
              >
                <!-- 连接线 -->
                <div class="progress-line"></div>
                <!-- Progress内容 -->
                <div class="progress-card">
                  <div class="progress-header">
                    <span class="progress-name">{{ progress.progress_name }}</span>
                    <!-- <span class="progress-status" :data-status="progress.status">
                      {{ getStatusIcon(progress.status) }} {{ getStatusText(progress.status as TaskStatus) }}
                    </span> -->
                    <div class="progress-status" :data-status="progress.status" @click="openStatusDialog(progress)">
                      {{ getStatusIcon(progress.status) }} {{ getStatusText(progress.status as TaskStatus) }}
                    </div>
                  </div>
                  <span class="progress-date">{{ formatDateTime(progress.progress_at) }}</span>
                  <p class="progress-content">{{ progress.content }}</p>
                  <!-- Progress卡片按钮组 -->
                  <div class="progress-actions" @click.stop>
                    <button class="action-btn" @click="handleProgressAction('notify', progress, item)" title="設定通知">
                      <span
                        class="btn-icon"
                        :class="{ 'speaking-emoji': progress.notifies && progress.notifies.length > 0 }"
                      >
                        {{ progress.notifies && progress.notifies.length > 0 ? '📣' : '🔔' }}
                      </span>
                    </button>
                    <button
                      class="action-btn"
                      @click="handleProgressAction('settings', progress, item)"
                      title="進度設定"
                    >
                      <!-- <span class="btn-icon" @click="getBackDetails(currentCategoryId, item.id, progress.id)">⚙️</span> -->
                      <span
                        class="btn-icon"
                        @click="
                          item.user_id &&
                            progress.notifies &&
                            progress.notifies.length > 0 &&
                            testSendToUser(
                              item.user_id,
                              progress.notifies?.[0]?.id || 0,
                              currentCategoryId,
                              item.id,
                              progress.id,
                            )
                        "
                        >⚙️</span
                      >
                    </button>
                    <button class="action-btn" @click="handleProgressAction('edit', progress, item)" title="修改進度">
                      <span class="btn-icon">🔧</span>
                    </button>
                    <button class="action-btn" @click="handleProgressAction('delete', progress, item)" title="刪除進度">
                      <span class="btn-icon">✂️</span>
                    </button>
                  </div>
                  <!-- 通知信息显示 -->
                  <div v-if="progress.notifies && progress.notifies.length > 0" class="notify-info">
                    <button class="notify-delete-btn" @click.stop="handleDeleteNotify(progress)" title="刪除通知">
                      <span class="btn-icon">⛔️</span>
                    </button>
                    <div class="notify-detail">
                      <span class="notify-label">通知模式：</span>
                      <span class="notify-value">{{ NOTIFY_RUN_MODE_TEXT[progress.notifies[0].run_mode] }}</span>
                    </div>

                    <!-- 指定星期模式显示执行星期 -->
                    <!-- 所有模式都显示开始时间 -->
                    <div class="notify-detail">
                      <span class="notify-label">開始時間：</span>
                      <span class="notify-value">{{ formatDateTime(progress.notifies[0].start_at) }}</span>
                    </div>

                    <!-- 非单次模式显示停止时间 -->
                    <div v-if="progress.notifies[0].run_mode !== 0" class="notify-detail">
                      <span class="notify-label">停止時間：</span>
                      <span class="notify-value">{{ formatDateTime(progress.notifies[0].stop_at) }}</span>
                    </div>

                    <!-- 非单次模式显示执行时间 -->
                    <div v-if="progress.notifies[0].run_mode !== 0" class="notify-detail">
                      <span class="notify-label">執行時間：</span>
                      <span class="notify-value">{{ progress.notifies[0].time_at }}</span>
                    </div>

                    <div v-if="progress.notifies[0].run_mode === 2" class="notify-detail">
                      <span class="notify-label">執行星期：</span>
                      <span class="notify-value">{{ getWeekDaysText(progress.notifies[0].week_at ?? 0) }}</span>
                    </div>

                    <!-- 显示最后执行时间 -->
                    <div v-if="progress.notifies[0].last_executed" class="notify-detail last-notify">
                      <span class="notify-label">最後通知：</span>
                      <span class="notify-value">{{ formatDateTime(progress.notifies[0].last_executed) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
  @import '../assets/styles/components/sidebar.css';
</style>

<style scoped>
  .notify-status-btn {
    position: fixed;
    bottom: 20px; /* 改为底部固定 */
    left: 120px; /* 在token计时器右边，token计时器在left: 20px，宽度约60px */
    top: auto; /* 取消top定位 */
    transform: none; /* 取消transform */
    z-index: 1000;
    font-size: 24px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .notify-status-btn:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: scale(1.1); /* 简化hover效果 */
  }

  .notify-status-btn.disabled {
    opacity: 0.6;
  }

  .notify-status-btn.disabled:hover {
    transform: none; /* 禁用状态取消缩放 */
  }

  /* 浮动菜单按钮样式 */
  .floating-menu-btn {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1000;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.7);
    border: none;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    transition: all 0.3s ease;
  }

  .floating-menu-btn:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .menu-icon {
    width: 20px;
    height: 2px;
    background-color: #333;
    transition: all 0.3s ease;
  }
  .task-container {
    margin-top: 16px;
    /* 增加顶部边距 */
    padding: 16px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .task-board {
    display: flex;
    height: 100vh;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }

  .context-menu {
    position: fixed;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px 0;
    min-width: 200px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .context-menu h4 {
    margin: 0;
    padding: 8px 16px;
    font-size: 14px;
    color: #666;
    border-bottom: 1px solid #eee;
  }

  .context-menu .menu-item {
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    color: #333;
  }

  .context-menu .menu-item:hover {
    background-color: #f5f5f5;
  }

  /* 导航栏样式 */
  .categories-nav {
    width: 240px;
    background: linear-gradient(to bottom, #ffffff, #e8f0fe); /* 與分類抬頭相同的漸變背景 */
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    max-height: 100vh;
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.15); /* 與分類抬頭相同的陰影效果 */
    border-radius: 8px;
    margin: 20px;
  }

  .token-countdown {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    font-size: 14px;
    color: #333;
    font-family: monospace;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 60px;
    min-height: 36px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #333;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .token-countdown:hover {
    background: rgba(255, 255, 255, 0.5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: scale(1.05);
  }

  /* 按钮容器样式 */
  .nav-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    justify-content: flex-start;
  }

  .category-btn {
    position: relative;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.8);
    color: #333;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    overflow: hidden;
  }

  .category-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s;
  }

  .category-btn:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .category-btn:hover::before {
    left: 100%;
  }

  .category-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }

  .category-btn.active:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }

  .arrow-icon {
    font-size: 16px;
    line-height: 1;
  }

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    background: linear-gradient(to bottom, #ffffff, #e8f0fe); /* 添加漸變背景 */
    padding: 20px 24px;
    z-index: 10;
    margin: 0 0 24px -24px;
    width: calc(100%);
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.15); /* 使用主題色的陰影 */
    border-radius: 8px 8px 0 0;
    margin-top: -24px;
    padding-top: 24px;
  }

  .category-title {
    margin: 0;
    font-size: 22px;
    /* 增大字体 */
    font-weight: 700;
    /* 增加字重 */
    color: #1a73e8;
    /* 使用主题色 */
    padding-bottom: 8px;
    /* 增加底部内边距 */
    border-bottom: 1px solid #e8eaed;
    /* 添加底部边框 */
  }

  .category-actions {
    display: flex;
    gap: 8px;
  }

  .category-action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .category-action-btn:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .floating-add-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(102, 126, 234, 0.7);
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .floating-add-btn:hover {
    background: rgba(102, 126, 234, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  .add-icon {
    line-height: 1;
  }

  /* 主要内容区域 */
  .main-content {
    flex: 1;
    padding: 0 24px 24px;
    /* 移除顶部内边距 */
    overflow-y: auto;
    background-color: #f8f9fa;
    /* 添加背景色 */
    border-radius: 0 0 8px 8px;
    /* 添加底部圆角 */
    border-left: 1px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    /* 添加阴影 */
  }

  .items-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .item-wrapper {
    position: relative;
  }

  .item-card {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), /* 主阴影 */ 0 4px 8px rgba(0, 0, 0, 0.06),
      /* 中层阴影 */ 0 1px 2px rgba(0, 0, 0, 0.04); /* 内层阴影 */
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    transform: translateZ(0); /* 启用GPU加速 */
  }

  .item-card:hover {
    transform: translateY(-4px) translateZ(0);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), /* 增强主阴影 */ 0 6px 12px rgba(0, 0, 0, 0.1),
      /* 增强中层阴影 */ 0 2px 4px rgba(0, 0, 0, 0.06); /* 增强内层阴影 */
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .item-name {
    font-weight: 600;
    color: #1a73e8;
    font-size: 16px;
  }

  .item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .progress-count {
    color: #1a73e8;
    font-size: 14px;
    font-weight: 500;
  }

  .item-date {
    color: #5f6368;
    font-size: 14px;
  }

  .item-content {
    margin: 0;
    color: #5f6368;
    font-size: 14px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .item-actions {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    gap: 5px;
  }

  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .action-btn:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .btn-icon {
    font-size: 16px;
  }

  /* Progresses样式 */
  .progresses-container {
    margin-top: 16px;
    padding-left: 20px;
    transition: all 0.3s ease-in-out;
    max-height: 1000px;
    opacity: 1;
    overflow: hidden;
  }

  .progresses-container.collapsed {
    max-height: 0;
    opacity: 0;
    margin: 0;
    padding: 0;
  }

  .progress-wrapper {
    position: relative;
    margin-bottom: 24px;
    animation: slideIn 0.3s ease-out;
  }

  .progress-actions {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    gap: 5px;
    z-index: 1;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .progress-status {
    cursor: pointer;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    display: inline-block;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* 正常状态 - 极淡蓝色 */
  .progress-status[data-status='0'] {
    color: #1967d2;
    background-color: rgba(232, 240, 254, 0.7);
  }

  /* 已完成状态 - 极淡绿色 */
  .progress-status[data-status='1'] {
    color: #188038;
    background-color: rgba(230, 244, 234, 0.7);
  }

  /* 已禁用状态 - 极淡灰色 */
  .progress-status[data-status='2'] {
    color: #5f6368;
    background-color: rgba(241, 243, 244, 0.7);
  }

  .progress-status:hover {
    background-color: rgba(255, 255, 255, 0.9);
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .speaking-emoji {
    display: inline-block;
    position: relative;
    animation: speak 1.5s infinite;
  }

  .last-notify {
    grid-column: 1 / -1; /* 跨越所有列 */
    background-color: rgba(254, 240, 138, 0.2);
    border-radius: 4px;
    padding: 8px;
    margin-top: 8px;
    border-left: 3px solid #fbbf24;
  }

  .last-notify .notify-label {
    color: #92400e !important; /* 深橘色文字 */
    font-weight: 600;
  }

  .last-notify .notify-value {
    color: #78350f !important; /* 深棕色文字 */
    font-weight: 500;
    font-size: 13px;
  }

  .last-notify .notify-label {
    color: #92400e !important;
    font-weight: 600;
    animation: pulse 2s infinite;
  }

  .bell-vibrating {
    animation: bellPulse 1.5s ease-in-out infinite;
    display: inline-block;
  }

  @keyframes bellPulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.8;
    }
  }

  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.25);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .notify-info {
    margin-top: 12px;
    padding: 12px;
    background-color: rgba(232, 240, 254, 0.5);
    border-radius: 8px;
    font-size: 12px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    position: relative;
    margin-bottom: 40px;
  }

  .notify-delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .notify-delete-btn:hover {
    background-color: rgba(255, 0, 0, 0.1);
    transform: scale(1.1);
  }

  .notify-detail {
    display: flex;
    align-items: center;
  }

  .notify-label {
    color: #5f6368;
    margin-right: 4px;
    font-weight: 500;
  }

  .notify-value {
    color: #1a73e8;
    font-weight: 500;
  }

  @keyframes speak {
    0%,
    100% {
      transform: translateX(0) scale(1);
      filter: brightness(1);
    }
    25% {
      transform: translateX(-2px) scale(1.05);
      filter: brightness(1.1);
    }
    50% {
      transform: translateX(2px) scale(1.1);
      filter: brightness(1.2);
    }
    75% {
      transform: translateX(-2px) scale(1.05);
      filter: brightness(1.1);
    }
  }

  .speaking-emoji::before {
    content: '📣';
    position: absolute;
    opacity: 0;
    animation: soundWave 1.5s infinite;
  }

  .speaking-emoji::after {
    content: '📣';
    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
    animation: soundWave 1.5s infinite 0.5s;
  }

  @keyframes soundWave {
    0% {
      transform: scale(1);
      opacity: 0.5;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .progress-line {
    position: absolute;
    left: -20px;
    top: 0;
    bottom: -24px;
    width: 1px;
    background: #5f6368;
    opacity: 0.7;
  }

  .progress-card {
    background: rgba(248, 249, 250, 0.9);
    border-radius: 8px;
    padding: 16px;
    margin-left: 16px;
    position: relative;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(95, 99, 104, 0.2);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .progress-card::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 20px;
    width: 12px; /* 从12px增加到16px */
    height: 12px; /* 从12px增加到16px */
    background: white;
    border: 2px solid #5f6368; /* 边框从2px增加到3px */
    border-radius: 50%;
    z-index: 1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .progress-name {
    font-weight: 500;
    color: #202124;
    font-size: 14px;
    display: block;
    margin-bottom: 4px;
  }

  .progress-date {
    color: #1a73e8; /* 使用主题蓝色作为强调色 */
    font-size: 12px;
    display: block;
    margin-bottom: 8px;
    font-weight: 500; /* 增加字重，使日期更加突出 */
  }

  .progress-content {
    margin: 0;
    color: #3c4043;
    font-size: 14px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .progress-wrapper:last-child .progress-line {
    bottom: 0; /* 最后一个进度卡片的连接线不延伸 */
  }

  .progress-wrapper[data-status='2'] .progress-card {
    filter: grayscale(100%);
    opacity: 0.7;
    background: rgba(241, 243, 244, 0.9);
    border-color: rgba(95, 99, 104, 0.1);
  }

  .progress-wrapper[data-status='2'] .progress-name,
  .progress-wrapper[data-status='2'] .progress-date,
  .progress-wrapper[data-status='2'] .progress-content {
    color: #9aa0a6; /* 使用更淺的灰色 */
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .notify-info {
      grid-template-columns: 1fr;
    }

    .task-board {
      flex-direction: column;
      background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
    }

    .category-header {
      padding: 12px 16px; /* 减小上下内边距 */
      margin: 0 0 16px -16px; /* 减小底部边距 */
    }

    .category-title {
      font-size: 18px; /* 稍微减小字体大小 */
      padding-bottom: 4px; /* 减小底部内边距 */
    }

    .category-actions {
      gap: 4px; /* 减小按钮间距 */
    }

    .category-action-btn {
      padding: 2px; /* 减小按钮内边距 */
    }

    .categories-nav {
      width: 100%;
      flex-direction: row;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: 12px;
      background: rgba(255, 255, 255, 0.95);
      gap: 8px;
      max-height: none;
      align-items: center;
    }

    .nav-buttons {
      width: auto;
      flex-shrink: 0;
      margin-bottom: 0;
      margin-right: 8px;
    }

    .category-btn {
      flex: 0 0 auto;
      min-width: 100px;
      padding: 10px 14px;
      font-size: 14px;
    }

    .floating-add-btn {
      right: 12px;
      bottom: 12px;
      width: 48px;
      height: 48px;
      font-size: 20px;
    }

    .item-card {
      padding: 16px;
      margin: 8px;
    }

    .progress-card {
      padding: 12px;
      margin: 8px;
    }
  }
</style>
