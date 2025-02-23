import Aura from '@primeuix/themes/aura';
import { workdayService } from './helpers/workdayService';

// https://nuxt.com/docs/api/configuration/nuxt-config
// biome-ignore lint/style/noDefaultExport: came from scaffolding
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@primevue/nuxt-module',"@hebilicious/vue-query-nuxt"],
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
    workday: {
      start_time: undefined,
      end_time: undefined,

    }
  },
  hooks: {
    'app:created': async () => {
      await workdayService().refetch();
    }
  }
});
