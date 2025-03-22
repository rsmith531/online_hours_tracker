import { relations } from "drizzle-orm/relations";
import { sessions, segments } from "./schema/workday";

export const segmentsRelations = relations(segments, ({one}) => ({
	session: one(sessions, {
		fields: [segments.sessionId],
		references: [sessions.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({many}) => ({
	segments: many(segments),
}));