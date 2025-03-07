<!-- ~/pages/login.vue -->

<!-- https://nuxt.com/docs/guide/recipes/sessions-and-authentication#login-page -->
<template>
    <form @submit.prevent="login" :style="{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        gap: '10px',
        justifyContent: 'center',
        alignItems: 'center',
    }">
        <input v-model="credentials.email" type="text" placeholder="Username" />
        <input v-model="credentials.password" type="password" placeholder="Password" />
        <button type="submit">Login</button>
    </form>
</template>

<script setup lang="ts">
import { useWorkday } from '~/composables/workdayService';

// no layouts allowed on login page
definePageMeta({
    layout: false
})
const { fetch: refreshSession } = useUserSession()
const { refetch: refetchWorkday } = useWorkday();
const credentials = reactive({
    email: '',
    password: '',
})
async function login() {
    $fetch('/api/login', {
        method: 'POST',
        body: credentials
    })
        .then(async () => {
            // Refresh the session on client-side and redirect to the home page
            await refreshSession()
            // refetch the workday data
            refetchWorkday();
            await navigateTo('/')
        })
        .catch(() => { alert('Bad credentials') })
}
</script>
