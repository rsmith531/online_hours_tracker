<!-- ~/components/section/DigitalClock.vue -->

<template>
  <Panel toggleable :style="{
    borderRadius: '15px',
    boxShadow: ` 0 0 6rem ${borderColor}`,
    transition: 'all 0.7s ease-in-out',
    border: '2px solid'
  }" 
  class="min-w-[21.75rem] sm:min-w-[37.625rem]"
  >
    <template #header>
      <p class="
        text-2xl sm:text-4xl p-3">{{ fieldsetLegend }}</p>
    </template>
    <div :style="{
      display: 'flex',
      flexDirection: 'row',
      gap: '0.5rem',
      overflow: 'hidden',
      alignContent: 'center',
      justifyContent: 'center'
    }" class="pt-[1.125rem]"
    >
      <NumberDisplay :number="hoursTens" class="clock_font" />
      <NumberDisplay :number="hoursOnes" class="clock_font" />
      <ColonDisplay :blink="isWorkdayOpen && !isWorkdayPaused" class="clock_font" />
      <NumberDisplay :number="minutesTens" class="clock_font" />
      <NumberDisplay :number="minutesOnes" class="clock_font" />
      <ColonDisplay :blink="isWorkdayOpen && !isWorkdayPaused" class="clock_font" />
      <NumberDisplay :number="secondsTens" class="clock_font" />
      <NumberDisplay :number="secondsOnes" class="clock_font" />
    </div>
  </Panel>
</template>

<script setup>

const props = defineProps({
  time: {
    type: Number,
    required: true,
  },
  stopwatch: {
    type: Boolean,
    required: false,
    default: true,
  },
});

const { user } = useUserSession();

const {
  isWorkdayClosed,
  isWorkdayOpen,
} = useWorkday();
const {
  isPending,
  isWorkdayNull,
  isWorkdayPaused,
} = useWorkday();

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
  if (isWorkdayOpen.value) return `${user.value?.name ? `${user.value.name}'s` : "Your"} workday`;
  if (isWorkdayClosed.value) return `${user.value?.name ? `${user.value.name}'s` : "Your"} last workday`;
  return 'No workday data';
});

const displayTime = ref(props.time);
let intervalId = null;
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
  if (props.stopwatch && props.time !== 0) {
    startInterval();
  }
});

watch(
  () => props.time,
  (newTime) => {
    displayTime.value = newTime;
    if (isMounted.value) {
      if (props.stopwatch && newTime !== 0) {
        startInterval();
      } else if (!props.stopwatch || newTime === 0) {
        clearIntervalIfSet();
      }
    }
  }
);

onUnmounted(() => {
  clearIntervalIfSet();
});

const startInterval = () => {
  clearIntervalIfSet();
  intervalId = setInterval(() => {
    displayTime.value += 1000;
  }, 1000);
};

const clearIntervalIfSet = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const hours = computed(() => Math.floor(displayTime.value / (1000 * 60 * 60)));
const minutes = computed(() =>
  Math.floor((displayTime.value / (1000 * 60)) % 60)
);
const seconds = computed(() => Math.floor((displayTime.value / 1000) % 60));

const hoursTens = computed(() =>
  displayTime.value === 0 ? '-' : Math.floor(hours.value / 10)
);
const hoursOnes = computed(() =>
  displayTime.value === 0 ? '-' : hours.value % 10
);
const minutesTens = computed(() =>
  displayTime.value === 0 ? '-' : Math.floor(minutes.value / 10)
);
const minutesOnes = computed(() =>
  displayTime.value === 0 ? '-' : minutes.value % 10
);
const secondsTens = computed(() =>
  displayTime.value === 0 ? '-' : Math.floor(seconds.value / 10)
);
const secondsOnes = computed(() =>
  displayTime.value === 0 ? '-' : seconds.value % 10
);
</script>

<style scoped>
.clock_font {
  font-family: DSEG7 Classic, monospace;
  font-weight: 500;
  font-style: italic;
}

</style>
