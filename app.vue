<!-- ~/app.vue -->

<template>

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <VueQueryDevtools v-if="enableDevTools" />

  <SettingsToast />
  <Toast position="bottom-right" />
</template>

<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';

const runtimeConfig = useRuntimeConfig()
// TODO: does this need to be a ref?
const enableDevTools = ref<boolean>(
  runtimeConfig.public.environment === 'development'
);
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
