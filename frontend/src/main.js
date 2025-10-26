// 🛠️ Fix für ResizeObserver Bug in Chrome
const resizeObserverErr = (e) => {
  if (e.message && e.message.includes('ResizeObserver loop completed')) {
    e.stopImmediatePropagation();
  }
};
window.addEventListener('error', resizeObserverErr);
window.addEventListener('unhandledrejection', resizeObserverErr);

import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import router from './router';
import store from './store';
import App from './App.vue';

// Import global styles
import '@/styles/index.scss';

// Import icons
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const app = createApp(App);

// Register all icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// Use plugins
app.use(ElementPlus);
app.use(router);
app.use(store);

// Mount app
app.mount('#app');
