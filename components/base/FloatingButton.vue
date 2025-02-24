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
    position: absolute; 
    left: calc(50%-20); 
    bottom: 2rem;
  " 
   :tooltipOptions="{ position: 'left' }"
  >
    </SpeedDial>
</template>

<script setup>
import { computed } from 'vue';

const toast = useToast();
const {
  updateWorkday,
  workday,
  isWorkdayClosed,
  isWorkdayNull,
  isWorkdayOpen,
} = workdayService();

console.log('floating button sees workday as: ', workday.value);

const items = computed(() => {
  return [
    ...(isWorkdayClosed.value || isWorkdayNull.value
      ? [
          {
            label: 'Open Workday',
            icon: 'pi pi-play',
            command: () => {
              updateWorkday();
            },
          },
        ]
      : []),
    ...(isWorkdayOpen.value
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
