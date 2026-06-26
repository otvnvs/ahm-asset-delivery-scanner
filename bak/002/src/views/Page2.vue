<template>
  <div class="page-container">
    <h4>src/views/Page2.vue</h4>
    <p>This view displays data captured straight from the active URL path.</p>
    
    <div class="data-box">
      <!-- Reading the path parameter (:id) -->
      <p><strong>Route Parameter (id):</strong> {{ route.params.id }}</p>
      
      <!-- Reading query string parameters (?user=...&mode=...) -->
      <p><strong>Query Parameter (user):</strong> {{ route.query.user }}</p>
      <p><strong>Query Parameter (mode):</strong> {{ route.query.mode }}</p>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();
console.log(`id:   ${route.params.id}`); 
console.log(`user: ${route.query.user}`); 
console.log(`mode: ${route.query.mode}`); 
</script>

<style scoped>
.page-container { background: #222222; padding: 15px; border-radius: 6px; }
.data-box { background: #333333; padding: 10px; border: 1px solid #ddd; margin-top: 10px; }
</style>

