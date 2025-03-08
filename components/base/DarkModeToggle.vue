<!-- ~/components/section/AboutModal.vue -->

<template>
    <Button id="dark-mode-button" @click="onSwitch" severity="info" :icon="getIcon" rounded style="
      position: absolute; 
      right: 6rem; 
      top: 2rem;" />

</template>

<script setup>
import { computed } from 'vue';
const colorMode = useColorMode()

const onSwitch = () => {
    switch (colorMode.preference) {
        case 'system':
            colorMode.preference = 'light';
            break;
        case 'light':
            colorMode.preference = 'dark';
            break;
        case 'dark':
            colorMode.preference = 'system';
            break;
        default:
            console.warn(`unexpected colorMode.preference: ${colorMode.preference}`)
    }
}
const getIcon = computed(() => {
    switch (colorMode.preference) {
        case 'system':
            return 'pi pi-clock';
        case 'light':
            return 'pi pi-sun';
        case 'dark':
            return 'pi pi-moon';
        default:
            return 'pi-exclamation-triangle'
    }
});
</script>