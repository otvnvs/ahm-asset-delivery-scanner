import { createRouter, createWebHashHistory } from 'vue-router';
import { store } from '../util/store.js';
import PinSetup from '../views/pinsetup/PinSetup.vue';
import PinEnter from '../views/pinenter/PinEnter.vue';
import Home from '../views/home/Home.vue';
import About from '../views/about/About.vue';

const routes = [
  { path: '/', redirect: '/home' },
  { name: 'setup', path: '/setup', component: PinSetup },
  { name: 'enter', path: '/enter', component: PinEnter },
  { name: 'home', path: '/home', component: Home },
  { name: 'about', path: '/about', component: About },
  { path: '/:catchAll(.*)*', redirect: '/home' } // Fallback for deleted paths
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const pinExists = store.appPin !== null && store.appPin !== undefined && store.appPin !== '';
  const isLoggedIn = store.user.isLoggedIn === true;

  if (!pinExists) {
    if (to.path !== '/setup') return next('/setup');
    return next();
  }

  if (!isLoggedIn) {
    if (to.path !== '/enter') return next('/enter');
    return next();
  }

  if (to.path === '/setup' || to.path === '/enter') {
    return next('/home');
  }

  next();
});

export default router;

