// ~/plugins/notifications.client.ts

import '~/utils/notificationsService';

// This file makes sure that the notificationsService runs as a Nuxt plugin

export default defineNuxtPlugin(() => {
  console.log('Notifications service initialized (client-side).');
});
