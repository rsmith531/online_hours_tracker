// nuxt.config.ts

import Aura from '@primevue/themes/aura';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@primevue/nuxt-module',
    '@nuxt/fonts',
    'nuxt-security',
    '@nuxtjs/tailwindcss',
  ],
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
      apiUrl: '/api',
    },
  },
  css: ['primeicons/primeicons.css'],
  fonts: {
    defaults: {
      fallbacks: {
        'sans-serif': ['Tahoma'],
        'serif': ['Georgia'],
        'monospace': ['Courier New']
      }
    },
    families: [
      {name: 'Doto', weights: [400, 800, 900]}
    ]
  },
});
