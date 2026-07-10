<template>
  <div class="minimal-container">
    <router-view></router-view>
  </div>
  
  <!-- 
    The exact physical input tag structure that worked in your vanilla project.
    By rendering it inside Main.vue alongside the top-level router-view container,
    it remains safely mounted across all route jumps.
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
import { useRoute, useRouter } from 'vue-router';
import { isWebcamScannerOpen } from './util/barcodeScanner.js';
import { store } from './util/store.js';

const route = useRoute();
const router = useRouter();
const scanCatcherRef = ref(null);

let continuousFocusInterval = null;

/**
 * Checks if the picker is actively entering alphanumeric values into a form group
 * or configuring server connections so we don't disrupt text layouts.
 */
const isTargetInputFocused = () => {
  if (isWebcamScannerOpen.value) return true; // Yield to camera matrix

  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const tagName = activeEl.tagName.toLowerCase();
  
  // Whitelisted text element selectors from your manual config/registration setups
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

// Global click delegation loop matching your old project architecture exactly
const handleWindowTapReclaim = (event) => {
  // If clicking an input target row directly, let focus transition natively
  if (event.target && event.target.tagName.toLowerCase() === 'input') {
    return;
  }
  setTimeout(reclaimScannerFocus, 40);
};

const handleHardwareWedgeInput = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const rawScanString = scanCatcherRef.value.value.trim();
    scanCatcherRef.value.value = ''; // Flush immediately for subsequent rapid box scans

    if (!rawScanString) return;

    // 🚨 NATIVE TELEMETRY DIAGNOSTIC ALERT 🚨
    alert(`[ZEBRA WEDGED DETECTED]\nData: "${rawScanString}"\nActive View Screen: ${route.path}`);

    processScannedBarcode(rawScanString);
  }
};

const processScannedBarcode = (barcodeString) => {
  // If scanning while on the registration view, pop it inside the input target field
  if (route.path === '/register_delivery') {
    const deliveryInput = document.querySelector('input[placeholder*="PO, STO, DC"]');
    if (deliveryInput) {
      deliveryInput.value = barcodeString;
      deliveryInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  // Look up item context rows from active deliveries list memory cache
  const cachedData = store.cache.entityLists['ActiveDelivery'];
  if (!cachedData) return;
  
  const activeDoc = Array.isArray(cachedData) ? cachedData : cachedData;
  if (!activeDoc || !activeDoc.items) return;

  // Match the laser data string parameter to our active data row array models
  const matchedItem = activeDoc.items.find(item => {
    return item.code === barcodeString || item.vendorId === barcodeString;
  });

  if (matchedItem) {
    // Increment the captured receipt item quantities count
    matchedItem.recptQty = (parseInt(matchedItem.recptQty, 10) || 0) + 1;

    // Direct programmatic shift to your destination layout view screen
    router.push({
      path: '/receipt_item',
      query: { articleCode: matchedItem.code }
    });
  }
};

// Reclaim scanner cursor position instantly when cross-screen transitions happen
watch(() => route.path, () => {
  setTimeout(reclaimScannerFocus, 80);
});

onMounted(() => {
  initWindowOverrides();

  if (scanCatcherRef.value) {
    // Port both attributes to make sure the Android WebKit context locks soft layouts down
    scanCatcherRef.value.inputMode = 'none';
    scanCatcherRef.value.setAttribute('inputmode', 'none');
  }

  reclaimScannerFocus();

  // Attach global operational events directly to window root nodes
  window.addEventListener('click', handleWindowTapReclaim, true);
  
  // Continuous 1-second focus stabilization safety loop check
  continuousFocusInterval = setInterval(reclaimScannerFocus, 1000);
});

onUnmounted(() => {
  window.removeEventListener('click', handleWindowTapReclaim, true);
  if (continuousFocusInterval) clearInterval(continuousFocusInterval);
});
</script>

<style>
/* 
  Global styles mapping to your old project's CSS parameters.
  This positions the element safely off-screen.
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

