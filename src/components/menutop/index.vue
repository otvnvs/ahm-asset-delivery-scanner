<template>
  <header class="app-header fixed-topbar">
    <!-- Displays the dynamic prop text instead of a hardcoded string -->
    <h1 class="header-title">{{ title }}</h1>
    <router-link to="/" class="header-home-btn">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </router-link>
  </header>
</template>

<script setup>
import { defineProps } from 'vue';

// Define the component properties
defineProps({
  title: {
    type: String,
    default: 'Goods Receipting' // Fallback text if no title is provided
  }
});
</script>

<style scoped>
.fixed-topbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 56px;
  z-index: 100;
  box-sizing: border-box;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
}

.header-title {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 1.25rem;
  margin: 0;
  font-weight: 600;
  color: var(--text-main);
}

.header-home-btn {
  color: var(--accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

