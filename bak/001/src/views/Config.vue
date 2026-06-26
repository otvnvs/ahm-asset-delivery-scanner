<template>
  <div class="view-wrapper config-wrapper">
    <div class="view-header">Configuration</div>
    
    <form @submit.prevent="handleSave" class="config-form">
      <div class="form-group">
        <label>OData URL</label>
        <input type="url" v-model="form.odataUrl" placeholder="http://localhost:4004/odata/v4/catalog/" required />
      </div>

      <div class="form-group">
        <label>Username</label>
        <input type="text" v-model="form.username" placeholder="Enter username" required />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input type="password" v-model="form.password" placeholder="Enter password" required />
      </div>

      <!-- NEW: CONFIGURABLE NETWORK TIMEOUT INPUT FIELD -->
      <!-- ENHANCED: Stylized Network Timeout Form Field Block -->
      <div class="form-group">
        <label>Network Timeout (Milliseconds)</label>
        <div class="timeout-stepper-wrapper">
          <button type="button" class="stepper-arrow-btn" @click="decrementTimeout">-</button>
          <input 
            type="number" 
            v-model="form.networkTimeoutMs" 
            placeholder="5000" 
            min="100" 
            step="50" 
            required 
            class="stepper-number-input"
          />
          <button type="button" class="stepper-arrow-btn" @click="incrementTimeout">+</button>
        </div>
      </div>

      <!-- Minimalist Offline Mode Network Simulator Toggle -->
      <div class="form-group toggle-group" :class="{ 'sim-active': store.simulatedOffline }">
        <label class="toggle-label">
          <span>Simulate Offline Mode</span>
          <span class="status-indicator">
            {{ store.simulatedOffline ? '[ OFFLINE ]' : '[ ONLINE ]' }}
          </span>
        </label>
        <div class="toggle-switch-wrapper">
          <input 
            type="checkbox" 
            id="offlineToggle" 
            :checked="store.simulatedOffline"
            @change="storeActions.toggleNetworkSimulation"
            class="hidden-checkbox"
          />
          <label for="offlineToggle" class="switch-chassis">
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>

      <p v-if="testResultStatus" class="status-txt" :class="{ 'success': testResultStatus.success }">
        {{ testResultStatus.message }}
      </p>

      <div class="button-row">
        <button type="submit" class="action-btn save-btn">Save Settings</button>
        <button type="button" class="action-btn test-btn" :disabled="isTesting" @click="handleTestConnection">
          {{ isTesting ? 'Testing...' : 'Test Connection' }}
        </button>
        <router-link to="/home" class="action-btn cancel-btn">Back</router-link>
      </div>
    </form>

    <p v-if="successMessage" class="success-txt saved-txt">{{ successMessage }}</p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { store, storeActions } from '../util/store.js';
import { testODataConnection } from '../util/sapService.js';

const successMessage = ref('');
const isTesting = ref(false);
const testResultStatus = ref(null);

const form = reactive({
  odataUrl: store.config.odataUrl || '',
  username: store.config.username || '',
  password: store.config.password || '',
  // Bind your form state model straight to the store configuration setting property
  networkTimeoutMs: store.config.networkTimeoutMs || 5000
});

const handleSave = () => {
  // Pass the chosen timeout length integer through the save action pipeline parameter
  storeActions.saveODataConfig(form.odataUrl, form.username, form.password, form.networkTimeoutMs);
  successMessage.value = 'Settings saved.';
  setTimeout(() => { successMessage.value = ''; }, 2000);
};

const handleTestConnection = async () => {
  if (!form.odataUrl || !form.username || !form.password) {
    testResultStatus.value = { success: false, message: 'Please complete all form fields first.' };
    return;
  }

  isTesting.value = true;
  testResultStatus.value = null;

  const result = await testODataConnection(form.odataUrl, form.username, form.password);
  
  testResultStatus.value = result;
  isTesting.value = false;
};
// Step handler callbacks for the timeout input field wrapper actions
const incrementTimeout = () => {
  form.networkTimeoutMs = (parseInt(form.networkTimeoutMs, 10) || 5000) + 100;
};

const decrementTimeout = () => {
  const current = parseInt(form.networkTimeoutMs, 10) || 5000;
  if (current > 1000) {
    form.networkTimeoutMs = current - 100;
  }
};
</script>

<style scoped>
.config-wrapper { text-align: left; box-sizing: border-box; padding: 0 10px; }
.config-form { margin-top: 25px; width: 100%; }
.form-group { margin-bottom: 20px; display: flex; flex-direction: column; }
.form-group label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; margin-bottom: 8px; font-family: monospace; }

/* Apply consistent terminal dark mode themes to your inputs */
.form-group input[type="url"], 
.form-group input[type="text"], 
.form-group input[type="password"],
.form-group input[type="number"] { font-family: monospace; background-color: #1a1a1a; color: #ffffff; border: 1px solid #333333; padding: 12px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; text-align: left; border-radius: 4px; }
.form-group input:focus { border-color: #555555; background-color: #222222; }

.toggle-group { flex-direction: row !important; justify-content: space-between; align-items: center; background-color: #161616; border: 1px solid #2d2d2d; padding: 14px; border-radius: 4px; margin-top: 25px; transition: all 0.2s ease; }
.toggle-group.sim-active { border-color: #e63946; background-color: #221213; }
.toggle-label { display: flex; flex-direction: column; margin-bottom: 0 !important; gap: 4px; }
.status-indicator { font-size: 12px; font-weight: bold; color: #38b000; font-family: monospace; }
.sim-active .status-indicator { color: #e63946; }

.toggle-switch-wrapper { position: relative; display: inline-block; width: 46px; height: 24px; }
.hidden-checkbox { opacity: 0; width: 0; height: 0; }
.switch-chassis { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333333; border: 1px solid #444444; border-radius: 24px; transition: .2s ease; }
.switch-slider { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: #888888; border-radius: 50%; transition: .2s ease; }
.hidden-checkbox:checked + .switch-chassis { background-color: #e63946; border-color: #e63946; }
.hidden-checkbox:checked + .switch-chassis .switch-slider { transform: translateX(22px); background-color: #ffffff; }

.button-row { margin-top: 30px; display: flex; gap: 10px; flex-wrap: wrap; }
.action-btn { font-family: monospace; font-size: 13px; padding: 12px 14px; cursor: pointer; text-align: center; box-sizing: border-box; border-radius: 4px; text-decoration: none; transition: all 0.2s; }
.save-btn { background: #ffffff; color: #000000; border: 1px solid #ffffff; font-weight: bold; }
.save-btn:hover { background: #dddddd; }
.test-btn { background: #2a2a2a; color: #ffffff; border: 1px solid #444444; }
.test-btn:hover:not(:disabled) { background: #3a3a3a; border-color: #666666; }
.test-btn:disabled { opacity: 0.5; }
.cancel-btn { background: transparent; color: #888888; border: 1px solid #333333; min-width: 60px; }
.cancel-btn:hover { color: #ffffff; border-color: #666666; background: rgba(255, 255, 255, 0.05); }

.status-txt { font-family: monospace; font-size: 12px; margin: 15px 0 0 0; color: #e63946; line-height: 1.4; }
.status-txt.success { color: #4eb5f1; }
.saved-txt { margin-top: 15px; color: #4eb5f1; font-family: monospace; font-size: 13px; }

/* ----------------------- */

/* --- STYLIZED TIMEOUT NUMBER STEPPER CONTROLS --- */
.timeout-stepper-wrapper {
  display: flex;
  width: 100%;
  background-color: #1a1a1a;
  border: 1px solid #333333;
  border-radius: 4px;
  overflow: hidden;
  box-sizing: border-box;
}

.stepper-number-input {
  font-family: monospace;
  background-color: transparent !important;
  color: #ffffff;
  border: none !important;
  padding: 12px;
  font-size: 14px;
  outline: none;
  flex: 1;
  text-align: center !important;
}

.stepper-arrow-btn {
  font-family: monospace;
  background-color: #262626;
  color: #c9c9c9;
  border: none;
  width: 45px;
  font-size: 16px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}
.stepper-arrow-btn:hover {
  background-color: #333333;
  color: #ffffff;
}
.stepper-arrow-btn:active {
  background-color: #1a1a1a;
}

/* Clear out native browser spinner buttons across WebKit and Firefox */
.stepper-number-input::-webkit-outer-spin-button,
.stepper-number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.stepper-number-input[type=number] {
  -moz-appearance: textfield;
}


/* --- CORRECTED TOGGLE SLIDER PLACEMENT ALIGNMENTS --- */
.switch-slider {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  /* FIXED: Absolute alignment adjustments using precise top coordinate properties */
  top: 0px; 
  background-color: #888888;
  border-radius: 50%;
  transition: .2s ease;
}

/* FIXED: Sliding path adjustment using single-axis translation transformations */
.hidden-checkbox:checked + .switch-chassis .switch-slider {
  transform: translateX(23px);
  background-color: #ffffff;
}

</style>

