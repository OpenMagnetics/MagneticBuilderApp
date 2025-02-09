import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/MagneticBuilder.vue')
    },
    {
        path: '/magnetic_tool',
        name: 'MagneticBuilder',
        component: () => import('../views/MagneticBuilder.vue')
    },
    {
        path: '/engine_loader',
        name: 'EngineLoader',
        component: () => import('../views/EngineLoader.vue')
    },

]
const router = createRouter({
    history: createWebHistory(),
    routes,
});


export default router
