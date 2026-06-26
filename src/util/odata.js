import { store } from './store.js';

/**
 * High-performance, universal network fetch wrapper for standard OData commands.
 * Handles timeouts, header injections, and cross-origin basic authentication profiles.
 */
export async function odataFetch(endpointPath, options = {}) {
  const { odataUrl, username, password, networkTimeoutMs } = store.config;

  if (!odataUrl) {
    throw new Error('OData Target Endpoint URL is missing in system settings.');
  }

  // Build the clean absolute target address line
  const cleanBase = odataUrl.endsWith('/') ? odataUrl.slice(0, -1) : odataUrl;
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const absoluteUrl = `${cleanBase}${cleanPath}`;

  // Configure operational header maps
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  
  if (options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Basic Authentication credentials safely if provided
  if (username) {
    const encodedCredentials = btoa(`${username}:${password || ''}`);
    headers.set('Authorization', `Basic ${encodedCredentials}`);
  }

  // Abort controller logic mapping your exact custom timeout parameter
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), networkTimeoutMs || 5000);

  const fetchConfig = {
    ...options,
    headers,
    signal: controller.signal,
    mode: 'cors'
  };

  try {
    const response = await fetch(absoluteUrl, fetchConfig);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Server error encountered.'}`);
    }

    // Try parsing as JSON unless it's the raw metadata string context channel
    if (endpointPath.includes('$metadata')) {
      return await response.text();
    }
    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Network Timeout: Server failed to respond within ${networkTimeoutMs}ms.`);
    }
    throw error;
  }
}

/**
 * CORE TEST FUNCTION: Pings the backend metadata manifest schema file.
 * Used on the config view screen layer to verify end-to-end telemetry connections.
 */
export async function testODataConnection() {
  console.log(`[ODATA TEST] Initiating backend ping sequence...`);
  // Hits the metadata endpoint using the unified authentication wrapper engine
  const metadata = await odataFetch('/$metadata', { method: 'GET' });
  return {
    success: true,
    message: 'Connected successfully! Metadata schema parsed online.'
  };
}

