<template>
  <div class="app-layout edit-outbox-view">
    <!-- Reusable Top Navigation Bar Component -->
    <MenuTop title="EDIT OUTBOX ITEM" />

    <!-- Main Entry Form Container Workspace -->
    <main class="app-content content-workspace">
      <form class="outbox-form" @submit.prevent="handleUpdate">
        
        <!-- Field 1: Article Code (Read-Only State View) -->
        <div class="form-group">
          <label class="form-label">Article</label>
          <div class="input-container">
            <input 
              type="text" 
              v-model="formData.article" 
              class="form-input read-only-input" 
              readonly
            />
          </div>
        </div>

        <!-- Field 2: Description (Read-Only State View) -->
        <div class="form-group">
          <label class="form-label">Description</label>
          <div class="input-container">
            <textarea 
              v-model="formData.description" 
              class="form-input text-area-input read-only-input" 
              readonly
              rows="2"
            ></textarea>
          </div>
        </div>

        <!-- Field 3: Unit of Measure (Read-Only State View) -->
        <div class="form-group">
          <label class="form-label">Unit of Measure</label>
          <div class="input-container">
            <input 
              type="text" 
              v-model="formData.uom" 
              class="form-input read-only-input" 
              readonly
            />
          </div>
        </div>

        <!-- Field 4: Editable Quantity Input Field -->
        <div class="form-group">
          <label class="form-label">Quantity</label>
          <div class="input-container">
            <input 
              type="number" 
              v-model.number="formData.quantity" 
              class="form-input numeric-input"
              min="0"
            />
          </div>
        </div>

        <!-- Update Quantity Submission Action Button Module -->
        <button type="submit" class="update-submit-btn">
          <!-- Save Floppy Vector Disk Icon matching your design wireframe standard -->
          <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Update Quantity
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

// Form tracking ref populated with your exact image specifications
const formData = ref({
  article: '8233324001',
  description: 'Cap NE 970 Rifle NY Y, White/Green, OSFM',
  uom: 'EA',
  quantity: 0
});

// Update submit handler
const handleUpdate = () => {
  console.log("Saving updated outbox item quantity packet:", formData.value);
  // Returns user smoothly back to the Scanned Goods checklist array view
  router.push('/scanned_goods');
};
</script>

<style scoped>
.edit-outbox-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  box-sizing: border-box;
}

/* Structural container layout offsets content from top navigation boundary lines */
.content-workspace {
  padding-top: 5.5rem !important;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

/* Centered structural grouping layout bounds */
.outbox-form {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin: 0 auto;
}

/* Layout architectural spacing block */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Typography styles matching label metrics */
.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted, #94a3b8);
  text-align: left;
}

.input-container {
  width: 100%;
}

/* Uniform design tokens matching field wrappers */
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
  text-align: left;
}

/* Read-only color formatting layer rules */
.read-only-input {
  color: var(--text-muted, #94a3b8);
  cursor: not-allowed;
}

/* Multi-line adjustment controls */
.text-area-input {
  resize: none;
  line-height: 1.4;
}

/* Active focus track indicator highlights */
.numeric-input:focus {
  border-color: var(--accent-color, #42b883);
}

/* Primary Execution Confirmation Action Button styling */
.update-submit-btn {
  background-color: #00e676; /* Radiant layout emerald token */
  color: #121214; /* Maximum contrast typography rule color */
  border: none;
  border-radius: 6px;
  padding: 0.9rem;
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0, 230, 118, 0.15);
  transition: opacity 0.1s ease;
}

.update-submit-btn:active {
  opacity: 0.9;
}

.btn-icon {
  display: inline-block;
  flex-shrink: 0;
}
</style>

