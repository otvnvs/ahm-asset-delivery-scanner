<template>
  <div class="minimal-container">
    <router-view></router-view>
    <!--<RefreshButton />-->
  </div>
  <CustomDialog />
  <BarcodeGuardian />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

//import RefreshButton from './components/refreshbutton/RefreshButton.vue';
import CustomDialog from './components/dialog/CustomDialog.vue';
import BarcodeGuardian from './components/scanner/BarcodeGuardian.vue';
import { initWindowOverrides } from './components/dialog/useDialog.js';
import { sendWorkerMessage, listenForWorkerMessages } from './util/serviceWorker/serviceWorker.js';



const workerReplyLog = ref('');

// Callback function to handle data emitted from the background worker thread
function handleIncomingWorkerData(messageObject) {
  if (messageObject.type === 'PONG_RESPONSE') {
    workerReplyLog.value = 'Received token from worker thread at: ' + messageObject.payload.timestamp;
  }
}

function triggerWorkerPing() {
  // Fire data bundle packet down across the browser bridge channel
  sendWorkerMessage({
    type: 'PING_BACKEND_THREAD',
    payload: { sourcePage: 'HomeViewDashboard' }
  });
}

onMounted(() => {
  initWindowOverrides();
  listenForWorkerMessages(handleIncomingWorkerData);
  initWindowOverrides();
});


</script>

<style>
/* Shared minimalistic design layouts */
.minimal-container {
	/*
  font-family: monospace;
  max-width: 320px;
  margin: 40px auto;
  padding: 10px;
  text-align: center;
	*/
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

