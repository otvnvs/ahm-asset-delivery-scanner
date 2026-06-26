<template>
  <div class="view-wrapper home-view">
    <div class="view-header">About View</div>
    <p class="welcome-text">About application.</p>
    <button class="action-btn" @click="handleBack">Back</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { storeActions } from '../util/store.js';

const router = useRouter();

const handleBack= () => {
  console.log("views/About.vue:handleBack()");
  // 2. Clear browser destination track paths immediately following state updates
  router.replace('/home');
};
</script>

