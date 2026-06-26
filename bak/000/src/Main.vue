<template>
  <div class="minimal-container">
    <router-view></router-view>
    <RefreshButton />
  </div>
</template>

<script setup>
import RefreshButton from './components/RefreshButton.vue';
</script>

<style>
/* Shared minimalistic design layouts */
.minimal-container {
  font-family: monospace;
  max-width: 320px;
  margin: 40px auto;
  padding: 10px;
  text-align: center;
}
.view-wrapper { width: 100%; }
.view-header {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #666;
  margin-bottom: 20px;
  border-bottom: 1px dashed #ccc;
  padding-bottom: 5px;
}
.home-view { padding: 20px 0; }
.welcome-text { font-size: 16px; margin-bottom: 30px; color: #333; }
.action-btn {
  background: none;
  border: 1px solid #333;
  color: #333;
  padding: 8px 16px;
  font-family: monospace;
  cursor: pointer;
}
.action-btn:hover { background: #f0f0f0; }
</style>

