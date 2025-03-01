<!-- NumberDisplay.vue -->

<template>
    <p
      :style="{
        border: '1px solid grey',
        borderRadius: '0.5rem',
        width: 'fit-content',
        maxWidth: 'calc(100%/8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transition: 'all 0.2s ease'
      }"
      class="
        text-3xl sm:text-8xl 
        h-[4rem] sm:h-[8rem] 
        p-[0.5rem] sm:p-[1rem]
      "
    >
      {{ number }}
    </p>
  </template>
  
<script setup>
defineProps({
  number: {
    type: [Number, String],
    required: true,
  },
});
</script>