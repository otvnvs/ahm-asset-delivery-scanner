# Service Worker Interface & Lifecycle Management

This module manages the connection bridge and background messaging channels between the Vue application context and the isolated Service Worker thread (`sw.js`).

## 🔄 Service Worker Lifecycle Statuses

A Service Worker operates on an independent thread separate from the webpage DOM. The interface handles four distinct runtime operational states:

1. **`[ RUNNING ]` (Green)**  
   The background worker is active, running, and actively controlling the network requests of the open tab (`navigator.serviceWorker.controller` is fully assigned).
2. **`[ DEACTIVATED ]` (White)**  
   The worker script is successfully registered inside the browser, but it has not yet claimed active control over this specific open tab instance. This is common during the initial load of uncompiled SFC loader runtimes.
3. **`[ DEACTIVATED ]` (Grey)**  
   The worker thread has been explicitly unregistered, deleted, or stopped entirely. No active background cache proxy instance exists for this domain.
4. **`[ NO SUPPORT ]` (Red)**  
   The underlying browser engine or Android WebView container does not support Service Workers, or registration is blocked by system security rules.

---

## Module API Methods (`serviceWorker.js`)

### `registerServiceWorker(workerScriptPath)`
Registers the background thread using an explicit path to prevent 404 lookup errors across environments.
* **Vite Environments (`src/main.js`)**: Maps straight to `/sw.js`.
* **SFC Loader Runtime (`src/main.sfc.js`)**: Maps straight to `/public/sw.js`.

### `sendWorkerMessage(messageDataPayload)`
Dispatches structured command payloads (must contain a `type` string property) down to the background worker thread using the `postMessage` pipeline.

### `listenForWorkerMessages(onMessageReceivedCallback)`
Attaches a listener interface to intercept asynchronous responses or data pushed back up from the worker thread.

---

## Testing States with Browser Developer Tools (Brave / Chrome)

You can manually trigger lifecycle shifts using Brave Developer Tools to verify your interface buttons and status indicators:

1. Open **Developer Tools** (`F12`) and navigate to the **Application** panel tab.
2. Select **Service Workers** from the left-hand sidebar menu list.

### Experiment 1: Simulate Thread Stoppage
* **Action**: Click the **Stop** link text button next to your active `sw.js` registration line inside the DevTools panel.
* **Effect**: This immediately terminates the execution thread.
* **Result**: Click **Refresh Status** on your Configuration page. The badge will shift from green to white/grey because the controller thread is no longer running.

### Experiment 2: Simulate Complete Unregistration
* **Action**: Click the **Unregister** button on the far right of the DevTools line.
* **Effect**: This completely deletes the service worker from the browser's persistent registry memory.
* **Result**: Click **Refresh Status** on your Configuration page. The badge will turn grey, matching the behavior of your on-screen "Unregister" button.

### Experiment 3: Force Immediate Code Activation
* **Action**: When you modify `sw.js`, DevTools will show a new instance waiting under a section labeled *"Update found: waiting to activate"*. Click the **skipWaiting** option link text.
* **Effect**: This instantly kills the older worker cache thread and mounts your updated logic without needing to close your active browser tab.

