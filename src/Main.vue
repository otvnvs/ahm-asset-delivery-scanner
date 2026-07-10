<template>
  <div class="minimal-container">
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isWebcamScannerOpen } from './util/barcodeScanner.js';
import { store } from './util/store.js';

const route = useRoute();
const router = useRouter();

// Dedicated local memory buffers to assemble high-speed incoming key strings
let keystrokeBuffer = '';
let lastKeyTimestamp = 0;

/**
 * Checks if the picker is intentionally typing inside a real manual form field
 * or setting up application configurations so we do not disrupt text input.
 */
const isUserManuallyEditing = () => {
  if (isWebcamScannerOpen.value) return true; // Camera QR stream pass

  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const tagName = activeEl.tagName.toLowerCase();
  
  // Whitelisted user-editable text entry components
  const interactiveInputs = ['inputDeliveryNum', 'inputSscc', 'inputRef', 'inputEditQty'];

  if (interactiveInputs.includes(activeEl.id) || 
      activeEl.className?.includes('form-input') || 
      tagName === 'textarea' || 
      tagName === 'select') {
    return true;
  }
  return false;
};

const handleGlobalKeystrokeCapture = (event) => {
  // Rule 1: Abort if the user has focused a visible input field to type manually
  if (isUserManuallyEditing()) {
    return;
  }

  const now = Date.now();

  // Reset the buffer if the time gap since the last keystroke is too long.
  // Hardware lasers in keyboard mode stream characters nearly instantly (typically under 15ms per character).
  // If a picker types by hand with large delays, this protects application states.
  if (now - lastKeyTimestamp > 200) {
    keystrokeBuffer = '';
  }
  lastKeyTimestamp = now;

  // Rule 2: Capture completion when the laser fires the terminating Enter command sequence
  if (event.key === 'Enter') {
    event.preventDefault();
    const finalizedBarcode = keystrokeBuffer.trim();
    keystrokeBuffer = ''; // Flush immediate buffer

    if (finalizedBarcode) {
      // 🚨 STANDARD NATIVE BROWSER ALERT POPUP 🚨
      alert(`[ZEBRA WEDGED DETECTED]\nData: "${finalizedBarcode}"\nActive View Screen: ${route.path}`);

      processScannedBarcode(finalizedBarcode);
    }
    return;
  }

  // Rule 3: Append raw single alphanumeric characters, ignoring control keys (Shift, CapsLock, Alt)
  if (event.key.length === 1) {
    keystrokeBuffer += event.key;
  }
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
  // Listen directly on the root window node using capturing mode (true)
  window.addEventListener('keydown', handleGlobalKeystrokeCapture, true);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeystrokeCapture, true);
});
</script>

<style>
/* Clean layouts wrapper */
.minimal-container {
  width: 100%;
  box-sizing: border-box;
}
</style>

