<template>
  <div class="app-layout goods-to-scan-view">
    <!-- Reusable Top Navigation Bar Component -->
    <MenuTop title="DELIVERIES LIST" />

    <!-- Main Workspace Scroll Area -->
    <main class="app-content content-workspace">
      <div class="deliveries-list">
        
        <!-- Loopable Delivery Entry Card Module Component -->
        <div 
          v-for="delivery in deliveries" 
          :key="delivery.id" 
          class="delivery-card"
          @click="selectDelivery(delivery.id)"
        >
          <!-- Left Layout Block: Icon Graphic and Shipment Metadata details -->
          <div class="card-left">
            <div class="package-icon-wrapper">
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="#d97706" stroke-width="1.5" fill="#f59e0b">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" fill="none" />
                <path d="M2 7v10l10 5V12L2 7z" opacity="0.15" />
              </svg>
            </div>
            
            <div class="delivery-details">
              <h2 class="delivery-number">{{ delivery.poNumber }}</h2>
              <div class="meta-row">SSCC: <span class="meta-value">{{ delivery.sscc }}</span></div>
              <div class="meta-row">Delivery: <span class="meta-value">{{ delivery.deliveryRef }}</span></div>
              <div class="meta-row">
                Pallet: <span class="meta-value">{{ delivery.pallets }}</span> 
                Cartons: <span class="meta-value">{{ delivery.cartons }}</span>
              </div>
            </div>
          </div>

          <!-- Right Layout Block: Timestamp Metrics -->
          <div class="card-right">
            <span class="status-label">Received:</span>
            <span class="date-stamp">{{ delivery.dateReceived }}</span>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import MenuTop from '../../components/menutop/index.vue';

const router = useRouter();

const deliveries = ref([
  {
    id: 1,
    poNumber: '4500176856',
    sscc: 'N/A',
    deliveryRef: 'None',
    pallets: 0,
    cartons: 0,
    dateReceived: '26/06/2026'
  }
]);

// Navigates directly to your exact /po_items path route
const selectDelivery = (id) => {
  console.log(`Selecting delivery item ID: ${id}, routing to /po_items`);
  router.push('/po_items');
};
</script>

<style scoped>
.goods-to-scan-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  box-sizing: border-box;
}

.content-workspace {
  padding-top: 5.5rem !important;
  padding-left: 1rem;
  padding-right: 1rem;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.deliveries-list {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin: 0 auto;
}

.delivery-card {
  background-color: var(--surface-color, #1a1a1e);
  border: 1px solid var(--border-color, #2c2c35);
  border-radius: 8px;
  padding: 1.25rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.1s ease, background-color 0.1s ease;
}

.delivery-card:active {
  background-color: var(--border-color, #2c2c35);
  transform: scale(0.99);
}

.card-left {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.package-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 0.2rem;
}

.delivery-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.delivery-number {
  font-size: 1.15rem;
  font-weight: bold;
  color: var(--text-main, #f4f4f7);
  margin: 0 0 0.15rem 0;
  font-family: system-ui, -apple-system, sans-serif;
}

.meta-row {
  font-size: 0.85rem;
  color: var(--text-muted, #94a3b8);
  font-family: monospace;
}

.meta-value {
  color: var(--text-main, #f4f4f7);
}

.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  gap: 0.15rem;
  min-width: max-content;
}

.status-label {
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
}

.date-stamp {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted, #94a3b8);
  font-family: monospace;
}
</style>

