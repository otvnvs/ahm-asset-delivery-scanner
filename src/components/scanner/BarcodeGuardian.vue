<template>
  <!-- 
    Using a transparent textarea completely eliminates the character-dropping issues.
    inputmode="none" keeps the soft layout keyboard permanently closed on Android.
  -->
  <textarea
    ref="guardianInputRef"
    v-model="scannedBuffer"
    class="zebra-hidden-guardian"
    autocomplete="off"
    inputmode="none"
    autofocus
    @keyup.enter.prevent="handleGlobalScan"
    @blur="handleBlurFallback"
  ></textarea>
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

const handleGlobalScan = () => {
  // Strip out any trailing newline symbols inserted by the rapid emulation layer
  const scannedBarcode = scannedBuffer.value.replace(/[\r\n]+/g, '').trim();
  scannedBuffer.value = ''; // Instantly clear the field so it's ready for the next box scan

  if (!scannedBarcode) return;

  console.log(`[ZEBRA SYSTEM CONTROL] Successfully captured code from hardware: ${scannedBarcode}`);

  const cachedData = store.cache.entityLists['ActiveDelivery'];
  if (!cachedData) {
    console.warn('[ZEBRA ROUTER] Scan rejected: No active delivery loaded in store memory.');
    return;
  }
  
  const activeDoc = Array.isArray(cachedData) ? cachedData[0] : cachedData;
  if (!activeDoc || !activeDoc.items) return;

  // Scan items to match against Article identifier or the physical Vendor EAN barcode string
  const matchedItem = activeDoc.items.find(item => {
    return item.code === scannedBarcode || item.vendorId === scannedBarcode;
  });

  if (matchedItem) {
    console.log(`[ZEBRA ROUTER] Match found for: ${matchedItem.description}. Redirecting...`);
    
    // Automatically increment the data counter row
    matchedItem.recptQty = (parseInt(matchedItem.recptQty, 10) || 0) + 1;

    // Force an immediate programmatic layout shift to your receipt view layout
    router.push({
      path: '/receipt_item',
      query: { articleCode: matchedItem.code }
    });
  } else {
    console.warn(`[ZEBRA ROUTER] Barcode "${scannedBarcode}" does not exist in active shipment manifest.`);
  }
};

// Re-enforce focus priority instantly when moving between router-view tabs
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
  left: -9999px;
  top: -9999px;
  width: 10px;
  height: 10px;
  opacity: 0;
  pointer-events: none;
  z-index: -9999;
  background: transparent;
  border: none;
  resize: none;
  overflow: hidden;
}
</style>

