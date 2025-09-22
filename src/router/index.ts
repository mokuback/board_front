import { createRouter, createWebHistory } from 'vue-router';
import LoginTest from '../components/LoginTest.vue';
import MessageBoard from '../components/MessageBoard.vue';
import TaskBoard from '../components/TaskBoard.vue';

const routes = [
    // {
    //     path: '/',
    //     name: 'Login',
    //     component: Login, // 默认使用 Login.vue
    // },
    {
        path: '/',
        name: 'LoginTest',
        component: LoginTest, // 测试登录组件
    },
    {
        path: '/messages',
        name: 'MessageBoard',
        component: MessageBoard,
        meta: { requiresAuth: true }
    },
    {
        path: '/task',
        name: 'TaskBoard',
        component: TaskBoard,
    }

];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
    // 如果路由标记为绕过 LINE 验证，则直接放行
    // if (to.meta.bypassLineAuth) {
    //     next();
    //     return;
    // }

    if (to.meta.requiresAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
            next('/');
        } else {
            next();
        }
    } else {
        next();
    }
});

export default router;
