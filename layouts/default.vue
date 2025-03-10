<!-- ~/layouts/default.vue -->

<template>
    <div :style="{
        borderRadius: '1rem',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative', 
        transition: 'all 1s ease-in',
    }">
        <slot />
        <FloatingButton />
        <SettingsToast />
        <Toast position="bottom-right" :style="{maxWidth: '90%'}" />
    </div>
</template>
