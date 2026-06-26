<template>
  <div class="view-wrapper services-wrapper">
    <div class="view-header">Discovered Services</div>

    <div v-if="loading" class="info-txt text-center">Querying SAP Metadata...</div>
    <div v-else-if="errorMessage" class="error-txt text-center">{{ errorMessage }}</div>
    
    <!-- CONFIGURED COMPONENT HANDLING LOCAL SLICES -->
    <ListDisplay 
      v-else 
      :items="visibleItems"
      :page="currentPage"
      :items-per-page="pageSize"
      :total-items="allEntities.length"
      @item-select="handleServiceNavigation"
      @page-change="handlePageSwitch"
    />

    <div class="button-row">
      <router-link to="/home" class="action-btn back-btn">Back to Dashboard</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../util/store.js';
import { fetchMetadata } from '../util/sapService.js';
import ListDisplay from '../components/ListDisplay.vue';

const router = useRouter();
const allEntities = ref([]); // Holds the entire master array from metadata
const loading = ref(true);
const errorMessage = ref('');

// VIEW SIDE PAGINATION CONTROLS
const currentPage = ref(1);
const pageSize = ref(10); // Display exactly 10 collection elements per page block

// Compute the specific slice chunk to send down to the component viewport
const visibleItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return allEntities.value.slice(start, end);
});

const handlePageSwitch = (targetPage) => {
console.log(targetPage)
  currentPage.value = targetPage;
};

const handleServiceNavigation = (selectedEntityName) => {
  router.push(`/services/${selectedEntityName}`);
};

onMounted(async () => {
  const { odataUrl, username, password } = store.config || {};
  if (!odataUrl || !username || !password) {
    errorMessage.value = 'Configuration values are uninitialized.';
    loading.value = false;
    return;
  }

  try {
    // Pull the complete unpaginated collection from your service helper array function
    allEntities.value = await fetchMetadata(odataUrl, username, password);
  } catch (err) {
    errorMessage.value = 'Failed to download metadata.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.services-wrapper { text-align: left; box-sizing: border-box; padding: 0 10px; }
.button-row { margin-top: 30px; }
.action-btn { font-family: monospace; font-size: 14px; padding: 12px 16px; cursor: pointer; text-align: center; border-radius: 4px; text-decoration: none; display: block; width: 100%; box-sizing: border-box; }
.back-btn { background: transparent; color: #ffffff; border: 1px solid #444; }
.back-btn:hover { background: rgba(255, 255, 255, 0.05); }
.info-txt { font-family: monospace; font-size: 13px; color: #888; }
.error-txt { font-family: monospace; font-size: 13px; color: #e63946; }
.text-center { text-align: center; padding: 20px 0; }
</style>

