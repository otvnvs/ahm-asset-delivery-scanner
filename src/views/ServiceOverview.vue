<template>
  <div class="view-wrapper overview-wrapper">
    <div class="view-header">Overview: {{ entityName }}</div>

    <!-- Minimal Search Input Form -->
    <div class="search-container">
      <form @submit.prevent="executeServerSearch" class="search-form">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Type keyword & hit Enter to query server..." 
          class="minimal-search-input"
          :disabled="loading"
        />
        <button type="submit" class="grid-search-btn" :disabled="loading">
          <span v-if="loading">...</span>
          <svg v-else class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://w3.org">
            <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="2"/>
            <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </form>
    </div>

    <!-- Centralized Minimalist Operational Action Toolbar -->
    <div class="toolbar-actions">
      <button class="toolbar-btn new-action-btn" :disabled="loading" @click="handleNewRecordClick">New</button>
      <button class="toolbar-btn edit-action-btn" :disabled="!selectedRow || loading" @click="handleSelectedEdit">Edit</button>
      <button class="toolbar-btn delete-action-btn" :disabled="!selectedRow || loading" @click="handleSelectedDelete">Delete</button>
    </div>

    <div v-if="loading && recordItems.length === 0" class="status-box text-center">Querying SAP Server Backend Matrix...</div>
    <div v-else-if="errorMessage" class="status-box error-txt text-center">{{ errorMessage }}</div>
    
    <div v-else class="data-container">
      <!-- SERVER PAGINATED BINDINGS: Pass mappedGridRows directly and feed server total count metrics -->
      <DataGridDisplay
        :headers="displayLabels"
        :rows="mappedGridRows"
        :page="currentPage"
        :items-per-page="itemsPerPage"
        :total-items="totalServerCount"
        @row-select="handleRowSelectionChange"
        @page-change="handlePageNumberSwitch"
      />
    </div>

    <div class="button-row">
      <router-link to="/services" class="action-btn back-btn">Return to Services</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store } from '../util/store.js';
import { deleteODataRecord, fetchEntityUIAnnotations } from '../util/sap.js';
import { extractRecordPrimaryKeys } from '../util/odata.js';
import DataGridDisplay from '../components/datagriddisplay/DataGridDisplay.vue';

const route = useRoute();
const router = useRouter();
const entityName = route.params.entityName;

const recordItems = ref([]);
const searchQuery = ref('');
const loading = ref(true);
const errorMessage = ref('');
const uiAnnotations = ref({ lineItems: [], selectionFields: [], formGroups: [] });

const selectedRow = ref(null);
const currentPage = ref(1);
const itemsPerPage = 10;
const totalServerCount = ref(0); // Tracks the absolute global record size inside SAP

const handleRowSelectionChange = (rowObject) => {
  selectedRow.value = rowObject ? rowObject._rawReference : null;
};

// SERVER-SIDE PAGE INTERCEPTOR: Updates active page tracking index and triggers a new data fetch
const handlePageNumberSwitch = (targetPageNumber) => {
  currentPage.value = targetPageNumber;
  selectedRow.value = null; // Prevent desync anomalies across separate records pools
  loadServerData();
};

const filterFields = function(rowObject) {
  var cleanObject = {};
  if (!rowObject) return cleanObject;
  for (var key in rowObject) {
    if (rowObject.hasOwnProperty(key) && !key.startsWith('@') && !key.startsWith('__') && typeof rowObject[key] !== 'object') {
      cleanObject[key] = rowObject[key];
    }
  }
  return cleanObject;
};

const displayLabels = computed(() => {
  if (uiAnnotations.value.lineItems && uiAnnotations.value.lineItems.length > 0) {
    return uiAnnotations.value.lineItems.map(function(item) { return item.label; });
  }
  if (recordItems.value.length === 0) return [];
  return Object.keys(filterFields(recordItems.value[0]));
});

const displayProperties = computed(() => {
  if (uiAnnotations.value.lineItems && uiAnnotations.value.lineItems.length > 0) {
    return uiAnnotations.value.lineItems.map(function(item) { return item.property; });
  }
  if (recordItems.value.length === 0) return [];
  return Object.keys(filterFields(recordItems.value[0]));
});

const mappedGridRows = computed(() => {
  const propsList = displayProperties.value;
  const labelsList = displayLabels.value;
  return recordItems.value.map(function(rawRow) {
    const mappedRow = {};
    propsList.forEach(function(propName, index) {
      const targetLabel = labelsList[index];
      mappedRow[targetLabel] = rawRow[propName];
    });
    mappedRow._rawReference = rawRow;
    return mappedRow;
  });
});

const handleNewRecordClick = () => {
  router.push({ name: 'service-new', params: { entityName: entityName } });
};

const handleSelectedEdit = () => {
  if (!selectedRow.value) return;
  const targetKeys = extractRecordPrimaryKeys(selectedRow.value);
  router.push({ name: 'service-details', params: { entityName: entityName }, query: targetKeys });
};

const handleSelectedDelete = async () => {
  if (!selectedRow.value) return;
  const row = selectedRow.value;
  const targetKeys = extractRecordPrimaryKeys(row);
  if (window.confirm("Are you sure you want to delete this record?")) {
    const { odataUrl, username, password } = store.config || {};
    loading.value = true;
    const result = await deleteODataRecord(odataUrl, username, password, entityName, targetKeys);
    loading.value = false;
    if (result.success) {
      // Re-fetch the current page chunk from the server after deletion to maintain pagination bounds
      loadServerData();
    }
  }
};

// DYNAMIC PAGINATING NETWORK BUILDER
const loadServerData = async () => {
  loading.value = true;
  errorMessage.value = '';
  const { odataUrl, username, password } = store.config || {};
  const cleanBase = odataUrl.replace(/\/+$/, '');
  
  // Calculate index offset parameters based on active page depth layer position
  var skipCount = (currentPage.value - 1) * itemsPerPage;
  
  // OData system options parameters chain: $top limits length | $skip pushes offset | $count asks for global size
  let targetUrl = `${cleanBase}/${entityName}?$top=${itemsPerPage}&$skip=${skipCount}&$count=true`;

  try {
    const credentials = btoa(`${username}:${password}`);
    
    // Fetch UI Annotations once on mount, or keep it synced side-by-side
    if (currentPage.value === 1 && recordItems.value.length === 0) {
      uiAnnotations.value = await fetchEntityUIAnnotations(odataUrl, username, password, entityName);
    }

    const response = await fetch(targetUrl, { 
      method: 'GET', 
      headers: { 'Authorization': `Basic ${credentials}`, 'Accept': 'application/json' } 
    });

    if (!response.ok) throw new Error("HTTP " + response.status);
    const payload = await response.json();
    
    // Assign rows subset array
    recordItems.value = payload.value || (Array.isArray(payload) ? payload : [payload]);
    
    // Extract global metadata counter length integer directly out of the server response header keys
    totalServerCount.value = payload['@odata.count'] || recordItems.value.length || 0;
  } catch (err) {
    errorMessage.value = 'Failed to load targeted segment data from server.';
  } finally {
    loading.value = false;
  }
};

const executeServerSearch = () => {
  currentPage.value = 1;
  selectedRow.value = null;
  loadServerData();
};

onMounted(() => { 
  loadServerData(); 
});
</script>


<style scoped>.overview-wrapper{text-align:left;box-sizing:border-box;padding:0 10px;width:100%;}.search-container{margin-top:15px;margin-bottom:5px;width:100%;}.search-form{display:flex;gap:6px;width:100%;}.minimal-search-input{font-family:monospace;background-color:#1a1a1a; color: #4eb5f1; border: 1px dashed #444444; padding: 10px 12px; font-size: 13px; outline: none; flex: 1; box-sizing: border-box; border-radius: 4px; }.minimal-search-input:focus{border-color:#4eb5f1; background-color: #222222; }.grid-search-btn{background-color:#1a1a1a; border: 1px solid #333; color: white; padding: 0 14px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; }.toolbar-actions{display:flex;gap:8px;margin:10px 0 15px 0;width:100%;}.toolbar-btn{font-family:monospace;font-size:12px;padding:6px 16px;background-color:#1a1a1a; color: #ffffff; border: 1px solid #333333; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }.toolbar-btn:hover:not(:disabled){background-color:#2a2a2a; border-color: #555555; }.toolbar-btn:disabled{opacity:0.25;color:#666666; cursor: not-allowed; border-color: #222222; }.new-action-btn{color:#a8ffb2; border-color: #38b000; }.new-action-btn:hover:not(:disabled){background-color:#38b000; color: #111111; }.edit-action-btn:not(:disabled){color:#4eb5f1; border-color: #4eb5f1; }.edit-action-btn:hover:not(:disabled){background-color:#4eb5f1; color: #111111; }.delete-action-btn:not(:disabled){color:#e63946; border-color: #e63946; }.delete-action-btn:hover:not(:disabled){background-color:#e63946; color: #ffffff; }.button-row{margin-top:25px;}.action-btn{font-family:monospace;font-size:14px;padding:12px 16px;cursor:pointer;text-align:center;border-radius:4px;text-decoration:none;display:block;width:100%;box-sizing:border-box;}.back-btn{background:transparent;color:#ffffff; border: 1px solid #444; }.status-box{font-family:monospace;font-size:13px;color:#888; padding: 25px 0; }.error-txt{color:#e63946; }.text-center{text-align:center;}</style>
