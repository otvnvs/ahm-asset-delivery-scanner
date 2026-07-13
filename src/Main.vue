<template>
  <div class="minimal-container">
    <router-view></router-view>
  </div>
  <CustomDialog />
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isWebcamScannerOpen } from './util/barcodeScanner.js';
import { store } from './util/store.js';

import { initWindowOverrides } from './components/dialog/useDialog.js';
import CustomDialog from './components/dialog/CustomDialog.vue';


const route = useRoute();
const router = useRouter();

// Persistent reference matching your vanilla initialization variable
let scanCatcher = null;

/**
 * Checks if the picker is actively entering values into standard form fields
 * or server options so we do not disrupt manual text layout loops.
 */
const isUserManuallyTyping = () => {
  if (isWebcamScannerOpen.value) return true; // Yield to camera module

  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const tagName = activeEl.tagName.toLowerCase();
  
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    if (activeEl.id === 'hardwareScanCatcher') {
      return false;
    }
    return true; // Picker is actively writing a manual form layout
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

const handleWindowClickReclaim = (event) => {
  if (event.target && (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea')) {
    return;
  }
  setTimeout(reclaimScannerFocus, 50);
};

const handleHardwareWedgeInput = (event) => {
  if (event.key === 'Enter') {
    //alert(`[ZEBRA WEDGED DETECTED]\nData: "${rawScanString}"\nActive View Screen: ${route.path}`);
    event.preventDefault();
    const rawScanString = scanCatcher.value.trim();
    scanCatcher.value = ''; // Instantly clear buffer for next rapid barcode scan

    if (!rawScanString) return;

    processScannedBarcode(rawScanString);
  }
};

//const processScannedBarcode = (barcodeString) => {
//  // Scenario 1: If scanning while on the registration screen, fill the input directly as before
//  if (route.path === '/register_delivery') {
//    const deliveryInput = document.querySelector('input[placeholder*="PO, STO, DC"]');
//    if (deliveryInput) {
//      deliveryInput.value = barcodeString;
//      deliveryInput.dispatchEvent(new Event('input', { bubbles: true }));
//    }
//    return;
//  }
//
//  // Scenario 2: Pull the current active shipment delivery from our global reactive cache
//  const cachedData = store.cache.entityLists['ActiveDelivery'];
//  if (!cachedData) {
//    console.warn('[ZEBRA HW] Scan canceled: No active delivery loaded in memory.');
//    return;
//  }
//  
//  const activeDoc = Array.isArray(cachedData) ? cachedData[0] : cachedData;
//  if (!activeDoc || !activeDoc.items) return;
//
//  // Search items matrix array to match by Article Code or physical Vendor EAN Barcode string
//  const matchedItem = activeDoc.items.find(item => {
//    return item.code === barcodeString || item.vendorId === barcodeString;
//  });
//
//  if (matchedItem) {
//    console.log(`[ZEBRA HARDWARE MATCH] Found product: ${matchedItem.description}. Updating counters...`);
//    
//    // 1. Directly increment the target element counter property in our reactive store
//    matchedItem.recptQty = (parseInt(matchedItem.recptQty, 10) || 0) + 1;
//
//    // 2. Force a programmatic layout swap straight to the interactive screen for that item
//    router.push({
//      path: '/receipt_item',
//      query: { articleCode: matchedItem.code }
//    });
//  } else {
//    console.warn(`[ZEBRA HARDWARE MATCH FAILURE] Code "${barcodeString}" does not belong to this delivery.`);
//  }
//};
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
    // 1. Directly increment the target element row data counter
    matchedItem.recptQty = (parseInt(matchedItem.recptQty, 10) || 0) + 1;

    // 2. Broadcast a global notification down to the DOM layer.
    // If the picker is currently resting on the receipt view screen, 
    // this event will bypass the router entirely and update the numbers live!
    window.dispatchEvent(new CustomEvent('zebra-hardware-scan-completed', {
      detail: { articleCode: matchedItem.code, newQty: matchedItem.recptQty }
    }));

    // 3. Keep the backup routing command intact for initial page warp transitions
    if (route.path !== '/receipt_item' || route.query.articleCode !== matchedItem.code) {
      router.push({
        path: '/receipt_item',
        query: { articleCode: matchedItem.code }
      });
    }
  }
};


// Reclaim scanner focus instantly during cross-view transition sweeps
watch(() => route.path, () => {
  setTimeout(reclaimScannerFocus, 100);
});

onMounted(() => {
  initWindowOverrides();
  // 1. Programmatically construct the element exactly as your vanilla project did
  scanCatcher = document.createElement('input');
  scanCatcher.type = 'text';
  scanCatcher.id = 'hardwareScanCatcher';
  
  // 2. Assign properties for maximum broad Android WebKit browser compatibility
  scanCatcher.inputMode = 'none';
  scanCatcher.setAttribute('inputmode', 'none');
  
  // 3. Match your vanilla project styling properties perfectly
  scanCatcher.style.position = 'fixed';
  scanCatcher.style.opacity = '0';
  scanCatcher.style.pointerEvents = 'none';
  scanCatcher.style.left = '-999px';
  scanCatcher.style.top = '0';
  scanCatcher.style.width = '1px';
  scanCatcher.style.height = '1px';
  scanCatcher.style.zIndex = '-999999';

  document.body.appendChild(scanCatcher);
  
  // 4. Attach listeners straight to the generated DOM node
  scanCatcher.addEventListener('keydown', handleHardwareWedgeInput);
  document.addEventListener('click', handleWindowClickReclaim, true);

  reclaimScannerFocus();

  // Continuous background focus safety synchronization checking loop
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

