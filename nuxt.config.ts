// nuxt.config.ts

import Aura from '@primeuix/themes/aura';
import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  modules: [
    '@primevue/nuxt-module',
    '@nuxt/fonts',
    'nuxt-security',
    'nuxt-auth-utils',
    '@nuxtjs/color-mode',
    '@nuxt/image',
    '@nuxt/test-utils/module',
  ],
  typescript: {
    typeCheck: true,
  },
  features: {
    devLogs: false, // Enable development logging in production
  },
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          // aligns primevue dark mode with @nuxtjs/color-mode
          darkModeSelector: '.dark-mode',
        },
      },
    },
  },
  nitro: {
    experimental: {
      websocket: true,
    },
  },
  vite: { plugins: [tailwindcss()], assetsInclude: ['**/*.md'] },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  // align runtime environment variables with those in the .env file
  runtimeConfig: {
    sessionPassword: process.env.NUXT_SESSION_PASSWORD,
    loginUsername: process.env.NUXT_LOGIN_USERNAME,
    loginPassword: process.env.NUXT_LOGIN_PASSWORD,
    vapidPrivateKey: process.env.NUXT_VAPID_PRIVATE_KEY,
    public: {
      environment: process.env.NUXT_PUBLIC_ENVIRONMENT,
      loginName: process.env.NUXT_PUBLIC_LOGIN_NAME,
      vapidPublicKey: process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY,
    },
  },
  css: ['primeicons/primeicons.css', '~/assets/css/main.css'],
  fonts: {
    defaults: {
      fallbacks: {
        'sans-serif': ['Tahoma'],
        serif: ['Georgia'],
        monospace: ['Courier New'],
      },
    },
    families: [
      { name: 'Doto', weights: [400, 800, 900] },
      { name: 'DSEG7 Classic', weights: [400, 800, 900] },
    ],
  },
  hooks: {
    // make sure the VAPID public key gets injected into serviceWorker.ts at build time
    'build:before': async () => {
      if (!process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY) {
        console.warn(
          'NUXT_PUBLIC_VAPID_PUBLIC_KEY is not set. Service worker may not function correctly.'
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
        `applicationServerKey: urlBase64ToUint8Array('${process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY}')`
      );

      fs.writeFileSync(serviceWorkerPath, serviceWorkerContent);
    },
  },
  devtools: {
    enabled: process.env.NUXT_PUBLIC_ENVIRONMENT === 'development',
  },
});
