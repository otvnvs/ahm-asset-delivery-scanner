<template>
  <div class="view-wrapper">
    <div class="view-header">Setup Required</div>
    <PinMobile 
      title="Create New PIN" 
      @submit="handleSetupPin" 
    />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { storeActions } from '../../util/store.js';
import PinMobile from '../../components/pinmobile/PinMobile.vue';

const router = useRouter();

const handleSetupPin = (chosenPin) => {
  storeActions.saveNewPin(chosenPin);
  router.push('/home'); // Send directly to dashboard home view
};
</script>
