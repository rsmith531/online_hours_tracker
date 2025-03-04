<!-- ~/components/base/FloatingButton.vue -->

<template>
  <SpeedDial v-if="workday" :model="items" type="linear" :radius="60" direction="up" :transitionDelay="80" style="
    position: absolute; 
    left: calc(50%-20); 
    bottom: 2rem;
  " :tooltipOptions="{ position: 'left' }">
  </SpeedDial>
</template>

<script setup>
import { computed } from 'vue';

const toast = useToast();
const {
  updateWorkday,
  pauseWorkday,
  workday,
  isWorkdayClosed,
  isWorkdayNull,
  isWorkdayOpen,
  isWorkdayPaused,
} = workdayService();

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
        {
          label: isWorkdayPaused.value ? 'Unpause Workday' : 'Pause Workday',
          icon: isWorkdayPaused.value ? 'pi pi-play' : 'pi pi-pause',
          command: () => {
            pauseWorkday();
          },
        },
      ]
      : []),
    {
      label: 'Sign Out', icon: 'pi pi-sign-out', command: async () => {
        const { clear } = useUserSession();
        await clear();
        await navigateTo('/login');
      }
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {
        toast.removeGroup('settings-toast');
        toast.add({
          summary: 'Welcome to the site!',
          group: 'settings-toast',
        })
      },
    },
  ];
});
</script>
