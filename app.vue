<template>
  <div
    :style="{
      border: `2px solid ${borderColor}`,
      borderRadius: '1rem',
      transition: 'all 0.5s ease',
      boxShadow: `inset 0 0 2rem ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }"
  >
  <Fieldset legend="Your workday"><DigitalClock :time="workdayDuration" /></Fieldset>
    <FloatingButton />
    <Toast position="bottom-right" />
  </div>
  <VueQueryDevtools />
</template>

<script setup>
import FloatingButton from '~/components/base/FloatingButton.vue';
import DigitalClock from '~/components/section/DigitalClock.vue';
import 'primeicons/primeicons.css';
import { useToast } from 'primevue/usetoast';
import Fieldset from 'primevue/fieldset';
import { workdayService } from '~/helpers/workdayService.ts';
import { computed } from 'vue';
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

const { workday, isLoading } = workdayService();

const borderColor = computed(() => {
  if (isLoading.value) return 'blue';
  if (!workday.value?.start_time) return 'red';
  return 'green';
});

const workdayDuration = computed(() => {
  if (!workday.value?.start_time) {
    return 0;
  }
  const now = new Date();
  const startTime = new Date(workday.value.start_time);
  return now - startTime;
});

</script>

<style>
html, body {
  display: flex;          
  flex-direction: column; 
  height: 100vh;
  /* margin: 0;
  padding: 0; */
}
#__nuxt { /* Style the Nuxt wrapper div */
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Important: Allow #__nuxt to grow to body height */
}
</style>
