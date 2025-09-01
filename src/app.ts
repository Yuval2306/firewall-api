import express from 'express';
import firewallRoutes from './routes/firewallRoutes';
import { config } from './config/env';
import logger from './config/logger';
import database from './config/database';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.use(config.constants.API_PREFIX, firewallRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Firewall API is running!',
    environment: config.env,
    version: '2.0.0'
  });
});

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${error.message}`, { stack: error.stack, url: req.url });
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    await database.connect();
    
    app.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();