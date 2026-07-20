import { poClient, grClient } from './odata.js';

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
        items: Array.isArray(sapHeader._Items)
            ? sapHeader._Items.map(item => normalizeSAPItem(item, sapHeader.Plant))
            : []
    };
}

function normalizeSAPItem(sapItem, fallbackPlant = '1010') {
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
        storageLocationId: sapItem.Plant || fallbackPlant,
        flags: { damages: false, noBarcode: false, invalidBarcode: false }
    };
}

function formatSAPDate(isoDateString) {
    if (!isoDateString) return '';
    const parts = isoDateString.split('-');
    if (parts.length !== 3) return isoDateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export const EntityService = {
    async getDeliveriesList(purchaseOrderNumber) {
        try {
            console.log(`[SAP ENTITY SERVICE] Fetching Purchase Order: ${purchaseOrderNumber}`);

            const client = poClient();
            const result = await client.entitySet('PurchaseOrder')
                .filter(b => b.eq('PurchaseOrder', purchaseOrderNumber))
                .expand('_Items')
                .list();

            return result.value.map(normalizeSAPHeader);
        } catch (error) {
            console.error('[SAP ENTITY SERVICE] Purchase Order fetch failed:', error);
            throw new Error(`SAP PO Lookup Failed: ${error.message}`);
        }
    },

    async submitGoodsReceiptTransaction(purchaseOrderNumber, frontEndItemsArray) {
        try {
            console.log(`[SAP ENTITY SERVICE] Committing goods receipt for PO: ${purchaseOrderNumber}`);

            const client = grClient();
            for (const item of frontEndItemsArray) {
                const patchPayload = {
                    OpenQuantity: Math.max(0, item.targetQty - item.recptQty),
                    EntryUnit: item.uom
                };

                console.log(`[SAP PATCH] Dispatching payload with unit context:`, patchPayload);

                await client.entitySet('GoodsReceipt').patch(
                    { PurchaseOrder: purchaseOrderNumber, PurchaseOrderItem: item.itemNumber },
                    patchPayload,
                    { headers: { 'If-Match': '*' } }
                );
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

            const client = grClient();
            const response = await client.entitySet('GoodsReceipt').create({
                PurchaseOrder: String(purchaseOrderNumber),
                PostingDate: postingDate
            });

            return response;
        } catch (error) {
            console.error('[SAP ENTITY SERVICE] Goods Receipt header submission failed:', error);
            throw new Error(`SAP Header Posting Failed: ${error.message}`);
        }
    },

    async executeDraftGoodsReceiptPipeline(purchaseOrderNumber, frontEndItemsArray, postingDate = "2026-06-22") {
        try {
            const client = grClient();

            console.log(`[SAP PIPELINE] Step 1: Initializing Goods Receipt Draft Document Header...`);
            const headerResponse = await client.entitySet('GoodsReceipt').create({
                PurchaseOrder: String(purchaseOrderNumber),
                PostingDate: postingDate
            });

            const grUuid = headerResponse.GoodsReceiptUUID;
            if (!grUuid) {
                throw new Error("SAP gateway failed to yield a structural GoodsReceiptUUID draft token identification string.");
            }
            console.log(`[SAP PIPELINE] Draft Header constructed successfully. Assigned UUID: ${grUuid}`);
            console.log(`[SAP PIPELINE] Full header response:`, JSON.stringify(headerResponse));

            console.log(`[SAP PIPELINE] Step 2: Injecting ${frontEndItemsArray.length} captured item rows into Draft allocation schema...`);
            const itemSet = client.entitySet('GoodsReceipt').nav({ GoodsReceiptUUID: grUuid, IsActiveEntity: false }, '_Item');

            for (const item of frontEndItemsArray) {
                const paddedLineItem = String(item.itemNumber || '10').padStart(5, '0');
                const itemPayload = {
                    GoodsReceiptUUID: grUuid,
                    PurchaseOrderItem: paddedLineItem,
                    Material: item.code || '',
                    MaterialDescription: item.description || '',
                    OrderQuantity: Math.floor(parseFloat(item.targetQty || 0)),
                    ReceivedQuantity: Math.floor(parseFloat(item.recptQty || 0)),
                    EntryUnit: item.uom || 'EA',
                    Plant: item.storageLocationId || '1010',
                    StorageLocation: '0001',
                    PrimaryEAN: item.vendorId || '',
                    CartonEAN: item.vendorId || ''
                };

                console.log(`[SAP PIPELINE] Appending Draft Item line: ${paddedLineItem}`);
                await itemSet.create(itemPayload);
            }

            console.log(`[SAP PIPELINE] Step 3: Dispatching Namespace Bound Action to finalize/activate ledger entry...`);
            const activationResponse = await client.entitySet('GoodsReceipt').callAction(
                { GoodsReceiptUUID: grUuid, IsActiveEntity: false },
                'com.sap.gateway.srvd_a2x.zgr_ui_grdoc_o4.v0001.Activate',
                {}
            );

            console.log(`[SAP PIPELINE] Activation Success! Active Entity state: ${activationResponse.IsActiveEntity}`);
            return activationResponse;
        } catch (error) {
            console.error('[SAP PIPELINE] Critical transactional breakdown on RAP stack compilation:', error);
            if (error.body) console.error('[SAP PIPELINE] Raw SAP response body:', error.body);
            throw new Error(`SAP Draft Transaction Pipeline Aborted: ${error.message}`);
        }
    }
};
