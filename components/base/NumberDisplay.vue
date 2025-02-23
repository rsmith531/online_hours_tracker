<template>
    <div
      :style="{
        height: '8rem',
        border: '1px solid grey',
        borderRadius: '0.5rem',
        width: 'fit-content',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '7rem',
        textAlign: 'center',
      }"
    >
      {{ number }}
    </div>
  </template>
  
  <script setup>
defineProps({
  number: {
    type: [Number, String],
    required: true,
  },
});
</script>