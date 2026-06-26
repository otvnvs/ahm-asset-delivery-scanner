<template>
  <div class="view-wrapper details-wrapper">
    <div class="view-header">Edit {{ entityName }} Item</div>

    <div v-if="loading" class="status-box text-center">Loading record fields properties...</div>
    <div v-else-if="errorMessage && Object.keys(formData).length === 0" class="status-box error-txt text-center">{{ errorMessage }}</div>

    <div v-else class="form-container">
      <form @submit.prevent="handleUpdateSubmit" class="details-form" novalidate>
        
        <div v-for="(value, key) in formData" :key="key" class="form-group">
          <label :class="{ 'is-key-label': isPrimaryKeyField(key), 'is-required-label': isFieldRequired(key) }">
            {{ key }} 
            <span v-if="isPrimaryKeyField(key)">[Immutable Key]</span>
            <span v-else-if="isFieldRequired(key)" class="marker-lbl">*</span>
            <span class="type-hint-lbl">({{ getFieldTypeHint(key) }})</span>
          </label>
          
          <!-- TYPE SEPARATION 1: Render boolean elements as dropdown select fields -->
          <select 
            v-if="schemaRules[key]?.type === 'Edm.Boolean'"
            v-model="formData[key]"
            class="minimal-details-select"
            :class="{ 'input-error-state': formErrors[key] }"
            :disabled="processing"
            @change="clearFieldWarning(key)"
          >
            <option value="">-- Select Boolean --</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>

          <!-- TYPE SEPARATION 2: Render dynamic GUID layouts with an inline helper button -->
          <div v-else-if="schemaRules[key]?.type === 'Edm.Guid'" class="input-with-action-row">
            <input 
              type="text" 
              v-model="formData[key]" 
              class="minimal-details-input"
              :class="{ 'input-error-state': formErrors[key] }"
              :disabled="isPrimaryKeyField(key) || processing"
              @input="clearFieldWarning(key)"
            />
            <button 
              v-if="!isPrimaryKeyField(key)"
              type="button" 
              class="inline-action-btn icon-only-btn" 
              :disabled="processing"
              @click="autofillFieldWithGuid(key)"
              title="Generate unique identifier string"
            >
              <svg class="gear-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
            </button>
          </div>

          <!-- TYPE SEPARATION 3: Render standard text fields for all other parameters -->
          <input 
            v-else
            type="text" 
            v-model="formData[key]" 
            class="minimal-details-input"
            :class="{ 'input-error-state': formErrors[key] }"
            :disabled="isPrimaryKeyField(key) || processing"
            @input="clearFieldWarning(key)"
          />
          
          <p v-if="formErrors[key]" class="field-error-msg">{{ formErrors[key] }}</p>
        </div>

        <p v-if="errorMessage" class="status-box error-txt text-center">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-txt">{{ successMessage }}</p>

        <div class="button-row">
          <button type="submit" class="action-btn update-btn" :disabled="processing">
            {{ processing ? 'Validating...' : 'Save Updates' }}
          </button>
          <button type="button" class="action-btn cancel-btn" @click="handleBack" :disabled="processing">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store } from '../util/store.js';
import { fetchODataRecordByKeys, updateODataRecord, fetchValidationRules } from '../util/sapService.js';
import { generateRandomGuid } from '../util/guid.js';

const route = useRoute();
const router = useRouter();

const entityName = route.params.entityName;
const loading = ref(true);
const processing = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const formData = reactive({});
const formErrors = reactive({});
const primaryKeyNames = ref([]);
const schemaRules = ref({});
let originalData = {};

const isPrimaryKeyField = (fieldName) => primaryKeyNames.value.includes(fieldName);
const isFieldRequired = (field) => schemaRules.value[field]?.required === true;
const clearFieldWarning = (field) => { formErrors[field] = ''; };

const autofillFieldWithGuid = (fieldName) => {
  formData[fieldName] = generateRandomGuid();
  clearFieldWarning(fieldName);
};

const getFieldTypeHint = (field) => {
  const type = schemaRules.value[field]?.type || '';
  return type ? type.replace('Edm.', '') : 'Text';
};

onMounted(async () => {
  const targetKeys = { ...route.query };
  primaryKeyNames.value = Object.keys(targetKeys);

  if (primaryKeyNames.value.length === 0) {
    errorMessage.value = "Missing structural row identity parameter references inside route.";
    loading.value = false;
    return;
  }

  try {
    const { odataUrl, username, password } = store.config || {};
    
    // Download validation guidelines and raw record payload side-by-side
    schemaRules.value = await fetchValidationRules(odataUrl, username, password, entityName);
    const freshRecordData = await fetchODataRecordByKeys(odataUrl, username, password, entityName, targetKeys);
    
    for (const [key, value] of Object.entries(freshRecordData)) {
      if (!key.startsWith('@') && !key.startsWith('__') && typeof value !== 'object') {
        const stringVal = value !== null && value !== undefined ? String(value) : '';
        formData[key] = stringVal;
        originalData[key] = stringVal;
        formErrors[key] = '';
      }
    }

    loading.value = false;
  } catch (err) {
    console.error("[DETAILS MOUNT FETCH BREAKDOWN]:", err);
    errorMessage.value = "Failed to download specific record properties from SAP server.";
    loading.value = false;
  }
});

// TYPE-AWARE LOCAL VALIDATOR ENGINE
const validateFormInputData = () => {
  let isValid = true;
  Object.keys(formData).forEach(field => {
    formErrors[field] = '';
    const rawValue = String(formData[field]).trim();
    const rule = schemaRules.value[field];

    if (rule?.required && rawValue === '') {
      formErrors[field] = 'This field is required.';
      isValid = false;
      return;
    }

    if (rawValue !== '') {
      const type = rule?.type || '';

      if (type === 'Edm.Guid') {
        const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!guidRegex.test(rawValue)) {
          formErrors[field] = 'Must match valid GUID notation framework.';
          isValid = false;
        }
      }
      else if (rule?.isNumeric) {
        if (isNaN(rawValue)) {
          formErrors[field] = 'Must be a clean numerical input.';
          isValid = false;
        }
      }
      else if (type === 'Edm.Date') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(rawValue) || isNaN(Date.parse(rawValue))) {
          formErrors[field] = 'Must match valid YYYY-MM-DD calendar layout.';
          isValid = false;
        }
      }
      else if (rule?.maxLength && rawValue.length > rule.maxLength) {
        formErrors[field] = `Exceeds max field length (${rule.maxLength} max).`;
        isValid = false;
      }
    }
  });
  return isValid;
};

const handleUpdateSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  
  if (!validateFormInputData()) {
    errorMessage.value = 'Form contains validation errors.';
    return;
  }

  processing.value = true;
  const { odataUrl, username, password } = store.config || {};
  
  const activeKeys = {};
  primaryKeyNames.value.forEach(keyName => {
    activeKeys[keyName] = route.query[keyName];
  });

  // DELTA ENGINE: Package modified fields strictly
  const deltaPayload = {};
  for (const [key, value] of Object.entries(formData)) {
    if (isPrimaryKeyField(key)) continue;

    if (value !== originalData[key]) {
      const type = schemaRules.value[key]?.type || '';
      
      if (type === 'Edm.Boolean') {
        deltaPayload[key] = value === 'true';
      } else if (schemaRules.value[key]?.isNumeric) {
        deltaPayload[key] = Number(value);
      } else {
        deltaPayload[key] = value;
      }
    }
  }

  if (Object.keys(deltaPayload).length === 0) {
    successMessage.value = "No fields changed. Saved values remain matching server records.";
    setTimeout(() => {
      processing.value = false;
      handleBack();
    }, 1000);
    return;
  }

  console.log(`[DATA UPDATE SUBMIT] Isolated delta changes payload:`, deltaPayload);

  const result = await updateODataRecord(odataUrl, username, password, entityName, activeKeys, deltaPayload);
  
  if (result.success) {
    successMessage.value = "Updates applied successfully.";
    setTimeout(() => {
      processing.value = false;
      handleBack();
    }, 1000);
  } else {
    errorMessage.value = `Failed to save changes: ${result.message}`;
    processing.value = false;
  }
};

const handleBack = () => {
  router.push(`/services/${entityName}`);
};
</script>

<style scoped>
.details-wrapper { text-align: left; box-sizing: border-box; padding: 0 10px; width: 100%; }
.form-container { margin-top: 20px; width: 100%; }
.details-form { width: 100%; display: flex; flex-direction: column; }
.form-group { margin-bottom: 18px; display: flex; flex-direction: column; }

.form-group label { font-family: monospace; font-size: 11px; text-transform: uppercase; color: #888888; letter-spacing: 0.5px; margin-bottom: 6px; }
.form-group label.is-key-label { color: #555555; }
.is-required-label { color: #ffffff !important; }
.marker-lbl { color: #e63946; font-weight: bold; margin-left: 2px; }
.type-hint-lbl { color: #555555; font-size: 10px; text-transform: lowercase; margin-left: 6px; }

.minimal-details-input, .minimal-details-select {
  font-family: monospace;
  background-color: #1a1a1a;
  color: #ffffff;
  border: 1px solid #333333;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  border-radius: 4px;
}
.minimal-details-input:focus:not(:disabled), .minimal-details-select:focus { border-color: #4eb5f1; background-color: #222222; }
.minimal-details-input:disabled { background-color: #111111; color: #666666; border-style: dashed; cursor: not-allowed; }

.input-with-action-row { display: flex; gap: 8px; width: 100%; align-items: center; }
.icon-only-btn { display: flex; align-items: center; justify-content: center; padding: 12px !important; }
.inline-action-btn { font-family: monospace; font-size: 11px; background-color: #2a2a2a; color: #4eb5f1; border: 1px solid #444444; padding: 12px 14px; border-radius: 4px; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.inline-action-btn:hover:not(:disabled) { background-color: #3a3a3a; border-color: #4eb5f1; }
.inline-action-btn:hover:not(:disabled) .gear-icon { transform: rotate(45deg); }
.gear-icon { transition: transform 0.2s ease; }

.input-error-state { border-color: #e63946 !important; background-color: rgba(230, 57, 70, 0.05) !important; }
.field-error-msg { font-family: monospace; font-size: 11px; color: #e63946; margin: 4px 0 0 0; line-height: 1.2; }

.button-row { margin-top: 30px; display: flex; gap: 12px; }
.action-btn { font-family: monospace; font-size: 14px; padding: 12px 16px; cursor: pointer; text-align: center; border-radius: 4px; border: none; flex: 1; }
.update-btn { background-color: #ffffff; color: #000000; font-weight: bold; }
.update-btn:hover:not(:disabled) { background-color: #dddddd; }
.update-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.cancel-btn { background-color: transparent; color: #888888; border: 1px solid #333333; }
.cancel-btn:hover { color: #ffffff; border-color: #555555; background: rgba(255, 255, 255, 0.05); }

.status-box { font-family: monospace; font-size: 13px; color: #888; padding: 25px 0; }
.error-txt { color: #e63946; }
.success-txt { font-family: monospace; font-size: 13px; color: #4eb5f1; margin: 10px 0; }
.text-center { text-align: center; }
</style>

