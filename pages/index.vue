<!-- ~/pages/index.vue -->

<template>
    <div style="display: flex; flex-direction: column; align-items:center; gap: 3rem; position: relative;" class="top-[calc(50vh-7rem-5.25rem)] sm:top-0">
        <DigitalClock :time="workdayDuration" :stopwatch="isWorkdayOpen && !isWorkdayPaused" />
        <WorkTimeline :vertical="$device.isMobile" />
    </div>
</template>

<script setup>
import { computed } from 'vue';
console.log(`[/index] page rendered on ${import.meta.server === true ? 'server' : import.meta.client === true ? 'client' : 'neither server nor client, apparently'}.`)

const {
    workday,
    isWorkdayOpen,
    isWorkdayPaused,
} = useWorkday();

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
