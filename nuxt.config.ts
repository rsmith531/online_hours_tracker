import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
// biome-ignore lint/style/noDefaultExport: came from scaffolding
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    // '@tailwindcss/postcss'
  ],
  // postcss: {
  //   plugins: {
  //     // tailwindcss: {},
  //     // autoprefixer: {},
  //     '@tailwindcss/postcss': {},
  //   },
  // },
  shadcn: {
    prefix: '',
    componentDir: './components',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
