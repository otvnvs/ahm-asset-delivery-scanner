import { odataFetch } from './odata.js';

/**
 * --- SAP DATA ADAPTER NORMALIZERS ---
 */

function normalizeSAPHeader(sapHeader) {
  if (!sapHeader) return null;
  return {
    id: sapHeader.PurchaseOrder || '',
    deliveryNumber: sapHeader.PurchaseOrder || '',
    storageLocationId: sapHeader.Plant || '', 
    sscc: sapHeader.Supplier || 'N/A',
    deliveryReference: sapHeader.SupplierName || 'None',
    pallets: 0, 
    cartons: 0,
    dateReceived: sapHeader.PurchaseOrderDate ? formatSAPDate(sapHeader.PurchaseOrderDate) : '',
    status: 'PEND', 
    items: Array.isArray(sapHeader._Items) ? sapHeader._Items.map(normalizeSAPItem) : []
  };
}

function normalizeSAPItem(sapItem) {
  if (!sapItem) return null;
  return {
    id: `${sapItem.PurchaseOrder}-${sapItem.PurchaseOrderItem}`, 
    deliveryId: sapItem.PurchaseOrder || '',
    code: sapItem.Material || '',
    itemNumber: sapItem.PurchaseOrderItem || '',
    description: sapItem.MaterialDescription || '',
    recptQty: 0, 
    targetQty: Math.floor(parseFloat(sapItem.OpenQuantity || 0)), 
    uom: sapItem.EntryUnit || 'EA',
    vendorId: sapItem.CartonEAN || 'None', 
    flags: {
      damages: false,
      noBarcode: false,
      invalidBarcode: false
    }
  };
}

function formatSAPDate(isoDateString) {
  if (!isoDateString) return '';
  const parts = isoDateString.split('-');
  if (parts.length !== 3) return isoDateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * --- EXTRACTED ENTITY SERVICES ---
 */
export const EntityService = {

  /**
   * SERVICE 1: Fetches purchase orders and deep expands nested line items.
   */
  async getDeliveriesList(purchaseOrderNumber) {
    try {
      console.log(`[SAP ENTITY SERVICE] Fetching Purchase Order: ${purchaseOrderNumber}`);
      
      const queryParams = `$filter=PurchaseOrder eq '${encodeURIComponent(purchaseOrderNumber)}'&$expand=_Items`;
      const endpoint = `/PurchaseOrder?${queryParams}`;
      
      const response = await odataFetch(endpoint, { method: 'GET' });
      const rawCollection = response.value || [];
      
      return rawCollection.map(normalizeSAPHeader);
    } catch (error) {
      console.error('[SAP ENTITY SERVICE] Purchase Order fetch failed:', error);
      throw new Error(`SAP PO Lookup Failed: ${error.message}`);
    }
  },

  /**
   * SERVICE 2: Commits captured goods receipts via standard SAP OData batch updates.
   */
  async submitGoodsReceiptTransaction(purchaseOrderNumber, frontEndItemsArray) {
    try {
      console.log(`[SAP ENTITY SERVICE] Committing goods receipt for PO: ${purchaseOrderNumber}`);

      for (const item of frontEndItemsArray) {
        const poId = purchaseOrderNumber;
        const itemId = item.itemNumber; 
        
        const endpoint = `/PurchaseOrderItem(PurchaseOrder='${poId}',PurchaseOrderItem='${itemId}')`;
        
        // FIXED: Added EntryUnit property alongside OpenQuantity to satisfy the SAP dependent property constraint
        const patchPayload = {
          OpenQuantity: Math.max(0, item.targetQty - item.recptQty),
          EntryUnit: item.uom
        };

        console.log(`[SAP PATCH] Dispatching payload with unit context to ${endpoint}:`, patchPayload);

        await odataFetch(endpoint, {
          method: 'PATCH', 
          headers: { 'If-Match': '*' }, 
          body: JSON.stringify(patchPayload)
        });
      }

      return 'Success: Purchase order quantities updated on SAP backend successfully.';
    } catch (error) {
      console.error('[SAP ENTITY SERVICE] Batch post processing failure:', error);
      throw new Error(`SAP Receipt Submission Failed: ${error.message}`);
    }
  }
};

