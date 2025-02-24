<!-- NumberDisplay.vue -->

<template>
    <Card
      :style="{
        height: '8rem',
        border: '1px solid grey',
        borderRadius: '0.5rem',
        width: 'fit-content',
        maxWidth: 'calc(100%/8)',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '7rem',
        textAlign: 'center',
      }"
    >
    <template #content>
      {{ number }}
    </template>
    </Card>
  </template>
  
<script setup>

defineProps({
  number: {
    type: [Number, String],
    required: true,
  },
});
</script>