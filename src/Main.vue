<template>
  <div class="minimal-container">
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isWebcamScannerOpen } from './util/barcodeScanner.js';
import { store } from './util/store.js';

const route = useRoute();
const router = useRouter();

// Memory registries to capture high-speed sequential characters
let hardwareBufferString = '';
let lastKeystrokeTime = 0;
let samsungIdleTimer = null;

/**
 * Checks if the warehouse picker is intentionally typing inside a real 
 * form field so we do not steal or disrupt intentional text input loops.
 */
const isUserManuallyEditing = () => {
  if (isWebcamScannerOpen.value) return true; // Camera QR pass

  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const tagName = activeEl.tagName.toLowerCase();
  const manualInputs = ['inputDeliveryNum', 'inputSscc', 'inputRef', 'inputEditQty'];

  if (manualInputs.includes(activeEl.id) || 
      activeEl.className?.includes('form-input') || 
      tagName === 'textarea' || 
      tagName === 'select') {
    return true; // Picker is filling out a manual form field
  }
  return false;
};

// Root-level capture loop
const handleRootKeystroke = (event) => {
  // Abort instantly if the user is typing inside an official manual text box
  if (isUserManuallyEditing()) return;

  const timestamp = Date.now();

  // Reset the data buffer array if the gap since the last keystroke is too long.
  // Both hardware lasers and fast finger typing send characters within short intervals.
  // If the worker walks away or types slowly, this clears the buffer safely.
  if (timestamp - lastKeystrokeTime > 250) {
    hardwareBufferString = '';
  }
  lastKeystrokeTime = timestamp;

  // Track completion channel A: The hardware laser fires a terminating Enter command sequence
  if (event.key === 'Enter') {
    event.preventDefault();
    if (samsungIdleTimer) clearTimeout(samsungIdleTimer);
    commitCapturedBuffer();
    return;
  }

  // Catch single characters (letters/numbers) ignoring function keys (Shift, Ctrl, Alt)
  if (event.key.length === 1) {
    hardwareBufferString += event.key;

    // Track completion channel B: Manual fast Samsung typing fallback tracker
    // If you type fast and pause for 300ms without pressing Enter, it evaluates the string automatically!
    if (samsungIdleTimer) clearTimeout(samsungIdleTimer);
    samsungIdleTimer = setTimeout(() => {
      commitCapturedBuffer();
    }, 300);
  }
};

const commitCapturedBuffer = () => {
  const finalizedBarcode = hardwareBufferString.trim();
  hardwareBufferString = ''; // Immediately clear buffer for the next scan sequence

  if (!finalizedBarcode) return;

  // 🚨 STANDARD SYNCHRONOUS BROWSER DIALOG POPUP 🚨
  alert(`[ZEBRA WEDGED DETECTED]\nData: "${finalizedBarcode}"\nActive View Screen: ${route.path}`);

  processScannedBarcode(finalizedBarcode);
};

const processScannedBarcode = (barcodeString) => {
  if (route.path === '/register_delivery') {
    const deliveryInput = document.querySelector('input[placeholder*="PO, STO, DC"]');
    if (deliveryInput) {
      deliveryInput.value = barcodeString;
      deliveryInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  const cachedData = store.cache.entityLists['ActiveDelivery'];
  if (!cachedData) return;
  
  const activeDoc = Array.isArray(cachedData) ? cachedData : cachedData;
  if (!activeDoc || !activeDoc.items) return;

  const matchedItem = activeDoc.items.find(item => {
    return item.code === barcodeString || item.vendorId === barcodeString;
  });

  if (matchedItem) {
    matchedItem.recptQty = (parseInt(matchedItem.recptQty, 10) || 0) + 1;
    router.push({
      path: '/receipt_item',
      query: { articleCode: matchedItem.code }
    });
  }
};

onMounted(() => {
  // Bind directly to the master window node using Event Capturing mode (true flag)
  // This interceptor will catch key strokes BEFORE any router grid card can block it.
  window.addEventListener('keydown', handleRootKeystroke, true);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleRootKeystroke, true);
  if (samsungIdleTimer) clearTimeout(samsungIdleTimer);
});
</script>

<style>
.minimal-container {
  width: 100%;
  box-sizing: border-box;
}
</style>

