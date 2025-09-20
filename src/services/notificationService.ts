import { ref, reactive } from 'vue';

// 通知状态
const notificationState = reactive({
    show: false,
    message: '',
    type: 'success',
    duration: 8000
});

// 通知队列
const notificationQueue = ref<Array<{
    message: string;
    type: string;
    duration: number;
}>>([]);

// 是否正在显示通知
const isShowingNotification = ref(false);

// 显示通知
export const showNotification = (message: string, type = 'success', duration = 3000) => {
    console.log('showNotification called:', message); // 添加日志

    // 将通知添加到队列
    notificationQueue.value.push({
        message,
        type,
        duration
    });

    console.log('Queue length:', notificationQueue.value.length); // 添加日志

    // 如果当前没有显示通知，则显示队列中的第一个通知
    if (!isShowingNotification.value) {
        showNextNotification();
    }
};

// 显示下一个通知
const showNextNotification = () => {
    console.log('showNextNotification called'); // 添加日志

    if (notificationQueue.value.length === 0) {
        isShowingNotification.value = false;
        return;
    }

    isShowingNotification.value = true;
    const notification = notificationQueue.value.shift();

    if (notification) {
        console.log('Showing notification:', notification.message); // 添加日志

        notificationState.message = notification.message;
        notificationState.type = notification.type;
        notificationState.duration = notification.duration;
        notificationState.show = true;

        setTimeout(() => {
            console.log('Hiding notification'); // 添加日志
            notificationState.show = false;
            setTimeout(showNextNotification, 100); // 短暂延迟后显示下一个通知
        }, notification.duration);
    }
};

// 导出通知状态，供组件使用
export const useNotification = () => {
    return {
        notificationState
    };
};
