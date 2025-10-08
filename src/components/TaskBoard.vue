<script setup lang="ts">
  import { useTaskBoard, type TaskCategory, type TaskItem, type TaskProgress } from '../composables/useTaskBoard';
  import AddCategoryDialog from './AddCategoryDialog.vue';
  import AddItemDialog from './AddItemDialog.vue';
  import AddProgressDialog from './AddProgressDialog.vue';
  import { formatDateTime } from '../utils/dateUtils';
  import { ref, nextTick } from 'vue';
  import { TASK_STATUS_TEXT, type TaskStatus } from '../utils/constants';
  import { getStatusIcon } from '../utils/statusUtils';
  import { useTokenCountdown } from '../composables/useTokenCountdown';

  const addCategoryDialogRef = ref<InstanceType<typeof AddCategoryDialog> | null>(null);
  const addItemDialogRef = ref<InstanceType<typeof AddItemDialog> | null>(null);
  const addProgressDialogRef = ref<InstanceType<typeof AddProgressDialog> | null>(null);
  const { formattedTime } = useTokenCountdown();

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

  const getStatusText = (status: TaskStatus) => {
    return TASK_STATUS_TEXT[status];
  };

  const {
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
    currentItemId,
    getCurrentItem,
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
  } = useTaskBoard();
</script>

<template>
  <div class="task-board">
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
          <li @click="logout"><span class="menu-item-icon">🚪</span>離開</li>
        </ul>
      </div>
    </div>
    <!-- 遮罩层 -->
    <div v-if="showSidebar" class="sidebar-overlay" @click="toggleSidebar"></div>

    <nav class="categories-nav">
      <div class="nav-buttons">
        <!-- 菜单按钮 -->
        <button class="menu-button" @click="toggleSidebar" title="菜单">
          <span class="menu-icon"></span>
          <span class="menu-icon"></span>
          <span class="menu-icon"></span>
        </button>
        <div class="token-countdown">
          {{ formattedTime }}
        </div>
      </div>

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
              <div v-for="progress in item.progresses" :key="progress.id" class="progress-wrapper">
                <!-- 连接线 -->
                <div class="progress-line"></div>
                <!-- Progress内容 -->
                <div class="progress-card">
                  <div class="progress-header">
                    <span class="progress-name">{{ progress.progress_name }}</span>
                    <span class="progress-status" :data-status="progress.status">
                      {{ getStatusIcon(progress.status) }} {{ getStatusText(progress.status as TaskStatus) }}
                    </span>
                  </div>
                  <span class="progress-date">{{ formatDateTime(progress.progress_at) }}</span>
                  <p class="progress-content">{{ progress.content }}</p>
                  <!-- Progress卡片按钮组 -->
                  <div class="progress-actions" @click.stop>
                    <button
                      class="action-btn"
                      @click="handleProgressAction('settings', progress, item)"
                      title="進度設定"
                    >
                      <span class="btn-icon">⚙️</span>
                    </button>
                    <button class="action-btn" @click="handleProgressAction('edit', progress, item)" title="修改進度">
                      <span class="btn-icon">🔧</span>
                    </button>
                    <button class="action-btn" @click="handleProgressAction('delete', progress, item)" title="刪除進度">
                      <span class="btn-icon">✂️</span>
                    </button>
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
    background: rgba(255, 255, 255, 0.95);
    padding: 20px;
    box-shadow: 2px 0 15px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    max-height: 100vh;
  }

  .token-countdown {
    margin-left: 10px;
    padding: 4px 8px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    font-size: 12px;
    color: #666;
    font-family: monospace;
  }

  /* 按钮容器样式 */
  .nav-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    justify-content: flex-start;
  }

  .category-btn {
    flex: 0 0 auto;
    min-width: 100px;
    padding: 10px 14px;
    font-size: 14px;
  }

  .category-btn:hover {
    background-color: #e8eaed;
  }

  .category-btn.active {
    background-color: #1a73e8;
    color: white;
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
    background-color: #fff;
    padding: 20px 24px;
    border-bottom: 2px solid #e0e0e0;
    z-index: 10;
    margin: 0 0 24px -24px;
    width: calc(100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 1px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
    border-top: 1px solid #e0e0e0;
    border-radius: 8px 8px 0 0;
    margin-top: -24px;
    padding-top: 24px;
    background: linear-gradient(to bottom, #ffffff, #f8f9fa);
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
  }

  .item-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
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
    margin-bottom: 16px;
    animation: slideIn 0.3s ease-out;
  }

  .progress-actions {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    gap: 5px;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .progress-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
  }

  /* 正常状态 - 极淡蓝色 */
  .progress-status[data-status='0'] {
    color: #1967d2;
    background-color: #e8f0fe;
  }

  /* 已完成状态 - 极淡绿色 */
  .progress-status[data-status='1'] {
    color: #188038;
    background-color: #e6f4ea;
  }

  /* 已禁用状态 - 极淡灰色 */
  .progress-status[data-status='2'] {
    color: #5f6368;
    background-color: #f1f3f4;
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

  .progress-line {
    position: absolute;
    left: -20px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e8eaed;
  }

  .progress-card {
    background: rgba(248, 249, 250, 0.9);
    border-radius: 8px;
    padding: 16px;
    margin-left: 16px;
    position: relative;
    backdrop-filter: blur(10px);
  }

  .progress-card::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 20px;
    width: 12px;
    height: 12px;
    background: white;
    border: 2px solid #e8eaed;
    border-radius: 50%;
  }

  .progress-name {
    font-weight: 500;
    color: #202124;
    font-size: 14px;
    display: block;
    margin-bottom: 4px;
  }

  .progress-date {
    color: #5f6368;
    font-size: 12px;
    display: block;
    margin-bottom: 8px;
  }

  .progress-content {
    margin: 0;
    color: #5f6368;
    font-size: 14px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .task-board {
      flex-direction: column;
      background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
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
