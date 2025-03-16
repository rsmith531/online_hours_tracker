<!-- ~/components/base/ColonDisplay.vue -->

<template>
    <div style="
    position: relative; 
    display: inline-block;
    "
    :style="{
        width: 'fit-content',
        maxWidth: 'calc(100%/8)'
      }">
      <p  :class="{ 'text-5xl sm:text-8xl': true, 'colon': blink }">
        :
      </p>
      <p style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          user-select: none;
          opacity: 0.10;
        " class="
        text-5xl sm:text-8xl
        ">
        :
      </p>
    </div>
  </template>

<script setup>

defineProps({
  blink: {
    type: Boolean,
    required: false,
    default: true,
  },
});

</script>

<style scoped>

@keyframes blink {
  to {
    visibility: hidden;
  }
}

.colon {
  animation: blink 1s steps(2, start) infinite;
}

</style>