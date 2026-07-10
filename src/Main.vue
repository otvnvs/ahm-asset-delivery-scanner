<template>
  <div class="minimal-container">
    <router-view></router-view>
  </div>
  
  <!-- 
    The exact physical input tag setup from your working vanilla JS project.
    By rendering it inside Main.vue alongside the top-level router-view container,
    it remains safely mounted and never gets destroyed across all route transitions.
  -->
  <input
    id="hardwareScanCatcher"
    ref="scanCatcherRef"
    type="text"
    class="zebra-hidden-guardian"
    autocomplete="off"
    @keydown="handleHardwareWedgeInput"
  />
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { initWindowOverrides } from './components/dialog/useDialog.js';
import { isWebcamScannerOpen } from './util/barcodeScanner.js';

const route = useRoute();
const scanCatcherRef = ref(null);

const isTargetInputFocused = () => {
  if (isWebcamScannerOpen.value) return true; // Yield to camera module

  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const tagName = activeEl.tagName.toLowerCase();
  
  // Your exact whitelisted form components where focus shouldn't be stolen
  const interactiveInputs = ['inputDeliveryNum', 'inputSscc', 'inputRef', 'inputEditQty'];

  if (interactiveInputs.includes(activeEl.id) || 
      activeEl.className?.includes('form-input') || 
      tagName === 'textarea' || 
      activeEl.id === 'hardwareScanCatcher') {
    return true;
  }
  return false;
};

const reclaimScannerFocus = () => {
  if (!isTargetInputFocused()) {
    if (scanCatcherRef.value) {
      scanCatcherRef.value.focus();
    }
  }
};

// Your exact global click handler pattern from the working vanilla app
const handleWindowTapReclaim = (event) => {
  // If clicking a manual form input field, let focus transition natively
  if (event.target && event.target.tagName.toLowerCase() === 'input') {
    return;
  }
  // Wait 40ms for the DOM focus pointer to settle, then reclaim focus safely
  setTimeout(reclaimScannerFocus, 40);
};

const handleHardwareWedgeInput = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const rawScanString = scanCatcherRef.value.value.trim();
    scanCatcherRef.value.value = ''; // Instantly clear buffer for next scan

    if (!rawScanString) return;

    // Standard native browser alert window
    alert(`[ZEBRA WEDGED DETECTED]\nData: "${rawScanString}"`);
  }
};

// Reclaim scanner focus instantly when screen changes occur
watch(() => route.path, () => {
  setTimeout(reclaimScannerFocus, 80);
});

onMounted(() => {
  initWindowOverrides();
  
  // Reclaim focus initially on mount
  reclaimScannerFocus();

  // Attach your exact working click listener to the master document window
  window.addEventListener('click', handleWindowTapReclaim, true);
});

onUnmounted(() => {
  window.removeEventListener('click', handleWindowTapReclaim, true);
});
</script>

<style>
/* 
  Your exact working off-screen styling configuration from the vanilla app.
  This positions the element outside visible bounds so it doesn't disrupt 
  your user interface layouts.
*/
.zebra-hidden-guardian {
  position: fixed !important;
  opacity: 0 !important;
  pointer-events: none !important;
  left: -999px !important;
  top: 0 !important;
  width: 1px !important;
  height: 1px !important;
  z-index: -999999 !important;
  background: transparent !important;
  border: none !important;
}
</style>

