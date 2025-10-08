import { ref, computed, onMounted, reactive, onUnmounted } from 'vue';
import axios from '../services/axiosInterceptor';
import { showLoading, hideLoading } from '../services/loadingService';
import { useRouter } from 'vue-router';
import { showNotification } from '../services/notificationService';
import { useConfirmDialog } from '../utils/confirmDialog';

// 定义数据类型
export interface TaskProgress {
  id: number;
  user_id: number;
  item_id: number;
  progress_name: string;
  content: string;
  progress_at: string;
  status: number;
}

export interface TaskItem {
  id: number;
  user_id: number;
  category_id: number;
  item_name: string;
  content: string;
  item_at: string;
  progresses?: TaskProgress[];
  showProgress?: boolean;
}

export interface TaskCategory {
  id: number;
  category_name: string;
  content: string;
  items?: TaskItem[];
  showItems?: boolean;
}

export function useTaskBoard() {
  const tasks = ref<TaskCategory[]>([]);
  const error = ref<string | null>(null);
  const showSidebar = ref(false);
  const router = useRouter();
  const showAddCategoryDialog = ref(false);
  const showContextMenu = ref(false);
  const selectedCategory = ref<TaskCategory | null>(null);
  const contextMenuPosition = ref({ x: 0, y: 0 });
  const { showConfirmDialog } = useConfirmDialog();
  const dialogTitle = ref('新增分類');
  const dialogIsEdit = ref(false);
  const dialogEditData = ref<TaskCategory | null>(null);
  const showAddItemDialog = ref(false);
  const itemDialogTitle = ref('新增項目');
  const itemDialogIsEdit = ref(false);
  const itemDialogEditData = ref<TaskItem | null>(null);
  const showAddProgressDialog = ref(false);
  const progressDialogTitle = ref('新增進度');
  const progressDialogIsEdit = ref(false);
  const progressDialogEditData = ref<TaskProgress | null>(null);

  const currentCategory = ref(0); //UI显示相关，與currentCategoryId要同步
  const currentCategoryId = ref(0); //數據操操作相關，與currentCategory要同步，通过 handleCategoryClick 函数改变(主要內容區塊全域可使用)
  const currentItemId = ref(0); //通过 openAddProgressDialog 函数中改变(只用於新增/修改進度的臨時變量傳遞)
  const timer = ref<number | null>(null);

  const getCurrentCategory = computed(() => {
    return tasks.value.find(t => t.id === currentCategory.value);
  });

  const getCurrentItem = computed(() => {
    const category = tasks.value.find(t => t.id === currentCategoryId.value);
    if (category && category.items) {
      return category.items.find(item => item.id === currentItemId.value);
    }
    return null;
  });

  const getCurrentCategoryName = computed(() => {
    const currentTask = tasks.value.find(t => t.id === currentCategory.value);
    return currentTask ? currentTask.category_name : '';
  });
  const handleProgressAction = (action: string, progress: TaskProgress, item: TaskItem) => {
    // 根据操作类型显示不同的通知
    let actionText = '';
    switch (action) {
      case 'settings':
        actionText = '進度設定';
        break;
      case 'edit':
        actionText = '修改進度';
        openAddProgressDialog(false, progress, item);
        break;
      case 'delete':
        actionText = '刪除進度';
        handleDeleteProgress(progress);
        break;
    }

    // 显示通知，包含项目ID、进度ID和功能类型
    showNotification(
      `分類ID: ${currentCategoryId.value},項目ID: ${item.id}, 進度ID: ${progress.id}, 功能: ${actionText}`,
    );
  };

  const handleItemAction = (action: string, item: TaskItem, category: TaskCategory) => {
    // 根据操作类型显示不同的通知
    let actionText = '';
    switch (action) {
      case 'add':
        actionText = '新增進度';
        openAddProgressDialog(true, null, item);
        break;
      case 'edit':
        actionText = '修改項目';
        openAddItemDialog(false, item, category);
        break;
      case 'delete':
        actionText = '刪除項目';
        handleDeleteItem(item);
        break;
    }

    // 显示通知
    showNotification(`分類ID: ${category.id}, 項目ID: ${item.id}, 功能: ${actionText}`);
  };

  const handleCategoryAction = (action: string, category: TaskCategory) => {
    let actionText = '';
    switch (action) {
      case 'add':
        actionText = '新增項目';
        openAddItemDialog(true, null, category);
        break;
      case 'edit':
        actionText = '修改分類';
        handleEditCategory(category);
        break;
      case 'delete':
        actionText = '刪除分類';
        handleDeleteCategory(category);
        break;
    }

    // 显示通知，包含分类ID和功能类型
    showNotification(`分類ID: ${category.id}, 功能: ${actionText}`);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const contextMenu = document.querySelector('.context-menu');
    if (showContextMenu.value && contextMenu && !contextMenu.contains(event.target as Node)) {
      closeContextMenu();
    }
  };

  const handleContextMenu = (event: MouseEvent, category: TaskCategory) => {
    event.preventDefault();
    selectedCategory.value = category;

    // 获取窗口宽度和菜单宽度
    const windowWidth = window.innerWidth;
    const menuWidth = 200; // 假设菜单宽度为200px

    // 计算菜单位置
    let x = event.clientX;
    if (x + menuWidth > windowWidth) {
      x = windowWidth - menuWidth;
    }

    contextMenuPosition.value = {
      x,
      y: event.clientY,
    };
    showContextMenu.value = true;
  };

  const closeContextMenu = () => {
    showContextMenu.value = false;
    selectedCategory.value = null;
  };

  const handleDeleteCategory = async (category: TaskCategory) => {
    closeContextMenu();
    const result = await showConfirmDialog('這會同時刪除這個分類下的工作項目和進度，確定要刪除嗎？');
    if (result === 1) {
      // 显示遮罩
      showLoading('正在刪除分類...');
      try {
        // 先发送请求到后端删除分类
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/categories/${category.id}`);

        // 后端删除成功后，再处理前端数据
        const categoryIndex = tasks.value.findIndex(t => t.id === category.id);
        if (categoryIndex === -1) {
          showNotification('找不到要刪除的分類', 'error');
          return;
        }

        // 从前端数据中删除该分类
        tasks.value.splice(categoryIndex, 1);

        // 如果删除的是当前显示的分类，切换到第一个分类
        if (currentCategory.value === category.id && tasks.value.length > 0) {
          currentCategory.value = tasks.value[0].id;
          tasks.value[0].showItems = true;
        }

        showNotification('分類刪除成功', 'success');
      } catch (error) {
        // 错误处理由 axiosInterceptor.ts 处理
        console.error('删除分類失敗:', error);
      } finally {
        // 无论成功或失败，都隐藏遮罩
        hideLoading();
      }
    }
  };

  const handleDeleteItem = async (item: TaskItem) => {
    const result = await showConfirmDialog('這會同時刪除這個項目下的工作進度，確定要刪除嗎？');
    if (result === 1) {
      showLoading('正在刪除項目...');
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/items/${item.id}`);

        // // 直接使用 currentCategoryId 查找分类，更可靠
        // const category = tasks.value.find(t => t.id === currentCategoryId.value);
        // if (!category?.items) {
        //   showNotification('找不到要刪除的項目', 'error');
        //   return;
        // }

        // // 从分类中删除项目
        // const itemIndex = category.items.findIndex(i => i.id === item.id);
        // if (itemIndex === -1) {
        //   showNotification('找不到要刪除的項目', 'error');
        //   return;
        // }

        // category.items.splice(itemIndex, 1);

        const category = tasks.value.find(t => t.id === item.category_id);
        if (!category?.items || !category.items.some(i => i.id === item.id)) {
          showNotification('找不到要刪除的項目', 'error');
          return;
        }

        // 从分类中删除项目
        category.items = category.items.filter(i => i.id !== item.id);
        showNotification('項目刪除成功', 'success');
      } catch (error) {
        console.error('刪除項目失敗:', error);
      } finally {
        hideLoading();
      }
    }
  };

  const handleEditCategory = (category: TaskCategory) => {
    openAddCategoryDialog(false, category);
    closeContextMenu();
  };

  const openAddCategoryDialog = (addNew: boolean = true, editData: TaskCategory | null = null) => {
    showAddCategoryDialog.value = true;
    // 可以在这里设置对话框的标题和模式
    if (!addNew && editData) {
      // 编辑模式
      dialogTitle.value = '編輯分類';
      dialogIsEdit.value = true;
      dialogEditData.value = editData;
    } else {
      // 新增模式
      dialogTitle.value = '新增分類';
      dialogIsEdit.value = false;
      dialogEditData.value = null;
    }
  };

  const openAddItemDialog = (
    addNew: boolean = true,
    editData: TaskItem | null = null,
    category: TaskCategory | null = null,
  ) => {
    showAddItemDialog.value = true;
    // if (category) {
    //   currentCategoryId.value = category.id;
    // }

    if (!addNew && editData) {
      // 编辑模式
      itemDialogTitle.value = '編輯項目';
      itemDialogIsEdit.value = true;
      itemDialogEditData.value = editData;
    } else {
      // 新增模式
      itemDialogTitle.value = '新增項目';
      itemDialogIsEdit.value = false;
      itemDialogEditData.value = null;
    }
  };

  const openAddProgressDialog = (
    addNew: boolean = true,
    editData: TaskProgress | null = null,
    item: TaskItem | null = null,
  ) => {
    currentItemId.value = item?.id || 0;
    showAddProgressDialog.value = true;
    // if (item) {
    //   currentItemId.value = item.id;
    // }

    if (!addNew && editData) {
      // 编辑模式
      progressDialogTitle.value = '編輯進度';
      progressDialogIsEdit.value = true;
      progressDialogEditData.value = editData;
    } else {
      // 新增模式
      progressDialogTitle.value = '新增進度';
      progressDialogIsEdit.value = false;
      progressDialogEditData.value = null;
    }
  };

  const handleUpdateCategory = async (categoryData: TaskCategory) => {
    showLoading('正在更新分類...');
    try {
      // 调用后端 API 更新分类
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/categories/${categoryData.id}`, {
        category_name: categoryData.category_name,
        content: categoryData.content,
      });

      // // 更新本地数据
      // const categoryIndex = tasks.value.findIndex(t => t.id === categoryData.id);
      // if (categoryIndex === -1) {
      //   showNotification('找不到要更新的分類', 'error');
      //   return false;
      // }

      // // 更新分类数据
      // tasks.value[categoryIndex] = {
      //   ...tasks.value[categoryIndex],
      //   category_name: categoryData.category_name,
      //   content: categoryData.content,
      // };

      const category = tasks.value.find(t => t.id === categoryData.id);
      if (!category) {
        showNotification('找不到要更新的分類', 'error');
        return false;
      }

      // 直接更新 category 对象的属性
      category.category_name = categoryData.category_name;
      category.content = categoryData.content;

      showNotification('分類更新成功', 'success');
      return true;
    } catch (error) {
      // showNotification('分類更新失敗', 'error');
      // 错误处理由 axiosInterceptor.ts 处理
      return false;
    } finally {
      // 无论成功或失败，都隐藏遮罩
      hideLoading();
    }
  };

  const handleAddNewCategory = async (categoryData: TaskCategory) => {
    // 显示遮罩
    showLoading('正在新增分類...');
    try {
      // 调用后端 API 创建新分类
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/categories/`, {
        category_name: categoryData.category_name,
        content: categoryData.content,
      });

      // 使用后端返回的数据创建新分类
      const newCategory: TaskCategory = {
        id: response.data.id,
        category_name: response.data.category_name,
        content: response.data.content,
        showItems: false,
        items: [],
      };

      // 添加到分类列表
      tasks.value.push(newCategory);

      // 显示成功通知
      showNotification('分類新增成功', 'success');

      return true;
    } catch (error) {
      // showNotification('分類新增失敗', 'error');
      // 由 axiosInterceptor.ts 處理錯誤
      return false;
    } finally {
      // 无论成功或失败，都隐藏遮罩
      hideLoading();
    }
  };

  const handleUpdateItem = async (itemData: TaskItem) => {
    showLoading('正在更新項目...');
    try {
      // 调用后端 API 更新项目
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/items/${itemData.id}`, {
        item_name: itemData.item_name,
        content: itemData.content,
        item_at: itemData.item_at,
      });

      // 更新本地数据
      const categoryIndex = tasks.value.findIndex(t => t.id === currentCategoryId.value);
      if (categoryIndex !== -1 && tasks.value[categoryIndex].items) {
        const itemIndex = tasks.value[categoryIndex].items?.findIndex(i => i.id === itemData.id);
        if (itemIndex !== undefined && itemIndex !== -1) {
          tasks.value[categoryIndex].items![itemIndex] = {
            ...tasks.value[categoryIndex].items![itemIndex],
            item_name: itemData.item_name,
            content: itemData.content,
            item_at: itemData.item_at,
          };
        }
      }

      showNotification('項目更新成功', 'success');
      return true;
    } catch (error) {
      // 错误处理由 axiosInterceptor.ts 处理
      return false;
    } finally {
      hideLoading();
    }
  };

  const handleAddNewItem = async (itemData: TaskItem) => {
    showLoading('正在新增項目...');
    try {
      // 调用后端 API 创建新项目
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/items/`, {
        item_name: itemData.item_name,
        content: itemData.content,
        item_at: itemData.item_at,
        category_id: currentCategoryId.value,
      });

      // 使用后端返回的数据创建新项目
      const newItem: TaskItem = {
        id: response.data.id,
        user_id: response.data.user_id,
        category_id: response.data.category_id,
        item_name: response.data.item_name,
        content: response.data.content,
        item_at: response.data.item_at,
        showProgress: false,
        progresses: [],
      };

      // 找到对应的分类并添加新项目
      const categoryIndex = tasks.value.findIndex(t => t.id === currentCategoryId.value);
      if (categoryIndex !== -1) {
        // 确保分类有 items 数组
        if (!tasks.value[categoryIndex].items) {
          tasks.value[categoryIndex].items = [];
        }
        tasks.value[categoryIndex].items?.push(newItem);

        // 展开当前分类
        tasks.value[categoryIndex].showItems = true;
      }

      showNotification('項目新增成功', 'success');
      return true;
    } catch (error) {
      // 错误处理由 axiosInterceptor.ts 处理
      return false;
    } finally {
      hideLoading();
    }
  };

  const handleUpdateProgress = async (progressData: TaskProgress, item: TaskItem) => {
    // showNotification(JSON.stringify(item));
    // return;
    showLoading('正在更新進度...');
    try {
      // 调用后端 API 更新进度
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/progresses/${progressData.id}`, {
        progress_name: progressData.progress_name,
        content: progressData.content,
        progress_at: progressData.progress_at,
        status: progressData.status,
      });

      // 更新本地数据
      const categoryIndex = tasks.value.findIndex(t => t.id === currentCategoryId.value);
      if (categoryIndex !== -1 && tasks.value[categoryIndex].items) {
        const itemIndex = tasks.value[categoryIndex].items?.findIndex(i => i.id === item.id); // 使用 item.id
        if (itemIndex !== undefined && itemIndex !== -1) {
          const progressIndex = tasks.value[categoryIndex].items![itemIndex].progresses?.findIndex(
            p => p.id === progressData.id,
          );
          if (progressIndex !== undefined && progressIndex !== -1) {
            tasks.value[categoryIndex].items![itemIndex].progresses![progressIndex] = {
              ...tasks.value[categoryIndex].items![itemIndex].progresses![progressIndex],
              progress_name: progressData.progress_name,
              content: progressData.content,
              progress_at: progressData.progress_at,
              status: progressData.status,
            };
          }
        }
      }

      showNotification('進度更新成功', 'success');
      return true;
    } catch (error) {
      // 错误处理由 axiosInterceptor.ts 处理
      return false;
    } finally {
      hideLoading();
    }
  };

  const handleAddNewProgress = async (progressData: TaskProgress, item: TaskItem) => {
    // showNotification(JSON.stringify(item));
    // return;
    showLoading('正在新增進度...');
    try {
      // 调用后端 API 创建新进度
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/progresses/`, {
        progress_name: progressData.progress_name,
        content: progressData.content,
        progress_at: progressData.progress_at,
        status: progressData.status,
        item_id: item.id,
      });

      // 使用后端返回的数据创建新进度
      const newProgress: TaskProgress = {
        id: response.data.id,
        user_id: response.data.user_id,
        item_id: response.data.item_id,
        progress_name: response.data.progress_name,
        content: response.data.content,
        progress_at: response.data.progress_at,
        status: response.data.status,
      };

      // 找到对应的分类和项目并添加新进度
      const category = tasks.value.find(t => t.id === item.category_id);
      if (category?.items) {
        const targetItem = category.items.find(i => i.id === item.id);
        if (targetItem) {
          // 确保项目有 progresses 数组
          if (!targetItem.progresses) {
            targetItem.progresses = [];
          }
          targetItem.progresses.push(newProgress);

          // 展开当前项目
          targetItem.showProgress = true;
        }
      }

      showNotification('進度新增成功', 'success');
      return true;
    } catch (error) {
      // 错误处理由 axiosInterceptor.ts 处理
      return false;
    } finally {
      hideLoading();
    }
  };

  const handleDeleteProgress = async (progress: TaskProgress) => {
    const result = await showConfirmDialog('確定要刪除這個進度嗎？');
    if (result === 1) {
      showLoading('正在刪除進度...');
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/progresses/${progress.id}`);

        // 找到对应的分类和项目
        // const category = tasks.value.find(t => t.id === currentCategoryId.value);
        // if (!category?.items) {
        //   showNotification('找不到要刪除的進度1', 'error');
        //   return;
        // }

        // const item = category.items.find(i => i.id === progress.item_id);
        // if (!item?.progresses) {
        //   showNotification('找不到要刪除的進度2', 'error');
        //   return;
        // }

        // 直接查找包含该进度的项目
        const item = tasks.value.flatMap(category => category.items || []).find(item => item.id === progress.item_id);

        if (!item?.progresses) {
          showNotification('找不到要刪除的進度', 'error');
          return;
        }

        // 从项目中删除进度
        const progressIndex = item.progresses.findIndex(p => p.id === progress.id);
        if (progressIndex === -1) {
          showNotification('找不到要刪除的進度3', 'error');
          return;
        }

        item.progresses.splice(progressIndex, 1);
        showNotification('進度刪除成功', 'success');
      } catch (error) {
        console.error('刪除進度失敗:', error);
      } finally {
        hideLoading();
      }
    }
  };

  // 切换菜单显示状态
  const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value;
  };

  // 处理离开
  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('displayName');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('tokenExpiresIn');
    localStorage.removeItem('tokenTimestamp');

    if (timer.value !== null) {
      clearInterval(timer.value);
    }

    router.push('/');
  };

  // 一次性获取所有数据
  const fetchAllData = async () => {
    showLoading('載入中...');
    error.value = null;

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/tasks/all`);
      const { categories, items, progresses } = response.data;

      // 组织数据结构
      const tasksData = categories.map((category: TaskCategory) => {
        const categoryItems = items.filter((item: TaskItem) => item.category_id === category.id);

        const itemsWithProgress = categoryItems.map((item: TaskItem) => {
          const itemProgresses = progresses.filter((progress: TaskProgress) => progress.item_id === item.id);
          return {
            ...item,
            showProgress: false,
            progresses: itemProgresses,
          };
        });

        return {
          ...category,
          showItems: false,
          items: itemsWithProgress,
        };
      });

      tasks.value = tasksData;

      // showNotification(JSON.stringify(currentCategoryId.value));
      // showNotification(JSON.stringify(currentCategory.value));

      // 展开第一个分类
      if (tasks.value.length > 0) {
        const firstTask =
          currentCategory.value === 0 ? tasks.value[0] : tasks.value.find(t => t.id === currentCategory.value);

        if (firstTask) {
          firstTask.showItems = true;
          // 如果是初始状态（currentCategory为0），更新currentCategory和currentCategoryId
          if (currentCategory.value === 0) {
            currentCategory.value = firstTask.id;
            currentCategoryId.value = firstTask.id;
          }
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取数据失败';
      console.error('获取数据失败:', err);
    } finally {
      hideLoading();
    }
  };

  const refreshData = async () => {
    try {
      // 重新获取所有分类数据
      await fetchAllData();
      // 关闭侧边栏
      toggleSidebar();
    } catch (error) {
      console.error('刷新数据失败:', error);
    }
  };

  // 在组件挂载时获取数据
  onMounted(() => {
    fetchAllData();
    document.addEventListener('click', handleClickOutside);

    // 初始化定时器，用于检查token状态
    timer.value = window.setInterval(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
      }
    }, 60000); // 每分钟检查一次
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    if (timer.value !== null) {
      clearInterval(timer.value);
      timer.value = null;
    }
  });

  const categories = computed(() =>
    tasks.value.map(cat => ({
      id: cat.id,
      category_name: cat.category_name,
      content: cat.content,
    })),
  );

  const filteredTasks = computed(() => {
    return tasks.value.filter(task => task.id === currentCategory.value);
  });

  const toggleTaskItems = (taskId: number) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task) {
      task.showItems = !task.showItems;
    }
  };

  const toggleItemProgress = (item: TaskItem) => {
    item.showProgress = !item.showProgress;
  };

  const expandAllProgress = () => {
    const currentTask = tasks.value.find(t => t.id === currentCategory.value);
    if (currentTask) {
      currentTask.showItems = true;
      if (currentTask.items) {
        // 添加空值检查
        currentTask.items.forEach(item => {
          item.showProgress = true;
        });
      }
    }
  };

  const collapseAllProgress = () => {
    const currentTask = tasks.value.find(t => t.id === currentCategory.value);
    if (currentTask) {
      if (currentTask.items) {
        // 添加空值检查
        currentTask.items.forEach(item => {
          item.showProgress = false;
        });
      }
    }
  };

  const handleCategoryClick = async (category: TaskCategory) => {
    currentCategory.value = category.id; // UI显示相关
    currentCategoryId.value = category.id; // 数据操作相关
    const task = tasks.value.find(t => t.id === category.id);
    if (task) {
      task.showItems = true;
    }
  };

  return {
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
    refreshData,
    toggleSidebar,
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
    handleDeleteProgress,
  };
}
