<!-- ~/layouts/default.vue -->

<template>
        <div :style="{
            borderRadius: '1rem',
            border: `2px solid ${borderColor}`,
            boxShadow: `inset 0 0 2rem ${borderColor}`,
            transition: 'all 1s ease',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
        }">
            <slot />
            <FloatingButton />
        </div>
</template>

<script setup lang="ts">

const {
    isPending,
    isWorkdayClosed,
    isWorkdayNull,
    isWorkdayOpen,
    isWorkdayPaused,
} = workdayService();

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
</script>
