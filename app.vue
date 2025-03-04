<!-- ~/app.vue -->

<template>
  <div v-if="isPending">
    Loading...
  </div>
  <div v-else-if="isError">
    An error occurred.
  </div>
  <div v-else :style="{
    border: `2px solid ${borderColor}`,
    borderRadius: '1rem',
    transition: 'all 1.5s ease',
    boxShadow: `inset 0 0 2rem ${borderColor}`,
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }">

    <NuxtPage />

    <FloatingButton v-if="!isPending" />

    <VueQueryDevtools />

  </div>
  <SettingsToast />
  <Toast position="bottom-right" />
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';
import { useSiteSettingsService } from '~/utils/siteSettingsService';

const {
  isPending,
  isError,
  isWorkdayClosed,
  isWorkdayNull,
  isWorkdayOpen,
  isWorkdayPaused,
} = workdayService();

onMounted(() => {
  useSiteSettingsService();
})

const borderColor = computed(() => {
  if (isPending.value || isWorkdayNull.value) return 'blue';
  if (isWorkdayClosed.value) return 'red';
  if (isWorkdayOpen.value) {
    if (!isWorkdayPaused.value) {
      return 'green';
    }
    return 'yellow';
  }
  return 'grey';
});
</script>

<style>
html,
body {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

#__nuxt {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
</style>
