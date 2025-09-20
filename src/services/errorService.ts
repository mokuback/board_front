// board_front/src/services/errorService.ts
import { showNotification } from './notificationService';
import router from '../router';

export class ApiError extends Error {
    public statusCode: number;
    public message: string;
    public details?: any;

    constructor(statusCode: number, message: string, details?: any) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.message = message;  // 明确赋值
        this.details = details;
    }
}

export const handleApiError = (error: any) => {
    // 检查是否有响应
    if (error.response) {
        // 处理 HTTP 错误响应
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.detail || error.message || '發生未知錯誤';

        switch (statusCode) {
            // case 401:
            //     showNotification('登入已過期，請重新登入', 'error');
            //     localStorage.removeItem('token');
            //     router.push('/');
            //     break;
            case 401:
                // 检查是否是 token 过期
                if (errorMessage.includes('Token has expired')) {
                    showNotification('登入已過期，請重新登入', 'error');
                    localStorage.removeItem('token');
                    router.push('/');
                }
                // 检查是否是无效 token
                else if (errorMessage.includes('Invalid token')) {
                    showNotification('登入已失效，請重新登入', 'error');
                    localStorage.removeItem('token');
                    router.push('/');
                }
                // 其他 401 错误
                else {
                    showNotification(errorMessage, 'error');
                }
                break;
            case 400:
                showNotification(errorMessage, 'error');
                break;
            case 403:
                showNotification(errorMessage, 'error');
                break;
            case 404:
                showNotification(errorMessage, 'error');
                break;
            case 500:
                showNotification(errorMessage, 'error');
                break;
            default:
                showNotification(errorMessage, 'error');
        }
    } else if (error.request) {
        // 请求已发出但没有收到响应
        showNotification('伺服器未回應', 'error');
    } else {
        // 请求设置出错
        showNotification('請求設置錯誤', 'error');
    }
};

export const createApiError = (error: any): ApiError => {
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.detail || error.message || '发生未知错误';
    return new ApiError(statusCode, message, error.response?.data);
};
