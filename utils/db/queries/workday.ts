// ~/utils/db/queries/workday.ts

import { segments, sessions } from '../schema/workday';
import {
  eq,
  type InferInsertModel,
  type InferSelectModel,
  isNull,
  not,
  desc,
  asc,
  gte,
  and,
  lte,
} from 'drizzle-orm';
import { db } from '../client';

export async function createSession(
  start: typeof sessions.$inferInsert.start = new Date()
): Promise<typeof sessions.$inferSelect.id> {
  return (
    await db
      .insert(sessions)
      .values({ start: start })
      .returning({ id: sessions.id })
  )[0].id;
}

export async function updateSessionEnd(
  sessionId: typeof sessions.$inferSelect.id,
  end: typeof sessions.$inferInsert.end = new Date()
): Promise<void> {
  await db.update(sessions).set({ end: end }).where(eq(sessions.id, sessionId));
}

export async function createSegment(
  segment: InferInsertModel<typeof segments>
): Promise<typeof segments.$inferSelect.id> {
  return (
    await db
      .insert(segments)
      .values({
        ...segment,
      })
      .returning({ id: segments.id })
  )[0].id;
}

export async function updateSegmentEnd(
  segmentId: typeof segments.$inferSelect.id,
  end: typeof segments.$inferSelect.end = new Date()
): Promise<void> {
  const response = await db.update(segments).set({ end: end }).where(eq(segments.id, segmentId));
  console.log(response)
}

export async function getOpenSegment(
  sessionId: typeof sessions.$inferSelect.id
): Promise<InferSelectModel<typeof segments> | undefined> {
  const response = await db
    .select()
    .from(segments)
    .where(and(eq(segments.sessionId, sessionId), isNull(segments.end)));
  return response.length > 0 ? response[0] : undefined;
}

export async function getOpenSession(): Promise<
  InferSelectModel<typeof sessions> | undefined
> {
  const response = await db.select().from(sessions).where(isNull(sessions.end));
  if (response.length > 1) {
    throw new Error('Sessions table has more than one open session.');
  }

  return response.length > 0 ? response[0] : undefined;
}

export async function getLastClosedSession(): Promise<
  InferSelectModel<typeof sessions> | undefined
> {
  const response = await db
    .select()
    .from(sessions)
    .where(not(isNull(sessions.end)))
    .orderBy(desc(sessions.end))
    .limit(1);

  return response.length > 0 ? response[0] : undefined;
}

export async function getSegmentsForSession(
  sessionId: typeof sessions.$inferSelect.id
): Promise<InferSelectModel<typeof segments>[]> {
  return await db
    .select()
    .from(segments)
    .where(eq(segments.sessionId, sessionId))
    .orderBy(asc(segments.start));
}

export async function getSessionsForWeek(
  weekday: Date = new Date()
): Promise<InferSelectModel<typeof sessions>[]> {
  // calculate the start and end of the week
  const dayOfWeek = weekday.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = weekday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
  const startDate = new Date(weekday.setDate(diff));
  const endDate = new Date(weekday.setDate(startDate.getDate() + 6));

  return await db
    .select()
    .from(sessions)
    .where(and(gte(sessions.start, startDate), lte(sessions.end, endDate)))
    .orderBy(asc(sessions.start));
}
