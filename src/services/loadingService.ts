import { ref, reactive } from 'vue';

// 遮罩层状态
const loadingState = reactive({
    isVisible: false,
    message: '处理中...'
});

// 显示遮罩层
export const showLoading = (message = '处理中...') => {
    loadingState.isVisible = true;
    loadingState.message = message;
};

// 隐藏遮罩层
export const hideLoading = () => {
    loadingState.isVisible = false;
};

// 导出遮罩层状态，供组件使用
export const useLoading = () => {
    return {
        loadingState
    };
};
