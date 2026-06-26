import { store, storeActions } from './store.js';
import { parseODataMetadata, parseEntityValidationRules } from './odata.js';

/**
 * Tests connection authenticity against a target SAP OData endpoint 
 * by requesting its service declaration XML configuration profile sheet ($metadata).
 * 
 * @param {string} baseUrl - The base OData url entered by the user
 * @param {string} username - Authentication profile username
 * @param {string} password - Authentication profile password
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function testODataConnection(baseUrl, username, password) {
  try {
    // 1. Clean up potential trailing slashes and append the $metadata resource indicator cleanly
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    const targetUrl = `${cleanUrl}/$metadata`;

    console.log(`[SAP SERVICE] Dispatching connection handshake request to: ${targetUrl}`);

    // 2. Generate standard HTTP Basic Authentication tokens safely inside browser loops
    const credentials = btoa(`${username}:${password}`);

    const timeoutLimit = store.config?.networkTimeoutMs || timeoutLimit;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    // 3. Evaluate operational response blocks returned by the server instance
    if (response.ok) {
      return { 
        success: true, 
        message: 'Connection successful. $metadata parsed correctly.' 
      };
    }

    // Handle authentication walls or resource parameter failures explicitly
    if (response.status === 401 || response.status === 403) {
      return { success: false, message: `Access denied (HTTP ${response.status}). Check credentials.` };
    }

    return { success: false, message: `Connection failed with status code HTTP ${response.status}.` };

  } catch (error) {
    console.error('[SAP SERVICE ERROR] Endpoint compilation failed:', error);
    return { 
      success: false, 
      message: 'Network error. Verify server availability or CORS configurations.' 
    };
  }
}


/**
 * Dedicated network pipeline fetching raw schema parameters and returning extracted entities.
 * Automatically saves successful responses and falls back to local cache arrays seamlessly on failure.
 * 
 * @param {string} baseUrl
 * @param {string} username
 * @param {string} password
 * @returns {Promise<string[]>} List of entities discovered
 */
/**
 * Dedicated network pipeline fetching raw schema parameters and returning extracted entities.
 * Saves successful responses, but strictly throws an exception if both network and cache are unavailable.
 * 
 * @param {string} baseUrl
 * @param {string} username
 * @param {string} password
 * @returns {Promise<string[]>} List of entities discovered
 */
export async function fetchMetadata(baseUrl, username, password) {
  // 1. NETWORK SIMULATOR CHECK: Kill request immediately if toggle is switched on
  if (store.simulatedOffline) {
    console.warn('[SAP SERVICE] Request blocked: Network Offline Simulator is active.');
    
    // Check if a cache snapshot exists before trying to read it
    if (!store.cache.metadataRawXml) {
      throw new Error('Offline Mode: Network is down and no local cache snapshot exists.');
    }
    return parseODataMetadata(store.cache.metadataRawXml);
  }

  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const targetUrl = `${cleanUrl}/$metadata`;
  const credentials = btoa(`${username}:${password}`);

  const timeoutLimit = store.config?.networkTimeoutMs || 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutLimit);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/xml, text/xml'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);

    const rawXml = await response.text();

    // SUCCESS CACHING POINT: Update persistent local memory
    storeActions.setMetadataCache(rawXml);

    return parseODataMetadata(rawXml);

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[SAP SERVICE] Network connection loop failed:', error.message);

    // 2. CRITICAL CACHE VALIDATION PASSTHROUGH
    // If the cache is completely empty/barren, DO NOT supply an empty fallback array.
    // Throw the error directly up so the UI components can output the correct error alert panel.
    if (!store.cache.metadataRawXml) {
      console.error('[SAP SERVICE] Absolute failure: Network is unreachable and cache is completely empty.');
      throw new Error(`Connection failed (${error.message}) and no local cache snapshot is available.`);
    }

    // 3. Clean Cache Fallback: Only fires if a valid historical snapshot exists
    console.log('[SAP SERVICE] Network down. Successfully recovered metadata schema from local cache.');
    return parseODataMetadata(store.cache.metadataRawXml);
  }
}

/**
 * Local extraction helper to process string variables out of persistent localStorage memory cache fields
 */
function loadMetadataFromCache(reason) {
  const cachedXml = store.cache.metadataRawXml;
  
  if (!cachedXml) {
    return {
      success: false,
      source: 'cache',
      entitySets: [],
      message: `Offline (${reason}) - No local cache snapshot found. Connection required.`
    };
  }

  return {
    success: true,
    source: 'cache',
    entitySets: parseODataMetadata(cachedXml),
    message: `Offline (${reason}) - Displaying services from local cache snapshot.`
  };
}

/**
 * Deletes a specific entity row from an SAP OData v4 service endpoint.
 * 
 * @param {string} baseUrl - The base OData configuration URL
 * @param {string} username - Authentication profile username
 * @param {string} password - Authentication profile password
 * @param {string} entityName - Name of the targeted collection (e.g. 'PurchaseOrder')
 * @param {Object} primaryKeysObj - Dictionary containing key-value pairs (e.g. { PurchaseOrder: '10', PurchaseOrderItem: '20' })
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteODataRecord(baseUrl, username, password, entityName, primaryKeysObj) {
  try {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    
    // 1. COMPILE ODATA KEY BRACKET STRING: Format keys safely for V4 constraints
    // Single Key output: EntitySet('KeyVal')
    // Composite Key output: EntitySet(Key1='Val1',Key2='Val2')
    const keyClauses = Object.entries(primaryKeysObj).map(([key, value]) => {
      // Check if value is numeric or text string to format quotes appropriately
      const formattedValue = (typeof value === 'number' || (!isNaN(value) && value !== '')) ? value : `'${value}'`;
      return Object.keys(primaryKeysObj).length === 1 ? formattedValue : `${key}=${formattedValue}`;
    });
    
    const keyBracket = `(${keyClauses.join(',')})`;
    const targetUrl = `${cleanBase}/${entityName}${keyBracket}`;
    
    console.log(`[SAP SERVICE] Dispatching HTTP DELETE pipeline request to: ${targetUrl}`);

    const credentials = btoa(`${username}:${password}`);
    
    // 2. DISPATCH NATIVE NETWORK CALL
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // 3. EVALUATE OPERATION STATUS
    // OData servers typically answer deletions with HTTP 204 No Content on total success
    if (response.ok || response.status === 204) {
      return { 
        success: true, 
        message: 'Record deleted successfully from the server backend.' 
      };
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: `Deletion rejected: Unauthorized (HTTP ${response.status}).` };
    }

    return { success: false, message: `Server refused deletion command with status HTTP ${response.status}.` };

  } catch (error) {
    console.error('[SAP SERVICE DELETE ERROR]:', error);
    return { 
      success: false, 
      message: 'Network execution fault. Verify connection status or server locks.' 
    };
  }
}

/**
 * Fetches a single specific entity record row from an SAP OData v4 endpoint using its keys.
 * 
 * @param {string} baseUrl - The base OData configuration URL
 * @param {string} username - Authentication profile username
 * @param {string} password - Authentication profile password
 * @param {string} entityName - Targeted collection name (e.g. 'PurchaseOrder')
 * @param {Object} primaryKeysObj - Dictionary of key-value pairs (e.g. { PurchaseOrder: '4500000001' })
 * @returns {Promise<Object>} The raw row data object returned by the server
 */
export async function fetchODataRecordByKeys(baseUrl, username, password, entityName, primaryKeysObj) {
  try {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    
    // Compile key parameters cleanly: EntitySet(Key='Val') or EntitySet(Key1='Val1',Key2='Val2')
    const keyClauses = Object.entries(primaryKeysObj).map(([key, value]) => {
      const formattedValue = (typeof value === 'number' || (!isNaN(value) && value !== '')) ? value : `'${value}'`;
      return Object.keys(primaryKeysObj).length === 1 ? formattedValue : `${key}=${formattedValue}`;
    });
    
    const targetUrl = `${cleanBase}/${entityName}(${keyClauses.join(',')})`;
    console.log(`[SAP SERVICE] Querying single row master entity reference from: ${targetUrl}`);

    const credentials = btoa(`${username}:${password}`);
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
    
    const payload = await response.json();
    
    // OData single entity requests return the bare object directly (not wrapped inside a 'value' array)
    return payload;
  } catch (error) {
    console.error('[SAP SERVICE FETCH BY KEY ERROR]:', error);
    throw error;
  }
}

/**
 * Updates an existing entity record row using HTTP PATCH with delta fields.
 */
export async function updateODataRecord(baseUrl, username, password, entityName, primaryKeysObj, updatedFieldsObj) {
  try {
    // Short-circuit if no fields were actually changed
    if (Object.keys(updatedFieldsObj).length === 0) {
      return { success: true, message: 'No modifications detected. Server update skipped.' };
    }

    const cleanBase = baseUrl.replace(/\/+$/, '');
    const keyClauses = Object.entries(primaryKeysObj).map(([key, value]) => {
      const formattedValue = (typeof value === 'number' || (!isNaN(value) && value !== '')) ? value : `'${value}'`;
      return Object.keys(primaryKeysObj).length === 1 ? formattedValue : `${key}=${formattedValue}`;
    });
    
    const targetUrl = `${cleanBase}/${entityName}(${keyClauses.join(',')})`;
    console.log(`[SAP SERVICE] Sending delta PATCH payload to: ${targetUrl}`, updatedFieldsObj);

    const credentials = btoa(`${username}:${password}`);
    const response = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedFieldsObj)
    });

    if (response.ok || response.status === 204) {
      return { success: true, message: 'Delta updates applied successfully to the server backend.' };
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: `Access denied (HTTP ${response.status}).` };
    }

    return { success: false, message: `Server rejected delta update with status HTTP ${response.status}.` };

  } catch (error) {
    console.error('[SAP SERVICE UPDATE ERROR]:', error);
    return { success: false, message: 'Network proxy layer transmission error.' };
  }
}
/**
 * Generates a brand new entity row entry on the SAP OData service using HTTP POST.
 * 
 * @param {string} baseUrl 
 * @param {string} username 
 * @param {string} password 
 * @param {string} entityName 
 * @param {Object} entryPayloadObj - The complete key-value mapping to create
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function createODataRecord(baseUrl, username, password, entityName, entryPayloadObj) {
  try {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const targetUrl = `${cleanBase}/${entityName}`;
    const credentials = btoa(`${username}:${password}`);
    const stringifiedJson = JSON.stringify(entryPayloadObj);

    // 1. Native Interface Bridge Routing Route
    if (window.AndroidNativeProxy) {
      console.log(`[SAP SERVICE] Routing POST creation natively through Android framework...`);
      const rawNativeResponse = window.AndroidNativeProxy.executeNativeWrite(
        targetUrl, 
        "POST", 
        credentials, 
        stringifiedJson
      );
      const response = JSON.parse(rawNativeResponse);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return { success: true, message: 'Record created successfully via native proxy.' };
      }
      return { success: false, message: `Server rejected creation: HTTP ${response.statusCode}` };
    }

    // 2. Dev Laptop Fallback Route
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: stringifiedJson
    });

    if (response.ok || response.status === 201) {
      return { success: true, message: 'Record generated successfully on the backend server.' };
    }
    return { success: false, message: `Server refused insertion status code: HTTP ${response.status}` };

  } catch (error) {
    console.error('[SAP SERVICE CREATE ERROR]:', error);
    return { success: false, message: 'Network proxy layer transmission failure.' };
  }
}

/**
 * Downloads raw XML metadata and compiles field constraint validation objects for a target entity.
 */
export async function fetchValidationRules(baseUrl, username, password, entityName) {
  try {
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    const targetUrl = `${cleanUrl}/$metadata`;
    const credentials = btoa(`${username}:${password}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/xml, text/xml'
      }
    });

    if (!response.ok) throw new Error(`HTTP XML error status ${response.status}`);
    const rawXml = await response.text();
    
    return parseEntityValidationRules(rawXml, entityName);
  } catch (error) {
    console.error("[SAP SERVICE] Failed fetching constraint schemas:", error);
    return {};
  }
}
