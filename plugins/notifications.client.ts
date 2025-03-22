// ~/plugins/notifications.client.ts

import { ToastEventBus } from 'primevue';
import type { NotifierApiRequest } from 'server/api/notifier';
import { watch } from 'vue';

// this plugin is run sitewide so that it can always do stuff when siteSettings changes
export default defineNuxtPlugin({
  name: 'notifications',
  dependsOn: ['site-settings'],
  async setup() {
    const { $siteSettings } = useNuxtApp();
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
              throw new Error(
                'This browser does not support push notifications.'
              );
            }
            console.log(
              '[notificationsService] browser compatibility check PASSED'
            );

            console.log(
              `[notifications] browser's notifications set to ${Notification.permission}`
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
              await navigator.serviceWorker.register('/serviceWorker.js');
            console.log('[notificationsService] service worker REGISTERED');

            // Send the initial interval to the service worker after a 100ms delay to wait for it to become active
            setTimeout(() => {
              console.log(
                '[notificationsService] serviceWorkerRegistration before trying to send the message: ',
                serviceWorkerRegistration
              );
              if (serviceWorkerRegistration.active) {
                serviceWorkerRegistration.active.postMessage({
                  type: 'initialNotificationInterval',
                  // @ts-expect-error I'm calling this a Nuxt problem. I did what the docs described and it doesn't fix it
                  interval: $siteSettings.getNotificationInterval(),
                });
                console.log(
                  '[notificationsService] service worker interval UPDATED'
                );
              } else {
                console.warn(
                  '[notificationsService] could not update service worker interval'
                );
              }
            }, 100); // 100ms delay

            // send toast telling users to make sure to revoke notifications permissions
            ToastEventBus.emit('add', {
              severity: 'info',
              summary: 'You have subscribed to notifications.',
              detail: 'You can safely close this tab.',
              life: 4000,
            });
          } catch (error) {
            console.error(
              'received error when registering service worker: ',
              error
            );
            // set notificationsOn to false
            // @ts-expect-error I'm calling this a Nuxt problem. I did what the docs described and it doesn't fix it
            $siteSettings.setNotificationsOn(false);

            // rethrow error to the next catch that adds a toast
            throw error;
          }
        } else if (notificationsOn === false) {
          // send a DELETE request to api/notifier to remove-subscription
          const registration = await navigator.serviceWorker.ready;
          if (registration) {
            const subscription =
              await registration.pushManager.getSubscription();
            if (subscription) {
              const requestBody: NotifierApiRequest = {
                // @ts-expect-error the MDN PushSubscriptionJSON interface
                // has all its properties as optional, but they should always
                // be there since I am making them be there
                subscription: subscription.toJSON(),
              };

              console.info(
                '[notificationsService] sending requestBody to /api/notifier via DELETE: ',
                requestBody
              );
              await $fetch('/api/notifier', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
              });
            } else {
              throw new Error('You were not subscribed to notifications.');
            }
          } else {
            throw new Error('Service worker not ready.');
          }
          // deregister the service worker from serviceWorker.ts
          console.log(
            '[notificationsService] unregistering service worker: ',
            serviceWorkerRegistration
          );
          if (serviceWorkerRegistration) {
            await serviceWorkerRegistration.unregister();
          }
          // send toast telling users to make sure to revoke notifications permissions
          ToastEventBus.emit('add', {
            severity: 'info',
            summary: 'You have unsubscribed from notifications.',
            detail:
              "Make sure to check your browser's permissions and rescind notifications for this website.",
            life: 4000,
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
          life: 4000,
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
            const subscription =
              await registration.pushManager.getSubscription();
            if (subscription) {
              const requestBody: NotifierApiRequest = {
                // @ts-expect-error the MDN PushSubscriptionJSON interface
                // has all its properties as optional, but they should always
                // be there since I am making them be there
                subscription: subscription.toJSON(),
                interval: notificationInterval,
              };

              console.info(
                '[notificationsService] sending requestBody to /api/notifier via PATCH: ',
                requestBody
              );
              await $fetch('/api/notifier', {
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
      // @ts-expect-error I'm calling this a Nuxt problem. I did what the docs described and it doesn't fix it
      () => $siteSettings.getNotificationsOn(),
      async (newValue) => await handleNotificationsChange(newValue)
    );

    // listen to the siteSettingsService for the settings.notificationInterval to change
    watch(
      // @ts-expect-error I'm calling this a Nuxt problem. I did what the docs described and it doesn't fix it
      () => $siteSettings.getNotificationInterval(),
      async (newValue) => await handleNotificationIntervalChange(newValue)
    );
  },
});
