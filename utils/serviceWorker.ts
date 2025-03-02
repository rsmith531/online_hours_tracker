// ~/utils/serviceWorker.ts

// when the service worker is registered, the activate event is triggered

// in the activate event, send a POST request to /api/notifier to create-subscription
// it will need to send a VAPID public key from a key pair stored on the server with it as applicationServerKey
// it will need userVisibleOnly set to true
// it will need to contain the settings.notificationInterval from the siteSettingsService (non-reactive I think) so the server knows how often to send the notification 

// will this file have access to the public key in the environment variable when it is registered as a service worker?

// in the push event, it should get the event body text and display it as a push notification via the push API
// clicking the notification should take the user to the website