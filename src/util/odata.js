import { SapODataClient, basicAuth } from '@otvnvs/ahm-decabase-odata/sap';
import { BrokerTransport } from '@otvnvs/ahm-decabase-odata';
import { store } from './store.js';

/**
 * Build a SapODataClient for the given service path (poPath or grPath).
 * Uses the current store config at call time so credentials/URLs can be updated
 * in the settings page without rebuilding.
 */
function buildClient(servicePath) {
  const baseUrl = `${store.config.baseHost.replace(/\/$/, '')}${servicePath.replace(/\/$/, '')}`;
  return new SapODataClient({
    baseUrl,
    version: 'v4',
    auth: basicAuth(store.config.username, store.config.password || ''),
    transport: new BrokerTransport({
      brokerUrl: '/api/net/request',
      timeoutMs: store.config.networkTimeoutMs || 15000,
    }),
    sapClient: store.config.sapClient || null,
  });
}

/** Client for the PurchaseOrder scan service. */
export function poClient() {
  return buildClient(store.config.poPath);
}

/** Client for the GoodsReceipt draft pipeline service. */
export function grClient() {
  return buildClient(store.config.grPath);
}

/**
 * Test metadata for any absolute SAP service URL.
 * Uses a temporary client so both PO and GR services can be diagnosed.
 */
export async function testServiceMetadata(baseUrl) {
  const client = new SapODataClient({
    baseUrl: baseUrl.replace(/\/$/, ''),
    version: 'v4',
    auth: basicAuth(store.config.username, store.config.password || ''),
    transport: new BrokerTransport({
      brokerUrl: '/api/net/request',
      timeoutMs: store.config.networkTimeoutMs || 15000,
    }),
    sapClient: store.config.sapClient || null,
  });

  const xml = await client.fetchMetadata();
  if (xml && xml.includes('Edmx')) {
    return true;
  }
  throw new Error('Invalid metadata format returned from SAP server gateway.');
}

/**
 * Backwards-compatible connection test used by the config page.
 * Tests the PurchaseOrder service metadata.
 */
export async function testODataConnection() {
  const ok = await testServiceMetadata(`${store.config.baseHost.replace(/\/$/, '')}${store.config.poPath.replace(/\/$/, '')}`);
  if (ok) {
    return { success: true, message: 'Connected to SAP S/4HANA successfully! Metadata schema loaded.' };
  }
  throw new Error('Connection test failed.');
}
