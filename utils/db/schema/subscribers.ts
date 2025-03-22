// ~/utils/db/schema/subscribers.ts

import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const subscribers = sqliteTable('subscribers', {
  id: integer().primaryKey({ autoIncrement: true }),
  endpoint: text().notNull(),
  expirationTime: integer(), // Can be null, so keep it as integer
  auth: text().notNull(), // Store keys.auth as text
  p256dh: text().notNull(), // Store keys.p256dh as text
  interval: integer().notNull(), // in seconds
  targetNotificationTime: integer().notNull(), // elapsed working time to send next notification in seconds
});
