// ~/utils/notificationsService.ts

import { useSiteSettingsService } from './siteSettingsService';
import type { NotifierApiRequest } from 'server/api/notifier';
import { ToastEventBus } from 'primevue';

// all this can only run on the client
// servers naturally don't have the necessary browser APIs

const siteSettings = useSiteSettingsService();
let serviceWorkerRegistration: ServiceWorkerRegistration;

const handleNotificationsChange = async (notificationsOn: boolean) => {
  if (!import.meta.client) {
    // not running on a client (running on a server)
    return;
  }
  try {
    if (notificationsOn === true) {
      try {
        // check to see if the client supports service workers, notifications, and push APIs
        if (!('serviceWorker' in navigator)) {
          throw new Error('This browser does not support service workers.');
        }
        if (!('Notification' in window)) {
          throw new Error('This browser does not support notifications.');
        }
        if (!('PushManager' in window)) {
          throw new Error('This browser does not support push notifications.');
        }
        console.log(
          '[notificationsService] browser compatibility check PASSED'
        );

        // next, check if notifications permissions have been granted
        switch (Notification.permission) {
          case 'granted': {
            // we can send notifications
            break;
          }
          case 'denied': {
            throw new Error('Notification permission not granted.');
          }
          case 'default': {
            // request permission from the user
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
              throw new Error('Notification permission not granted.');
            }

            break;
          }
          default: {
            throw new Error(
              'Something went wrong when detecting the notifications permissions.'
            );
          }
        }
        console.log('[notificationsService] browser notifications ENABLED');

        // register the service worker from serviceWorker.ts (if previously registered, it will update the registration)
        serviceWorkerRegistration =
          await navigator.serviceWorker.register('/serviceWorker.ts');
        console.log('[notificationsService] service worker REGISTERED');
      } catch (error) {
        console.error(
          'received error when registering service worker: ',
          error
        );
        // set notificationsOn to false
        siteSettings.setNotificationsOn(false);

        // rethrow error to the next catch that adds a toast
        throw error;
      }
    } else if (notificationsOn === false) {
      // send a DELETE request to api/notifier to remove-subscription
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const requestBody: NotifierApiRequest = {
            subscription: subscription.toJSON(),
          };

          console.log(
            '[notificationsService]: sending requestBody to /api/notifier via DELETE: ',
            requestBody
          );
          await fetch('/api/notifier', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
        } else {
          throw new Error("Client's Push API is not subscribed.");
        }
      } else {
        throw new Error('Service worker not ready.');
      }
      // deregister the service worker from serviceWorker.ts
      if (serviceWorkerRegistration) {
        serviceWorkerRegistration.unregister();
      }
      // send toast telling users to make sure to revoke notifications permissions
      ToastEventBus.emit('add', {
        severity: 'info',
        summary: 'You have unsubscribed from notifications.',
        detail:
          "Make sure to check your browser's permissions and rescind notifications for this website.",
      });
    } else {
      throw new Error(
        `Encountered unexpected value for notificationsOn: ${notificationsOn}.`
      );
    }
  } catch (error) {
    console.error('notificationsService: ', error);
    // send a toast to explain what happened
    ToastEventBus.emit('add', {
      severity: 'error',
      summary: 'Whoops',
      detail: error,
    });
  }
};

const handleNotificationIntervalChange = async (
  notificationInterval: number
) => {
  if (!import.meta.client) {
    // not running on a client (running on a server)
    return;
  }
  try {
    // send a PATCH request to api/notifier to update-subscription to the new interval
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const requestBody: NotifierApiRequest = {
            subscription: subscription.toJSON(),
            interval: notificationInterval,
          };

          console.log(
            '[notificationsService]: sending requestBody to /api/notifier via PATCH: ',
            requestBody
          );
          await fetch('/api/notifier', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
        } else {
          throw new Error("Client's Push API is not subscribed.");
        }
      } else {
        throw new Error('Service worker not ready.');
      }
    }
  } catch (error) {
    console.error('notificationsService: ', error);
    // send a toast to explain what happened
    ToastEventBus.emit('add', {
      severity: 'error',
      summary: 'Whoops',
      detail: error,
      life: 4000,
    });
  }
};

// listen to the siteSettingsService for the settings.notificationsOn to be set to true
watch(
  () => siteSettings.getNotificationsOn(),
  (newValue) => handleNotificationsChange(newValue)
);

// listen to the siteSettingsService for the settings.notificationInterval to change
watch(
  () => siteSettings.getNotificationInterval(),
  (newValue) => handleNotificationIntervalChange(newValue)
);
