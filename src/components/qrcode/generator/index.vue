<script setup>
import { computed } from 'vue'
import { getMatrix, renderPath } from '../../../lib/qr-code-generator/qr-code-generator-lib.mjs'


// Define the component properties
const props = defineProps({
  text: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#888888'
  },
  size: {
    type: [Number, String],
    default: 200
  }
})

// Compute the SVG path data and bounds whenever text changes
const qrSvgData = computed(() => {
  if (!props.text) return null
  try {
    const matrix = getMatrix(props.text)
    return renderPath(matrix)
  } catch (error) {
    console.error('Failed to generate QR Code:', error)
    return null
  }
})
</script>

<template>
  <div class="qr-container" :style="{ width: size + 'px', height: size + 'px' }">
    <!-- Notice the stroke and stroke-width properties added here per library specifications -->
    <svg
      v-if="qrSvgData"
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="`0 0 ${qrSvgData.dim} ${qrSvgData.dim}`"
      :stroke="color"
      stroke-width="1.05"
      shape-rendering="crispEdges"
    >
      <path :d="qrSvgData.d" />
    </svg>
  </div>
</template>

<style scoped>
.qr-container svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>

