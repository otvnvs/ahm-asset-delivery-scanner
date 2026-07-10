import { ref } from 'vue';

export const isGlobalScanningActive = ref(true);
export const isWebcamScannerOpen = ref(false);

/**
 * Utility function to determine if the user is currently typing
 * in a real editable field anywhere in the application.
 */
export function isUserEditing() {
  // If the webcam or QR reader module is active, do NOT allow the background loop to steal focus
  if (isWebcamScannerOpen.value) {
    return true; 
  }

  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const tagName = activeEl.tagName.toLowerCase();
  
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    if (activeEl.classList.contains('zebra-hidden-guardian')) {
      return false;
    }
    return true;
  }
  
  return false;
}
