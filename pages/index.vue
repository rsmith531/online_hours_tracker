<!-- ~/pages/index.vue -->

<template>

    <Fieldset>
        <template #legend>
            <p class="
          text-2xl sm:text-4xl">{{ fieldsetLegend }}</p>
        </template>
        <DigitalClock :time="workdayDuration" :stopwatch="isWorkdayOpen && !isWorkdayPaused" />
    </Fieldset>

</template>

<script setup>
import { computed } from 'vue';

const {
    workday,
    isWorkdayClosed,
    isWorkdayOpen,
    isWorkdayPaused,
} = workdayService();

const { user } = useUserSession();
const fieldsetLegend = computed(() => {
    if (isWorkdayOpen.value) return `${user.value.name ? `${user.value.name}'s` : "Your"} workday`;
    if (isWorkdayClosed.value) return `${user.value.name ? `${user.value.name}'s` : "Your"} last workday`;
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
