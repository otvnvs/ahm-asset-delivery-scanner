<template>
  <!-- Off-screen, zero-width input matching hardware keystroke emulation constraints -->
  <input
    ref="guardianInputRef"
    v-model="scannedBuffer"
    type="text"
    class="zebra-hidden-guardian"
    autocomplete="off"
    autofocus
    @keyup.enter="handleScanComplete"
    @blur="handleBlurFallback"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { isGlobalScanningActive, isUserEditing } from '../../util/barcodeScanner.js';

const route = useRoute();
const guardianInputRef = ref(null);
const scannedBuffer = ref('');

// Enforce focus loop stability
let focusCheckInterval = null;

const enforceFocus = () => {
  if (isGlobalScanningActive.value && !isUserEditing()) {
    guardianInputRef.value?.focus();
  }
};

const handleBlurFallback = () => {
  // If blurred naturally, check immediately on next execution frame if we need to snap focus back
  setTimeout(enforceFocus, 50);
};

const handleScanComplete = () => {
  const finalizedString = scannedBuffer.value.trim();
  scannedBuffer.value = ''; // Clean buffer immediately for next hardware sweep

  if (!finalizedString) return;

  console.log(`[ZEBRA HARDWARE SCAN] Dispatched text: ${finalizedString} on route: ${route.path}`);
  
  // Global Event dispatching - allows active view templates to listen natively
  window.dispatchEvent(new CustomEvent('zebra-barcode-scanned', {
    detail: { 
      text: finalizedString,
      currentPath: route.path 
    }
  }));
};

// Auto focus re-evaluation when pickers flip between dashboard view tabs
watch(() => route.path, () => {
  setTimeout(enforceFocus, 100);
});

onMounted(() => {
  enforceFocus();
  // Continuous verification fallback interval (e.g., if OS or WebView system messages steal layout priority)
  focusCheckInterval = setInterval(enforceFocus, 1000);
});

onUnmounted(() => {
  if (focusCheckInterval) clearInterval(focusCheckInterval);
});
</script>

<style scoped>
.zebra-hidden-guardian {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}
</style>

