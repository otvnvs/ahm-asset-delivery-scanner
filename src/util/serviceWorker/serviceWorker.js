/**
 * Service Worker Registration and Interface Controller Module.
 */

/**
 * Registers the service worker script natively using an environment-specific path.
 * Leverages the native .ready promise to avoid window reload infinite loops.
 * 
 * @param {string} workerScriptPath - Explicit path to the script (e.g. '/sw.js' or '/public/sw.js')
 */
export function registerServiceWorker(workerScriptPath) {
  console.log("util/serviceWorker/serviceWorker.js:registerServiceWorker()");
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      var targetPath = workerScriptPath || '/sw.js';
      
      console.log('[SW REGISTER] Initiating registration pipeline for target route: ' + targetPath);
      
      navigator.serviceWorker.register(targetPath/*, { scope: '/' }*/)
        .then(function(registration) {
          console.log('[SW REGISTER] ServiceWorker successfully registered with scope: ', registration.scope);
          
          // FIXED: Bypassed the window.location.reload loop by leveraging the native ready state promise
          navigator.serviceWorker.ready.then(function(readyRegistration) {
            console.log('[SW REGISTER] Service Worker thread is fully initialized, ready, and active.');
          });
        })
        .catch(function(error) {
          console.error('[SW REGISTER] Internal registration failure:', error);
        });
    });
  }
}

/**
 * Sends a message payload string block down to the active service worker context thread.
 */
export function sendWorkerMessage(messageDataPayload) {
  console.log("util/serviceWorker/serviceWorker.js:sendWorkerMessage()");
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(messageDataPayload);
  }
}

/**
 * Attaches a message listener to intercept responses coming back up out of sw.js.
 */
export function listenForWorkerMessages(onMessageReceivedCallback) {
  console.log("util/serviceWorker/serviceWorker.js:listenForWorkerMessages()");
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(event) {
      if (typeof onMessageReceivedCallback === 'function') {
	console.log("util/serviceWorker/serviceWorker.js:"+event.data);
        onMessageReceivedCallback(event.data);
      }
    });
  }
}
