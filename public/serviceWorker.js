// ~/public/serviceWorker.js

let notificationInterval = 60 * 60; // Default value: 1hr

let intervalPromiseResolve;

// create a tripwire to hold the activate event from running
// when the resolve function is called, it ends the await so
// any code after it can be executed
const intervalPromise = new Promise((resolve) => {
  // assign the tripwire to the accessor
  intervalPromiseResolve = resolve;
});

// update the notification interval when it gets the message from the server
self.addEventListener('message', (event) => {
  try {
    console.log('[serviceWorker] adding event listener for message... ');
    if (event.data && event.data.type === 'initialNotificationInterval') {
      notificationInterval = event.data.interval;
      console.log(
        '[serviceWorker] Received initial notificationInterval:',
        notificationInterval
      );
      // trigger the tripwire (resolve the promise)
      intervalPromiseResolve();
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

    // don't run anything else until the tripwire is triggered
    await intervalPromise;
    console.log(
      `[serviceWorker] tripwire triggered: notificationInterval is now ${notificationInterval}`
    );

    const subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BOdW06v7GXcA5HcaRNVc-eozeQ_f9y9o4_s7qCrWxQw8ldEWOZsvsxX8RtO7R4iHTOXCYt9scZbLyMORoS4xDuM'
      ), // populated at build time by vite pre-build hook
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
      tag: 'workday-tracker',
      icon: new URL('/favicon.ico', self.location.origin).href,
      actions: [{ action: 'go-to-dashboard', title: 'Go to dashboard' }],
    });
  } catch (error) {
    console.error(
      '[serviceWorker] could not show push notification from server: ',
      error
    );
    console.trace();
  }
});

// behavior for when the push notification is clicked
self.addEventListener('notificationclick', (event) => {
  const promiseChain = async (event) => {
    // user clicked the notification, not its button
    if (!event.action) {
      // go to the website, accounting for the promise for the waitUntil()
      return sendClientToWebsite();
    }

    // user clicked on one of the notification's buttons
    switch (event.action) {
      case 'go-to-dashboard': {
        // go to the website, accounting for the promise for the waitUntil()
        return sendClientToWebsite();
      }
      default: {
        console.warn(
          `[pushNotification] unknown action clicked: ${event.action}`
        );
      }
    }

    // close the notification
    const clickedNotification = event.notification;
    return clickedNotification.close();
  };

  // keep the service worker alive while the user's response is handled
  event.waitUntil(promiseChain(event));
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

/**
 * checks if the user's browser has any open tabs or windows at our
 * website already and focuses it, or opens a new window to our
 * website if they don't.
 */
const sendClientToWebsite = () => {
  // get the absolute URL from this relative URL
  const urlToOpen = new URL('/', self.location.origin).href;

  // get a list of WindowClient objects
  return clients
    .matchAll({
      type: 'window', // only windows and tabs, no service workers
      includeUncontrolled: true, // even the ones this service worker doesn't control
    })
    .then((windowClients) => {
      let matchingClient = null;

      for (let i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        if (windowClient.url === urlToOpen) {
          matchingClient = windowClient;
          break;
        }
      }

      if (matchingClient) {
        return matchingClient.focus();
      }
      return clients.openWindow(urlToOpen);
    })
    .catch((error) => {
      console.error(
        '[sendClientToWebsite] encountered a problem while sending user to website: ',
        error
      );
    });
};
