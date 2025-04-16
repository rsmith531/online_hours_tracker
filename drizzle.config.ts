import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './utils/db/drizzle',
  schema: './utils/db/schema/*',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.NUXT_DB_FILE_NAME!,
  },
});
