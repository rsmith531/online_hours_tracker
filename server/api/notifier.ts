// ~/server/api/notifier.ts

import type { PushSubscription } from 'web-push';
import webpush from 'web-push';

// the list of subscribers to the push notifications
const subscribers: { subscription: PushSubscription; interval: number }[] = [];

export type NotifierApiRequest = {
  subscription: PushSubscription;
  interval?: number;
};

export default defineEventHandler(async (event) => {
  // configure web-push
  if (
    process.env.VITE_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  ) {
    webpush.setVapidDetails(
      // TODO: get this URL from a reliable source of information about where the server is running
      'https://localhost:3000',
      process.env.VITE_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } else {
    return createError({
      statusCode: 512,
      statusMessage: 'VAPID keys are not configured.',
    });
  }

  try {
    const requestBody: NotifierApiRequest = await readBody(event);
    console.log('notifier API got: ', requestBody);
    switch (event.method) {
      case 'GET': {
        // TODO
        // send-notification: will need to listen to the workday API to know the current working time
        // at the intervals set by each subscriber, push a notification to them
        console.warn('Notifier API: GET not implemented');
        webpush.sendNotification(subscribers[0].subscription, 'Hello world');
        return;
      }
      case 'POST': {
        // create-subscription: add the new subscriber to the subscribers
        subscribers.push({
          subscription: requestBody.subscription,
          interval: Number(requestBody.interval),
        });
        return;
      }

      case 'PATCH': {
        // update-subscription: look up the subscriber and change the interval to the new interval
        if (requestBody.interval && requestBody.subscription) {
          const subscriber = subscribers.findIndex((subscriber) => {
            subscriber.subscription.endpoint ===
              requestBody.subscription.endpoint;
          });

          if (subscriber !== -1) {
            // found subscriber
            subscribers[subscriber].interval = requestBody.interval;
          } else {
            console.warn(
              'Notifier API: did not find subscriber while updating interval.'
            );
          }

          return;
        }
        throw new Error('Invalid PATCH request.');
      }

      case 'DELETE': {
        // remove-subscription: look up the subscriber and remove it
        if (requestBody.subscription) {
          const subscriber = subscribers.findIndex((subscriber) => {
            subscriber.subscription.endpoint ===
              requestBody.subscription.endpoint;
          });

          if (subscriber !== -1) {
            // found subscriber
            subscribers.splice(subscriber, 1); // remove the subscriber
          } else {
            console.warn(
              'Notifier API: did not find subscriber while removing subscriber.'
            );
          }
          return;
        }
        throw new Error('Invalid DELETE request.');
      }

      default: {
        return createError({
          statusCode: 400,
          statusMessage: 'Invalid request',
        });
      }
    }
  } catch (error) {
    console.error('Notifier API:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    });
  }
});
