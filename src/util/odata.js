import { store } from './store.js';

// In-memory cache for the validated token to prevent redundant network handshakes
let cachedCsrfToken = null;

// utility function to get csrf url
const getCsrfUrl = (str, u = new URL(str)) => `${u.origin}${u.pathname.slice(0, u.pathname.lastIndexOf('/', u.pathname.length - 2) + 1)}`;


/**
 * Helper Utility: Performs a standard GET handshake with the SAP Gateway root
 * to fetch and store a fresh operational X-CSRF-Token.
 */
async function fetchSAPCsrfToken(absoluteBaseUrl) {
  console.log('[SAP CSRF ENGINE] Handshaking with Gateway using GET to fetch a fresh token...');

  absoluteBaseUrl=getCsrfUrl(absoluteBaseUrl)
  
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
    const response = await fetch(`${absoluteBaseUrl}`, {
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
	/*
// Updated Default State
const defaultState = {
  user: { name: 'User', isLoggedIn: false },
  appPin: null,
  config: {
    baseHost: 'https://s4hana2025.professorsoft.com:44300', // New: Common Host
    poPath: '/sap/opu/odata4/sap/zgr_ui_poscan_o4/srvd_a2x/sap/zgr_ui_poscan_o4/0001/', // New: Register Service
    grPath: '/sap/opu/odata4/sap/zgr_grdoc_api/srvd_a2x/sap/zgr_ui_grdoc_o4/0001', // New: Goods Receipt Service
    username: '',
    password: '',
    networkTimeoutMs: 5000,
    useDummyData: false,
    sapClient: '100' // Optional: Added for completeness
  },
  cache: {
    metadataRawXml: '',
    entityLists: {}
  },
  simulatedOffline: false
};

	 */
  const { baseHost, username, password, networkTimeoutMs, useDummyData } = store.config;

  if (!baseHost)throw new Error('OData Endpoint missing in system settings.');
  if (!username)throw new Error('OData Username missing in system settings.');
  if (!password)throw new Error('OData Password missing in system settings.');

  // --- LOCAL SERVICE WORKER INTERCEPT FOR DUMMY DATA OFFLINE MODE ---
  if (useDummyData) {
    console.warn(`[SW INTERCEPT ACTIVE] Request passing through to worker layer proxy.`);
  }

  const cleanBase = baseHost.endsWith('/') ? baseHost.slice(0, -1) : baseHost;
  let cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  
  // SAP Gateway v4 frequently mandates an explicit format tracking parameter on standard queries
//  if (!cleanPath.includes('$metadata') && !cleanPath.includes('$format')) {
//    const separator = cleanPath.includes('?') ? '&' : '?';
//    cleanPath = `${cleanPath}${separator}$format=json`;
//  }
// FIX: Do not append $format=json if it is an SAP Bound Action namespace containing dots
if (!cleanPath.includes('$metadata') && !cleanPath.includes('$format') && !cleanPath.includes('v0001.')) {
    const separator = cleanPath.includes('?') ? '&' : '?';
    cleanPath = `${cleanPath}${separator}$format=json`;
}

  const absoluteUrl = `${cleanBase}${cleanPath}`;
  console.warn("absoluteUrl:"+absoluteUrl);
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
      await fetchSAPCsrfToken(absoluteUrl)
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
      const freshToken = await fetchSAPCsrfToken(absoluteUrl);
      
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

