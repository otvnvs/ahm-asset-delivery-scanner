import { odataFetch } from './odata.js';

/**
 * --- DATA ADAPTER MAPS ---
 * These normalizers isolate the frontend view keys from backend schema names.
 * If backend parameters change or migrate, modify the mapping keys inside these functions.
 */

function normalizeDeliveryHeader(rawHeader) {
  if (!rawHeader) return null;
  return {
    id: rawHeader.ID || '',
    deliveryNumber: rawHeader.deliveryNumber || '',
    storageLocationId: rawHeader.storageLocation_id || '',
    sscc: rawHeader.sscc || 'N/A',
    deliveryReference: rawHeader.deliveryReference || 'None',
    pallets: parseInt(rawHeader.pallets, 10) || 0,
    cartons: parseInt(rawHeader.cartons, 10) || 0,
    dateReceived: rawHeader.dateReceived ? formatDate(rawHeader.dateReceived) : '',
    status: rawHeader.status || 'PEND',
    // Recursively normalize children array collections if expanded by backend
    items: Array.isArray(rawHeader.items) ? rawHeader.items.map(normalizeDeliveryItem) : []
  };
}

function normalizeDeliveryItem(rawItem) {
  if (!rawItem) return null;
  return {
    id: rawItem.ID || '',
    deliveryId: rawItem.delivery_ID || '',
    code: rawItem.articleCode || '',
    itemNumber: rawItem.itemNumber || '',
    description: rawItem.description || '',
    recptQty: parseInt(rawItem.recptQty, 10) || 0,
    targetQty: parseInt(rawItem.targetQty, 10) || 0,
    uom: rawItem.uom || 'EA',
    vendorId: rawItem.vendorId || '',
    flags: {
      damages: !!rawItem.damages,
      noBarcode: !!rawItem.noBarcode,
      invalidBarcode: !!rawItem.invalidBarcode
    }
  };
}

// Utility function to convert ISO dates (YYYY-MM-DD) into display dates (DD/MM/YYYY)
function formatDate(isoDateString) {
  if (!isoDateString) return '';
  const parts = isoDateString.split('-');
  if (parts.length !== 3) return isoDateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * --- ABSTRACTED ENTITY SERVICES ---
 * Exposes a stable contract wrapper API directly to the front-end Vue views workspace.
 */
export const EntityService = {

  /**
   * SERVICE 1: Fetches shipments by number and expands deep child line records.
   * Maps backend data entities into consistent frontend array tracking models.
   */
  async getDeliveriesList(deliverySearchNumber) {
    try {
      console.log(`[ENTITY SERVICE] Querying deliveries list for search indicator token: ${deliverySearchNumber}`);
      
      // Call the precise custom OData function exposed by the CAP service
      const endpoint = `/getDeliveriesByNumber(searchNumber='${encodeURIComponent(deliverySearchNumber)}')`;
      const response = await odataFetch(endpoint, { method: 'GET' });
      
      // OData v4 array payloads wrap their response datasets inside a default root 'value' block
      const rawCollection = response.value || [];
      return rawCollection.map(normalizeDeliveryHeader);
    } catch (error) {
      console.error('[ENTITY SERVICE] Failed to execute getDeliveriesList:', error);
      throw new Error(`Deliveries Lookup Failed: ${error.message}`);
    }
  },

  /**
   * SERVICE 2: Dispatches verification cache segments downstream back into persistent storage.
   * Format parameter values exactly to match what the backend custom controller action anticipates.
   */
  async submitGoodsReceiptTransaction(deliveryContainerId, frontEndItemsArray) {
    try {
      console.log(`[ENTITY SERVICE] Sending batch transactional update payload across container UUID: ${deliveryContainerId}`);

      // Transform front-end item records back into the strict format expected by the backend OData Action context
      const formattedItemsPayload = frontEndItemsArray.map(item => ({
        itemId: item.id,
        recptQty: parseInt(item.recptQty, 10) || 0,
        damages: !!item.flags.damages,
        noBarcode: !!item.flags.noBarcode,
        invalidBarcode: !!item.flags.invalidBarcode
      }));

      const endpoint = '/submitGoodsReceipt';
      const bodyPayload = {
        deliveryId: deliveryContainerId,
        items: formattedItemsPayload
      };

      const response = await odataFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(bodyPayload)
      });

      return response.value || 'Transaction executed successfully.';
    } catch (error) {
      console.error('[ENTITY SERVICE] Failed to post transaction package details:', error);
      throw new Error(`Receipt Submission Failed: ${error.message}`);
    }
  }
};

