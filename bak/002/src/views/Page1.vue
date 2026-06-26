<template>
  <div class="store-test-card">
    <h4>Global Persistent Store Demo</h4>
    
    <!-- Display state values reactively -->
    <div class="status-panel">
      <p>Welcome, <strong>{{ store.user.name }}</strong> ({{ store.user.role }})</p>
      <p>Counter Status: <strong>{{ store.counter }}</strong></p>
      <p>Active Layout Theme: <strong>{{ store.settings.theme }}</strong></p>
    </div>

    <!-- Trigger actions on click events -->
    <div class="control-actions">
      <button @click="storeActions.increment">Increment Count</button>
      <button @click="storeActions.toggleTheme">Toggle Application Theme</button>
      
      <button 
        v-if="!store.user.isLoggedIn" 
        @click="storeActions.login('Bohn Zoe')" 
        class="login-btn"
      >
        Sign In
      </button>
      <button 
        v-else 
        @click="storeActions.logout" 
        class="logout-btn"
      >
        Sign Out
      </button>
    </div>
  </div>
</template>

<script setup>
import { store, storeActions } from '../util/store.js';
</script>

<style scoped>
.store-test-card {
  background: #222222;
  border: 1px solid #e2e8f0;
  padding: 20px;
  border-radius: 8px;
  margin-top: 15px;
}
.status-panel {
  background: #333333;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}
.control-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
button {
  background: #edf2f7;
  border: 1px solid #cbd5e0;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}
button:hover { background: #e2e8f0; }
.login-btn { background: #c6f6d5; color: #22543d; border-color: #9ae6b4; }
.login-btn:hover { background: #9ae6b4; }
.logout-btn { background: #fed7d7; color: #742a2a; border-color: #feb2b2; }
.logout-btn:hover { background: #feb2b2; }
</style>
