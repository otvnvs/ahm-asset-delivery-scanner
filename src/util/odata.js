import { store } from './store.js';

// In-memory cache for the validated token to prevent redundant network handshakes
let cachedCsrfToken = null;

/**
 * Helper Utility: Performs a standard GET handshake with the SAP Gateway root
 * to fetch and store a fresh operational X-CSRF-Token.
 */
async function fetchSAPCsrfToken(absoluteBaseUrl) {
  console.log('[SAP CSRF ENGINE] Handshaking with Gateway using GET to fetch a fresh token...');
  
  const headers = new Headers();
  headers.set('X-CSRF-Token', 'Fetch');
  headers.set('Accept', 'application/json');

  if (store.config.username) {
    const encodedCredentials = btoa(`${store.config.username}:${store.config.password || ''}`);
    headers.set('Authorization', `Basic ${encodedCredentials}`);
  }

  try {
    // FIXED: Switched from HEAD to a standard GET against the root service document (/)
    // This is incredibly lightweight and allowed by all standard SAP security profiles
    const response = await fetch(`${absoluteBaseUrl}/`, {
      method: 'GET',
      headers: headers,
      mode: 'cors'
    });

    const token = response.headers.get('x-csrf-token');
    if (!token) {
      console.warn('[SAP CSRF ENGINE] Server response was successful, but no X-CSRF-Token header was returned.');
      return null;
    }

    cachedCsrfToken = token;
    console.log('[SAP CSRF ENGINE] Token fetched and cached successfully via GET handshake.');
    return cachedCsrfToken;
  } catch (error) {
    console.error('[SAP CSRF ENGINE] GET handshake token request failed to execute:', error);
    return null;
  }
}

/**
 * High-performance network fetch wrapper configured specifically for SAP Gateway pipelines.
 */
export async function odataFetch(endpointPath, options = {}) {
  const { odataUrl, username, password, networkTimeoutMs, useDummyData } = store.config;

  if (!odataUrl) {
    throw new Error('OData Target Endpoint URL is missing in system settings.');
  }

  // --- LOCAL SERVICE WORKER INTERCEPT FOR DUMMY DATA OFFLINE MODE ---
  if (useDummyData) {
    console.warn(`[SW INTERCEPT ACTIVE] Request passing through to worker layer proxy.`);
  }

  const cleanBase = odataUrl.endsWith('/') ? odataUrl.slice(0, -1) : odataUrl;
  let cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  
  // SAP Gateway v4 frequently mandates an explicit format tracking parameter on standard queries
  if (!cleanPath.includes('$metadata') && !cleanPath.includes('$format')) {
    const separator = cleanPath.includes('?') ? '&' : '?';
    cleanPath = `${cleanPath}${separator}$format=json`;
  }

  const absoluteUrl = `${cleanBase}${cleanPath}`;
  const headers = new Headers(options.headers || {});
  
  // Format configurations to resolve 406 Not Acceptable blockers on structural schemas
  if (cleanPath.includes('$metadata')) {
    headers.set('Accept', 'application/xml, text/xml, */*');
  } else {
    headers.set('Accept', 'application/json');
    if (options.method && options.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }
  }

  // Inject standard basic authentication credentials layer
  if (username) {
    const encodedCredentials = btoa(`${username}:${password || ''}`);
    headers.set('Authorization', `Basic ${encodedCredentials}`);
  }

  // --- AUTOMATIC SAP CSRF SECURE HEADER HANDLING PIPELINE ---
  const isModifyingRequest = options.method && options.method !== 'GET' && options.method !== 'HEAD';
  
  if (isModifyingRequest && !useDummyData) {
    // 1. Fetch a fresh token if the local in-memory cache is empty
    if (!cachedCsrfToken) {
      await fetchSAPCsrfToken(cleanBase);
    }
    
    // 2. Append the valid token to the outbound operation payload header group
    if (cachedCsrfToken) {
      headers.set('X-CSRF-Token', cachedCsrfToken);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), networkTimeoutMs || 5000);

  let fetchConfig = {
    ...options,
    headers,
    signal: controller.signal,
    mode: 'cors'
  };

  try {
    let response = await fetch(absoluteUrl, fetchConfig);

    // --- RECOVERY MECHANISM: RETRY ON EXPIRED TOKEN TIMEOUTS ---
    if (response.status === 403 && isModifyingRequest && !useDummyData) {
      console.warn('[SAP CSRF ENGINE] Modifying request failed with HTTP 403. Token may have expired. Retrying with a fresh token...');
      
      // Clear expired token and fetch a new one
      cachedCsrfToken = null;
      const freshToken = await fetchSAPCsrfToken(cleanBase);
      
      if (freshToken) {
        headers.set('X-CSRF-Token', freshToken);
        fetchConfig.headers = headers;
        
        // Fire the exact operation a second time seamlessly
        response = await fetch(absoluteUrl, fetchConfig);
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText || 'SAP Gateway Error'}`);
    }

    // Return text for XML metadata schemas, parse objects for application json datasets
    if (cleanPath.includes('$metadata')) {
      return await response.text();
    }
    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Network Timeout: SAP server failed to respond within ${networkTimeoutMs}ms.`);
    }
    throw error;
  }
}

/**
 * Connection diagnostic test function wrapper
 */
export async function testODataConnection() {
  console.log(`[SAP DIAGNOSTIC] Pinging metadata schema address line...`);
  const xmlPayload = await odataFetch('/$metadata', { method: 'GET' });
  
  if (xmlPayload && xmlPayload.includes('Edmx')) {
    return {
      success: true,
      message: 'Connected to SAP S/4HANA successfully! Metadata schema loaded.'
    };
  }
  throw new Error('Invalid metadata format returned from SAP server gateway.');
}

