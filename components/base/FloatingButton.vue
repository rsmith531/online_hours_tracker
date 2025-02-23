<!-- ~/components/base/FloatingButton.vue -->

<template>
  <SpeedDial 
    v-if="workday"
  :model="items" 
  type="linear" 
  :radius="60"
  direction="up" 
  :transitionDelay="80"
  style="
    position: fixed; 
    left: 50%; 
    bottom: 2rem;
  " 
   :tooltipOptions="{ position: 'left' }"
  >
    </SpeedDial>
</template>

<script setup>
import { computed } from 'vue';

const toast = useToast();
const { updateWorkday, workday } = workdayService();

const isWorkdayOpen =
  workday.value?.start_time !== null && workday.value?.end_time === null;
const isWorkdayClosed =
  workday.value?.start_time === null && workday.value?.end_time !== null;
const isWorkdayNull =
  workday.value?.start_time === null && workday.value?.end_time === null;

const items = computed(() => {
  return [
    ...(isWorkdayClosed || isWorkdayNull
      ? [
          {
            label: 'Open Workday',
            icon: 'pi pi-play',
            command: async () => {
              await updateWorkday();
            },
          },
        ]
      : []),
    ...(isWorkdayOpen
      ? [
          {
            label: 'Close Workday',
            icon: 'pi pi-stop',
            command: () => {
              updateWorkday();
            },
          },
        ]
      : []),
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {
        toast.add({
          severity: 'info',
          summary: 'Settings',
          detail:
            'Configure your app settings here (will one day have settings)',
          life: 3000,
        });
      },
    },
  ];
});
</script>
