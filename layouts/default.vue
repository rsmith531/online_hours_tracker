<!-- ~/layouts/default.vue -->

<template>
    <div :style="{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative', 
        transition: 'all 1s ease-in', minHeight: '100vh'
    }">
        <slot />
        <FloatingButton />
        <SettingsToast />
        <Toast position="bottom-right" :style="{maxWidth: '90%'}" />
    </div>
</template>
