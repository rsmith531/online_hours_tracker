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
  type SQL,
  or,
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
  timezoneOffset: number,
  filter?: {
    column:
      | Extract<keyof typeof sessions.$inferSelect, 'start' | 'state'>
      | 'start_time'
      | 'end_time';
    value: string | [Date | null, Date | null];
  }
) {
  const offset = (page - 1) * amount;
  const timezoneOffsetSeconds = timezoneOffset * 60;

  console.log(
    `[getSessions] sorting ${sort.column} by ${sort.order}\n    Getting ${amount} rows by offset ${offset} with timezone offset ${timezoneOffset}`
  );

  let whereCondition: SQL | undefined;
  if (filter) {
    console.log(`[getSessions] filtering ${filter.column} by `, filter.value);
    switch (filter.column) {
      case 'state': {
        if (typeof filter.value === 'string') {
          whereCondition = eq(sessions.state, filter.value);
        } else {
          console.error(
            `[getSessions] ${filter.value} is an invalid filter type for ${filter.column} column.`
          );
        }
        break;
      }
      case 'start': {
        if (Array.isArray(filter.value)) {
          const [startDate, endDate] = filter.value;
          const conditions: SQL[] = [];
          if (startDate) {
            conditions.push(gte(sessions.start, startDate));
          }
          if (endDate) {
            conditions.push(lte(sessions.start, endDate));
          }
          if (conditions.length > 0) {
            whereCondition = and(...conditions);
          }
        } else {
          console.error(
            `[getSessions] ${filter.value} is an invalid filter type for ${filter.column} column.`
          );
        }
        break;
      }
      case 'start_time': {
        if (Array.isArray(filter.value)) {
          const [startTime, endTime] = filter.value;
          const dbStartTimeWithOffsetSql = sql<string>`strftime('%H:%M:%S', ${sessions.start} - ${timezoneOffsetSeconds}, 'unixepoch')`;


          // Helper function to get time in HH:MM:SS format relative to UTC
          const getFilterTimeInTargetTimezoneString = (
            date: Date,
            offsetSeconds: number
          ): string => {
            // Get the UTC timestamp in seconds
            const utcTimestampSeconds = date.getTime() / 1000;
            // Add the offset to the UTC timestamp to find the equivalent timestamp in the target timezone
            const targetTimestampSeconds = utcTimestampSeconds - offsetSeconds;
            // Create a new Date object from this adjusted timestamp
            const targetDate = new Date(targetTimestampSeconds * 1000);
            // Get the time components from this adjusted Date object using UTC methods.
            // This effectively gives the time in the target timezone.
            const hours = targetDate.getUTCHours().toString().padStart(2, '0');
            const minutes = targetDate
              .getUTCMinutes()
              .toString()
              .padStart(2, '0');
            const seconds = targetDate
              .getUTCSeconds()
              .toString()
              .padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
          };

          let timeFilterCondition: SQL | undefined;
          if (startTime && endTime) {
            // Both start and end filters are present. Apply the midnight crossing logic.

            // Convert filter times from UTC to the target timezone for comparison
            const filterStartTimeTargetTZ = getFilterTimeInTargetTimezoneString(
              startTime,
              timezoneOffsetSeconds
            );
            const filterEndTimeTargetTZ = getFilterTimeInTargetTimezoneString(
              endTime,
              timezoneOffsetSeconds
            );

            // Create the individual comparison conditions.
            // Within this block, startTime and endTime are guaranteed to be Date objects.
            const gteCondition = gte(
              dbStartTimeWithOffsetSql,
              filterStartTimeTargetTZ
            );
            const lteCondition = lte(
              dbStartTimeWithOffsetSql,
              filterEndTimeTargetTZ
            );

            // Determine if the range crosses midnight based on the filter values IN THE TARGET TIMEZONE
            if (filterStartTimeTargetTZ <= filterEndTimeTargetTZ) {
              // Range does NOT cross midnight (e.g., 09:00 to 17:00 in user's time)
              // Condition is: (db_time_with_offset >= filter_start_time_target_tz) AND (db_time_with_offset <= filter_end_time_target_tz)
              timeFilterCondition = and(gteCondition, lteCondition);
            } else {
              // Range crosses midnight (e.g., 20:00 to 03:00 in user's time)
              // Condition is: (db_time_with_offset >= filter_start_time_target_tz) OR (db_time_with_offset <= filter_end_time_target_tz)
              timeFilterCondition = or(gteCondition, lteCondition);
            }
          } else if (startTime) {
            // Only range start time is specified (e.g., >= 09:00 in user's time)

            // Convert filter start time from UTC to the target timezone
            const filterStartTimeTargetTZ = getFilterTimeInTargetTimezoneString(
              startTime,
              timezoneOffsetSeconds
            );
            timeFilterCondition = gte(
              dbStartTimeWithOffsetSql,
              filterStartTimeTargetTZ
            );
          } else if (endTime) {
            // Only range end time is specified (e.g., <= 17:00 in user's time)

            // Convert filter end time from UTC to the target timezone
            const filterEndTimeTargetTZ = getFilterTimeInTargetTimezoneString(
              endTime,
              timezoneOffsetSeconds
            );
            timeFilterCondition = lte(
              dbStartTimeWithOffsetSql,
              filterEndTimeTargetTZ
            );
          }
          // Assign the resulting time filter condition to whereCondition
          whereCondition = timeFilterCondition;
        } else {
          console.error(
            `[getSessions] ${filter.value} is an invalid filter type for ${filter.column} column.`
          );
        }
        break;
      }
      // TODO: consolidate the exact same logic from here and start_time into one
      case 'end_time': {
        if (Array.isArray(filter.value)) {
          const [startTime, endTime] = filter.value;
          const dbStartTimeWithOffsetSql = sql<string>`strftime('%H:%M:%S', ${sessions.end} - ${timezoneOffsetSeconds}, 'unixepoch')`;


          // Helper function to get time in HH:MM:SS format relative to UTC
          const getFilterTimeInTargetTimezoneString = (
            date: Date,
            offsetSeconds: number
          ): string => {
            // Get the UTC timestamp in seconds
            const utcTimestampSeconds = date.getTime() / 1000;
            // Add the offset to the UTC timestamp to find the equivalent timestamp in the target timezone
            const targetTimestampSeconds = utcTimestampSeconds - offsetSeconds;
            // Create a new Date object from this adjusted timestamp
            const targetDate = new Date(targetTimestampSeconds * 1000);
            // Get the time components from this adjusted Date object using UTC methods.
            // This effectively gives the time in the target timezone.
            const hours = targetDate.getUTCHours().toString().padStart(2, '0');
            const minutes = targetDate
              .getUTCMinutes()
              .toString()
              .padStart(2, '0');
            const seconds = targetDate
              .getUTCSeconds()
              .toString()
              .padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
          };

          let timeFilterCondition: SQL | undefined;
          if (startTime && endTime) {
            // Both start and end filters are present. Apply the midnight crossing logic.

            // Convert filter times from UTC to the target timezone for comparison
            const filterStartTimeTargetTZ = getFilterTimeInTargetTimezoneString(
              startTime,
              timezoneOffsetSeconds
            );
            const filterEndTimeTargetTZ = getFilterTimeInTargetTimezoneString(
              endTime,
              timezoneOffsetSeconds
            );

            // Create the individual comparison conditions.
            // Within this block, startTime and endTime are guaranteed to be Date objects.
            const gteCondition = gte(
              dbStartTimeWithOffsetSql,
              filterStartTimeTargetTZ
            );
            const lteCondition = lte(
              dbStartTimeWithOffsetSql,
              filterEndTimeTargetTZ
            );

            // Determine if the range crosses midnight based on the filter values IN THE TARGET TIMEZONE
            if (filterStartTimeTargetTZ <= filterEndTimeTargetTZ) {
              // Range does NOT cross midnight (e.g., 09:00 to 17:00 in user's time)
              // Condition is: (db_time_with_offset >= filter_start_time_target_tz) AND (db_time_with_offset <= filter_end_time_target_tz)
              timeFilterCondition = and(gteCondition, lteCondition);
            } else {
              // Range crosses midnight (e.g., 20:00 to 03:00 in user's time)
              // Condition is: (db_time_with_offset >= filter_start_time_target_tz) OR (db_time_with_offset <= filter_end_time_target_tz)
              timeFilterCondition = or(gteCondition, lteCondition);
            }
          } else if (startTime) {
            // Only range start time is specified (e.g., >= 09:00 in user's time)

            // Convert filter start time from UTC to the target timezone
            const filterStartTimeTargetTZ = getFilterTimeInTargetTimezoneString(
              startTime,
              timezoneOffsetSeconds
            );
            timeFilterCondition = gte(
              dbStartTimeWithOffsetSql,
              filterStartTimeTargetTZ
            );
          } else if (endTime) {
            // Only range end time is specified (e.g., <= 17:00 in user's time)

            // Convert filter end time from UTC to the target timezone
            const filterEndTimeTargetTZ = getFilterTimeInTargetTimezoneString(
              endTime,
              timezoneOffsetSeconds
            );
            timeFilterCondition = lte(
              dbStartTimeWithOffsetSql,
              filterEndTimeTargetTZ
            );
          }
          // Assign the resulting time filter condition to whereCondition
          whereCondition = timeFilterCondition;
        } else {
          console.error(
            `[getSessions] ${filter.value} is an invalid filter type for ${filter.column} column.`
          );
        }
        break;
      }
      default: {
        console.warn(
          `[getSessions] filtering for ${filter.column} column is not implemented.`
        );
      }
    }
  }

  // create a common table expression to ensure it gets `amount` unique rows.
  // Otherwise it will get `amount` rows that are thrown off by duplicates of a
  // session that has multiple segments (resulting in multiple rows due to the
  // join)
  const limitedSessions = db.$with('limited_sessions').as(
    db
      .select({ id: sessions.id })
      .from(sessions)
      .where(whereCondition)
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

  // take the rows with the same session id and wrap them all up into one row
  // with its segments as an array property
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
    `[getSessions] returning ${result.length} results in order ${result.map((element) => element.id)}`
  );

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

/**
 * Updates the start of the chosen session to a new date. Also updates the session's earliest segment to ensure they stay in alignment.
 */
export async function setSessionStart(
  rowId: typeof sessions.$inferSelect.id,
  startDate: typeof sessions.$inferSelect.start
): Promise<void> {
  // update the session start value
  await db
    .update(sessions)
    .set({ start: startDate })
    .where(eq(sessions.id, rowId));
  // update the earliest segment for the given sessionId
  await db
    .update(segments)
    .set({ start: startDate })
    .orderBy(asc(segments.start))
    .limit(1)
    .where(eq(segments.sessionId, rowId));
}

/**
 * Updates the end of the chosen session to a new date or null.
 *
 * There is special consideration for identifying which of the session's segments needs to be updated to remain in sync.
 *
 * If the end is being set to null, we know that we can just get the segment with the latest end date.
 *
 * If the end is being set to a new date, the existing end date may already either be
 *
 * 1. null (when setting a session from open to closed) or
 * 2. a date (when updating a closed session to a new closing time)
 *
 * Therefore, we first check if there is a null segment aand update that one, or find the latest end segment and update that one.
 */
export async function setSessionEnd(
  rowId: typeof sessions.$inferSelect.id,
  endDate: typeof sessions.$inferSelect.end
): Promise<void> {
  // set the session.end column to newValue
  await updateSessionEnd(rowId, endDate);
  // set the latest segment.end to newValue or null
  if (endDate) {
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
        .set({ end: endDate })
        .where(and(eq(segments.sessionId, rowId), isNull(segments.end)));
    } else if (nullSegment.length === 0) {
      // otherwise, update the latest segment for the given session
      await db
        .update(segments)
        .set({ end: endDate })
        .orderBy(desc(segments.end))
        .limit(1)
        .where(eq(segments.sessionId, rowId));
    } else {
      console.error('[setSessionEnd] nullSegment: ', nullSegment);
      throw new Error(
        `[setSessionEnd] encountered unexpected state while setting the segment for session ${rowId} to ${endDate}`
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
