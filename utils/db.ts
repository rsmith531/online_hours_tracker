// ~/utils/db.ts

// TODO: someday, transition to using an ORM such as prisma or drizzle
import Database from 'better-sqlite3';
import type { ActivityType } from '../composables/workdayService';
const db = new Database('workday_data.sqlite');
// https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md
db.pragma('journal_mode = WAL');

export function initializeDatabase(): void {
  db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start TEXT NOT NULL,
        end TEXT,
        state TEXT GENERATED ALWAYS AS (CASE WHEN end IS NULL THEN 'open' ELSE 'closed' END) VIRTUAL
      );
  
      CREATE TABLE IF NOT EXISTS segments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        start TEXT NOT NULL,
        end TEXT,
        activity TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        CHECK (activity IN ('working', 'on break'))
      );
    `);
}

export function createSession(start: Date = new Date()): number {
  const stmt = db.prepare('INSERT INTO sessions (start) VALUES (?)');
  const info = stmt.run(start.toISOString());
  return info.lastInsertRowid as number;
}

export function updateSessionEnd(
  sessionId: number,
  end: Date = new Date()
): void {
  const stmt = db.prepare('UPDATE sessions SET end = ? WHERE id = ?');
  stmt.run(end.toISOString(), sessionId);
}

export function createSegment(segment: Omit<Segment, 'id'>): number {
  const stmt = db.prepare(
    'INSERT INTO segments (session_id, start, end, activity) VALUES (?, ?, ?, ?)'
  );
  const info = stmt.run(
    segment.session_id,
    segment.start.toISOString(),
    segment.end?.toISOString(),
    segment.activity
  );
  return info.lastInsertRowid as number;
}

export function updateSegmentEnd(
  segmentId: number,
  end: Date = new Date()
): void {
  const stmt = db.prepare('UPDATE segments SET end = ? WHERE id = ?');
  stmt.run(end.toISOString(), segmentId);
}

export function getSessions(): Session[] {
  const sessions = db.prepare('SELECT * FROM sessions').all() as RawSession[];
  return sessions.map((session) => ({
    ...session,
    start: new Date(session.start),
    end: session.end ? new Date(session.end) : null,
    state: session.state,
  }));
}

export function getOpenSegment(sessionId: number): Segment | undefined {
  const segment = db
    .prepare('SELECT * FROM segments WHERE session_id = ? AND end IS NULL')
    .get(sessionId) as RawSegment;

  if (!segment) {
    return undefined;
  }

  return {
    ...segment,
    start: new Date(segment.start),
    end: segment.end ? new Date(segment.end) : null,
    activity: segment.activity,
  };
}

export function getOpenSession(): Session | undefined {
  const session = db
    .prepare('SELECT * FROM sessions WHERE end IS NULL')
    .get() as RawSession;

  if (!session) {
    return undefined;
  }

  return {
    ...session,
    start: new Date(session.start),
    end: session.end ? new Date(session.end) : null,
    state: session.state,
  };
}

export function getLastClosedSession(): Session | undefined {
  const session = db
    .prepare(
      'SELECT * FROM sessions WHERE end IS NOT NULL ORDER BY end DESC LIMIT 1'
    )
    .get() as RawSession;
  if (!session) {
    return undefined;
  }
  return {
    ...session,
    start: new Date(session.start),
    end: session.end ? new Date(session.end) : null,
    state: session.state,
  };
}

export function getSegmentsForSession(sessionId: number): Segment[] {
  const segments = db
    .prepare('SELECT * FROM segments WHERE session_id = ? ORDER BY start ASC')
    .all(sessionId) as RawSegment[];

  return segments.map((segment) => ({
    ...segment,
    start: new Date(segment.start),
    end: segment.end ? new Date(segment.end) : null,
    activity: segment.activity,
  }));
}

// TODO: get rid of the double call to getCurrentWeek()
export function getSessionsForWeek(
  startDate: Date = getCurrentWeek().startDate,
  endDate: Date = getCurrentWeek().endDate
): Session[] {
  const sessions = db
    .prepare(
      'SELECT * FROM sessions WHERE start >= ? AND start <= ? ORDER BY start ASC'
    )
    .all(startDate.toISOString(), endDate.toISOString()) as RawSession[];

  return sessions.map((session) => ({
    ...session,
    start: new Date(session.start),
    end: session.end ? new Date(session.end) : null,
    state: session.state,
  }));
}

export function getCurrentWeek(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
  const startDate = new Date(now.setDate(diff));
  const endDate = new Date(now.setDate(startDate.getDate() + 6));
  return { startDate, endDate };
}

enum SessionState {
  Open = 'open',
  Closed = 'closed',
}

interface Session {
  id: number;
  start: Date;
  end: Date | null;
  state: SessionState;
}

interface Segment {
  id: number;
  session_id: number;
  start: Date;
  end: Date | null;
  activity: ActivityType;
}

interface RawSession {
  id: number;
  start: string;
  end: string | null;
  state: SessionState;
}

interface RawSegment {
  id: number;
  session_id: number;
  start: string;
  end: string | null;
  activity: ActivityType;
}

initializeDatabase();
