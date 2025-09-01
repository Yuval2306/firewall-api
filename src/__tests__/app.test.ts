import request from 'supertest';
import express from 'express';
import firewallRoutes from '../routes/firewallRoutes';
import { config } from '../config/env';

const createApp = () => {
  const app = express();
  app.use(express.json());
  
  app.use((req, res, next) => {
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
    res.status(500).json({ error: 'Internal server error' });
  });
  
  return app;
};

describe('App', () => {
  const app = createApp();
  
  it('should respond to root path', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
      
    expect(response.body).toMatchObject({
      message: 'Firewall API is running!',
      environment: 'dev',
      version: '2.0.0'
    });
  });
  
  it('should handle 404 for unknown routes', async () => {
    await request(app)
      .get('/unknown-route')
      .expect(404);
  });
  
  it('should handle errors with error middleware', async () => {
    const response = await request(app)
      .post('/api/firewall/ip')
      .send({}) 
      .expect(400);
      
    expect(response.body).toHaveProperty('error');
  });
});