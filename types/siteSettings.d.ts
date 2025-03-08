// ~/types/siteSettings.d.ts

import type { Settings } from '../plugins/siteSettings';
import type { Ref } from 'vue';

declare module '#app' {
  interface NuxtApp {
    $siteSettings: {
      settings: Ref<Settings>;
      setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;
      getNotificationsOn(): Settings['notificationsOn'];
      getNotificationInterval(): Settings['notificationInterval'];
      reactiveSettings(): Ref<Settings>;
      setNotificationsOn(value: Settings['notificationsOn']): void;
      setNotificationInterval(value: Settings['notificationInterval']): void;
    };
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $siteSettings: {
      settings: Ref<Settings>;
      setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;
      getNotificationsOn(): Settings['notificationsOn'];
      getNotificationInterval(): Settings['notificationInterval'];
      reactiveSettings(): Ref<Settings>;
      setNotificationsOn(value: Settings['notificationsOn']): void;
      setNotificationInterval(value: Settings['notificationInterval']): void;
    };
  }
}