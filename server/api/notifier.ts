// ~/server/api/notifier.ts

import type { PushSubscription } from 'web-push';
import webpush from 'web-push';
import { ActivityType } from '../../composables/workdayService';
import { getOpenSession, getSegmentsForSession } from '../../utils/db';

// the list of subscribers to the push notifications
const subscribers: {
  subscription: PushSubscription;
  interval: number; // in seconds
  targetNotificationTime: number; // elapsed working time to send next notification in ms
}[] = [];

export type NotifierApiRequest = {
  subscription: PushSubscription;
  interval?: number; // in seconds
};

export default defineEventHandler(async (event) => {
  // check if request is authorized, throws 401 if not
  await requireUserSession(event);
  const config = useRuntimeConfig();

  // configure web-push
  if (config.public.vapidPublicKey && config.vapidPrivateKey) {
    // check if origin is an https, if not or if it does not exist, use a default
    const origin = event.node.req.headers?.origin?.startsWith('https:')
      ? event.node.req.headers.origin
      : 'https://localhost:3000';
      console.log(`[api/notifier] request origin from headers is ${event.node.req.headers.origin}`)
      console.log(`[api/notifier] configuring webpush at ${origin}`)

    webpush.setVapidDetails(
      origin,
      config.public.vapidPublicKey,
      config.vapidPrivateKey
    );
  } else {
    return createError({
      statusCode: 512,
      statusMessage: 'VAPID keys are not configured.',
    });
  }

  try {
    switch (event.method) {
      case 'GET': {
        // send-notification: send a message to ALL subscribers
        subscribers.map((subscriber) => {
          webpush.sendNotification(subscriber.subscription, 'Hello world');
        });

        return;
      }
      case 'POST': {
        // create-subscription: add the new subscriber to the subscribers
        const requestBody = await readBody(event);
        const intervalMs = Number(requestBody.interval) * 1000;
        const currentWorkingTime = getCurrentWorkingTime();
        const nextNotificationTime =
          Math.ceil(currentWorkingTime / intervalMs) * intervalMs;
        subscribers.push({
          subscription: requestBody.subscription,
          interval: Number(requestBody.interval),
          targetNotificationTime: nextNotificationTime,
        });
        console.log('[api/notifier] subscribers is now ', subscribers);
        return;
      }

      case 'PATCH': {
        // update-subscription: look up the subscriber and change the interval to the new interval
        const requestBody = await readBody(event);
        if (requestBody.interval && requestBody.subscription) {
          console.log("[api/notifier: PATCH] looking for subscriber...")
          console.log(`[api/notifier: PATCH] ${requestBody.subscription.endpoint}`)
          const subscriber = subscribers.findIndex((subscriber) => {
            console.log(`[api/notifier: PATCH] ${subscriber.subscription.endpoint}`)
            return (
              subscriber.subscription.endpoint ===
              requestBody.subscription.endpoint
            );
          });

          if (subscriber !== -1) {
            // found subscriber
            // TODO: extract from here and PUT into a function
            const intervalMs = Number(requestBody.interval) * 1000;
            const currentWorkingTime = getCurrentWorkingTime();
            const nextNotificationTime =
              Math.ceil(currentWorkingTime / intervalMs) * intervalMs;
            subscribers[subscriber].interval = requestBody.interval;
            subscribers[subscriber].targetNotificationTime =
              nextNotificationTime;
            console.log('[api/notifier] subscribers is now ', subscribers);
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
        const requestBody = await readBody(event);
        if (requestBody.subscription) {
          console.log("[api/notifier: DELETE] looking for subscriber...")
          console.log(`[api/notifier: DELETE] ${requestBody.subscription.endpoint}`)
          const subscriber = subscribers.findIndex((subscriber) => {
            console.log(`[api/notifier: DELETE] ${subscriber.subscription.endpoint}`)
            return (
              subscriber.subscription.endpoint ===
              requestBody.subscription.endpoint
            );
          });

          if (subscriber !== -1) {
            // found subscriber
            subscribers.splice(subscriber, 1); // remove the subscriber
            console.log('[api/notifier] subscribers is now ', subscribers);
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

async function checkAndSendNotifications() {
  const totalWorkingDuration = getCurrentWorkingTime();

  for (const subscriber of subscribers) {
    if (
      totalWorkingDuration >= subscriber.targetNotificationTime &&
      totalWorkingDuration !== 0
    ) {
      try {
        await webpush.sendNotification(
          subscriber.subscription,
          `You have been working for ${formatDuration(totalWorkingDuration)}`
        );
        // Calculate the next target notification time
        subscriber.targetNotificationTime += subscriber.interval * 1000;
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  }
}

// TODO: consolidate this function into the workdayService
function getCurrentWorkingTime(): number {
  const now = new Date();
  let totalWorkingDuration = 0;

  // TODO: get the database data from API instead
  // Get all segments for current session
  const openSession = getOpenSession();
  const segments = openSession ? getSegmentsForSession(openSession.id) : [];

  for (const segment of segments) {
    if (segment.activity === ActivityType.Working) {
      const startTime = new Date(segment.start);
      const endTime = segment.end ? new Date(segment.end) : now;

      const segmentDuration = endTime.getTime() - startTime.getTime();
      totalWorkingDuration += segmentDuration;
    }
  }

  return totalWorkingDuration;
}

function formatDuration(totalWorkingDuration: number): string {
  const totalSeconds = Math.floor(totalWorkingDuration / 1000); // Get whole number seconds from ms

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

// Check every second for accumulated working time
const notificationCheckInterval = setInterval(checkAndSendNotifications, 1000);

// Cleanup on exit
process.on('exit', () => clearInterval(notificationCheckInterval));
