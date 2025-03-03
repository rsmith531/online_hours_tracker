// ~/public/serviceWorker.js

let notificationInterval = 60; // Default value

// update the notification interval when it gets the message from the server
self.addEventListener('message', (event) => {
  try {
    if (event.data && event.data.type === 'initialNotificationInterval') {
      notificationInterval = event.data.interval;
      console.log(
        '[serviceWorker] Received initial notificationInterval:',
        notificationInterval
      );
    }
  } catch (error) {
    console.error(
      '[serviceWorker] could not receive initial notificationInterval: ',
      error
    );
    console.trace();
  }
});

// when the service worker is registered, the activate event is triggered
self.addEventListener('activate', async () => {
  try {
    console.log('[serviceWorker] adding event listener for activate... ');
    const subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('BDrm3OZerkXyjQ0Vc0Xr_Pewynd6lRCZKLEgLNbfooHvlzJ8bRT2h1Mi7_4J3s_BAk5FDbmGXewU1-tBFlXcC78'), // populated at build time by vite pre-build hook
    });
    console.log('[serviceWorker] subscribed to push: ', subscription);

    // construct the URL the service worker will contact
    const notifierUrl = `${self.location.origin}/api/notifier`;

    const requestBody = {
      subscription: subscription.toJSON(),
      interval: notificationInterval,
    };

    console.log(
      `[serviceWorker] sending requestBody to ${notifierUrl} via POST: `,
      requestBody
    );

    // send a POST request to /api/notifier to create-subscription
    const response = await fetch(notifierUrl, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('[serviceWorker] got response', response.body);
  } catch (error) {
    console.error('[serviceWorker] could not activate service worker: ', error);
    console.trace();
  }
});

self.addEventListener('push', (e) => {
  try {
    console.log('[serviceWorker] adding event listener for push... ');
    // in the push event, it should get the event body text and display it as a push notification via the push API
    // clicking the notification should take the user to the website
    self.registration.showNotification('Workday reminder', {
      body: e.data?.text(),
    });
  } catch (error) {
    console.error(
      '[serviceWorker] could not show push notification from server: ',
      error
    );
    console.trace();
  }
});

// a helper function to make the VAPID public key readable by the Push API
const urlBase64ToUint8Array = (base64String) => {
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
