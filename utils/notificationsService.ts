// ~/utils/notificationsService.ts

// make sure all this runs on the client only, no server

// listen to the siteSettingsService for the settings.notificationsOn to be set to true

// when false, send a DELETE request to api/notifier to remove-subscription, revoke notifications permissions, and deregister the service worker from serviceWorker.ts

// when true, trigger a check to see if the client supports service workers, notifications, and push APIs

// if any of these are unsupported, set notificationsOn to false and send a toast to explain what happened and return early

// next, check if notifications permissions have been granted

// if not, request permission from the user

// if they deny, set notificationsOn to false and send a toast to explain what happened and return early

// finally, register the service worker from serviceWorker.ts (if previously registered, it will update the registration)

// also, listen to the siteSettingsService for the settings.notificationInterval to change

// when it changes, send a PATCH request to api/notifier to update-subscription to the new interval