<template>
  <!-- 
    inputmode="none" tells Android explicitly NOT to pop up the soft keyboard.
    readonly prevents virtual keyboard trigger loops while still allowing manual focus scripts 
    and fast keystroke hardware injections to append character values.
  -->
  <input
    ref="guardianInputRef"
    :value="scannedBuffer"
    type="text"
    class="zebra-hidden-guardian"
    autocomplete="off"
    inputmode="none"
    autofocus
    @textInput="handleHardwareInput"
    @keydown="handleKeyDownCapture"
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

// Intercepts character streams typed by the high-speed laser hardware emulated keyboard
const handleKeyDownCapture = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleGlobalScan();
  } else if (event.key.length === 1) {
    // Append character chunks straight into our local memory string buffer
    scannedBuffer.value += event.key;
  }
};

// Fallback listener for embedded Android WebKit text insertion blocks
const handleHardwareInput = (event) => {
  if (event.data) {
    scannedBuffer.value += event.data;
  }
};

const handleGlobalScan = () => {
  const scannedBarcode = scannedBuffer.value.trim();
  scannedBuffer.value = ''; // Instantly wipe layout buffer arrays for the next laser scan sweep

  if (!scannedBarcode) return;

  const cachedData = store.cache.entityLists['ActiveDelivery'];
  if (!cachedData) return;
  
  const activeDoc = Array.isArray(cachedData) ? cachedData[0] : cachedData;
  if (!activeDoc || !activeDoc.items) return;

  // Match against Article code view data or Vendor EAN strings
  const matchedItem = activeDoc.items.find(item => {
    return item.code === scannedBarcode || item.vendorId === scannedBarcode;
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

