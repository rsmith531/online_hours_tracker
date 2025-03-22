
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const runtime = useRuntimeConfig();
const sqlite = new Database(runtime.dbFileName);
// https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md
sqlite.pragma('journal_mode = WAL');
export const db = drizzle({ client: sqlite });