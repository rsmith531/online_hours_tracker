// nuxt.config.ts

import Aura from '@primevue/themes/aura';

// https://nuxt.com/docs/api/configuration/nuxt-config
// biome-ignore lint/style/noDefaultExport: came from scaffolding
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@primevue/nuxt-module'],
  primevue: {
    options: {
      theme: {
        preset: Aura,
      },
    },
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  runtimeConfig: {
    public: {
      apiUrl: 'http://localhost:3000/api',
    },
  },
  css: ['primeicons/primeicons.css'],
});
