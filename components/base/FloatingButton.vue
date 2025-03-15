<!-- ~/components/base/FloatingButton.vue -->

<template>
  <ClientOnly>
    <SpeedDial v-if="workday && !isPending" :model="items" type="semi-circle" :radius="70" direction="up"
      :transitionDelay="80" style="
    position: absolute; 
    left: calc(50%-20); 
    bottom: 2rem;
  " :tooltipOptions="{ position: 'left' }">
      <template #item="{ item, toggleCallback }">
        <Button v-tooltip.top="{
          value: item.label,
          showDelay: 600,
          hideDelay: 300,
          autoHide: false,
        }" rounded :icon="item.icon" severity="contrast" @click="toggleCallback" />
      </template>
    </SpeedDial>
  </ClientOnly>
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
  isPending
} = useWorkday();

const items = computed(() => {
  // if the workday data isn't ready yet, don't try computing the buttons
  if (isPending.value || !workday.value) {
    return [];
  }
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
