<template>
  <input
    ref="guardianInputRef"
    v-model="scannedBuffer"
    type="text"
    class="zebra-hidden-guardian"
    autocomplete="off"
    autofocus
    @keyup.enter="handleGlobalScan"
    @blur="handleBlurFallback"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../../util/store.js';
import { isGlobalScanningActive, isUserEditing } from '../../util/barcodeScanner.js';

const router = useRouter();
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
  const scannedBarcode = scannedBuffer.value.trim();
  scannedBuffer.value = ''; // Clear immediately for the next rapid hardware trigger

  if (!scannedBarcode) return;

  // 1. Extract the active delivery document from our global cache store
  const cachedData = store.cache.entityLists['ActiveDelivery'];
  if (!cachedData) {
    console.warn('[SCAN INTERCEPT] No active delivery document loaded in memory.');
    return;
  }
  
  const activeDoc = Array.isArray(cachedData) ? cachedData[0] : cachedData;
  if (!activeDoc || !activeDoc.items) return;

  // 2. Scan the item matrix array to match by Article Code or Vendor EAN Barcode
  const matchedItem = activeDoc.items.find(item => {
    return item.code === scannedBarcode || item.vendorId === scannedBarcode;
  });

  if (matchedItem) {
    console.log(`[ZEBRA TARGET INTERCEPT] Match found: ${matchedItem.code}. Incrementing quantity and routing...`);
    
    // 3. Directly increment the tracking counter in our reactive state
    matchedItem.recptQty = (parseInt(matchedItem.recptQty, 10) || 0) + 1;

    // 4. Force a programmatic route swap straight to the Receipt Item view for that item
    router.push({
      path: '/receipt_item',
      query: { articleCode: matchedItem.code }
    });
  } else {
    console.warn(`[ZEBRA TARGET INTERCEPT] Scanned code "${scannedBarcode}" does not match any items in this delivery.`);
  }
};

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
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}
</style>

