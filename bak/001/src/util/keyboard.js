/**
 * Keyboard Shortcut Listener Module
 * Listens for Alt + R to reload the current page.
 */

// Handles the keydown event to check for Alt + R
const handleKeyDown = (event) => {
  // Check if Alt key is held and 'r' or 'R' is pressed
  if (event.ctrlKey && (event.key === 'r' || event.key === 'R')) {
    event.preventDefault(); // Prevent default browser behavior if any
    window.location.reload(); // Reload the current page
  }
};

/**
 * Registers the Alt + R keyboard shortcut listener.
 */
export const register = () => {
  window.addEventListener('keydown', handleKeyDown);
};

/**
 * Unregisters the Alt + R keyboard shortcut listener.
 */
export const unregister = () => {
  window.removeEventListener('keydown', handleKeyDown);
};
register();
