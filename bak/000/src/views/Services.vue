<template>
  <div class="view-wrapper services-wrapper">
    <div class="view-header">Discovered Services</div>

    <div v-if="loading" class="info-txt text-center">Querying SAP Metadata...</div>
    <div v-else-if="errorMessage" class="error-txt text-center">{{ errorMessage }}</div>
    
    <div v-else class="services-list">
      <p class="subtitle">Discovered Entity Collections:</p>
      
      <div v-if="entities.length === 0" class="info-txt">No entities found in service schema definitions.</div>
      
      
      <router-link 
        v-else 
        v-for="item in entities" 
        :key="item" 
        :to="`/services/${item}`" 
        class="service-card"
      >
        </span>{{ item }}</span>
        </div>
      </router-link>
    </div>

    <div class="button-row">
      <router-link to="/home" class="action-btn back-btn">Back to Dashboard</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { store } from '../util/store.js';
import { fetchMetadata } from '../util/sapService.js';

const entities = ref([]);
const loading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  const { odataUrl, username, password } = store.config || {};
  if (!odataUrl || !username || !password) {
    errorMessage.value = 'Configuration values are uninitialized.';
    loading.value = false;
    return;
  }
  try {
    entities.value = await fetchMetadata(odataUrl, username, password);
  } catch (err) {
    errorMessage.value = 'Failed to download metadata.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.services-wrapper { text-align: left; box-sizing: border-box; padding: 0 10px; }
.subtitle { font-family: monospace; font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 15px; }
.services-list { margin-top: 20px; }
.service-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #1a1a1a;
  border: 1px solid #333;
  padding: 14px;
  margin-bottom: 10px;
  border-radius: 4px;
  font-family: monospace;
  text-decoration: none; /* Clears anchor underline rules */
  transition: border-color 0.2s;
}
.service-card:hover { border-color: #555; }
.entity-icon { font-size: 16px; }
.entity-info { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.entity-name { color: #4eb5f1; font-size: 14px; font-weight: bold; }
.tap-hint { font-size: 11px; color: #555; text-transform: uppercase; }
.service-card:hover .tap-hint { color: #888; }
.button-row { margin-top: 30px; }
.action-btn { font-family: monospace; font-size: 14px; padding: 12px 16px; cursor: pointer; text-align: center; border-radius: 4px; text-decoration: none; display: block; width: 100%; box-sizing: border-box; }
.back-btn { background: transparent; color: #ffffff; border: 1px solid #444; }
.info-txt { font-family: monospace; font-size: 13px; color: #888; }
.error-txt { font-family: monospace; font-size: 13px; color: #e63946; }
.text-center { text-align: center; padding: 20px 0; }
</style>

