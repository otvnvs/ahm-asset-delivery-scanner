<template>
  <div class="view-wrapper new-wrapper">
    <div class="view-header">New {{ entityName }} Record</div>

    <div v-if="loading" class="status-box text-center">Downloading entity constraints...</div>
    <div v-else-if="errorMessage && fieldKeys.length === 0" class="status-box error-txt text-center">{{ errorMessage }}</div>

    <div v-else class="form-container">
      <form @submit.prevent="handleCreateSubmit" class="new-form" novalidate>
        
        <div v-for="field in fieldKeys" :key="field" class="form-group">
          <label :class="{ 'is-required-label': isFieldRequired(field) }">
            {{ field }} 
            <span v-if="isFieldRequired(field)" class="marker-lbl">*</span>
            <span class="type-hint-lbl">({{ getFieldTypeHint(field) }})</span>
          </label>
          
          <!-- TYPE SEPARATION 1: Render boolean elements as clean dropdowns -->
          <select 
            v-if="schemaRules[field]?.type === 'Edm.Boolean'"
            v-model="formData[field]"
            class="minimal-new-select"
            :class="{ 'input-error-state': formErrors[field] }"
            :disabled="processing"
            @change="clearFieldWarning(field)"
          >
            <option value="">-- Select Boolean --</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>

          <!-- TYPE SEPARATION 2: Render dynamic GUID layouts with an inline helper button -->
          <div v-else-if="schemaRules[field]?.type === 'Edm.Guid'" class="input-with-action-row">
            <input 
              type="text" 
              v-model="formData[field]" 
              class="minimal-new-input"
              :class="{ 'input-error-state': formErrors[field] }"
              :disabled="processing"
              :placeholder="getFieldPlaceholder(field)"
              @input="clearFieldWarning(field)"
            />
            <button 
              type="button" 
              class="inline-action-btn" 
              :disabled="processing"
              @click="autofillFieldWithGuid(field)"
            >
  <svg class="gear-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
  </svg>
            </button>
          </div>

          <!-- TYPE SEPARATION 3: Render standard inputs for all other fields -->
          <input 
            v-else
            type="text" 
            v-model="formData[field]" 
            class="minimal-new-input"
            :class="{ 'input-error-state': formErrors[field] }"
            :disabled="processing"
            :placeholder="getFieldPlaceholder(field)"
            @input="clearFieldWarning(field)"
          />
          
          <p v-if="formErrors[field]" class="field-error-msg">{{ formErrors[field] }}</p>
        </div>

        <p v-if="errorMessage" class="status-box error-txt">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-txt">{{ successMessage }}</p>

        <div class="button-row">
          <button type="submit" class="action-btn create-btn" :disabled="processing">
            {{ processing ? 'Validating...' : 'Create Entry' }}
          </button>
          <button type="button" class="action-btn cancel-btn" @click="handleBack">
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
import { createODataRecord, fetchValidationRules } from '../util/sapService.js';
import { generateRandomGuid } from '../util/guid.js'; // New Import Entry

const route = useRoute();
const router = useRouter();

const entityName = route.params.entityName;
const loading = ref(true);
const processing = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const formData = reactive({});
const formErrors = reactive({});
const fieldKeys = ref([]);
const schemaRules = ref({});

const isFieldRequired = (field) => schemaRules.value[field]?.required === true;
const clearFieldWarning = (field) => { formErrors[field] = ''; };

// NEW: Generates and maps a fresh GUID directly into the reactive input field string space
const autofillFieldWithGuid = (fieldName) => {
  formData[fieldName] = generateRandomGuid();
  clearFieldWarning(fieldName);
  console.log(`[GUID HELPER] Injected token string into field properties node: ${fieldName}`);
};

const getFieldTypeHint = (field) => {
  const type = schemaRules.value[field]?.type || '';
  return type.replace('Edm.', '');
};

const getFieldPlaceholder = (field) => {
  const type = schemaRules.value[field]?.type || '';
  if (type === 'Edm.Guid') return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
  if (type === 'Edm.Date') return 'YYYY-MM-DD';
  if (type === 'Edm.DateTimeOffset') return 'YYYY-MM-DDTHH:MM:SSZ';
  if (schemaRules.value[field]?.isNumeric) return 'Enter number';
  return 'Enter text';
};

onMounted(async () => {
  try {
    const fieldsStr = route.query._fields;
    if (!fieldsStr) throw new Error("Missing structural headers reference.");
    
    fieldKeys.value = JSON.parse(fieldsStr);
    fieldKeys.value.forEach(key => {
      formData[key] = '';
      formErrors[key] = '';
    });

    const { odataUrl, username, password } = store.config || {};
    schemaRules.value = await fetchValidationRules(odataUrl, username, password, entityName);
    
    loading.value = false;
  } catch (err) {
    console.error(err);
    loading.value = false;
  }
});

const validateFormInputData = () => {
  let isValid = true;
  
  fieldKeys.value.forEach(field => {
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

const handleCreateSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  
  if (!validateFormInputData()) {
    errorMessage.value = 'Form contains validation errors.';
    return;
  }

  processing.value = true;
  const { odataUrl, username, password } = store.config || {};
  const payloadToCreate = {};

  for (const [key, value] of Object.entries(formData)) {
    const trimmedVal = String(value).trim();
    if (trimmedVal === '') continue;

    const type = schemaRules.value[key]?.type || '';

    if (type === 'Edm.Boolean') {
      payloadToCreate[key] = trimmedVal === 'true';
    } else if (schemaRules.value[key]?.isNumeric) {
      payloadToCreate[key] = Number(trimmedVal);
    } else {
      payloadToCreate[key] = trimmedVal;
    }
  }

  const result = await createODataRecord(odataUrl, username, password, entityName, payloadToCreate);
  
  if (result.success) {
    successMessage.value = "Record generated successfully.";
    setTimeout(() => {
      processing.value = false;
      handleBack();
    }, 1000);
  } else {
    errorMessage.value = `Creation rejected: ${result.message}`;
    processing.value = false;
  }
};

const handleBack = () => { router.push(`/services/${entityName}`); };
</script>

<style scoped>
.new-wrapper { text-align: left; box-sizing: border-box; padding: 0 10px; width: 100%; }
.form-container { margin-top: 20px; width: 100%; }
.new-form { width: 100%; display: flex; flex-direction: column; }
.form-group { margin-bottom: 18px; display: flex; flex-direction: column; }

.form-group label { font-family: monospace; font-size: 11px; text-transform: uppercase; color: #888888; letter-spacing: 0.5px; margin-bottom: 6px; }
.is-required-label { color: #ffffff !important; }
.marker-lbl { color: #e63946; font-weight: bold; margin-left: 2px; }
.type-hint-lbl { color: #555555; font-size: 10px; text-transform: lowercase; margin-left: 6px; }

.minimal-new-input {
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
.minimal-new-input:focus { border-color: #38b000; background-color: #222222; }

/* Inverted high-visibility error field borders */
.input-error-state {
  border-color: #e63946 !important;
  background-color: rgba(230, 57, 70, 0.05) !important;
}
.field-error-msg {
  font-family: monospace;
  font-size: 11px;
  color: #e63946;
  margin: 4px 0 0 0;
  line-height: 1.2;
}

.button-row { margin-top: 30px; display: flex; gap: 12px; }
.action-btn { font-family: monospace; font-size: 14px; padding: 12px 16px; cursor: pointer; text-align: center; border-radius: 4px; border: none; flex: 1; }

.create-btn { background-color: #ffffff; color: #000000; font-weight: bold; }
.create-btn:hover:not(:disabled) { background-color: #dddddd; }
.create-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.cancel-btn { background-color: transparent; color: #888888; border: 1px solid #333333; }
.cancel-btn:hover { color: #ffffff; border-color: #555555; background: rgba(255, 255, 255, 0.05); }

.status-box { font-family: monospace; font-size: 13px; color: #e63946; padding: 15px 0 5px 0; margin: 0; }
.error-txt { color: #e63946; }
.success-txt { font-family: monospace; font-size: 13px; color: #a8ffb2; margin: 10px 0; }
.text-center { text-align: center; }
.minimal-new-select {
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
  cursor: pointer;
}
.minimal-new-select:focus {
  border-color: #38b000;
  background-color: #222222;
}
/* Inline alignment row for input and action button */
.input-with-action-row {
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: center;
}

/* Minimalist Stark Inline Generation Trigger Action link */
.inline-action-btn {
  font-family: monospace;
  font-size: 11px;
  background-color: #2a2a2a;
  color: #4eb5f1; /* Matches your theme highlight accent */
  border: 1px solid #444444;
  padding: 12px 14px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.inline-action-btn:hover:not(:disabled) {
  background-color: #3a3a3a;
  border-color: #4eb5f1;
}
.inline-action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.minimal-new-select {
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
  cursor: pointer;
}
.minimal-new-select:focus { border-color: #38b000; background-color: #222222; }
/* Restyle button container frame to wrap the gear icon precisely */
.icon-only-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px !important;
}

/* Subtle clockwise spinning hover animation to indicate interactive action state */
.inline-action-btn:hover:not(:disabled) .gear-icon {
  transform: rotate(45deg);
  transition: transform 0.2s ease;
}

.gear-icon {
  transition: transform 0.2s ease;
}
</style>
