<!-- ~/app.vue -->

<template>

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <SettingsToast />
  <Toast position="bottom-right" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSiteSettingsService } from '~/utils/siteSettingsService';

onMounted(() => {
  useSiteSettingsService();
})
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
