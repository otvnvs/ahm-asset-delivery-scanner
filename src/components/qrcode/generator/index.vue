<script setup>
import { computed } from 'vue'
import { renderSVG } from 'uqr'

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

const qrSvgHtml = computed(() => {
  if (!props.text) return ''
  try {
    return renderSVG(props.text, { blackColor: props.color })
  } catch (error) {
    console.error('Failed to generate QR Code:', error)
    return ''
  }
})
</script>

<template>
  <div
    class="qr-container"
    :style="{ width: size + 'px', height: size + 'px' }"
    v-html="qrSvgHtml"
  />
</template>

<style scoped>
.qr-container :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>

