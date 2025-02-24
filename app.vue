<!-- ~/app.vue -->

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

    <Fieldset :legend="fieldsetLegend">
      <DigitalClock :time="workdayDuration" :stopwatch="isWorkdayOpen" />
    </Fieldset>
    
    <FloatingButton v-if="!isLoading" />

    <Toast position="bottom-right" />
    
    <VueQueryDevtools />

  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';

const { workday, isLoading, isWorkdayClosed, isWorkdayNull, isWorkdayOpen } =
  workdayService();

watch(
  workday,
  (newValue) => {
    console.log('app.vue watcher sees workday as: ', newValue);
  },
  { deep: true }
);

watch(isLoading, (newValue) => {
  console.log('    and isLoading watcher as: ', newValue);
});
console.log('app.vue sees workday as: ', workday.value);
console.log('    and isLoading as: ', isLoading.value);

const borderColor = computed(() => {
  if (isLoading.value) return 'blue';
  if (isWorkdayClosed.value || isWorkdayNull.value) return 'red';
  if (isWorkdayOpen.value) return 'green';
  return 'grey';
});

const fieldsetLegend = computed(() => {
  if (isWorkdayOpen.value) return 'Your workday';
  if (isWorkdayClosed.value) return 'Your last workday';
  return 'No workday data';
});
const workdayDuration = computed(() => {
  if (!workday.value) {
    return 0;
  }
  if (isWorkdayOpen.value) {
    const now = new Date();
    const startTime = new Date(workday.value.start_time);
    console.log('calculated start time: ', now - startTime);
    return now - startTime;
  }
  if (isWorkdayClosed.value) {
    return (
      workday?.value.end_time?.getTime() - workday?.value.start_time?.getTime()
    );
  }
  return 0;
});
</script>

<style>
html, body {
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
