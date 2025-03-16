<!-- ~/components/base/NumberDisplay.vue -->

<template>
  <div style="
  position: relative; display: flex; justify-content: center;
  " :style="{
    width: 'fit-content',
    maxWidth: 'calc(100%/8)',
  }">
    <p style="
        width: min-content;" class="
        text-5xl sm:text-8xl 
      ">
      {{ isMounted ? number : '-' }}
    </p>
    <p style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        user-select: none;
        opacity: 0.10;
        width: min-content;
      " class="
        text-5xl sm:text-8xl 
      ">
      8
    </p>
  </div>
</template>

<script setup>

defineProps({
  number: {
    type: [Number, String],
    required: true,
  },
});
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});

</script>