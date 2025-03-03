// ~/public/serviceWorker.ts

declare const self: ServiceWorkerGlobalScope;
import type { NotifierApiRequest } from 'server/api/notifier';

// when the service worker is registered, the activate event is triggered
self.addEventListener('activate', async () => {
  console.log('[serviceWorker] adding event listener for activate... ');
  const subscription = await self.registration.pushManager.subscribe({
    userVisibleOnly: true,
    // will this file have access to the public key in the environment variable when it is registered as a service worker?
    applicationServerKey: urlBase64ToUint8Array('BLuvMIgFaIErYWv0eQPV_xrZflq4ZJfn5QBGmTE6_FiPnoDokw9NC6DXcUZYsmvHazLHbPc-0vDreGFXQ4hgFp8'), // populated at build time by vite pre-build hook
  });

  // The siteSettingsService is not accessible to the service worker,
  // but I know that the service stores the interval here, so I will
  // cheat and pick it up directly
  // TODO: more elegantly get the interval value
  const requestBody: NotifierApiRequest = {
    // @ts-expect-error I don't really know if this will be a problem or not
    subscription: subscription.toJSON(),
    interval: Number.parseInt(
      localStorage.getItem('notificationInterval') ?? '60'
    ),
  };

  console.log('[serviceWorker]: sending requestBody to /api/notifier via POST: ', requestBody);

  // send a POST request to /api/notifier to create-subscription
  await fetch('/api/notifier', {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
});

self.addEventListener('push', (e) => {
  console.log('[serviceWorker] adding event listener for push... ');
  // in the push event, it should get the event body text and display it as a push notification via the push API
  // clicking the notification should take the user to the website
  self.registration.showNotification('Wohoo!!', { body: e.data?.text() });
});

// a helper function to make the VAPID public key readable by the Push API
const urlBase64ToUint8Array = (
  base64String: string
): Uint8Array<ArrayBuffer> => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};
