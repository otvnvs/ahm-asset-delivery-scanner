import { createRouter, createWebHashHistory } from 'vue-router';
import { store } from '../util/store.js';
import PinSetup from '../views/PinSetup.vue';
import PinEnter from '../views/PinEnter.vue';
import Home from '../views/Home.vue';
import About from '../views/About.vue';
import Config from '../views/Config.vue'; // New Import Entry
import Services from '../views/Services.vue'; // New Import
import ServiceOverview from '../views/ServiceOverview.vue'; // New Import
import ServiceDetails from '../views/ServiceDetails.vue';
import ServiceNew from '../views/ServiceNew.vue';

const routes = [
  { path: '/', redirect: '/home' },
  { name: 'setup', path: '/setup', component: PinSetup },
  { name: 'enter', path: '/enter', component: PinEnter },
  { name: 'home', path: '/home', component: Home },
  { name: 'about', path: '/about', component: About },
  { name: 'config', path: '/config', component: Config },
  { name: 'services', path: '/services', component: Services },
  { name: 'service-overview', path: '/services/:entityName', component: ServiceOverview },
  { name: 'service-details', path: '/services/:entityName/details', component: ServiceDetails },
  { name: 'service-new', path: '/services/:entityName/new', component: ServiceNew }
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

