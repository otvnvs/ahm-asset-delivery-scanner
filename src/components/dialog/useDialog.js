import { ref } from 'vue';

// Use an isolated global key to share state between environments
const GLOBAL_KEY = '__VUE_CUSTOM_DIALOG_STATE__';

if (!window[GLOBAL_KEY]) {
  window[GLOBAL_KEY] = {
    isOpen: ref(false),
    type: ref('alert'),
    message: ref(''),
    promptValue: ref(''),
    resolvePromise: null
  };
}

const state = window[GLOBAL_KEY];

const openDialog = (dialogType, msg, defaultPrompt = '') => {
  state.type.value = dialogType;
  state.message.value = msg;
  state.promptValue.value = defaultPrompt;
  state.isOpen.value = true;
  
  return new Promise((resolve) => {
    state.resolvePromise = resolve;
  });
};

export function useDialog() {
  const handleAction = (status) => {
    state.isOpen.value = false;
    if (!state.resolvePromise) return;

    if (state.type.value === 'alert') {
      state.resolvePromise(undefined);
    } else if (state.type.value === 'confirm') {
      state.resolvePromise(status === 'confirm');
    } else if (state.type.value === 'prompt') {
      state.resolvePromise(status === 'confirm' ? state.promptValue.value : null);
    }
    state.resolvePromise = null;
  };

  return { 
    isOpen: state.isOpen, 
    type: state.type, 
    message: state.message, 
    promptValue: state.promptValue, 
    open: openDialog, 
    handleAction 
  };
}

export function initWindowOverrides() {
  
  window.alert = (msg) => {
    openDialog('alert', msg);
  };

  window.confirm = async (msg) => {
    return await openDialog('confirm', msg);
  };

  window.prompt = async (msg, defaultPrompt = '') => {
    return await openDialog('prompt', msg, defaultPrompt);
  };
}

