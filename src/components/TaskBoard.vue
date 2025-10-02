<script setup lang="ts">
import { useTaskBoard, type TaskCategory } from '../composables/useTaskBoard';
import { showNotification } from '../services/notificationService';
import AddCategoryDialog from './AddCategoryDialog.vue';
import { ref, nextTick } from 'vue';

const addCategoryDialogRef = ref<InstanceType<typeof AddCategoryDialog> | null>(null);
const handleCategorySubmit = async (categoryData: TaskCategory) => {
  const success = await submitCategory(categoryData);
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
  toggleTaskItems,
  toggleItemProgress,
  expandAllProgress,
  collapseAllProgress,
  formatDate,
  handleCategoryClick,
  toggleSidebar,
  logout,
  submitCategory,
  handleContextMenu,
  closeContextMenu,
  handleDeleteCategory,
  handleEditCategory,  
} = useTaskBoard();
</script>

<template>
  <div
    v-if="showContextMenu"
    class="context-menu"
    :style="{
      left: contextMenuPosition.x + 'px',
      top: contextMenuPosition.y + 'px'
    }"
  >
    <h4>{{ selectedCategory?.category_name }}</h4>
    <div class="menu-item" @click="selectedCategory?.id && handleDeleteCategory(selectedCategory.id)">
      刪除分類
    </div>
    <div class="menu-item" @click="selectedCategory?.id && handleEditCategory(selectedCategory.id)">
      修改分類
    </div>
  </div>   
  <div class="task-board">
    <AddCategoryDialog
      ref="addCategoryDialogRef"
      v-model="showAddCategoryDialog"
      @submit="handleCategorySubmit"
      @clear="handleCategoryClear"
    />    
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ 'sidebar-active': showSidebar }">
      <div class="sidebar-content">
        <h3>選單</h3>
        <ul class="menu-list">
          <li @click="showAddCategoryDialog = true; toggleSidebar()">
            <span class="menu-item-icon">📁</span>新增分類
          </li>
          <li @click="logout">
            <span class="menu-item-icon">🚪</span>離開
          </li>
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
        <!-- 展开/收起按钮 --> 
        <button class="expand-btn" @click="expandAllProgress" title="展开所有进度">
          <span class="arrow-icon down">▼</span>
        </button>
        <button class="collapse-btn" @click="collapseAllProgress" title="收起所有进度">
          <span class="arrow-icon up">▲</span>
        </button>
      </div>
      
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['category-btn', { active: currentCategory === cat.id }]"
        @click="handleCategoryClick(cat.id)"
        @contextmenu="handleContextMenu($event, cat)"
      >
        {{ cat.category_name }}
      </button>
    </nav>

    <!-- 悬浮按钮移到这里 -->
    <button class="floating-add-btn" @click="showAddCategoryDialog = true" title="新增分類">
      <span class="add-icon">+</span>
    </button>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-container"
      >
        <!-- Items列表 -->
        <div v-if="task.showItems" class="items-container">
          <div
            v-for="item in task.items"
            :key="item.id"
            class="item-wrapper"
          >
            <!-- Item卡片 -->
            <div class="item-card" @click="toggleItemProgress(item)">
              <div class="item-header">
                <span class="item-name">{{ item.item_name }}</span>
                <span class="item-date">{{ formatDate(item.item_at) }}</span>
              </div>
              <p class="item-content">{{ item.content }}</p>
            </div>

            <!-- Progresses列表 -->
            <div v-if="item.showProgress" class="progresses-container">
              <div
                v-for="(progress, index) in item.progresses"
                :key="progress.id"
                class="progress-wrapper"
              >
                <!-- 连接线 -->
                <div class="progress-line"></div>
                <!-- Progress内容 -->
                <div class="progress-card">
                  <span class="progress-name">{{ progress.progress_name }}</span>
                  <span class="progress-date">{{ formatDate(progress.progress_at) }}</span>
                  <p class="progress-content">{{ progress.content }}</p>
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
.task-board {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  z-index: 1000;
  min-width: 150px;
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
  box-shadow: 2px 0 15px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 100vh;
}

/* 新增按钮容器样式 */
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

.expand-btn,
.collapse-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.expand-btn:hover,
.collapse-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
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
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.floating-add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.add-icon {
  line-height: 1;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
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
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
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

.item-date {
  color: #5f6368;
  font-size: 14px;
}

.item-content {
  margin: 0;
  color: #5f6368;
  font-size: 14px;
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
