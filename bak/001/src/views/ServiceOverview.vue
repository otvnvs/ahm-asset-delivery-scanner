<template>
  <div class="view-wrapper overview-wrapper">
    <div class="view-header">Overview: {{ entityName }}</div>

    <!-- Search input row wrapper segment -->
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

    <!-- NEW: Centralized Minimalist Operational Action Toolbar -->
    <div class="toolbar-actions">
      <button 
        class="toolbar-btn new-action-btn" 
        @click="handleNewRecordClick"
      >
        New
      </button>
      <button 
        class="toolbar-btn edit-action-btn" 
        :disabled="!selectedRow" 
        @click="handleSelectedEdit"
      >
        Edit
      </button>
      <button 
        class="toolbar-btn delete-action-btn" 
        :disabled="!selectedRow" 
        @click="handleSelectedDelete"
      >
        Delete
      </button>
    </div>

    <div v-if="loading && recordItems.length === 0" class="status-box text-center">Querying SAP Server Backend Matrix...</div>
    <div v-else-if="errorMessage" class="status-box error-txt text-center">{{ errorMessage }}</div>
    
    <div v-else class="data-container">
      <div class="meta-row">
        <p class="record-count">Server Rows Loaded: {{ filteredItems.length }}</p>
        <p v-if="totalPages > 0" class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</p>
      </div>

      <div v-if="filteredItems.length === 0" class="status-box text-center">No records found matching query.</div>

      <div v-else class="grid-layout-block">
        <!-- Scrollable Data Grid Matrix -->
        <div class="datagrid-scroll-frame">
          <table class="mendix-dark-grid">
            <thead>
              <tr>
                <th class="index-hdr">#</th>
                <th v-for="header in gridHeaders" :key="header">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <!-- Click event captures row selection directly across rows -->
              <tr 
                v-for="(row, rowIndex) in paginatedItems" 
                :key="rowIndex"
                @click="toggleRowSelection(row)"
                :class="{ 'is-selected': selectedRow === row }"
              >
                <td class="index-cell">{{ ((currentPage - 1) * itemsPerPage) + rowIndex + 1 }}</td>
                <td v-for="header in gridHeaders" :key="header">
                  {{ row[header] !== null && row[header] !== undefined && row[header] !== '' ? row[header] : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Toolbar -->
        <div v-if="totalPages > 1" class="pagination-toolbar">
          <button class="pager-btn" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
          <span class="pager-summary">{{ currentPage }} / {{ totalPages }}</span>
          <button class="pager-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>
    </div>

    <div class="button-row">
      <router-link to="/services" class="action-btn back-btn">Return to Services</router-link>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store } from '../util/store.js';
import { deleteODataRecord } from '../util/sapService.js';

const route = useRoute();
const router = useRouter();

const entityName = route.params.entityName;

const recordItems = ref([]);
const searchQuery = ref('');
const loading = ref(true);
const errorMessage = ref('');
const activeHeaders = ref([]);

// Selection tracker configuration state
const selectedRow = ref(null);

const currentPage = ref(1);
const itemsPerPage = 10;

// Clear selection if current page switches to keep logic safe
watch(currentPage, () => {
  selectedRow.value = null;
});

const toggleRowSelection = (row) => {
  if (selectedRow.value === row) {
    selectedRow.value = null; // Deselect if tapped a second time
  } else {
    selectedRow.value = row; // Assign row selection
  }
};

const filterFields = (rowObject) => {
  const cleanObject = {};
  if (!rowObject) return cleanObject;
  for (const [key, value] of Object.entries(rowObject)) {
    if (!key.startsWith('@') && !key.startsWith('__') && typeof value !== 'object') {
      cleanObject[key] = value;
    }
  }
  return cleanObject;
};

const gridHeaders = computed(() => {
  if (activeHeaders.value.length > 0) return activeHeaders.value;
  if (recordItems.value.length === 0) return [];
  return Object.keys(filterFields(recordItems.value[0]));
});

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return recordItems.value;

  return recordItems.value.filter(row => {
    const cleanFields = filterFields(row);
    return Object.entries(cleanFields).some(([header, rawValue]) => {
      const isNumericType = typeof rawValue === 'number' || 
                            (!isNaN(rawValue) && rawValue !== '' && String(rawValue).trim() === String(Number(rawValue)));
      if (isNumericType) return false;

      const stringValue = String(rawValue).trim();
      const estimatedMaxLength = Math.max(stringValue.length, 3);
      if (query.length <= estimatedMaxLength) {
        return stringValue.toLowerCase().includes(query);
      }
      return false;
    });
  });
});

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage));
const paginatedItems = computed(() => {
  const startIdx = (currentPage.value - 1) * itemsPerPage;
  return filteredItems.value.slice(startIdx, startIdx + itemsPerPage);
});

const extractPrimaryKeys = (rowObject) => {
  const keys = {};
  if ('PurchaseOrder' in rowObject) keys['PurchaseOrder'] = rowObject['PurchaseOrder'];
  if ('PurchaseOrderItem' in rowObject) keys['PurchaseOrderItem'] = rowObject['PurchaseOrderItem'];
  
  if (Object.keys(keys).length === 0) {
    if ('ID' in rowObject) keys['ID'] = rowObject['ID'];
    else if ('id' in rowObject) keys['id'] = rowObject['id'];
  }
  return keys;
};

// Toolbar focused deletion execution handler mapping
const handleSelectedDelete = async () => {
  if (!selectedRow.value) return;

  const row = selectedRow.value;
  const targetKeys = extractPrimaryKeys(row);
  if (Object.keys(targetKeys).length === 0) {
    alert("Could not dynamically isolate primary keys configurations.");
    return;
  }

  const keysString = Object.entries(targetKeys).map(([k, v]) => `${k}:${v}`).join(', ');
  if (true||confirm(`Are you sure you want to permanently delete selected record [${keysString}]?`)) {
    const { odataUrl, username, password } = store.config || {};
    
    loading.value = true;
    const result = await deleteODataRecord(odataUrl, username, password, entityName, targetKeys);
    loading.value = false;

    if (result.success) {
      //alert(result.message);
      recordItems.value = recordItems.value.filter(item => item !== row);
      selectedRow.value = null; // Clear out state indicators post wipe actions
      
      if (currentPage.value > totalPages.value && currentPage.value > 1) {
        currentPage.value--;
      }
    } else {
      alert(`Deletion rejected by server: ${result.message}`);
    }
  }
};

const handleSelectedEdit = () => {
  if (!selectedRow.value) return;

  const row = selectedRow.value;
  const targetKeys = extractPrimaryKeys(row);

  console.log(`[NAVIGATION] Routing to details with clean key parameters:`, targetKeys);

  router.push({
    name: 'service-details',
    params: { entityName: entityName },
    query: targetKeys // Passes only clean identifiers like ?PurchaseOrder=4500000001
  });
};

const handleNewRecordClick = () => {
  router.push({
    name: 'service-new',
    params: { entityName: entityName },
    query: {
      // Pass headers array to seed form properties on the creation page instantly
      _fields: JSON.stringify(gridHeaders.value)
    }
  });
};

const loadServerData = async (queryKeyword = '') => {
  loading.value = true;
  errorMessage.value = '';
  currentPage.value = 1;
  selectedRow.value = null; // Reset selection references on fresh network calls
  
  const { odataUrl, username, password } = store.config || {};
  const cleanBase = odataUrl.replace(/\/+$/, '');
  let targetUrl = `${cleanBase}/${entityName}`;
  const cleanKeyword = queryKeyword.trim();
  const keywordLength = cleanKeyword.length;

  if (cleanKeyword && gridHeaders.value.length > 0 && recordItems.value.length > 0) {
    const sampleRow = recordItems.value[0];
    const filterClauses = [];
    gridHeaders.value.forEach(header => {
      const rawValue = sampleRow[header];
      const isNumericType = typeof rawValue === 'number' || (!isNaN(rawValue) && rawValue !== '' && String(rawValue).trim() === String(Number(rawValue)));
      if (!isNumericType) {
        const stringValue = rawValue !== null && rawValue !== undefined ? String(rawValue).trim() : '';
        const estimatedMaxLength = Math.max(stringValue.length, 3);
        if (keywordLength <= estimatedMaxLength) {
          filterClauses.push(`contains(${header},'${cleanKeyword}')`);
        }
      }
    });
    if (filterClauses.length > 0) {
      const compiledFilter = `(${filterClauses.join(' or ')})`;
      targetUrl += `?$filter=${encodeURIComponent(compiledFilter)}`;
    } else {
      recordItems.value = [];
      loading.value = false;
      return;
    }
  }

  try {
    const credentials = btoa(`${username}:${password}`);
    const response = await fetch(targetUrl, { method: 'GET', headers: { 'Authorization': `Basic ${credentials}`, 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
    const payload = await response.json();
    const rows = payload.value || (Array.isArray(payload) ? payload : [payload]);
    recordItems.value = rows;
    if (rows.length > 0 && activeHeaders.value.length === 0) {
      activeHeaders.value = Object.keys(filterFields(rows[0]));
    }
  } catch (err) {
    console.error("[SERVER QUERY FAILURE]:", err);
    errorMessage.value = 'Query rejected by SAP Gateway. Refine search length parameters.';
  } finally {
    loading.value = false;
  }
};

const executeServerSearch = () => { loadServerData(searchQuery.value); };
onMounted(() => { loadServerData(); });
</script>
<style scoped>
.overview-wrapper { text-align: left; box-sizing: border-box; padding: 0 10px; width: 100%; }
.search-container { margin-top: 15px; margin-bottom: 5px; width: 100%; }
.search-form { display: flex; gap: 6px; width: 100%; }
.minimal-search-input { font-family: monospace; background-color: #1a1a1a; color: #4eb5f1; border: 1px dashed #444444; padding: 10px 12px; font-size: 13px; outline: none; flex: 1; box-sizing: border-box; border-radius: 4px; }
.minimal-search-input:focus { border-color: #4eb5f1; background-color: #222222; }
.grid-search-btn { background-color: #1a1a1a; border: 1px solid #333; color: white; padding: 0 14px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; }

/* NEW: Horizontal Minimalist Action Control Bar styles */
.toolbar-actions {
  display: flex;
  gap: 8px;
  margin: 10px 0 15px 0;
  width: 100%;
}
.toolbar-btn {
  font-family: monospace;
  font-size: 12px;
  padding: 6px 16px;
  background-color: #1a1a1a;
  color: #ffffff;
  border: 1px solid #333333;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.toolbar-btn:hover:not(:disabled) {
  background-color: #2a2a2a;
  border-color: #555555;
}
.disabled-btn, .toolbar-btn:disabled {
  opacity: 0.25;
  color: #666666;
  cursor: not-allowed;
  border-color: #222222;
}
.delete-action-btn:not(:disabled) {
  color: #e63946;
  border-color: #e63946;
}
.delete-action-btn:hover:not(:disabled) {
  background-color: #e63946;
  color: #ffffff;
}

.meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.record-count, .page-indicator { font-family: monospace; font-size: 11px; color: #888; text-transform: uppercase; margin: 0; }

.datagrid-scroll-frame { width: 100%; overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #2d2d2d; background-color: #111111; }
.mendix-dark-grid { border-collapse: collapse; width: 100%; font-family: monospace; font-size: 12px; text-align: left; white-space: nowrap; }
.mendix-dark-grid th { position: sticky; top: 0; background-color: #1c1c1c; color: #888888; font-weight: bold; text-transform: uppercase; font-size: 11px; padding: 10px 16px; border-bottom: 2px solid #2d2d2d; border-right: 1px solid #2d2d2d; z-index: 2; }
.mendix-dark-grid td { padding: 10px 16px; color: #ffffff; border-bottom: 1px solid #222222; border-right: 1px solid #222222; transition: background-color 0.1s; }
.mendix-dark-grid tbody tr { cursor: pointer; }
.mendix-dark-grid tbody tr:nth-child(even) { background-color: #161616; }
.mendix-dark-grid tbody tr:hover { background-color: #202020; }

/* NEW: High-Visibility Row Selection Highlight Variant Styles */
.mendix-dark-grid tbody tr.is-selected td {
  background-color: #1c3d5a !important; /* Elegant dark blue highlight tint overlay */
  color: #4eb5f1 !important;
  border-bottom-color: #2b6cb0;
}

.index-hdr, .index-cell { text-align: center !important; font-weight: bold; background-color: #1a1a1a !important; color: #555555 !important; border-right: 2px solid #2d2d2d !important; width: 40px; }
.pagination-toolbar { display: flex; justify-content: space-between; align-items: center; background-color: #161616; border: 1px solid #2d2d2d; border-top: none; padding: 8px 12px; }
.pager-btn { background-color: transparent; border: 1px solid #444; color: #fff; font-family: monospace; font-size: 11px; padding: 6px 12px; cursor: pointer; border-radius: 2px; }
.pager-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pager-summary { font-family: monospace; font-size: 12px; color: #888; }
.button-row { margin-top: 25px; }
.action-btn { font-family: monospace; font-size: 14px; padding: 12px 16px; cursor: pointer; text-align: center; border-radius: 4px; text-decoration: none; display: block; width: 100%; box-sizing: border-box; }
.back-btn { background: transparent; color: #ffffff; border: 1px solid #444; }
.status-box { font-family: monospace; font-size: 13px; color: #888; padding: 25px 0; }
.error-txt { color: #e63946; }
.text-center { text-align: center; }
.edit-action-btn:not(:disabled) {
  color: #4eb5f1;
  border-color: #4eb5f1;
}
.edit-action-btn:hover:not(:disabled) {
  background-color: #4eb5f1;
  color: #111111;
}
.new-action-btn {
  color: #a8ffb2;
  border-color: #38b000;
}
.new-action-btn:hover {
  background-color: #38b000;
  color: #111111;
}
</style>

