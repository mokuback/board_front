import { ref, computed, onMounted, reactive, onUnmounted } from 'vue'
import axios from '../services/axiosInterceptor';
import { showLoading, hideLoading } from '../services/loadingService';
import { useRouter } from 'vue-router';
import { showNotification } from '../services/notificationService';

// 定义数据类型
export interface TaskProgress {
    id: number;
    user_id: number;
    item_id: number;
    progress_name: string;
    content: string;
    progress_at: string;
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
    const currentCategory = ref(1);
    const error = ref<string | null>(null);
    const showSidebar = ref(false);
    const router = useRouter();
    const showAddCategoryDialog = ref(false);
    const showContextMenu = ref(false);
    const selectedCategory = ref<TaskCategory | null>(null);
    const contextMenuPosition = ref({ x: 0, y: 0 });

    const handleClickOutside = (event: MouseEvent) => {
        const contextMenu = document.querySelector('.context-menu');
        if (showContextMenu.value && contextMenu && !contextMenu.contains(event.target as Node)) {
            closeContextMenu();
        }
    };

    const handleContextMenu = (event: MouseEvent, category: TaskCategory) => {
        event.preventDefault();
        selectedCategory.value = category;
        contextMenuPosition.value = {
            x: event.clientX,
            y: event.clientY
        };
        showContextMenu.value = true;
    };

    const closeContextMenu = () => {
        showContextMenu.value = false;
        selectedCategory.value = null;
    };

    const handleDeleteCategory = async (categoryId: number) => {
        closeContextMenu();
        // TODO: 实现删除分类的逻辑
        console.log('Delete category:', categoryId);
    };

    const handleEditCategory = (categoryId: number) => {
        closeContextMenu();
        // TODO: 实现修改分类的逻辑
        console.log('Edit category:', categoryId);
    };
    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/categories`);
            return response.data;
        } catch (error) {
            console.error('获取分类失败:', error);
            throw error;
        }
    };

    const fetchItems = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/items`);
            return response.data;
        } catch (error) {
            console.error('获取项目失败:', error);
            throw error;
        }
    };

    const fetchProgresses = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/progresses`);
            return response.data;
        } catch (error) {
            console.error('获取进度失败:', error);
            throw error;
        }
    };

    const submitCategory = async (categoryData: TaskCategory) => {
        try {
            // throw new Error('未实现');

            // 获取当前最大ID
            const maxId = Math.max(...tasks.value.map(t => t.id), 0);

            // 创建新分类
            const newCategory: TaskCategory = {
                id: maxId + 1,
                category_name: categoryData.category_name,
                content: categoryData.content,
                showItems: false,
                items: []
            };

            // 添加到分类列表
            tasks.value.push(newCategory);

            // 显示成功通知
            showNotification('分類新增成功', 'success');

            return true;
        } catch (error) {
            showNotification('分類新增失敗', 'error');
            return false;
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
                        progresses: itemProgresses
                    };
                });

                return {
                    ...category,
                    showItems: false,
                    items: itemsWithProgress
                };
            });

            tasks.value = tasksData;

            // 展开第一个分类
            const firstTask = tasks.value.find(t => t.id === currentCategory.value);
            if (firstTask) {
                firstTask.showItems = true;
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : '获取数据失败';
            console.error('获取数据失败:', err);
        } finally {
            hideLoading();
        }
    };

    // 在组件挂载时获取数据
    onMounted(() => {
        fetchAllData();
        document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
    });

    const categories = computed(() => tasks.value.map(cat => ({
        id: cat.id,
        category_name: cat.category_name,
        content: cat.content
    })));

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
            if (currentTask.items) {  // 添加空值检查
                currentTask.items.forEach(item => {
                    item.showProgress = true;
                });
            }
        }
    };


    const collapseAllProgress = () => {
        const currentTask = tasks.value.find(t => t.id === currentCategory.value);
        if (currentTask) {
            if (currentTask.items) {  // 添加空值检查
                currentTask.items.forEach(item => {
                    item.showProgress = false;
                });
            }
        }
    };


    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW');
    };

    const handleCategoryClick = async (categoryId: number) => {
        currentCategory.value = categoryId;
        const task = tasks.value.find(t => t.id === categoryId);
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
        toggleTaskItems,
        toggleItemProgress,
        expandAllProgress,
        collapseAllProgress,
        formatDate,
        handleCategoryClick,
        refreshData: fetchAllData,
        toggleSidebar,
        logout,
        submitCategory,
        handleContextMenu,
        closeContextMenu,
        handleDeleteCategory,
        handleEditCategory,
    };
}
