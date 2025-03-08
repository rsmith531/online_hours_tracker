<!-- ~/pages/login.vue -->

<!-- https://nuxt.com/docs/guide/recipes/sessions-and-authentication#login-page -->
<template>
    <div :style="{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }">
        <Card class="w-[90%] sm:w-fit">

            <template #title>Welcome to Workday Tracker!</template>

            <template #subtitle class="pb-4">Please sign in to continue</template>

            <template #content>
                <form @submit.prevent="login" :style="{ marginTop: '1rem', marginBottom: '1rem' }">
                    <InputGroup class="pb-7 pt-2">
                        <InputGroupAddon>
                            <i class="pi pi-user"></i>
                        </InputGroupAddon>
                        <FloatLabel variant="over">
                            <InputText inputId="email" v-model="credentials.email" />
                            <label for="email">Username</label>
                        </FloatLabel>
                    </InputGroup>
                    <InputGroup>
                        <InputGroupAddon>
                            <i class="pi pi-key"></i>
                        </InputGroupAddon>
                        <FloatLabel variant="over">
                            <Password v-model="credentials.password" inputId="password" toggleMask :feedback="false" />
                            <label for="password">Password</label>
                        </FloatLabel>
                    </InputGroup>
                </form>
            </template>
            <template #footer>
                <div class="flex gap-4 mt-1 justify-end">
                    <Button @click="login" icon="pi pi-sign-in" label="Login" :loading="loading" />
                </div>
            </template>
        </Card>
    </div>

</template>

<script setup lang="ts">
import { useWorkday } from '~/composables/workdayService';
import { ref } from 'vue';

// no layouts allowed on login page
definePageMeta({
    layout: false
})

const loading = ref(false);

const { fetch: refreshSession } = useUserSession()
const { refetch: refetchWorkday } = useWorkday();
const credentials = reactive({
    email: '',
    password: '',
})
async function login() {
    loading.value = true;
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
    loading.value = false;
}
</script>
