<template>
  <div class="view-wrapper home-view">
    <div class="view-header">Home View</div>
    <p class="welcome-text">Welcome to your dashboard.</p>
    
    <nav class="sub-nav">
      <router-link to="/services" class="nav-link highlight-link">Services</router-link>
      <div class="nav-divider"></div>
      <router-link to="/about" class="nav-link">About Screen</router-link> | 
    </nav>

    <button class="action-btn" @click="handleLock">Lock Application</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { storeActions } from '../../util/store.js';

const router = useRouter();

const handleLock = () => {
  storeActions.logout();
  router.push('/enter');
};
</script>

<style scoped>
.sub-nav { margin-bottom: 35px; font-size: 13px; line-height: 1.8; }
.nav-link { color: #333; text-decoration: underline; }
.highlight-link { color: #4eb5f1; font-weight: bold; font-size: 14px; text-decoration: none; border: 1px dashed #333; padding: 8px 12px; display: inline-block; margin-bottom: 15px; border-radius: 4px; }
.highlight-link:hover { background: #1a1a1a; border-color: #555; }
.nav-divider { border-bottom: 1px solid #222; margin: 5px 0 15px 0; }
</style>

