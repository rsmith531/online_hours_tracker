<!-- DigitalClock.vue -->

<template>
  <div :style="{
      display: 'flex', 
      flexDirection: 'row',
      gap: '0.5rem',
      overflow: 'hidden',
      alignContent: 'center',
      justifyContent: 'center'
      }">
    <NumberDisplay :number="hoursTens" />
    <NumberDisplay :number="hoursOnes" />
    <p
      :style="{
        width: 'fit-content',
        maxWidth: 'calc(100%/8)',
        display: 'flex',
        alignItems: 'center'
      }"
      class="
        text-2xl sm:text-8xl 
        h-[4rem] sm:h-[8rem] 
        p-[0rem] sm:p-[1rem]
      "
    >
      :
    </p>
    <NumberDisplay :number="minutesTens" />
    <NumberDisplay :number="minutesOnes" />
    <p
      :style="{
        width: 'fit-content',
        maxWidth: 'calc(100%/8)',
        display: 'flex',
        alignItems: 'center'
      }"
      class="
        text-2xl sm:text-8xl 
        h-[4rem] sm:h-[8rem] 
        p-[0rem] sm:p-[1rem]
      "
    >
      :
    </p>
    <NumberDisplay :number="secondsTens" />
    <NumberDisplay :number="secondsOnes" />
  </div>
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
div {
  font-family: Doto, monospace;
  font-weight: 700;
}

</style>
