<template>
  <!--
    Using a standard text input with an internal change/input listener as a secondary catch mechanism
  -->
  <input
    ref="guardianInputRef"
    v-model="scannedBuffer"
    type="text"
    class="zebra-hidden-guardian"
    autocomplete="off"
    inputmode="none"
    autofocus
    @keydown="handleKeyDown"
    @blur="handleBlurFallback"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { store } from '../../util/store.js';
import { isGlobalScanningActive, isUserEditing } from '../../util/barcodeScanner.js';

const router = useRouter();
const route = useRoute();
const guardianInputRef = ref(null);
const scannedBuffer = ref('');
let focusCheckInterval = null;

const enforceFocus = () => {
  if (isGlobalScanningActive.value && !isUserEditing()) {
    guardianInputRef.value?.focus();
  }
};

const handleBlurFallback = () => {
  setTimeout(enforceFocus, 50);
};

// Captures fast hardware emulated keyboard inputs
const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleGlobalScan();
  }
};

const handleGlobalScan = () => {
  const scannedBarcode = scannedBuffer.value.trim();
  scannedBuffer.value = ''; // Instantly clear buffer for subsequent rapid scans

  if (!scannedBarcode) {
    alert("Zebra Guardian triggered, but the captured barcode text buffer was empty.");
    return;
  }

  // HARDWARE TELEMETRY DIAGNOSTIC ALERT
  // This will display exactly what text strings are passing through the system
  alert(`[ZEBRA HARDWARE DETECTED]\nScanned Code: "${scannedBarcode}"\nActive View Screen: ${route.path}`);

  const cachedData = store.cache.entityLists['ActiveDelivery'];
  if (!cachedData) {
    console.warn('[ZEBRA ROUTER] Scan rejected: No active delivery loaded.');
    return;
  }
  
  const activeDoc = Array.isArray(cachedData) ? cachedData : cachedData;
  if (!activeDoc || !activeDoc.items) return;

  const matchedItem = activeDoc.items.find(item => {
    return item.code === scannedBarcode || item.vendorId === scannedBarcode;
  });

  if (matchedItem) {
    matchedItem.recptQty = (parseInt(matchedItem.recptQty, 10) || 0) + 1;
    router.push({
      path: '/receipt_item',
      query: { articleCode: matchedItem.code }
    });
  } else {
    console.warn(`[ZEBRA ROUTER] Barcode "${scannedBarcode}" doesn't match items in this delivery list.`);
  }
};

watch(() => route.path, () => {
  setTimeout(enforceFocus, 100);
});

onMounted(() => {
  enforceFocus();
  focusCheckInterval = setInterval(enforceFocus, 1000);
});

onUnmounted(() => {
  if (focusCheckInterval) clearInterval(focusCheckInterval);
});
</script>

<style scoped>
.zebra-hidden-guardian {
  position: fixed;
  left: 0;
  top: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  z-index: -99999;
  background: transparent;
  border: none;
}
</style>

