// ~/server/api/notifier.ts

import webpush, { type PushSubscription } from 'web-push';
import { ActivityType } from '../../composables/workdayService'; // is this the problem?
import {
  getOpenSession,
  getSegmentsForSession,
} from '../../utils/db/queries/workday';
import {
  getSubscribersToNotify,
  subscribe,
  unsubscribe,
  updateSubscriberByEndpoint,
  updateSubscriberTargetTimeByEndpoint,
} from '../../utils/db/queries/subscribers';

export type NotifierApiRequest = {
  subscription: PushSubscription;
  interval?: number; // in seconds
};

// TODO: if the workday stops and a new one begins, do the subscribers' target notification intervals change back from whatever it was for the last workday to what it needs to be for the new workday? e.g. if the last workday was at 8 hrs, the next hourly notification would be hour 9, but for the new workday should be hour 1

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
    console.log(
      `[api/notifier] request origin from headers is ${event.node.req.headers.origin}`
    );
    console.log(`[api/notifier] configuring webpush at ${origin}`);

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
    const requestBody = await readBody<NotifierApiRequest>(event);

    console.log(`[api/notifier ${event.method}] request body: `, requestBody);
    switch (event.method) {
      case 'POST': {
        // create-subscription: add the new subscriber to the subscribers
        if (requestBody.interval && requestBody.subscription) {
          const subscriberDetails =
            requestBody.subscription as PushSubscription;
          await subscribe({
            endpoint: subscriberDetails.endpoint,
            expirationTime: subscriberDetails.expirationTime,
            auth: subscriberDetails.keys.auth,
            p256dh: subscriberDetails.keys.p256dh,
            interval: requestBody.interval,
            targetNotificationTime: await getNextNotificationTime(
              Number(requestBody.interval)
            ),
          });
          return;
        }
        throw new Error('Invalid POST request.');
      }

      case 'PATCH': {
        // update-subscription: look up the subscriber and change the interval to the new interval
        if (requestBody.interval && requestBody.subscription) {
          await updateSubscriberByEndpoint(requestBody.subscription.endpoint, {
            // update the interval to the newly provided interval
            interval: Number(requestBody.interval),
            // update the target notification time using the new interval and the current working duration
            targetNotificationTime: await getNextNotificationTime(
              Number(requestBody.interval)
            ),
          });
          return;
        }
        throw new Error('Invalid PATCH request.');
      }

      case 'DELETE': {
        // remove-subscription: look up the subscriber and remove it
        if (requestBody.subscription) {
          await unsubscribe(requestBody.subscription.endpoint);
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

/**
 * Gets subscribers whose target notification time is less
 * than the total current working time and concurrently sends
 * them a push notification.
 *
 * Afterwards, updates the subscriber's target time to the
 * next time on their preferred interval.
 *
 * If a delivery fails, removes the subscriber to avoid
 * bothering them with more unwanted notifications.
 */
async function checkAndSendNotifications() {
  const totalWorkingDuration = await getCurrentWorkingTime();
  const subscribers = await getSubscribersToNotify(totalWorkingDuration);

  // concurrently send notifications to all the subscribers ready for one
  await Promise.all(
    subscribers.map(async (subscriber) => {
      try {
        await webpush.sendNotification(
          subscriber,
          `You have been working for ${formatDuration(totalWorkingDuration)}`
        );
      } catch (error) {
        console.error('Failed to send notification:', error);

        if (error instanceof webpush.WebPushError && error.statusCode === 410) {
          // try deleting the subscriber from the list since they are no longer subscribed
          // https://autopush.readthedocs.io/en/latest/http.html#error-codes
          await $fetch('/api/notifier', {
            method: 'DELETE',
            body: { subscription: subscriber },
          });
        }
      }

      // recalculate outside the try/catch so that if delivery fails, it won't keep trying to send another for this interval match
      // Calculate the next target notification time
      await updateSubscriberTargetTimeByEndpoint(
        subscriber.endpoint,
        subscriber.targetNotificationTime + subscriber.interval
      );
    })
  );
}

// TODO: consolidate this function into the workdayService
/**
 * @returns the active working time **in seconds** for the current work session
 * (excluding breaks). If there is no open session, returns 0.
 */
async function getCurrentWorkingTime(): Promise<number> {
  const now = new Date();
  let totalWorkingDuration = 0;
  // TODO: get the database data from API instead

  const openSession = await getOpenSession();
  if (!openSession) {
    return 0;
  }

  // Get all segments for current session
  const segments = await getSegmentsForSession(openSession.id);

  // sum the active working time
  for (const segment of segments) {
    if (segment.activity === ActivityType.Working) {
      const startTime = segment.start;
      const endTime = segment.end ?? now;

      const segmentDuration = endTime.getTime() - startTime.getTime();
      totalWorkingDuration += segmentDuration;
    }
  }

  // convert ms to sec
  return Math.floor(totalWorkingDuration / 1000);
}

/**
 * 1. divide to get the number of intervals passed during this working time,
 * 2. get the ceiling so that the next interval is the one in the future,
 * 3. multiply by how long each interval is to get the target time
 *
 * @param {number} interval the amount of time **in seconds** between notifications
 * @returns {number} the time **in seconds** that the next notification should be
 * sent at in relation to the current working time.
 */
async function getNextNotificationTime(interval: number): Promise<number> {
  const currentWorkingTime = await getCurrentWorkingTime();
  return Math.ceil(currentWorkingTime / interval) * interval;
}

/**
 * @param {number} totalWorkingDuration the active working time **in seconds**
 * @returns {string} the duration formatted like HH:mm:ss
 */
function formatDuration(totalWorkingDuration: number): string {
  const hours = Math.floor(totalWorkingDuration / 3600);
  const minutes = Math.floor((totalWorkingDuration % 3600) / 60);
  const seconds = totalWorkingDuration % 60;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

// check every minute if a notification should be sent
// doesn't need to be any faster, since the minimum interval between notifications is one minute.
const notificationCheckInterval = setInterval(checkAndSendNotifications, 60000);

// cleanup interval on exit
process.on('exit', () => clearInterval(notificationCheckInterval));
