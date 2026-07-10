<template>
  <!-- Completely headless carrier. We match your vanilla layout exactly -->
  <div class="zebra-headless-carrier" aria-hidden="true"></div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { store } from '../../util/store.js';
import { isWebcamScannerOpen } from '../../util/barcodeScanner.js';

const router = useRouter();
const route = useRoute();

// Maintain a stable persistent reference to the native DOM node
let scanCatcher = null;

const reclaimScannerFocus = () => {
  // Respect active webcam scan streams or configuration fields
  if (isWebcamScannerOpen.value) return;

  const activeEl = document.activeElement;
  
  // Whitelisted manual fields from your new Vue project forms where focus shouldn't be stolen
  const interactiveInputTags = ['inputDeliveryNum', 'inputSscc', 'inputRef', 'inputEditQty'];
  
  if (activeEl) {
    const tagName = activeEl.tagName.toLowerCase();
    
    // Check custom component IDs or standard form fields
    if (interactiveInputTags.includes(activeEl.id) || 
        activeEl.className?.includes('form-input') || 
        tagName === 'textarea' || 
        activeEl.id === 'hardwareScanCatcher') {
      return; // Safe pass for manual typing
    }
  }

  // Force programmatic focus onto our hardware wedge target receiver input
  if (scanCatcher) {
    scanCatcher.focus();
  }
};

const handleGlobalClick = (event) => {
  // If the worker taps a configuration entry, let the thread process focus, then reclaim
  if (event.target && event.target.tagName.toLowerCase() === 'input') {
    return;
  }
  setTimeout(reclaimScannerFocus, 50);
};

const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const rawScanString = scanCatcher.value.trim();
    scanCatcher.value = ''; // Instantly flush character buffer

    if (!rawScanString) return;

    // 🚨 DIAGNOSTIC TELEMETRY ALERT MATCHING YOUR REQ 🚨
    alert(`[ZEBRA HARDWARE CAPTURED]\nScanned String: "${rawScanString}"\nCurrent Vue Route: ${route.path}`);

    processScannedPayload(rawScanString);
  }
};

const processScannedPayload = (barcode) => {
  // Rule 1: Handle delivery registration screens exactly as your vanilla project did
  if (route.path === '/register_delivery') {
    const deliveryInput = document.querySelector('input[placeholder*="PO, STO, DC"]');
    if (deliveryInput) {
      deliveryInput.value = barcode;
      // Dispatch standard input change events so Vue's internal reactive trackers accept the change
      deliveryInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  // Rule 2: Inspect active delivery datasets
  const cachedData = store.cache.entityLists['ActiveDelivery'];
  if (!cachedData) return;
  
  const activeDoc = Array.isArray(cachedData) ? cachedData : cachedData;
  if (!activeDoc || !activeDoc.items) return;

  // Search items comparing with code fields or normalized Vendor EAN strings (CartonEAN attributes)
  const matchedItem = activeDoc.items.find(item => {
    return item.code === barcode || item.vendorId === barcode;
  });

  if (matchedItem) {
    // Increment product selection line item counter
    matchedItem.recptQty = (parseInt(matchedItem.recptQty, 10) || 0) + 1;

    // Move view path straight onto your destination screen layout view
    router.push({
      path: '/receipt_item',
      query: { articleCode: matchedItem.code }
    });
  }
};

// Re-evaluate focus targets instantly during cross-view transition sweeps
watch(() => route.path, () => {
  setTimeout(reclaimScannerFocus, 100);
});

onMounted(() => {
  // Programmatically construct and append the element exactly as your vanilla JS project did
  scanCatcher = document.createElement('input');
  scanCatcher.type = 'text';
  scanCatcher.id = 'hardwareScanCatcher';
  
  // Set properties both programmatically and via attribute descriptors for broad WebKit compatibility
  scanCatcher.inputMode = 'none';
  scanCatcher.setAttribute('inputmode', 'none');
  
  // Match your working vanilla CSS parameters exactly
  scanCatcher.style.position = 'fixed';
  scanCatcher.style.opacity = '0';
  scanCatcher.style.pointerEvents = 'none';
  scanCatcher.style.left = '-999px';
  scanCatcher.style.top = '0';
  scanCatcher.style.width = '1px';
  scanCatcher.style.height = '1px';
  scanCatcher.style.zIndex = '-99999';

  document.body.appendChild(scanCatcher);
  
  // Bind listeners
  scanCatcher.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', handleGlobalClick, true);

  reclaimScannerFocus();

  // Unified background synchronization fallback loop tracker
  window.zebraFocusLoop = setInterval(reclaimScannerFocus, 1000);
});

onUnmounted(() => {
  // Clean up references cleanly during hot-reload iterations
  if (scanCatcher && document.body.contains(scanCatcher)) {
    scanCatcher.removeEventListener('keydown', handleKeyDown);
    document.body.removeChild(scanCatcher);
  }
  document.removeEventListener('click', handleGlobalClick, true);
  if (window.zebraFocusLoop) clearInterval(window.zebraFocusLoop);
});
</script>

<style scoped>
.zebra-headless-carrier {
  display: none;
}
</style>

