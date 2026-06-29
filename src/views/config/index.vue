<template>
  <div class="app-layout config-view">
    <MenuTop title="SERVER CONFIG" />
    <main class="app-content content-workspace">
      <form class="config-form" @submit.prevent="handleSaveConfig">
        <div class="form-group">
          <label class="form-label">OData Catalog Endpoint URL</label>
          <div class="input-container">
            <input type="url" v-model="localConfig.odataUrl" placeholder="http://localhost:4004/odata/v4/catalog" class="form-input" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Basic Auth Username</label>
          <div class="input-container">
            <input type="text" v-model="localConfig.username" placeholder="Enter username" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Basic Auth Password</label>
          <div class="input-container">
            <input type="password" v-model="localConfig.password" placeholder="Enter password" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Network Timeout(ms)</label>
          <div class="input-container">
            <input type="number" v-model.number="localConfig.networkTimeoutMs" placeholder="5000" class="form-input" required />
          </div>
        </div>
        <!--Field 5:Development Mock Data Toggle-->
        <div class="form-group toggle-field-row">
          <label class="form-label check-label">
            <input type="checkbox" v-model="localConfig.useDummyData" class="form-checkbox" />
            Activate Offline Development Mode(Use Dummy Data)
          </label>
        </div>

        <!--Connection Diagnostics Feedback Banner Panel-->
        <div v-if="testResult" class="status-banner" :class="testResult.status">{{ testResult.message }}</div>
        <div v-if="saveSuccess" class="status-banner success">Configuration parameters updated and locked successfully!</div>

        <!--Diagnostic Testing Control Trigger-->
        <button type="button" class="connectivity-test-btn" :disabled="isTesting" @click="runDiagnostics">
          <span v-if="isTesting" class="spinner-icon"></span>
          {{ isTesting ? 'Pinging CAP Server...' : 'Test Connection' }}
        </button>

        <button type="submit" class="save-config-btn">
          <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Save Configuration
        </button>

        <!-- Share Configuration Action -->
        <button type="button" class="share-qr-btn" @click="toggleQrCode">
          <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
            <polygon points="14 14 17 14 17 17 14 17"></polygon>
            <polygon points="17 17 21 17 21 21 17 21"></polygon>
            <polygon points="14 19 17 19 17 21 14 21"></polygon>
            <polygon points="19 14 21 14 21 17 19 17"></polygon>
          </svg>
          Share Configuration as QR Code
        </button>

        <!-- Scan QR Configuration -->
        <button type="button" class="share-qr-btn" @click="isQrScannerOpen = true">
          <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
            <polygon points="14 14 17 14 17 17 14 17"></polygon>
            <polygon points="17 17 21 17 21 21 17 21"></polygon>
            <polygon points="14 19 17 19 17 21 14 21"></polygon>
            <polygon points="19 14 21 14 21 17 19 17"></polygon>
          </svg>
          Scan QR Code
        </button>
      </form>
    </main>

    <!-- Full-Screen Interactive Overlay Panel -->
    <div v-if="showQrCode" class="qr-overlay" @click="toggleQrCode">
      <div class="qr-modal-card">
        <div class="qr-wrapper">
          <QrCode :text="qrCodeValue" :size="260" color="#FFFFFF" />
        </div>
        <p class="qr-caption">Scan to transfer settings</p>
        <p class="qr-sub-caption">Click anywhere to close</p>
      </div>
    </div>

    <QrCodeScanner 
      v-if="isQrScannerOpen" 
      @close="closeScanner"
      @scanned="handleScan"
    />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import MenuTop from '../../components/menutop/index.vue';
import QrCode from '../../components/qrcode/generator/index.vue';
import QrCodeScanner from '../../components/qrcode/scanner/index.vue';
import { store, storeActions } from '../../util/store.js';
import { testODataConnection } from '../../util/odata.js';

const router = useRouter();
const saveSuccess = ref(false);
const isTesting = ref(false);
const testResult = ref(null);
const showQrCode = ref(false);
const isQrScannerOpen = ref(false);
const closeScanner = () => {
	isQrScannerOpen.value = false;
};
const handleScan = (scanData) => {
  console.log("Applying scanned parameters to local config form:", scanData);

  // Safely guard against empty or corrupted scan payloads
  if (scanData) {
    // Direct mapping to update your form's reactive input elements
    if (scanData.odataUrl) localConfig.value.odataUrl = scanData.odataUrl;
    if (scanData.username) localConfig.value.username = scanData.username;
    if (scanData.password) localConfig.value.password = scanData.password;
    if (scanData.networkTimeoutMs) localConfig.value.networkTimeoutMs = Number(scanData.networkTimeoutMs);
    
    // Explicitly handle Boolean state updates
    if (typeof scanData.useDummyData !== 'undefined') {
      localConfig.value.useDummyData = !!scanData.useDummyData;
    }
  }

  // Dismiss the fullscreen camera scanner overlay
  isQrScannerOpen.value = false;
};

const localConfig = ref({
  odataUrl: store.config.odataUrl,
  username: store.config.username,
  password: store.config.password,
  networkTimeoutMs: store.config.networkTimeoutMs,
  useDummyData: store.config.useDummyData
});

const qrCodeValue = computed(() => {
  return JSON.stringify(localConfig.value);
});

const toggleQrCode = () => {
  showQrCode.value = !showQrCode.value;
};

const runDiagnostics = async () => {
  isTesting.value = true;
  testResult.value = null;
  storeActions.saveODataConfig(localConfig.value.odataUrl, localConfig.value.username, localConfig.value.password, localConfig.value.networkTimeoutMs);
  try {
    const res = await testODataConnection();
    testResult.value = { status: 'success', message: res.message };
  } catch (error) {
    testResult.value = { status: 'failed', message: `Connection Failed:${error.message}` };
  } finally {
    isTesting.value = false;
  }
};

const handleSaveConfig = () => {
  storeActions.saveODataConfig(localConfig.value.odataUrl, localConfig.value.username, localConfig.value.password, localConfig.value.networkTimeoutMs, localConfig.value.useDummyData);
  saveSuccess.value = true;
  setTimeout(() => {
    saveSuccess.value = false;
    router.push('/home');
  }, 1200);
};
</script>

<style scoped>
.config-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  box-sizing: border-box;
  position: relative;
}
.content-workspace {
  padding-top: 5.5rem !important;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}
.config-form {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 0 auto;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted, #94a3b8);
  text-align: left;
}
.input-container {
  width: 100%;
}
.form-input {
  width: 100%;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  border-radius: 6px;
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
  box-sizing: border-box;
  outline: none;
}
.form-input:focus {
  border-color: var(--accent-color);
}
.status-banner {
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.3;
}
.status-banner.success {
  background-color: rgba(66, 184, 131, 0.1);
  border: 1px solid rgba(66, 184, 131, 0.3);
  color: var(--accent-color);
}
.status-banner.failed {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}
.connectivity-test-btn {
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-main);
  font-size: 0.95rem;
  font-weight: bold;
  padding: 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-sizing: border-box;
}
.connectivity-test-btn:active {
  background-color: var(--border-color);
}
.save-config-btn {
  background-color: #00e676;
  color: #121214;
  border: none;
  border-radius: 6px;
  padding: 0.9rem;
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0, 230, 118, 0.15);
}
.share-qr-btn {
  background-color: transparent;
  border: 1px solid var(--accent-color, #00e676);
  color: var(--accent-color, #00e676);
  font-size: 0.95rem;
  font-weight: bold;
  padding: 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-sizing: border-box;
  margin-top: 0.5rem;
}
.share-qr-btn:active {
  background-color: rgba(0, 230, 118, 0.1);
}

/* Full-Screen Semi-Transparent Overlay */
.qr-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
  box-sizing: border-box;
  cursor: pointer;
}

/* Centered Layout Card with Minor Padding */
.qr-modal-card {
  background-color: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 320px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

.qr-wrapper {
  padding: 0.5rem;
  background-color: transparent;
}

.qr-caption {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  text-align: center;
}

.qr-sub-caption {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
  text-align: center;
}

.spinner-icon {
  width: 14px;
  height: 14px;
  border: 2px solid var(--text-muted);
  border-top-color: var(--text-main);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

