import { ref } from 'vue';

export const isGlobalScanningActive = ref(true);

/**
 * Utility function to determine if the user is currently typing
 * in a real editable field anywhere in the application.
 */
export function isUserEditing() {
  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const tagName = activeEl.tagName.toLowerCase();
  
  // Do not steal focus if user is filling forms or tweaking configurations
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    // Exception: If it is our own hidden guardian input, it doesn't count as user editing
    if (activeEl.classList.contains('zebra-hidden-guardian')) {
      return false;
    }
    return true;
  }
  
  return false;
}

