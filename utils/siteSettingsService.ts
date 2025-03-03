// ~/utils/siteSettingsService.ts

// TODO: convert to a nuxt plugin

import { ref, type Ref } from 'vue';
import { ToastEventBus } from 'primevue';

type Settings = {
  notificationsOn: boolean;
  notificationInterval: number; // in seconds
};

// TODO: think about converting this to a Nuxt plugin
class SiteSettingsService {
  // member variables
  private static instance: SiteSettingsService | null = null;
  settings: Ref<Settings>;

  constructor() {
    this.settings = ref({
      notificationsOn: false,
      notificationInterval: 60, // * 60, // 60 minutes
    });

    // Only run client-side code in browser
    if (import.meta.client) {
      this.loadSettings(); // Load settings from localStorage on initialization
    }
  }

  // return a singleton of this class
  static getInstance(): SiteSettingsService {
    if (!SiteSettingsService.instance) {
      SiteSettingsService.instance = new SiteSettingsService();
    }
    return SiteSettingsService.instance;
  }

  private loadSettings() {
    // return if not running client-side
    if (!import.meta.client) return;

    const storedSettings = localStorage.getItem('siteSettings');

    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        // Merge stored settings with defaults to handle potential new settings in future versions
        this.settings.value = { ...this.settings.value, ...parsedSettings };
      } catch (error) {
        console.error('Error parsing site settings from localStorage:', error);
        // clear corrupted storage
        localStorage.removeItem('siteSettings');
      }
    } else {
      setTimeout(() => {
        ToastEventBus.emit('add', {
          summary: 'Welcome to the site!',
          group: 'settings-toast',
        });
      }, 1500);
    }
  }

  private saveSettings() {
    // return if not running client-side
    if (!import.meta.client) return;
    localStorage.setItem('siteSettings', JSON.stringify(this.settings.value));
  }

  // Getters
  getNotificationsOn(): Settings['notificationsOn'] {
    return this.settings.value.notificationsOn;
  }

  getNotificationInterval(): Settings['notificationInterval'] {
    return this.settings.value.notificationInterval;
  }

  // use this in Vue components for reactivity
  reactiveSettings() {
    return this.settings;
  }

  // Setters
  setNotificationsOn(value: Settings['notificationsOn']): void {
    this.settings.value.notificationsOn = value;
    this.saveSettings();
  }

  setNotificationInterval(value: Settings['notificationInterval']): void {
    this.settings.value.notificationInterval = value;
    this.saveSettings();
  }

  setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.settings.value[key] = value;
    this.saveSettings();
  }
}

// expose a SiteSettingsService factory to the app
// export const useSiteSettingsService = () => {
//   return new SiteSettingsService();
// };

// expose a SiteSettingsService singleton to the app
export const useSiteSettingsService = () => {
  return SiteSettingsService.getInstance();
};
