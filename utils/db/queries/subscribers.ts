// ~/utils/db/queries/subscribers.ts

import { type InferInsertModel, type InferSelectModel, eq, lte } from 'drizzle-orm';
import { db } from '../client';
import { subscribers } from '../schema/subscribers';
import type { PushSubscription } from 'web-push';

export async function subscribe(
  subscriber: InferInsertModel<typeof subscribers>
): Promise<typeof subscribers.$inferSelect.id> {
  return (
    await db
      .insert(subscribers)
      .values({ ...subscriber })
      .returning({ id: subscribers.id })
  )[0].id;
}

export async function unsubscribe(
  subscriber: typeof subscribers.$inferSelect.endpoint
): Promise<void> {
  const response = await db.delete(subscribers).where(eq(subscribers.endpoint, subscriber));
  
  if (response.changes === 0) {
    console.warn('[unsubscribe] did not find subscriber with matching endpoint')
  }
}

export async function updateSubscriberByEndpoint(
  endpoint: typeof subscribers.$inferSelect.endpoint,
  subscriber: Partial<Omit<InferSelectModel<typeof subscribers>, 'endpoint'>>
): Promise<void> {
  await db
    .update(subscribers)
    .set({ ...subscriber })
    .where(eq(subscribers.endpoint, endpoint));
}

export async function updateSubscriberTargetTimeByEndpoint(
  endpoint: typeof subscribers.$inferSelect.endpoint,
  target: typeof subscribers.$inferSelect.targetNotificationTime
): Promise<void> {
  await db
    .update(subscribers)
    .set({ targetNotificationTime: target })
    .where(eq(subscribers.endpoint, endpoint));
}

export async function updateSubscriberTargetTimes(): Promise<void> {
  const allSubscribers = await db
    .select({ id: subscribers.id, interval: subscribers.interval })
    .from(subscribers);

  await Promise.all(
    allSubscribers.map(async (subscriber) => {
      // const newTargetTime = await getNextNotificationTime(subscriber.interval);
      // await db
      //   .update(subscribers)
      //   .set({ targetNotificationTime: newTargetTime })
      //   .where(eq(subscribers.id, subscriber.id));
    })
  );
}

/**
 * Gets subscribers whose target notification time
 * is less than the provided target time
 */
export async function getSubscribersToNotify(
  targetNotificationTime: typeof subscribers.$inferSelect.targetNotificationTime
): Promise<
  (PushSubscription & {
    targetNotificationTime: typeof subscribers.$inferSelect.targetNotificationTime;
    interval: typeof subscribers.$inferSelect.interval;
  })[]
> {
  return await db
    .select({
      keys: { auth: subscribers.auth, p256dh: subscribers.p256dh },
      endpoint: subscribers.endpoint,
      expirationTime: subscribers.expirationTime,
      targetNotificationTime: subscribers.targetNotificationTime,
      interval: subscribers.interval,
    })
    .from(subscribers)
    .where(lte(subscribers.targetNotificationTime, targetNotificationTime));
}
