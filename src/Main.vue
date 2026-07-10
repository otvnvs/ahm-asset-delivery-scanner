<template>
  <div class="minimal-container">
    <router-view></router-view>
  </div>
  
  <!-- 
    The exact physical input tag structure from your working vanilla JS project.
    Placed side-by-side with router-view to ensure it never drops out of the DOM.
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
import { initWindowOverrides } from './components/dialog/useDialog.js';
import { isWebcamScannerOpen } from './util/barcodeScanner.js';
import { store } from './util/store.js';

const route = useRoute();
const router = useRouter();
const scanCatcherRef = ref(null);

let continuousFocusInterval = null;
let trueSystemAlertRef = null;

/**
 * Creates a clean iframe reference to grab an un-hijacked copy of 
 * native window.alert, completely bypassing the CustomDialog promise timeline.
 */
const forceNativeAlertPopup = (messageText) => {
  if (!trueSystemAlertRef) {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      trueSystemAlertRef = iframe.contentWindow.alert;
    } catch (e) {
      trueSystemAlertRef = window.alert; // Fallback
    }
  }
  trueSystemAlertRef(messageText);
};

const isTargetInputFocused = () => {
  if (isWebcamScannerOpen.value) return true; // Camera QR stream pass

  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const tagName = activeEl.tagName.toLowerCase();
  
  // Whitelisted text field markers from your manual configuration pages
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

const handleWindowTapReclaim = (event) => {
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

    // 🚨 FORCED TRUE NATIVE WEBVIEW SYSTEM DIALOG POPUP 🚨
    forceNativeAlertPopup(`[ZEBRA WEDGED DETECTED]\nData: "${rawScanString}"\nActive View Screen: ${route.path}`);

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

watch(() => route.path, () => {
  setTimeout(reclaimScannerFocus, 80);
});

onMounted(() => {
alert("mounted");
  // Safe initialization of your dialog overrides layer
  initWindowOverrides();

  if (scanCatcherRef.value) {
    // Port both attributes to ensure the Android WebKit context locks soft layouts down
    scanCatcherRef.value.inputMode = 'none';
    scanCatcherRef.value.setAttribute('inputmode', 'none');
  }

  reclaimScannerFocus();

  window.addEventListener('click', handleWindowTapReclaim, true);
  continuousFocusInterval = setInterval(reclaimScannerFocus, 1000);
});

onUnmounted(() => {
  window.removeEventListener('click', handleWindowTapReclaim, true);
  if (continuousFocusInterval) clearInterval(continuousFocusInterval);
});
</script>

<style>
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

