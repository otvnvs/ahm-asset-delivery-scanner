<template>
  <div class="app-layout scanned-goods-view">
    <!-- Reusable Top Navigation Bar Component -->
    <MenuTop title="GOODS TO RECEIPT" />

    <!-- Main Workspace Scroll Track -->
    <main class="app-content content-workspace">
      <div class="scanned-list">
        
        <!-- Loopable Scanned Goods Entry Card -->
        <div 
          v-for="item in scannedItems" 
          :key="item.id" 
          class="scanned-card"
          @click="inspectItem(item.id)"
        >
          <!-- Left Layout Column: Status indicator check box -->
          <div class="card-status-indicator">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="3" fill="none">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <!-- Middle Layout Column: Detailed Product Data Specifications -->
          <div class="card-body-details">
            <div class="item-article-code">{{ item.articleCode }}</div>
            <div class="item-description-text">{{ item.description }}</div>
            <div class="item-sub-meta">PO Delivery: {{ item.poDelivery }}</div>
            <div class="item-sub-meta">Bags: {{ item.bags }}</div>
          </div>

          <!-- Right Layout Column: Bright Green Logged Quantities Metric Counter -->
          <div class="card-qty-metric">
            <span class="qty-label">Qty:</span>
            <span class="qty-value">{{ item.qty }}</span>
          </div>
        </div>

      </div>

      <!-- Bottom System Process Form Control Action Button Row -->
      <div class="form-actions-row">
        <!-- Delete All / Clear Queue Module Button Trigger -->
        <button type="button" class="action-btn-delete" @click="handleDeleteAll">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          Delete All
        </button>

        <!-- Save Server / Post Transaction Sync Module Button Trigger -->
        <button type="button" class="action-btn-save-server" @click="handleSaveServer">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M12 2v12M12 14l-4-4M12 14l4-4"></path>
            <path d="M2 17v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"></path>
          </svg>
          Save Server
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import MenuTop from '../../components/menutop/index.vue';

const router = useRouter();

// Mock data structured identically to your layout snapshot interface parameters
const scannedItems = ref([
  {
    id: 1,
    articleCode: '8233324001',
    description: 'Cap NE 970 Rifle NY Y, White/Green, OSFM',
    poDelivery: '4500176856',
    bags: 'DN NBN LN',
    qty: 0
  }
]);

// Route jump trigger hook targeting your designated outbox parameter route
const inspectItem = (id) => {
  console.log(`Drilling into item sequence trace record parameter ID: ${id}, jumping to /outbox_item`);
  router.push('/outbox_item');
};

const handleDeleteAll = () => {
  console.log("Triggered sweep deletion request across all local items cache queue.");
};

const handleSaveServer = () => {
  console.log("Posting local verification cache arrays downstream to central storage database logs.");
};
</script>

<style scoped>
.scanned-goods-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  box-sizing: border-box;
}

.content-workspace {
  /* padding-top: 5.5rem !important; */
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 1.5rem;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: center;
}

/* Master list items vertical loop track alignment */
.scanned-list {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Scanned Product Card Framework matching your architecture standard specifications */
.scanned-card {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.scanned-card:active {
  transform: scale(0.99);
}

/* Left layout check symbol block */
.card-status-indicator {
  background-color: #00e676; /* Bright brand accent layout verification green tracking token */
  color: #121214;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

/* Central informational string text block configurations */
.card-body-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: left;
}

.item-article-code {
  font-size: 1.05rem;
  font-weight: bold;
  color: var(--text-main);
  font-family: monospace;
}

.item-description-text {
  font-size: 0.85rem;
  line-height: 1.3;
  color: var(--text-muted);
}

.item-sub-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: monospace;
}

/* Right layout bright emerald status parameter counters tracking style */
.card-qty-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: monospace;
  line-height: 1.1;
  min-width: max-content;
}

.qty-label {
  font-size: 0.85rem;
  font-weight: bold;
  color: #00e676;
}

.qty-value {
  font-size: 1.35rem;
  font-weight: bold;
  color: #00e676;
}

/* Bottom Footer Action Controls Container Layout system */
.form-actions-row {
  width: 100%;
  max-width: 440px;
  display: grid;
  grid-template-columns: 1fr 1.15fr; /* Controls structural asymmetric width distribution */
  gap: 0.75rem;
  /*margin-top: auto;*/ /* Locks down items row comfortably to bottom of inner layout height tracking bounds */
  padding-top: 1rem;
}

/* Red Tinted Destruction Action Button component */
.action-btn-delete {
  background-color: transparent;
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
  border-radius: 6px;
  padding: 0.85rem 0;
  font-size: 0.95rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
}

.action-btn-delete:active {
  background-color: rgba(239, 68, 68, 0.1);
}

/* Neon Green Remote Push Execution Confirmation Action Button component */
.action-btn-save-server {
  background-color: #00e676;
  color: #121214;
  border: none;
  border-radius: 6px;
  padding: 0.85rem 0;
  font-size: 0.95rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 230, 118, 0.15);
}

.action-btn-save-server:active {
  opacity: 0.9;
}
</style>

