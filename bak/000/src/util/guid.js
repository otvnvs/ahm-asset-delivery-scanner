/**
 * Utility library to handle RFC 4122 Version 4 compliant GUID generation.
 */

/**
 * Generates a standard random 36-character UUID/GUID string.
 * Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * @returns {string} Compliant GUID string
 */
export function generateRandomGuid() {
  // Uses cryptographically secure browser algorithms if available, otherwise falls back to standard random pools
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

