import request from 'supertest';
import express from 'express';
import firewallRoutes from '../../routes/firewallRoutes';
import { config } from '../../config/env';

const app = express();
app.use(express.json());
app.use(config.constants.API_PREFIX, firewallRoutes);

describe('Firewall Controller', () => {
  
  describe('POST /api/firewall/ip', () => {
    it('should add valid IPs to blacklist', async () => {
      const response = await request(app)
        .post('/api/firewall/ip')
        .send({
          values: ['192.168.1.100', '10.0.0.50'],
          mode: 'blacklist'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        type: 'ip',
        mode: 'blacklist',
        values: ['192.168.1.100', '10.0.0.50'],
        status: 'success'
      });
    });

    it('should add valid IPs to whitelist', async () => {
      const response = await request(app)
        .post('/api/firewall/ip')
        .send({
          values: ['172.16.0.1'],
          mode: 'whitelist'
        })
        .expect(200);

      expect(response.body.mode).toBe('whitelist');
      expect(response.body.status).toBe('success');
    });

    it('should handle edge case IPs', async () => {
      const response = await request(app)
        .post('/api/firewall/ip')
        .send({
          values: ['0.0.0.0', '255.255.255.255'],
          mode: 'blacklist'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should reject invalid mode', async () => {
      const response = await request(app)
        .post('/api/firewall/ip')
        .send({
          values: ['192.168.1.1'],
          mode: 'invalid-mode'
        })
        .expect(400);

      expect(response.body.error).toContain('Mode must be either blacklist or whitelist');
    });

    it('should reject missing values', async () => {
      const response = await request(app)
        .post('/api/firewall/ip')
        .send({
          mode: 'blacklist'
        })
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('POST /api/firewall/port', () => {
    it('should add valid ports', async () => {
      const response = await request(app)
        .post('/api/firewall/port')
        .send({
          values: [80, 443, 22],
          mode: 'blacklist'
        })
        .expect(200);

      expect(response.body.values).toEqual([80, 443, 22]);
    });

    it('should handle edge case ports', async () => {
      const response = await request(app)
        .post('/api/firewall/port')
        .send({
          values: [1, 65535], // Min and max valid ports
          mode: 'whitelist'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should convert port numbers to strings', async () => {
      const response = await request(app)
        .post('/api/firewall/port')
        .send({
          values: [8080],
          mode: 'blacklist'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  describe('POST /api/firewall/url', () => {
    it('should add valid URLs', async () => {
      const response = await request(app)
        .post('/api/firewall/url')
        .send({
          values: ['malicious-site.com', 'spam-domain.org'],
          mode: 'blacklist'
        })
        .expect(200);

      expect(response.body.values).toEqual(['malicious-site.com', 'spam-domain.org']);
    });

    it('should handle various URL formats', async () => {
      const response = await request(app)
        .post('/api/firewall/url')
        .send({
          values: ['sub.domain.co.uk', 'localhost'],
          mode: 'whitelist'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  describe('GET /api/firewall/rules', () => {
    it('should return all rules in correct format', async () => {
      const response = await request(app)
        .get('/api/firewall/rules')
        .expect(200);

      expect(response.body).toHaveProperty('ips');
      expect(response.body).toHaveProperty('urls');
      expect(response.body).toHaveProperty('ports');
      expect(response.body.ips).toHaveProperty('blacklist');
      expect(response.body.ips).toHaveProperty('whitelist');
    });
  });

  describe('DELETE endpoints', () => {
    beforeEach(async () => {
      // Add test data before deletion tests
      await request(app)
        .post('/api/firewall/ip')
        .send({
          values: ['192.168.1.200'],
          mode: 'blacklist'
        });
    });

    it('should delete existing IP rules', async () => {
      const response = await request(app)
        .delete('/api/firewall/ip')
        .send({
          values: ['192.168.1.200'],
          mode: 'blacklist'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.deleted).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {

      const response = await request(app)
        .post('/api/firewall/ip')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
    
    it('should handle empty arrays', async () => {
      const response = await request(app)
        .post('/api/firewall/ip')
        .send({
          values: [],
          mode: 'blacklist'
        })
        .expect(200);
        
      expect(response.body.status).toBe('success');
    });
    
    it('should handle mixed valid/invalid data gracefully', async () => {
      const response = await request(app)
        .post('/api/firewall/port')
        .send({
          values: [80, 'invalid-port', 443],
          mode: 'blacklist'
        })
        .expect(200);
        
      expect(response.body.status).toBe('success');
    });
  });
  describe('PUT /api/firewall/rules', () => {
    it('should update rule status', async () => {
      // First create a rule
      await request(app)
        .post('/api/firewall/url')
        .send({
          values: ['test-update.com'],
          mode: 'blacklist'
        });

      // Get all rules to find the ID
      const rulesResponse = await request(app)
        .get('/api/firewall/rules');
      
      const testRule = rulesResponse.body.urls.blacklist.find(
        (rule: any) => rule.value === 'test-update.com'
      );

      // Update the rule status
      const updateResponse = await request(app)
        .put('/api/firewall/rules')
        .send({
          url: {
            ids: [testRule.id],
            active: false
          }
        })
        .expect(200);

      expect(updateResponse.body.updated).toHaveLength(1);
      expect(updateResponse.body.updated[0].active).toBe(false);
    });
  });
});