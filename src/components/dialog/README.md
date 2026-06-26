# Global Browser Dialog Override Layer

A lightweight Vue 3 utility that replaces native blocking dialogs (`window.alert`, `window.confirm`, and `window.prompt`) with an asynchronous, mobile-optimized dark theme modal.

## Architecture & Core Decisions

### 1. Global Context State Mirroring
Standard Vue composable state registers unique instances per context. Because native window calls can execute from outside the Vue tree (e.g., third-party scripts, browser console), the reactive references (`refs`) are bound to a persistent global key: `window.__VUE_CUSTOM_DIALOG_STATE__`. This ensures that any call to `window.alert()` modifies the exact reactive instance monitored by the DOM.

### 2. Thread Promisification
Native browser dialogs are synchronous and freeze the JavaScript execution thread. Because custom HTML elements cannot block the thread, the custom overrides return an unresolved JavaScript `Promise`. The thread continues, but application logic is suspended using `async/await` until the user clicks an option, which fires the promise's internal `resolve()` handler.

### 3. DOM Placement via Teleport
To circumvent layout clipping, parent z-index limitations, or parent container `overflow: hidden` rules, the modal component uses Vue's `<Teleport to="body">` directive. This detaches the modal node from the component tree and drops it directly into the document root.

## Directory Layout

* **`src/util/useDialog.js`**: Houses the global window hijacking script, handles state persistence, and manages promise tracking logic.
* **`src/components/CustomDialog.vue`**: Controls the dark theme UI layout wrapper, style rules, and button tap handlers.

## Usage Implementation

### 1. Update Conditional Logic to Async
Because overrides use promises, your application must use `async/await` syntax to evaluate the returned values.

```javascript
// Synchronous calls fail because they receive a truthy Promise object immediately.
// Use this asynchronous pattern instead:
const handleDelete = async () => {
  if (await window.confirm("Delete record?")) {
    executeDeletePipeline();
  }
};
```

### 2. Initialize in App Root
Invoke the override initialization during the root mount sequence of your application.

```javascript
import { onMounted } from 'vue';
import { initWindowOverrides } from './util/useDialog.js';

onMounted(() => {
  initWindowOverrides();
});
```

## Mobile & UI Engineering

* **Touch Targets**: All action buttons maintain a minimum padding profile ensuring click targets match mobile user accessibility guidelines.
* **Responsive Layout**: Action buttons leverage CSS grid rules to present choices side-by-side on mobile devices, automatically switching to a vertical stack on displays smaller than 340px.
* **Theme**: Employs an monochromatic color scheme matching developer console interfaces to prevent high-contrast eye fatigue.

