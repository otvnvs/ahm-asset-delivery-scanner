<template>
  <div class="app-layout receipt-item-view">
    <MenuTop title="RECEIPT ITEM" />

    <!-- Main Workspace Area -->
    <main class="app-content content-workspace">
      <!-- Top Info Summary Card Details -->
      <div class="summary-card">
        <h2 class="product-title">Cap NE 970 Rifle NY Y, White/Green, OSFM</h2>
        
        <div class="meta-grid">
          <div class="meta-label">Article: <span class="meta-val">8233324001</span></div>
          <div class="meta-label text-right">Item: <span class="meta-val">2110</span></div>
        </div>

        <div class="status-counter" :class="{ 'has-qty': quantity > 0 }">
          {{ quantity }} EA - captured
        </div>

        <div class="vendor-stamp">Vendor Arg. 60843778</div>
      </div>

      <!-- Quantity Stepper Calculator Row Controls -->
      <div class="stepper-row">
        <button class="step-btn" @click="adjustQty(-5)">&lt; 5</button>
        <button class="step-btn" @click="adjustQty(-1)">-</button>
        <button class="step-btn" @click="adjustQty(1)">+</button>
        <button class="step-btn" @click="adjustQty(5)">5 &gt;</button>
      </div>

      <!-- Exception Flag Row Toggles -->
      <div class="toggles-list">
        
        <!-- Condition 1: Damages Flag -->
        <div class="toggle-row">
          <span class="toggle-label">Damages</span>
          <div class="binary-switch">
            <button 
              type="button" 
              class="switch-btn segment-no" 
              :class="{ active: !flags.damages }"
              @click="flags.damages = false"
            >NO</button>
            <button 
              type="button" 
              class="switch-btn segment-yes" 
              :class="{ active: flags.damages }"
              @click="flags.damages = true"
            >YES</button>
          </div>
        </div>

        <!-- Condition 2: No Barcode Flag -->
        <div class="toggle-row">
          <span class="toggle-label">No Barcode</span>
          <div class="binary-switch">
            <button 
              type="button" 
              class="switch-btn segment-no" 
              :class="{ active: !flags.noBarcode }"
              @click="flags.noBarcode = false"
            >NO</button>
            <button 
              type="button" 
              class="switch-btn segment-yes" 
              :class="{ active: flags.noBarcode }"
              @click="flags.noBarcode = true"
            >YES</button>
          </div>
        </div>

        <!-- Condition 3: Invalid Barcode Flag -->
        <div class="toggle-row">
          <span class="toggle-label">Invalid Barcode</span>
          <div class="binary-switch">
            <button 
              type="button" 
              class="switch-btn segment-no" 
              :class="{ active: !flags.invalidBarcode }"
              @click="flags.invalidBarcode = false"
            >NO</button>
            <button 
              type="button" 
              class="switch-btn segment-yes" 
              :class="{ active: flags.invalidBarcode }"
              @click="flags.invalidBarcode = true"
            >YES</button>
          </div>
        </div>

      </div>

      <!-- Bottom Form Control Action Buttons Row -->
      <div class="form-actions-row">
        <!-- Clear / Reset Parameters Trigger -->
        <button type="button" class="action-btn-clear" @click="handleClear">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Clear
        </button>

        <!-- Save / Persist Entry Data Trigger -->
        <button type="button" class="action-btn-save" @click="handleSave">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Save
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
const quantity = ref(0);

const flags = ref({
  damages: false,
  noBarcode: false,
  invalidBarcode: false
});

const adjustQty = (amount) => {
  quantity.value = Math.max(0, quantity.value + amount);
};

// Reset all values back to default state
const handleClear = () => {
  console.log("Resetting transaction state values...");
  quantity.value = 0;
  flags.value.damages = false;
  flags.value.noBarcode = false;
  flags.value.invalidBarcode = false;
};

// Handle data persistence and route redirect
const handleSave = () => {
  console.log("Saving collected shipment parameters: ", {
    qty: quantity.value,
    exceptions: flags.value
  });
  // Navigate back to item summary list
  router.push('/po_items');
};
</script>

<style scoped>
.receipt-item-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  box-sizing: border-box;
}

.content-workspace {
  padding-top: 5.5rem !important;
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

/* Info Summary Card styling wrapper block */
.summary-card {
  width: 100%;
  max-width: 440px;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem;
  box-sizing: border-box;
  text-align: left;
}

.product-title {
  font-size: 1.15rem;
  font-weight: bold;
  line-height: 1.4;
  margin: 0 0 0.75rem 0;
  color: var(--text-main);
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 1.25rem;
}

.meta-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-family: monospace;
}

.meta-val {
  color: var(--text-main);
}

.text-right {
  text-align: right;
}

/* Captured Quantity Text Field feedback selector color tracking */
.status-counter {
  font-size: 1.35rem;
  font-weight: bold;
  font-family: monospace;
  color: #555555; /* Neutral dark status default when 0 items exist */
  margin-bottom: 0.5rem;
}

.status-counter.has-qty {
  color: var(--accent-color); /* Transforms immediately into green accent color */
}

.vendor-stamp {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-family: monospace;
}

/* Stepper incremental matrix layout styling keys */
.stepper-row {
  width: 100%;
  max-width: 440px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.step-btn {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  border-radius: 6px;
  padding: 0.85rem 0;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  outline: none;
  font-family: monospace;
}

.step-btn:active {
  background-color: var(--border-color);
}

/* Exception flag toggle lists mapping rules */
.toggles-list {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toggle-row {
  width: 100%;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.65rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.toggle-label {
  font-size: 1rem;
  color: var(--text-main);
}

/* Custom segmented controls styling tracks */
.binary-switch {
  display: flex;
  background-color: #121214;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  padding: 2px;
}

.switch-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 0.5rem 1.15rem;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  outline: none;
  transition: all 0.1s ease;
}

/* Toggle option highlight background states */
.switch-btn.segment-no.active {
  background-color: #00e676; /* Standard layout neon active state green color token */
  color: #121214;
}

.switch-btn.segment-yes.active {
  background-color: #00e676;
  color: #121214;
}

/* Footer Action Buttons Section Layout */
.form-actions-row {
  width: 100%;
  max-width: 440px;
  display: grid;
  grid-template-columns: 1fr 1.25fr; /* Matches the layout ratio of save button dominance */
  gap: 0.75rem;
  margin-top: auto; /* Pushes the button array downward comfortably */
  padding-top: 1rem;
}

/* Red Clear Button */
.action-btn-clear {
  background-color: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171; /* Accent red font tone */
  border-radius: 6px;
  padding: 0.9rem 0;
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
}

.action-btn-clear:active {
  background-color: rgba(239, 68, 68, 0.1);
}

/* Green Bright Save Action Button */
.action-btn-save {
  background-color: #00e676;
  color: #121214;
  border: none;
  border-radius: 6px;
  padding: 0.9rem 0;
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 230, 118, 0.15);
}

.action-btn-save:active {
  opacity: 0.9;
}
</style>

