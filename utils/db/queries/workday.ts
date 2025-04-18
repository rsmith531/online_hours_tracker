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
  sql,
  inArray,
} from 'drizzle-orm';
import { db } from '../client';
import { z } from 'zod';

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
): Promise<typeof sessions.$inferSelect | null> {
  const response = await db
    .update(sessions)
    .set({ end: end })
    .where(eq(sessions.id, sessionId))
    .returning();
  return response.length > 0 ? response[0] : null;
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
  await db.update(segments).set({ end: end }).where(eq(segments.id, segmentId));
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

export async function getSessions(
  sort: {
    column: keyof typeof sessions.$inferSelect | 'start_time' | 'end_time';
    order: 'asc' | 'desc';
  },
  amount: number,
  page: number,
  timezoneOffset: number
) {
  const offset = (page - 1) * amount;
  const timezoneOffsetSeconds = timezoneOffset * 60;

  console.log(
    `[getSessions] sorting ${sort.column} by ${sort.order}\n    Getting ${amount} rows by offset ${offset} with timezone offset ${timezoneOffset}`
  );

  // create a common table expression to ensure it gets `amount` unique rows
  const limitedSessions = db.$with('limited_sessions').as(
    db
      .select({ id: sessions.id })
      .from(sessions)
      .orderBy(
        sort.column === 'start_time' || sort.column === 'end_time'
          ? sort.order === 'asc'
            ? asc(
                sql<string>`strftime('%H:%M:%S', ${
                  sort.column === 'start_time' ? sessions.start : sessions.end
                } - ${timezoneOffsetSeconds}, 'unixepoch')`
              )
            : desc(
                sql<string>`strftime('%H:%M:%S', ${
                  sort.column === 'start_time' ? sessions.start : sessions.end
                } - ${timezoneOffsetSeconds}, 'unixepoch')`
              )
          : sort.order === 'asc'
            ? asc(sessions[sort.column])
            : desc(sessions[sort.column])
      )
      .limit(amount)
      .offset(offset)
  );

  const response = await db
    .with(limitedSessions)
    .select()
    .from(limitedSessions)
    .innerJoin(sessions, eq(limitedSessions.id, sessions.id))
    .leftJoin(segments, eq(sessions.id, segments.sessionId));

  console.log(
    `[getSessions] got results in order ${response.map((element) => element.sessions.id)}`
  );

  const result: (InferSelectModel<typeof sessions> & {
    segments: InferSelectModel<typeof segments>[];
  })[] = response.reduce<
    (InferSelectModel<typeof sessions> & {
      segments: InferSelectModel<typeof segments>[];
    })[]
  >((acc, row) => {
    const sessionData = row.sessions;
    const segmentData = row.segments;

    const existingSession = acc.find((s) => s.id === sessionData.id);

    if (existingSession) {
      if (segmentData) {
        existingSession.segments.push(segmentData);
      }
    } else {
      acc.push({ ...sessionData, segments: segmentData ? [segmentData] : [] });
    }

    return acc;
  }, []);

  console.log(
    `[getSessions] returning results in order ${result.map((element) => element.id)}`
  );
  console.log(`[getSessions] found ${result.length} rows`);

  return result;
}

export async function deleteSessions(
  ids: Array<typeof sessions.$inferSelect.id>
) {
  await db.delete(sessions).where(inArray(sessions.id, ids));
}

export async function editSession(
  column: keyof typeof sessions.$inferSelect,
  rowId: typeof sessions.$inferSelect.id,
  newValue: unknown
) {
  console.log(
    `[editSession] changing value in column ${column} for row ${rowId} to "${newValue}".`
  );
  // validate newValue
  switch (column) {
    case 'start': {
      const validator = z.coerce.number().min(1577836800); // 1/1/2020 00:00:00
      const validatedResponse = validator.parse(newValue);
      const valueToSubmit = new Date(validatedResponse);
      // update the session start value
      await db
        .update(sessions)
        .set({ start: valueToSubmit })
        .where(eq(sessions.id, rowId));
      // update the earliest segment for the given sessionId
      await db
        .update(segments)
        .set({ start: valueToSubmit })
        .orderBy(asc(segments.start))
        .limit(1)
        .where(eq(segments.sessionId, rowId));
      break;
    }
    case 'end': {
      const validator = z.coerce.number().min(1577836800).nullable(); // 1/1/2020 00:00:00
      const validatedResponse = validator.parse(newValue);

      // try to make a Date object out of newValue if it isn't null
      const valueToSubmit = validatedResponse
        ? new Date(validatedResponse)
        : null;

      // set the session.end column to newValue
      await updateSessionEnd(rowId, valueToSubmit);
      // set the latest segment.end to newValue or null
      if (valueToSubmit) {
        // check if there is a null segment for this session
        const nullSegment = await db
          .select({ id: segments.id })
          .from(segments)
          .where(and(eq(segments.sessionId, rowId), isNull(segments.end)))
          .limit(1);
        if (nullSegment.length > 0) {
          // if there is one, update it
          await db
            .update(segments)
            .set({ end: valueToSubmit })
            .where(and(eq(segments.sessionId, rowId), isNull(segments.end)));
        } else if (nullSegment.length === 0) {
          // otherwise, update the latest segment for the given session
          await db
            .update(segments)
            .set({ end: valueToSubmit })
            .orderBy(desc(segments.end))
            .limit(1)
            .where(eq(segments.sessionId, rowId));
        } else {
          console.error('[editSession] nullSegment: ', nullSegment);
          throw new Error(
            `[editSession] encountered unexpected state while setting the segment for session ${rowId} to ${valueToSubmit}`
          );
        }
      } else {
        await db
          .update(segments)
          .set({ end: null })
          .orderBy(desc(segments.end))
          .limit(1)
          .where(eq(segments.sessionId, rowId));
      }

      return;
    }
    case 'state': {
      const validator = z.enum(['open', 'closed']);
      validator.parse(newValue);
      if (newValue === 'closed') {
        const now = new Date();
        // set the session.end column to now
        await updateSessionEnd(rowId, now);
        // set the latest segment.end to now
        return await db
          .update(segments)
          .set({ end: now })
          .where(and(eq(segments.sessionId, rowId), isNull(segments.end)));
      }
      if (newValue === 'open') {
        // set session.end to null
        await updateSessionEnd(rowId, null);
        // set the latest segment.end to null
        db.run(sql`
          UPDATE ${segments}
          SET end = NULL
          WHERE id = (
            SELECT id
            FROM ${segments}
            WHERE session_id = ${rowId}
            ORDER BY end DESC
            LIMIT 1
          );
        `);
        return;
      }
      throw new Error(
        `[editSession] ${newValue} is an invalid value for updating ${column}.`
      );
    }
    default: {
      throw new Error(`[editSession] column ${column} does not exist`);
    }
  }
}

export async function countSessions() {
  return await db.$count(sessions);
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
