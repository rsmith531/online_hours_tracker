// ~/utils/siteSettingsService.ts

import { useToast } from 'primevue/usetoast';
import { ref, type Ref, h } from 'vue';

type Settings = {
  notificationsOn: boolean;
  notificationInterval: number; // in seconds
};

class SiteSettingsService {
  // member variables
  settings: Ref<Settings>;
  private toast: ReturnType<typeof useToast> | undefined = undefined;
  private toastReady: Ref<boolean> | undefined = undefined;

  constructor(toastReady: Ref<boolean>) {
    this.settings = ref({
      notificationsOn: true,
      notificationInterval: 60 * 60, // 60 minutes
    });
    this.toastReady = toastReady;
    if (import.meta.client) {
      // Only run client-side code in browser
      this.toast = useToast();
      if (this.toast) {
      } else {
        console.warn(
          'SiteSettingsService: Toast injection failed. Make sure ToastProvider is set up.'
        );
      }
      this.loadSettings(); // Load settings from localStorage on initialization
    }
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
    } else if (this.toast && this.toastReady?.value) {
        setTimeout(() => {
          this.toast?.add({
            summary: 'Welcome to the site!',
            group: 'settings-toast',
          })
        }, 1);
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
export const useSiteSettingsService = (toastReady: Ref<boolean>) => {
  return new SiteSettingsService(toastReady);
};
