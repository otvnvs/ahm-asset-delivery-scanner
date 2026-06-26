<template>
  <div class="generic-datagrid-container">
    <div class="grid-meta-row">
      <slot name="header">
        <p class="grid-subtitle">Data Matrix Grid:</p>
      </slot>
      <span v-if="totalItems > 0" class="grid-pager-indicator">
        Rows: {{ totalItems }} total | Page {{ page }} of {{ totalPages }}
      </span>
    </div>

    <!-- Fallback indicator when the data pool is empty -->
    <div v-if="rows.length === 0" class="grid-empty-txt">
      No data records available to display.
    </div>

    <div v-else class="grid-layout-block">
      <!-- TWO-AXIS CONTAINER: Handles vertical constraints and horizontal text-overflow scrolling -->
      <div class="datagrid-scroll-frame">
        <table class="mendix-dark-grid">
          <thead>
            <tr>
              <th class="index-hdr">#</th>
              <th v-for="header in headers" :key="header">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Click event captures row selection directly across data rows -->
            <tr 
              v-for="(row, rowIndex) in rows" 
              :key="rowIndex"
              @click="handleRowTap(row)"
              :class="{ 'is-selected': internalSelectedRow === row }"
            >
              <td class="index-cell">{{ ((page - 1) * itemsPerPage) + rowIndex + 1 }}</td>
              
              <!-- Dynamic property cell mapper loop -->
              <td v-for="header in headers" :key="header">
                <template v-if="typeof row === 'object' && row !== null">
                  {{ row[header] !== null && row[header] !== undefined && row[header] !== '' ? row[header] : '-' }}
                </template>
                <template v-else>
                  <!-- Safe string fallback if a plain primitive string array is passed later -->
                  {{ header === 'Value' ? row : '-' }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- COMPACT PAGINATION TOOLBAR MATRIX -->
      <div v-if="totalPages > 1" class="pagination-toolbar">
        <button 
          type="button"
          class="pager-btn" 
          :disabled="page === 1" 
          @click="$emit('page-change', page - 1)"
        >
          Prev
        </button>
        
        <span class="pager-summary">{{ page }} / {{ totalPages }}</span>
        
        <button 
          type="button"
          class="pager-btn" 
          :disabled="page === totalPages" 
          @click="$emit('page-change', page + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  // Column string header labels list array
  headers: {
    type: Array,
    required: true,
    default: () => []
  },
  // Row data item records collection array
  rows: {
    type: Array,
    required: true,
    default: () => []
  },
  // Active page control variables managed by parent controllers
  page: {
    type: Number,
    required: true,
    default: 1
  },
  itemsPerPage: {
    type: Number,
    required: true,
    default: 10
  },
  totalItems: {
    type: Number,
    required: true,
    default: 0
  }
});

const emit = defineEmits(['row-select', 'page-change']);

const internalSelectedRow = ref(null);

// Wipe selection caches if pages or row datasets update to prevent target reference desyncs
watch(() => props.page, () => { internalSelectedRow.value = null; });
watch(() => props.rows, () => { internalSelectedRow.value = null; });

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.itemsPerPage);
});

const handleRowTap = (row) => {
  if (internalSelectedRow.value === row) {
    internalSelectedRow.value = null; // Toggle selection off if clicked again
  } else {
    internalSelectedRow.value = row;  // Set selection active
  }
  // Emit selection state change to parent view controller wrapper
  emit('row-select', internalSelectedRow.value);
};
</script>

<style scoped>
.grid-meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.grid-subtitle { font-family: monospace; font-size: 12px; color: #888; text-transform: uppercase; margin: 0; }
.grid-pager-indicator { font-family: monospace; font-size: 11px; color: #666; text-transform: uppercase; }

.generic-datagrid-container { width: 100%; text-align: left; box-sizing: border-box; }

.datagrid-scroll-frame {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 400px;
  border: 1px solid #2d2d2d;
  background-color: #111111;
}

.mendix-dark-grid {
  border-collapse: collapse;
  width: 100%;
  font-family: monospace;
  font-size: 12px;
  text-align: left;
  white-space: nowrap;
}

.mendix-dark-grid th {
  position: sticky;
  top: 0;
  background-color: #1c1c1c;
  color: #888888;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 11px;
  padding: 10px 16px;
  border-bottom: 2px solid #2d2d2d;
  border-right: 1px solid #2d2d2d;
  z-index: 2;
}

.mendix-dark-grid td {
  padding: 10px 16px;
  color: #ffffff;
  border-bottom: 1px solid #222222;
  border-right: 1px solid #2d2d2d;
  transition: background-color 0.1s;
}

.mendix-dark-grid tbody tr { cursor: pointer; }
.mendix-dark-grid tbody tr:nth-child(even) { background-color: #161616; }
.mendix-dark-grid tbody tr:hover { background-color: #202020; }

/* Custom selection accent highlight configuration settings */
.mendix-dark-grid tbody tr.is-selected td {
  background-color: #1c3d5a !important;
  color: #4eb5f1 !important;
  border-bottom-color: #2b6cb0;
}

.index-hdr, .index-cell {
  text-align: center !important;
  font-weight: bold;
  background-color: #1a1a1a !important;
  color: #555555 !important;
  border-right: 2px solid #2d2d2d !important;
  width: 40px;
}

.pagination-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #161616;
  border: 1px solid #2d2d2d;
  border-top: none;
  padding: 8px 12px;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}
.pager-btn {
  background-color: transparent;
  border: 1px solid #444;
  color: #fff;
  font-family: monospace;
  font-size: 11px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 2px;
}
.pager-btn:disabled { opacity: 0.25; cursor: not-allowed; }
.pager-summary { font-family: monospace; font-size: 12px; color: #888; }
.grid-empty-txt { font-family: monospace; font-size: 13px; color: #888; text-align: center; padding: 25px 0; border: 1px dashed #333; border-radius: 4px; }
</style>

