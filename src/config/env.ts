import { z, ZodError } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  ENV: z.enum(['dev', 'production']),
  PORT: z.string().transform(val => {
    const port = parseInt(val, 10);
    if (port < 1 || port > 65535) {
      throw new Error('PORT must be between 1 and 65535');
    }
    return port;
  }),
  DATABASE_URI_DEV: z.string().url(),
  DATABASE_URI_PROD: z.string().url(),
  DB_CONNECTION_INTERVAL: z.string().transform(val => {
    const interval = parseInt(val, 10);
    if (interval < 1000) {
      throw new Error('DB_CONNECTION_INTERVAL must be at least 1000ms');
    }
    return interval;
  })
});

const parseEnv = () => {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    console.error('Environment validation failed:');
    if (error instanceof ZodError) {
      error.issues.forEach((issue: any) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
    }
    process.exit(1);
  }
};

const env = parseEnv();

export const config = {
  env: env.ENV,
  port: env.PORT,
  database: {
    uri: env.ENV === 'dev' ? env.DATABASE_URI_DEV : env.DATABASE_URI_PROD,
    connectionInterval: env.DB_CONNECTION_INTERVAL
  },
  constants: {
    API_PREFIX: '/api',
    VALID_RULE_TYPES: ['ip', 'url', 'port'] as const,
    VALID_MODES: ['blacklist', 'whitelist'] as const,
    LOG_LEVELS: {
      dev: 'debug',
      production: 'info'
    }
  }
} as const;

export type Config = typeof config;