<template>
  <div class="app-layout po-items-view">
    <!-- Reusable Top Navigation Bar Component -->
    <MenuTop title="PO ITEMS" />

    <main class="app-content content-workspace">
      <!-- Search input container matching your UI layout -->
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search PO items..." 
          class="search-input"
        />
      </div>

      <!-- Scrollable list of items -->
      <div class="items-list">
        <div 
          v-for="item in filteredItems" 
          :key="item.id" 
          class="item-card"
          @click="selectItem(item)"
        >
          <!-- Item Code highlighted in green accent color -->
          <div class="item-code">{{ item.code }}</div>
          
          <!-- Detailed Item description text metadata block -->
          <div class="item-description">{{ item.description }}</div>
          
          <!-- Core tracking metrics information row line summary -->
          <div class="item-meta">
            Recpt. Qty: <span class="highlight">{{ item.recptQty }}</span> 
            / <span class="highlight">{{ item.cartons }} CAR</span> 
            - Vendor Arg. <span class="highlight">{{ item.vendorId }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import MenuTop from '../../components/menutop/index.vue';
const router = useRouter();

const searchQuery = ref('');

// Item data array mimicking your live layout screenshot variables exactly
const items = ref([
  {
    id: 1,
    code: '8233324001',
    description: 'Cap NE 970 Rifle NY Y, White/Green, OSFM',
    recptQty: '0EQ',
    cartons: '0',
    vendorId: '60843778'
  },
  {
    id: 2,
    code: '8233325001',
    description: 'Cap NE 970 Rifle Chic, White/Green, OSFM',
    recptQty: '0EQ',
    cartons: '0',
    vendorId: '60843782'
  },
  {
    id: 3,
    code: '8233326001',
    description: 'Cap NE 970 Rifle Chic, White/Green, OSFM',
    recptQty: '0EQ',
    cartons: '0',
    vendorId: '60843780'
  },
  {
    id: 4,
    code: '8233327001',
    description: 'Cap NE 940 Washed NY Yanke, Pebble, OSFM',
    recptQty: '0EQ',
    cartons: '0',
    vendorId: '60843728'
  },
  {
    id: 5,
    code: '8233328001',
    description: 'Cap NE 940 Washed LA Dodge, Pebble, OSFM',
    recptQty: '0EQ',
    cartons: '0',
    vendorId: '60843724'
  }
]);

// Real-time reactive searching/filtering utility hook computation logic
const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value;
  const query = searchQuery.value.toLowerCase();
  return items.value.filter(item => 
    item.code.toLowerCase().includes(query) || 
    item.description.toLowerCase().includes(query)
  );
});

const selectItem = (item) => {
  console.log(`Selecting product barcode: ${item.code}`);
  router.push('/receipt_item');
};
</script>

<style scoped>
.po-items-view {
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

/* Fluid search field framing matching input panel definitions */
.search-container {
  width: 100%;
  max-width: 440px;
}

.search-input {
  width: 100%;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  border-radius: 6px;
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
  box-sizing: border-box;
  outline: none;
}

.search-input:focus {
  border-color: var(--accent-color);
}

.search-input::placeholder {
  color: #4b5563;
}

/* Master list flow wrapper framework stack alignment */
.items-list {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* List element item row cards */
.item-card {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1.25rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-sizing: border-box;
  text-align: left;
}

/* Identification title metrics mapping green tokens */
.item-code {
  font-size: 1.05rem;
  font-weight: bold;
  color: var(--accent-color);
  font-family: monospace;
}

/* Body description copy definitions */
.item-description {
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--text-main);
}

/* Footnote detail summary formatting labels */
.item-meta {
  font-size: 0.825rem;
  color: var(--text-muted);
  font-family: monospace;
  letter-spacing: 0.25px;
}

.highlight {
  color: var(--text-main);
}
</style>

