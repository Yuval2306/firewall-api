import type { Config } from 'drizzle-kit';
import { config } from './src/config/env';

export default {
  schema: './src/config/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.database.uri,
  },
} satisfies Config;