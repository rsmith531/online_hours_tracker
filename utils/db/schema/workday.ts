// ~/utils/db/schema/workday.ts

import { sqliteTable, check, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { ActivityType } from 'composables/workdayService';

export const sessions = sqliteTable('sessions', {
  id: integer().primaryKey({ autoIncrement: true }),
  start: integer({ mode: 'timestamp' }).notNull(),
  end: integer({ mode: 'timestamp' }),
  state: text().generatedAlwaysAs(
    sql`CASE WHEN end IS NULL THEN 'open' ELSE 'closed' END`,
    { mode: 'virtual' }
  ),
});

export const segments = sqliteTable(
  'segments',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    sessionId: integer('session_id')
      .notNull()
      .references(() => sessions.id),
    start: integer({ mode: 'timestamp' }).notNull(),
    end: integer({ mode: 'timestamp' }),
    // https://stackoverflow.com/questions/55142177/how-to-build-a-type-from-enum-values-in-typescript
    activity: text().$type<`${ActivityType}`>().notNull(),
  },
  () => [
    check('segments_check_1', sql`activity IN ('working', 'on break')`),
  ]
);
