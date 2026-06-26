//import { loadModule } from './lib/vue3-sfc-loader/vue3-sfc-loader.esm.js';
//import * as Vue from './lib/vue/vue.esm-browser.prod.js';
//import style from './style.css' with { type: 'css' };
//
//async function initApp() {
//  window.Vue = Vue;
//
//  const routerRes = await fetch('./src/lib/vue-router/vue-router.global.prod.js');
//  if (!routerRes.ok) throw new Error("Failed to load Vue Router global asset.");
//  const routerCode = await routerRes.text();
//  
//  const script = document.createElement('script');
//  script.textContent = routerCode;
//  document.head.appendChild(script);
//  
//  const VueRouter = window.VueRouter;
//
//  if ('serviceWorker' in navigator) {
//    window.addEventListener('load', () => {
//      navigator.serviceWorker.register('./sw.sfc.js')
//        .then(reg => console.log('Offline worker active!', reg.scope))
//        .catch(err => console.error('Worker registration failed:', err));
//    });
//  }
//
//  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
//  const customJsCache = {};
//
//  const options = {
//    moduleCache: {
//      vue: Vue,
//      'vue-router': VueRouter
//    },
//    async getFile(url) {
//      const res = await fetch(url);
//      if (!res.ok) throw new Error(`Failed to load ${url}`);
//      return { getContentData: (asBinary) => asBinary ? res.arrayBuffer() : res.text() };
//    },
//    addStyle(styleStr) {
//      const style = document.createElement('style');
//      style.textContent = styleStr;
//      document.head.appendChild(style);
//    },
//    pathResolve({ refPath, relPath }) {
//      if (!refPath) return relPath;
//      if (relPath.startsWith('.')) {
//        return refPath.substring(0, refPath.lastIndexOf('/') + 1) + relPath;
//      }
//      return relPath;
//    },
//    async handleModule(type, getContentData, path, options) {
//      if (path.endsWith('.js')) {
//        async function resolveAndCacheModule(currentPath) {
//          if (currentPath === 'vue') return { resolved: true, exports: Vue };
//          if (currentPath === 'vue-router') return { resolved: true, exports: VueRouter };
//          if (customJsCache[currentPath]) {
//            return customJsCache[currentPath];
//          }
//          
//          customJsCache[currentPath] = { resolved: false, blobUrl: null, exports: null, rawCode: '' };
//          const res = await fetch(currentPath);
//          if (!res.ok) throw new Error(`Module compilation failed to fetch: ${currentPath}`);
//          const rawCode = await res.text();
//          customJsCache[currentPath].rawCode = rawCode;
//          
//          let cleanCurrentDir = currentPath;
//          if (cleanCurrentDir.startsWith('.')) cleanCurrentDir = cleanCurrentDir.substring(1);
//          const currentDirUrl = new URL(cleanCurrentDir, window.location.origin);
//          
//          const importRegex = /from\s+['"](\.\.?\/[^'"]+|vue|vue-router)['"]/g;
//          let match;
//          const dependencies = [];
//          
//          while ((match = importRegex.exec(rawCode)) !== null) {
//            const relPath = match[1];
//            if (relPath === 'vue' || relPath === 'vue-router') {
//              dependencies.push({ relPath, absoluteDependencyPath: relPath });
//            } else {
//              const resolvedUrl = new URL(relPath, currentDirUrl);
//              const absoluteDependencyPath = '.' + resolvedUrl.pathname;
//              dependencies.push({ relPath, absoluteDependencyPath });
//            }
//          }
//          
//          for (const dep of dependencies) {
//            // FIX 1: If a dependency is a Vue component, compile it using loadModule
//            if (dep.absoluteDependencyPath.endsWith('.vue')) {
//              if (!customJsCache[dep.absoluteDependencyPath]) {
//                customJsCache[dep.absoluteDependencyPath] = { resolved: false, blobUrl: null, exports: null };
//                const vueComponent = await loadModule(dep.absoluteDependencyPath, options);
//                
//                // Create an ES module Blob wrapping the compiled Vue component object
//                const compBlob = new Blob([`export default window.sfcComponentCache["${dep.absoluteDependencyPath}"];`], { type: 'text/javascript' });
//                if (!window.sfcComponentCache) window.sfcComponentCache = {};
//                window.sfcComponentCache[dep.absoluteDependencyPath] = vueComponent;
//                
//                customJsCache[dep.absoluteDependencyPath].blobUrl = URL.createObjectURL(compBlob);
//                customJsCache[dep.absoluteDependencyPath].exports = { default: vueComponent };
//                customJsCache[dep.absoluteDependencyPath].resolved = true;
//              }
//            } else {
//              await resolveAndCacheModule(dep.absoluteDependencyPath);
//            }
//          }
//          
//          let transformedCode = rawCode.replace(/from\s+['"](\.\.?\/[^'"]+|vue|vue-router)['"]/g, (m, relPath) => {
//            if (relPath === 'vue') {
//              return `from 'data:text/javascript,export default window.Vue; export * from "data:text/javascript,const {reactive,ref,computed,watch,onMounted,onUnmounted,defineComponent,createApp}=window.Vue; export {reactive,ref,computed,watch,onMounted,onUnmounted,defineComponent,createApp};";'`;
//            }
//            if (relPath === 'vue-router') {
//              return `from 'data:text/javascript,export default window.VueRouter; export * from "data:text/javascript,const {createRouter,createWebHashHistory,createWebHistory,useRoute,useRouter}=window.VueRouter; export {createRouter,createWebHashHistory,createWebHistory,useRoute,useRouter};";'`;
//            }
//            
//            const resolvedUrl = new URL(relPath, currentDirUrl);
//            const absoluteDependencyPath = '.' + resolvedUrl.pathname;
//            
//            // FIX 2: Point the import specifier directly to the pre-compiled Vue module blob URL
//            const cachedDep = customJsCache[absoluteDependencyPath];
//            if (cachedDep && cachedDep.blobUrl) {
//              return `from '${cachedDep.blobUrl}'`;
//            }
//            return `from '${resolvedUrl.pathname}'`;
//          });
//          
//          const blob = new Blob([transformedCode], { type: 'text/javascript' });
//          const blobUrl = URL.createObjectURL(blob);
//          customJsCache[currentPath].blobUrl = blobUrl;
//          const evaluatedModule = await import(blobUrl);
//          customJsCache[currentPath].resolved = true;
//          customJsCache[currentPath].exports = evaluatedModule;
//          return customJsCache[currentPath];
//        }
//        const moduleData = await resolveAndCacheModule(path);
//        return moduleData.exports;
//      }
//    }
//  };
//
//  window.sfcLoaderOptions = options;
//  
//  loadModule('./src/Main.vue', options)
//    .then(async (Main) => {
//      const app = Vue.createApp(Main);
//      const routerModule = await options.handleModule('.js', null, './src/router/index.js', options);
//      if (routerModule && routerModule.default) {
//        app.use(routerModule.default);
//      }
//      app.mount('#app');
//    })
//    .catch(err => console.error('App initialization failed:', err));
//}
//
//initApp();
//--------------------------------------------------------------------------------
import { bootstrapSfcApp } from './util/sfcBootstrap.js';
import style from './style.css' with { type: 'css' };

document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];

bootstrapSfcApp().then(({ createApp, Main, router }) => {
  const app = createApp(Main);
  if (router) app.use(router);
  app.mount('#app');
}).catch(err => console.error('App initialization failed:', err));

