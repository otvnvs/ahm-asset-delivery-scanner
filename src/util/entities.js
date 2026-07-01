import { odataFetch } from './odata.js';
import { store } from './store.js';

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
      const endpoint = `${store.config.poPath}/PurchaseOrder?${queryParams}`;
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
        
        const endpoint = `${store.config.grPath}/GoodsReceipt(PurchaseOrder='${poId}',PurchaseOrderItem='${itemId}')`;
        
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
  },

  async postGoodsReceiptHeader(purchaseOrderNumber, postingDate = "2026-06-22") {
    try {
      console.log(`[SAP ENTITY SERVICE] Creating Goods Receipt Document Header for PO: ${purchaseOrderNumber}`);
      
      // Target the base resource endpoint as described in your bash script
      const endpoint = `${store.config.grPath}/GoodsReceipt`;
      
      const postPayload = {
        PurchaseOrder: String(purchaseOrderNumber),
        PostingDate: postingDate
      };

      console.log(`[SAP POST] Dispatching document creation payload to ${endpoint}:`, postPayload);
      
      const response = await odataFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(postPayload)
      });

      return response;
    } catch (error) {
      console.error('[SAP ENTITY SERVICE] Goods Receipt header submission failed:', error);
      throw new Error(`SAP Header Posting Failed: ${error.message}`);
    }
  },

  // 2. NEW BRAND-NEW RAP TRANSACTION PIPELINE (Replaces submitGoodsReceiptTransaction)
  async executeDraftGoodsReceiptPipeline(purchaseOrderNumber, frontEndItemsArray, postingDate = "2026-06-22") {
    try {
      const sapClientParam = store.config.sapClient ? `?sap-client=${store.config.sapClient}` : '';

      // --- STEP 1: INITIALIZE DRAFT HEADER ---
      console.log(`[SAP PIPELINE] Step 1: Initializing Goods Receipt Draft Document Header...`);
      const headerEndpoint = `${store.config.grPath}/GoodsReceipt${sapClientParam}`;
      
      const headerPayload = {
        PurchaseOrder: String(purchaseOrderNumber),
        PostingDate: postingDate
      };

      const headerResponse = await odataFetch(headerEndpoint, {
        method: 'POST',
        body: JSON.stringify(headerPayload)
      });

      const grUuid = headerResponse.GoodsReceiptUUID;
      if (!grUuid) {
        throw new Error("SAP gateway failed to yield a structural GoodsReceiptUUID draft token identification string.");
      }
      console.log(`[SAP PIPELINE] Draft Header constructed successfully. Assigned UUID: ${grUuid}`);

      // --- STEP 2: APPEND CHILD DRAFT ITEMS ---
      console.log(`[SAP PIPELINE] Step 2: Injecting ${frontEndItemsArray.length} captured item rows into Draft allocation schema...`);
      
      // Target the bound navigational path context directly off the created header uuid instance
      const baseItemEndpoint = `${store.config.grPath}/GoodsReceipt(GoodsReceiptUUID=${grUuid},IsActiveEntity=false)/_Item${sapClientParam}`;

      for (const item of frontEndItemsArray) {
        // Enforce 5-digit character padding constraint standard for SAP document lines (e.g., '10' -> '00010')
        const paddedLineItem = String(item.itemNumber || '10').padStart(5, '0');

        const itemPayload = {
          GoodsReceiptUUID: grUuid,
          PurchaseOrderItem: paddedLineItem,
          Material: item.code || '',
          MaterialDescription: item.description || '',
          OrderQuantity: Math.floor(parseFloat(item.targetQty || 0)),
          ReceivedQuantity: Math.floor(parseFloat(item.recptQty || 0)),
          EntryUnit: item.uom || 'EA',
          Plant: item.storageLocationId || '1010', // Maps back from normalizeSAPHeader fallback values
          StorageLocation: '0001',                // Default fallback configuration assignment
          PrimaryEAN: item.vendorId || '',        // Maps back from normalizeSAPItem schema
          CartonEAN: item.vendorId || ''
        };

        console.log(`[SAP PIPELINE] Appending Draft Item line: ${paddedLineItem}`);
        await odataFetch(baseItemEndpoint, {
          method: 'POST',
          body: JSON.stringify(itemPayload)
        });
      }

      // --- STEP 3: ACTIVATE THE DRAFT BOOTSTRAP ---
      console.log(`[SAP PIPELINE] Step 3: Dispatching Namespace Bound Action to finalize/activate ledger entry...`);
      const actionNamespace = "com.sap.gateway.srvd_a2x.zgr_ui_grdoc_o4.v0001.Activate";
      const activationEndpoint = `${store.config.grPath}/GoodsReceipt(GoodsReceiptUUID=${grUuid},IsActiveEntity=false)/${actionNamespace}${sapClientParam}`;

      const activationResponse = await odataFetch(activationEndpoint, {
        method: 'POST',
        body: JSON.stringify({}) // Bound actions mandate an explicitly empty JSON payload block object
      });

      console.log(`[SAP PIPELINE] Activation Success! Active Entity state: ${activationResponse.IsActiveEntity}`);
      return activationResponse;

    } catch (error) {
      console.error('[SAP PIPELINE] Critical transactional breakdown on RAP stack compilation:', error);
      throw new Error(`SAP Draft Transaction Pipeline Aborted: ${error.message}`);
    }
  }

};

