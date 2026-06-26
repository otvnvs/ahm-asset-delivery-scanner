<template>
  <div class="generic-list-container">
    <div class="list-meta-row">
      <slot name="header">
        <p class="list-subtitle">Items Matrix:</p>
      </slot>
      <span v-if="totalItems > 0" class="list-pager-indicator">
        Page {{ page }} of {{ totalPages }} ({{ totalItems }} total)
      </span>
    </div>
    
    <div v-if="items.length === 0" class="list-empty-txt">
      No records available.
    </div>
    
    <div v-else class="list-items-frame">
      <div 
        v-for="(item, index) in items" 
        :key="index" 
        class="generic-list-card"
        @click="$emit('item-select', item)"
        role="button"
      >
        <div class="card-content-layout">
          <template v-if="displayFields.length > 0">
            <div v-for="field in displayFields" :key="field" class="card-field-line">
              <span class="field-label" v-if="showInlineLabels">{{ field }}:</span>
              <span class="field-value">{{ item[field] }}</span>
            </div>
          </template>
          <template v-else>
            <span class="fallback-row-text">{{ typeof item === 'object' ? JSON.stringify(item) : item }}</span>
          </template>
        </div>
        <div class="card-action-slot">
          <slot name="row-action" :item="item">
            <span class="default-row-arrow">➔</span>
          </slot>
        </div>
      </div>

      <!-- PAGINATION NAVIGATION TOOLBAR -->
      <div v-if="totalPages > 1" class="generic-list-pagination">
        <button 
          type="button"
          class="list-pager-btn" 
          :disabled="page === 1" 
          @click="$emit('page-change', page - 1)"
        >
          Prev
        </button>
        
        <span class="list-pager-summary">{{ page }} / {{ totalPages }}</span>
        
        <button 
          type="button"
          class="list-pager-btn" 
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
import { computed } from 'vue';

const props = defineProps({
  items: { type: Array, required: true, default: () => [] },
  displayFields: { type: Array, required: false, default: () => [] },
  showInlineLabels: { type: Boolean, required: false, default: false },
  page: { type: Number, required: true, default: 1 },
  itemsPerPage: { type: Number, required: true, default: 10 },
  totalItems: { type: Number, required: true, default: 0 }
});

defineEmits(['item-select', 'page-change']);

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.itemsPerPage);
});
</script>

<style scoped>
.list-meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.list-subtitle { font-family: monospace; font-size: 12px; color: #888; text-transform: uppercase; margin: 0; }
.list-pager-indicator { font-family: monospace; font-size: 11px; color: #666; text-transform: uppercase; }
.generic-list-container { margin-top: 20px; width: 100%; text-align: left; }
.generic-list-card { display: flex; align-items: center; justify-content: space-between; background-color: #1a1a1a; border: 1px solid #333; padding: 14px; margin-bottom: 10px; border-radius: 4px; font-family: monospace; cursor: pointer; user-select: none; }
.generic-list-card:hover { border-color: #555; }
.card-content-layout { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.card-field-line { font-size: 14px; line-height: 1.4; }
.field-label { color: #888; margin-right: 6px; font-weight: bold; }
.field-value { color: #ffffff; }
.fallback-row-text { color: #4eb5f1; font-size: 14px; font-weight: bold; }
.card-action-slot { margin-left: 15px; }
.default-row-arrow { color: #555; font-size: 12px; }
.list-empty-txt { font-family: monospace; font-size: 13px; color: #888; text-align: center; padding: 20px 0; }
.generic-list-pagination { display: flex; justify-content: space-between; align-items: center; background-color: #161616; border: 1px solid #2d2d2d; padding: 8px 12px; margin-top: 15px; border-radius: 4px; }
.list-pager-btn { background-color: transparent; border: 1px solid #444; color: #fff; font-family: monospace; font-size: 11px; padding: 6px 14px; cursor: pointer; border-radius: 2px; }
.list-pager-btn:hover:not(:disabled) { background-color: #222; border-color: #888; }
.list-pager-btn:disabled { opacity: 0.25; cursor: not-allowed; border-color: #222; }
.list-pager-summary { font-family: monospace; font-size: 12px; color: #666; }
</style>

