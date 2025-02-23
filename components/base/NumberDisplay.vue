<template>
    <Card
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
    :class="{ 'text-xs-2rem': true, 'text-sm-7rem': true, 'height-xs-1rem': true, 'height-sm-1rem': true }"
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