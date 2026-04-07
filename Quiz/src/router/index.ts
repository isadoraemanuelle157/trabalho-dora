import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/quiz',
      name: 'quiz',
      component: () => import('../components/Quiz.vue'),
    },
    {
      path: '/ranking',
      name: 'ranking',
      component: () => import('../components/Ranking.vue'),
    },
  ],
})

export default router