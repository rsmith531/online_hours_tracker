// nuxt.config.ts

import Aura from '@primevue/themes/aura';
import fs from 'node:fs';
import path from 'node:path';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  modules: ['@primevue/nuxt-module', '@nuxt/fonts', 'nuxt-security', '@nuxtjs/tailwindcss', 'nuxt-auth-utils'],
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
      environment: process.env.VITE_PUBLIC_ENVIRONMENT
    },
  },
  css: ['primeicons/primeicons.css'],
  fonts: {
    defaults: {
      fallbacks: {
        'sans-serif': ['Tahoma'],
        serif: ['Georgia'],
        monospace: ['Courier New'],
      },
    },
    families: [{ name: 'Doto', weights: [400, 800, 900] }],
  },
  vite: {
    define: {
      'process.env.VITE_PUBLIC_VAPID_PUBLIC_KEY': JSON.stringify(
        process.env.VITE_PUBLIC_VAPID_PUBLIC_KEY
      ),
    },
  },
  hooks: {
    // make sure the VAPID public key gets injected into serviceWorker.ts at build time
    'build:before': async () => {
      if (!process.env.VITE_PUBLIC_VAPID_PUBLIC_KEY) {
        console.warn(
          'VITE_PUBLIC_VAPID_PUBLIC_KEY is not set. Service worker may not function correctly.'
        );
        return;
      }

      const serviceWorkerPath = path.resolve(
        __dirname,
        'public',
        'serviceWorker.js'
      );
      let serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf-8');
      // Regex to match the entire applicationServerKey line
      const regex = /applicationServerKey:\s*urlBase64ToUint8Array\(([^)]*)\)/;

      // Replace the placeholder with the actual public key
      serviceWorkerContent = serviceWorkerContent.replace(
        regex,
        `applicationServerKey: urlBase64ToUint8Array('${process.env.VITE_PUBLIC_VAPID_PUBLIC_KEY}')`
      );

      fs.writeFileSync(serviceWorkerPath, serviceWorkerContent);
    },
  },
  devtools: {
    enabled: process.env.VITE_PUBLIC_ENVIRONMENT === 'development'
  },

});