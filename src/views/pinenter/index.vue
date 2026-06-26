<template>
  <div class="view-wrapper">
    <div class="view-header">Locked</div>
    
    <PinMobile 
      ref="pinEntryRef"
      title="Enter PIN to Unlock" 
      :error-message="errorMessage" 
      @submit="handleVerifyPin" 
    />

    <!-- Minimalist Forgot PIN reset trigger link -->
    <div class="forgot-container">
      <button class="forgot-btn" @click="handleForgotPin">
        Forgot PIN?
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { store, storeActions } from '../../util/store.js';
import PinMobile from '../../components/pinmobile/PinMobile.vue';

const router = useRouter();
const pinEntryRef = ref(null);
const errorMessage = ref('');

const handleVerifyPin = (enteredPin) => {
  if (String(enteredPin) === String(store.appPin)) {
    errorMessage.value = '';
    storeActions.login();
    router.push('/home'); 
  } else {
    errorMessage.value = 'Incorrect PIN code.';
    if (pinEntryRef.value) {
      pinEntryRef.value.clearAll();
    }
  }
};

// Clear out application data and bounce back to setup phase
const handleForgotPin = () => {
  const confirmReset = confirm("Are you sure you want to reset your PIN? This will wipe your saved access settings.");
  
  if (confirmReset) {
    // 1. Hand off all database mutation loops to the store action context
    storeActions.resetStore();
    
    // 2. Simply switch the window viewport page location location path string
    router.push('/setup');
  }
};

</script>

<style scoped>
.forgot-container {
  margin-top: 20px;
  text-align: center;
}
.forgot-btn {
  background: none;
  border: none;
  color: #666;
  text-decoration: underline;
  font-family: monospace;
  font-size: 12px;
  cursor: pointer;
  padding: 5px 10px;
}
.forgot-btn:hover {
  color: #000;
}
</style>
