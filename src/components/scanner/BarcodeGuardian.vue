<template>
  <!-- No invisible inputs to fight against Android OS keyboard layouts -->
  <div class="zebra-headless-guardian" aria-hidden="true"></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../../util/store.js';
import { isUserEditing } from '../../util/barcodeScanner.js';

const router = useRouter();

// Dedicated local memory registry array to catch fast incoming individual keys
let keystrokeBuffer = '';
let lastKeyTimestamp = 0;

const handleGlobalKeystroke = (event) => {
  // Rule 1: Abort if the operator is intentionally interacting with an editable field
  if (isUserEditing()) {
    return;
  }

  const now = Date.now();

  // Reset the buffer if the time gap since the last keystroke is too long.
  // Hardware laser emulation types characters nearly instantaneously (typically under 15ms per char).
  // If a picker types by hand with large delays, this protects layout loops.
  if (now - lastKeyTimestamp > 250) {
    keystrokeBuffer = '';
  }
  lastKeyTimestamp = now;

  // Rule 2: Capture completion when the laser fires the terminating Enter sequence
  if (event.key === 'Enter') {
    event.preventDefault();
    const finalizedBarcode = keystrokeBuffer.trim();
    keystrokeBuffer = ''; // Flush immediate operational state

    if (finalizedBarcode) {
      // 🚨 DIAGNOSTIC WINDOW TARGET ALERT 🚨
      alert(`[ZEBRA WINDOW INTERCEPTED]\nCode: "${finalizedBarcode}"`);

      executeGlobalRoutingPipeline(finalizedBarcode);
    }
    return;
  }

  // Rule 3: Append raw alphanumeric character strings ignoring command keys (Shift, Alt, etc.)
  if (event.key.length === 1) {
    keystrokeBuffer += event.key;
  }
};

const executeGlobalRoutingPipeline = (scannedBarcode) => {
  const cachedData = store.cache.entityLists['ActiveDelivery'];
  if (!cachedData) return;
  
  const activeDoc = Array.isArray(cachedData) ? cachedData : cachedData;
  if (!activeDoc || !activeDoc.items) return;

  // Match scanned code against Article Number string or physical Vendor EAN barcode attributes
  const matchedItem = activeDoc.items.find(item => {
    return item.code === scannedBarcode || item.vendorId === scannedBarcode;
  });

  if (matchedItem) {
    // Automatically increment the receipt item line quantity counters
    matchedItem.recptQty = (parseInt(matchedItem.recptQty, 10) || 0) + 1;

    // Shift route focus cleanly straight to your destination screen layout
    router.push({
      path: '/receipt_item',
      query: { articleCode: matchedItem.code }
    });
  } else {
    console.warn(`[ZEBRA MASTER CONTROL] Scanned item context "${scannedBarcode}" not in manifest rows.`);
  }
};

onMounted(() => {
  // Register the event listener directly on the master window node
  window.addEventListener('keydown', handleGlobalKeystroke, true);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeystroke, true);
});
</script>

<style scoped>
.zebra-headless-guardian {
  display: none;
}
</style>

