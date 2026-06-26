//import { createApp } from 'vue';
//import Main from './Main.vue';
//import './style.css';
//
//
//createApp(Main).mount('#app');
//--------------------------------------------------------------------------------
import { createApp } from 'vue';
import Main from './Main.vue';
import router from './router/index.js'; // 1. Import your unified routing config
import './style.css';

const app = createApp(Main);

app.use(router); // 2. Register the router instance with your app context

app.mount('#app');
