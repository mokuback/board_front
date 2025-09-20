import axios from 'axios';
import { handleApiError } from './errorService';

// 设置axios默认配置
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL; // 根据实际情况修改

// 请求拦截器
axios.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 响应拦截器
axios.interceptors.response.use(
    response => response,
    error => {
        handleApiError(error);
        return Promise.reject(error);
    }
);

export default axios;
