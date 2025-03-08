// ~/plugins/siteSettings.ts

import { ref, watch, type Ref } from 'vue';
import { ToastEventBus } from 'primevue';

type Settings = {
  notificationsOn: boolean;
  notificationInterval: number; // in seconds
};

export default defineNuxtPlugin({
  name: 'site-settings',
  async setup() {
    const settings: Ref<Settings> = ref({
      notificationsOn: false,
      notificationInterval: 60 * 60, // 60 minutes
    });
    const { loggedIn } = useUserSession();

    const loadSettings = () => {
      // return if not running client-side
      if (!import.meta.client) return;

      const storedSettings = localStorage.getItem('siteSettings');

      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          // Merge stored settings with defaults to handle potential new settings in future versions
          settings.value = { ...settings.value, ...parsedSettings };
        } catch (error) {
          console.error(
            'Error parsing site settings from localStorage:',
            error
          );
          // clear corrupted storage
          localStorage.removeItem('siteSettings');
        }
      } else if (loggedIn) {
        saveSettings();
        setTimeout(() => {
          ToastEventBus.emit('add', {
            summary: 'Welcome to the site!',
            group: 'settings-toast',
          });
        }, 1500);
      }
    };

    const saveSettings = () => {
      // only run client-side
      if (import.meta.client) {
        localStorage.setItem('siteSettings', JSON.stringify(settings.value));
      }
    };

    watch(
      loggedIn,
      (newLoggedIn) => {
        if (newLoggedIn) {
          loadSettings();
        }
      },
      { immediate: true }
    );

    // Getters
    const getNotificationsOn = (): Settings['notificationsOn'] => {
      return settings.value.notificationsOn;
    };

    const getNotificationInterval = (): Settings['notificationInterval'] => {
      return settings.value.notificationInterval;
    };

    // use this in Vue components for reactivity
    const reactiveSettings = () => {
      return settings;
    };

    // Setters
    const setNotificationsOn = (value: Settings['notificationsOn']): void => {
      settings.value.notificationsOn = value;
      saveSettings();
    };

    const setNotificationInterval = (
      value: Settings['notificationInterval']
    ): void => {
      settings.value.notificationInterval = value;
      saveSettings();
    };

    const setSetting = <K extends keyof Settings>(
      key: K,
      value: Settings[K]
    ) => {
      settings.value[key] = value;
      saveSettings();
    };

    return {
      // make the helper functions available to the entire Nuxt app
      provide: {
        siteSettings: {
          settings,
          setSetting,
          getNotificationsOn,
          getNotificationInterval,
          reactiveSettings,
          setNotificationsOn,
          setNotificationInterval,
        },
      },
    };
  },
});
