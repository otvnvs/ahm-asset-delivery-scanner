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

// Persistent reference to match your vanilla instantiation variable
let scanCatcher = null;

/**
 * Checks if the picker is actively entering alphanumeric values into a form
 * group or configuring settings so we do not disrupt manual typing.
 */
const isUserManuallyTyping = () => {
  if (isWebcamScannerOpen.value) return true; // Yield to camera module

  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const tagName = activeEl.tagName.toLowerCase();
  
  // Explicitly identify real manual text entries inside your Vue form layouts
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    // If it's our scanner element, it doesn't count as manual user typing
    if (activeEl.id === 'hardwareScanCatcher') {
      return false;
    }
    return true; // Picker is typing in a configuration or delivery registration form
  }
  return false;
};

const reclaimScannerFocus = () => {
  if (!isUserManuallyTyping()) {
    if (scanCatcher) {
      scanCatcher.focus();
    }
  }
};

// Reclaims focus on click, exactly matching your vanilla event delegation layout
const handleWindowClickReclaim = (event) => {
  // If clicking an input directly, let focus transition natively without interruption
  if (event.target && (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea')) {
    return;
  }
  // Wait a split second for focus pointers to settle, then reclaim
  setTimeout(reclaimScannerFocus, 50);
};

const handleHardwareWedgeInput = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const rawScanString = scanCatcher.value.trim();
    scanCatcher.value = ''; // Flush immediate operational state

    if (!rawScanString) return;

    // Standard native browser alert prompt window
    alert(`[ZEBRA WEDGED DETECTED]\nData: "${rawScanString}"\nActive View Screen: ${route.path}`);

    processScannedBarcode(rawScanString);
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

// Reclaim scanner focus instantly during cross-view transition sweeps
watch(() => route.path, () => {
  setTimeout(reclaimScannerFocus, 100);
});

onMounted(() => {
  // 1. Programmatically construct the element exactly as your vanilla project did
  scanCatcher = document.createElement('input');
  scanCatcher.type = 'text';
  scanCatcher.id = 'hardwareScanCatcher';
  
  // 2. Assign the inputmode both as a property and as a structural attribute string
  scanCatcher.inputMode = 'none';
  scanCatcher.setAttribute('inputmode', 'none');
  
  // 3. Match your old working layout CSS rules precisely
  scanCatcher.style.position = 'fixed';
  scanCatcher.style.opacity = '0';
  scanCatcher.style.pointerEvents = 'none';
  scanCatcher.style.left = '-999px';
  scanCatcher.style.top = '0';
  scanCatcher.style.width = '1px';
  scanCatcher.style.height = '1px';
  scanCatcher.style.zIndex = '-999999';

  document.body.appendChild(scanCatcher);
  
  // 4. Attach raw listeners straight to the generated DOM node
  scanCatcher.addEventListener('keydown', handleHardwareWedgeInput);
  document.addEventListener('click', handleWindowClickReclaim, true);

  reclaimScannerFocus();

  // 1-second continuous focus safety background syncing loop
  window.zebraFocusStabilizer = setInterval(reclaimScannerFocus, 1000);
});

onUnmounted(() => {
  if (scanCatcher && document.body.contains(scanCatcher)) {
    scanCatcher.removeEventListener('keydown', handleHardwareWedgeInput);
    document.body.removeChild(scanCatcher);
  }
  document.removeEventListener('click', handleWindowClickReclaim, true);
  if (window.zebraFocusStabilizer) clearInterval(window.zebraFocusStabilizer);
});
</script>

<style>
.minimal-container {
  width: 100%;
  box-sizing: border-box;
}
</style>

