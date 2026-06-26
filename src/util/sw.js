import { store } from './store.js';

export function syncServiceWorkerState() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SERVICE WORKER] Context is unavailable on this device architecture.');
    return;
  }

  if (store.config.useDummyData) {
    navigator.serviceWorker.register('mock-sw.js',/*{scope:"/"}*/)
      .then((registration) => {
        console.log('[SERVICE WORKER] Mocking proxy successfully registered.');
        
        // If the worker was already installed but idle, force an immediate manual activation step
        if (registration.active) {
          registration.active.postMessage({ action: 'skipWaiting' });
        }
      })
      .catch(err => console.error('[SERVICE WORKER] Registration failure:', err));
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then(() => {
          console.log('[SERVICE WORKER] Mocking proxy deactivated.');
          // Force page refresh to return fetch controllers back to normal browser engines
          window.location.reload(); 
        });
      }
    });
  }
}

