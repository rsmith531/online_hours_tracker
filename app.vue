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

    <Fieldset>
      <template #legend>
        <p class="
        text-2xl sm:text-4xl">{{ fieldsetLegend }}</p>
      </template>
      <DigitalClock :time="workdayDuration" :stopwatch="isWorkdayOpen && !isWorkdayPaused" />
    </Fieldset>


    <FloatingButton v-if="!isPending" />

    <VueQueryDevtools />

  </div>
  <SettingsToast />
  <Toast position="bottom-right" />
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';
import { useSiteSettingsService } from '~/utils/siteSettingsService';
import ToastService from 'primevue/toastservice';

const {
  workday,
  isPending,
  isError,
  isWorkdayClosed,
  isWorkdayNull,
  isWorkdayOpen,
  isWorkdayPaused,
} = workdayService();

// make a globally accessible Toast Service from primevue
const app = useNuxtApp();
app.vueApp.use(ToastService);

// make a signal so that the site settings service sends a toast after it is available
const toastReady = ref(false);
let siteSettings;
onMounted(() => {
  toastReady.value = true;
  siteSettings = useSiteSettingsService(toastReady);
});

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

const fieldsetLegend = computed(() => {
  if (isWorkdayOpen.value) return 'Your workday';
  if (isWorkdayClosed.value) return 'Your last workday';
  return 'No workday data';
});

const workdayDuration = computed(() => {
  if (!workday.value || !workday.value.segments) {
    return 0;
  }

  let totalWorkingDuration = 0;
  const now = new Date(); // Get current time once for open workday calculation

  for (const segment of workday.value.segments) {
    if (segment.activity === ActivityType.Working) {
      const startTime = new Date(segment.start_time);
      let endTime;

      if (segment.end_time) {
        endTime = new Date(segment.end_time);
      } else if (isWorkdayOpen.value) {
        endTime = now; // For open workday, use 'now' as end time for the last segment
      } else {
        endTime = startTime; // Should not happen, but to avoid NaN, set to start time in unexpected case
      }

      const segmentDuration = endTime.getTime() - startTime.getTime();
      totalWorkingDuration += segmentDuration;
    }
  }

  return totalWorkingDuration;
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
