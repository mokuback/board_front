import { createRouter, createWebHistory } from 'vue-router';
import MessageBoard from '../components/MessageBoard.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../App.vue'),
    },
    {
        path: '/messages',
        name: 'MessageBoard',
        component: MessageBoard,
        meta: { requiresAuth: true }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
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
