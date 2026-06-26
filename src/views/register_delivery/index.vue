<template>
  <div class="app-layout register-delivery-view">
    <!-- Reusable Top Navigation Bar Component -->
    <MenuTop title="REGISTER DELIVERY" />

    <!-- Main Entry Form Container Workspace -->
    <main class="app-content content-workspace">
      <form class="delivery-form" @submit.prevent="handleSubmit">
        
        <!-- Field 1: Storage Location Selection Group -->
        <div class="form-group">
          <label class="form-label">Storage Location<span class="required-indicator">*</span></label>
          <div class="input-container select-wrapper">
            <select v-model="formData.storageLocation" class="form-input custom-select">
              <option value="0001">0001 - Standard SLoc</option>
              <option value="0002">0002 - Secondary SLoc</option>
            </select>
          </div>
        </div>

        <!-- Field 2: PO / STO / DC Tracking Field -->
        <div class="form-group">
          <label class="form-label">PO / STO / DC Delivery Number</label>
          <div class="input-container">
            <input 
              type="text" 
              v-model="formData.deliveryNumber"
              placeholder="Enter a PO, STO, DC Delivery Number" 
              class="form-input"
            />
          </div>
        </div>

        <!-- Field 3: SSCC Handling Code Field -->
        <div class="form-group">
          <label class="form-label">SSCC</label>
          <div class="input-container">
            <input 
              type="text" 
              v-model="formData.sscc"
              placeholder="Enter SSCC number only" 
              class="form-input"
            />
          </div>
        </div>

        <!-- Field 4: Optional Delivery Reference Notes -->
        <div class="form-group">
          <label class="form-label">Delivery reference</label>
          <div class="input-container">
            <input 
              type="text" 
              v-model="formData.deliveryReference"
              placeholder="Required for vendor POs" 
              class="form-input"
            />
          </div>
        </div>

        <!-- Submission Trigger Action Module Button -->
        <button type="submit" class="receipt-submit-btn">
          <!-- Centralized Box Delivery Vector Icon matching your design wireframe -->
          <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="21 8 21 21 3 21 3 8"></polyline>
            <rect x="1" y="3" width="22" height="5"></rect>
            <line x1="10" y1="12" x2="14" y2="12"></line>
          </svg>
          Receipt
        </button>

      </form>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import MenuTop from '../../components/menutop/index.vue';

const router = useRouter();

// Bindable layout form state tracker parameters
const formData = ref({
  storageLocation: '0001',
  deliveryNumber: '',
  sscc: '',
  deliveryReference: ''
});

// Primary validation submission event hook handler
const handleSubmit = () => {
  console.log("Submitting delivery data packet: ", formData.value);
  // Add processing state validation or tracking execution routines here
};
</script>

<style scoped>
/* Main view wrapper structure layout rules */
.register-delivery-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  box-sizing: border-box;
}

/* Offset positioning to drop content comfortably below fixed navbar */
.content-workspace {
  padding-top: 5.5rem !important;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

/* Center and constraint-manage form layout spacing blockages */
.delivery-form {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 0 auto;
}

/* Form block architecture */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Text label design tokens */
.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted, #94a3b8);
  font-family: system-ui, -apple-system, sans-serif;
}

.required-indicator {
  color: #ef4444; /* Standard deep clean validation red highlight marker */
  margin-left: 0.15rem;
}

/* Fluid Input Elements Architecture */
.input-container {
  width: 100%;
  position: relative;
}

.form-input {
  width: 100%;
  background-color: var(--surface-color, #1a1a1e);
  border: 1px solid var(--border-color, #2c2c35);
  color: var(--text-main, #f4f4f7);
  border-radius: 6px;
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
  box-sizing: border-box;
  outline: none;
  font-family: system-ui, -apple-system, sans-serif;
  transition: border-color 0.15s ease;
}

/* Highlight border track focusing styling standard matches */
.form-input:focus {
  border-color: var(--accent-color, #42b883);
}

/* Native select element adjustments */
.custom-select {
  appearance: none;
  cursor: pointer;
}

/* Chevron indicator vector injection element overlay track */
.select-wrapper::after {
  content: "";
  position: absolute;
  right: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--text-muted, #94a3b8);
  pointer-events: none;
}

/* Custom placeholder styling overrides to match screen aesthetics */
.form-input::placeholder {
  color: #4b5563; /* Low-profile dark gray placeholder definition text */
  opacity: 1;
}

/* Primary Form Confirmation Action Button styling */
.receipt-submit-btn {
  background-color: #00e676; /* Vibrant emerald layout theme match button color */
  color: #121214; /* Inverted dark content contrast text rule color */
  border: none;
  border-radius: 6px;
  padding: 0.9rem;
  font-size: 1.05rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0, 230, 118, 0.2);
  transition: opacity 0.15s ease;
}

.receipt-submit-btn:active {
  opacity: 0.9;
}

.btn-icon {
  display: inline-block;
  flex-shrink: 0;
}
</style>

