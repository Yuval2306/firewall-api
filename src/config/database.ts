import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from './env';
import logger from './logger';
import { firewallRules } from './schema';

class DatabaseConnection {
  private pool: Pool;
  private db: ReturnType<typeof drizzle>;
  private isConnected = false;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.uri,
    });
    this.db = drizzle(this.pool);
  }

  async connect(): Promise<void> {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries && !this.isConnected) {
      try {
        logger.info(`Attempting database connection... (attempt ${retries + 1}/${maxRetries})`);
        
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        this.isConnected = true;
        logger.info('Database connected successfully');
        return;
        
      } catch (error) {
        retries++;
        logger.error(`Database connection failed (attempt ${retries}/${maxRetries}): ${error}`);
        
        if (retries < maxRetries) {
          logger.info(`Retrying in ${config.database.connectionInterval}ms...`);
          await this.delay(config.database.connectionInterval);
        } else {
          logger.error('All database connection attempts failed. Shutting down...');
          process.exit(1);
        }
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDb() {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database disconnected');
    }
  }
}

const database = new DatabaseConnection();

process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Gracefully shutting down...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  await database.disconnect();
  process.exit(0);
});

export default database;