<template>
  <div class="scanner-fullscreen-shell">
    <!-- Header Controls Navigation Bar -->
    <header class="bar-header">
      <button type="button" @click="emitClose" class="nav-btn">← Back</button>
      <span class="bar-title">Live QR Scanner View</span>
      <div class="spacer-block"></div>
    </header>

    <!-- Main Live View Tracking Screen Frame -->
    <main class="view-viewport">
      <!-- Native HTML5 Video Element for live feed -->
      <video 
        ref="videoRef" 
        autoplay 
        playsinline 
        muted 
        class="webcam-stream"
      ></video>

      <!-- Targeted Capture Box Frame Overlay -->
      <div class="capture-target-box">
        <div class="target-corners"></div>
        <span class="laser-indicator"></span>
      </div>

      <!-- Live Error Feedback Banner if permissions are denied -->
      <div v-if="cameraError" class="error-banner">
        {{ cameraError }}
      </div>

      <p class="guide-text">Position the QR code inside the target window.</p>
    </main>

    <!-- Bottom Actions Control Hub -->
    <footer class="bar-footer">
      <button type="button" @click="emitFakeScan" class="mock-action-btn">
        Trigger Mock Scan Result
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const emit = defineEmits(['close', 'scanned']);

const videoRef = ref(null);
const cameraError = ref('');
let localStream = null;

onMounted(() => {
  startWebcam();
});

onBeforeUnmount(() => {
  stopWebcam();
});

const startWebcam = async () => {
  try {
    // Request access specifically to the rear hardware camera on mobile devices
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false // Audio track disabled
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStream = stream;

    // Bind the active video hardware stream directly to our HTML5 element
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (error) {
    console.error('Error accessing camera hardware:', error);
    cameraError.value = 'Camera access denied or unavailable.';
  }
};

const stopWebcam = () => {
  // Gracefully stop all background camera tracking paths to turn off device indicator lights
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
};

const emitClose = () => {
  stopWebcam();
  emit('close');
};

const emitFakeScan = () => {
  const mockPayload = {
    url: "https://localhost:4004/odata/v4/catalog",
    timestamp: Date.now()
  };
  emit('scanned', mockPayload);
};
</script>

<style scoped>
.scanner-fullscreen-shell {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #000000;
  color: #ffffff;
  z-index: 9999;
  box-sizing: border-box;
}

.bar-header {
  height: 60px;
  background-color: #111111;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid #222222;
  z-index: 10;
}

.nav-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
}

.bar-title {
  font-weight: bold;
}

.spacer-block {
  width: 50px;
}

.view-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
  position: relative;
  gap: 2rem;
  overflow: hidden;
}

/* Fullscreen absolute background webcam video alignment styling */
.webcam-stream {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

/* Bring focus bounding boxes and instructions out cleanly on top of webcams feeds */
.capture-target-box {
  width: 220px;
  height: 220px;
  border: 3px solid #94a3b8;
  border-radius: 12px;
  position: relative;
  background-color: rgba(0, 0, 0, 0.15);
  z-index: 2;
  box-shadow: 0 0 0 4000px rgba(0, 0, 0, 0.45); /* Creates a dim overlay mask surrounding target frame */
}

.laser-indicator {
  position: absolute;
  width: 90%;
  height: 2px;
  background-color: #00e676;
  top: 50%;
  left: 5%;
  box-shadow: 0 0 8px #00e676;
}

.guide-text {
  font-size: 0.9rem;
  color: #f1f5f9;
  margin: 0;
  text-align: center;
  z-index: 2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
}

.error-banner {
  position: absolute;
  top: 1rem;
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  z-index: 3;
}

.bar-footer {
  padding: 1.5rem;
  background-color: #111111;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.mock-action-btn {
  background-color: #ffffff;
  color: #000000;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
}

.mock-action-btn:active {
  background-color: #cccccc;
}
</style>

