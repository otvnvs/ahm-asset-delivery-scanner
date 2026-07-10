<template>
  <div class="minimal-container">
    <router-view></router-view>
  </div>
  
  <!-- 
    We position the input inside the active screen layout bounds (top: 0, left: 0),
    making it fully visible to the Android WebKit engine so it accepts high-speed injections.
    By matching the font and background color to your app's dark theme surface variables,
    and shrinking it to 1px with no borders, it remains completely invisible to human eyes.
  -->
  <input
    id="hardwareScanCatcher"
    ref="scanCatcherRef"
    type="text"
    class="zebra-hardware-receiver"
    autocomplete="off"
    @keydown="handleHardwareWedgeInput"
  />
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { initWindowOverrides } from './components/dialog/useDialog.js';
import { isWebcamScannerOpen } from './util/barcodeScanner.js';

const route = useRoute();
const scanCatcherRef = ref(null);
let continuousFocusInterval = null;

const isTargetInputFocused = () => {
  if (isWebcamScannerOpen.value) return true;

  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const tagName = activeEl.tagName.toLowerCase();
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
  // Capture when the Zebra hardware wedge slams the terminal Enter command sequence
  if (event.key === 'Enter') {
    event.preventDefault();
    const rawScanString = scanCatcherRef.value.value.trim();
    scanCatcherRef.value.value = ''; // Instantly clear the field for the next scan

    if (!rawScanString) return;

    // HARDWARE SUCCESS ALERT
    alert(`[ZEBRA WEDGED DETECTED]\nData: "${rawScanString}"`);
  }
};

watch(() => route.path, () => {
  setTimeout(reclaimScannerFocus, 80);
});

onMounted(() => {
  initWindowOverrides();
  
  if (scanCatcherRef.value) {
    // Disable the virtual on-screen keyboard layout entirely
    scanCatcherRef.value.inputMode = 'none';
    scanCatcherRef.value.setAttribute('inputmode', 'none');
  }

  reclaimScannerFocus();

  window.addEventListener('click', handleWindowTapReclaim, true);
  
  // Fast 250ms focus loop to ensure the laser catcher stays locked and focused
  continuousFocusInterval = setInterval(reclaimScannerFocus, 250);
});

onUnmounted(() => {
  window.removeEventListener('click', handleWindowTapReclaim, true);
  if (continuousFocusInterval) clearInterval(continuousFocusInterval);
});
</script>

<style>
/* 
  Camouflage visibility layout strategy:
  Instead of hiding it off-screen where WebKit disables multi-character hardware streams,
  we mount it right at the top left corner of the screen layout wrapper but shrink it down
  to 1px and make all text and colors match your exact theme background.
*/
.zebra-hardware-receiver {
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 1 !important;
  background-color: #121214 !important; /* Matches your --bg-color exactly */
  color: #121214 !important;            /* Matches your --bg-color exactly */
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
  z-index: -999999 !important;
  pointer-events: none !important;
}
</style>

