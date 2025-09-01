import request from 'supertest';
import express from 'express';
import firewallRoutes from '../../routes/firewallRoutes';
import { config } from '../../config/env';

const app = express();
app.use(express.json());
app.use(config.constants.API_PREFIX, firewallRoutes);

describe('Firewall System - Happy Flow', () => {
  it('should handle complete firewall rule lifecycle', async () => {
    // 1. Add IP rules
    await request(app)
      .post('/api/firewall/ip')
      .send({
        values: ['192.168.100.1', '10.0.100.1'],
        mode: 'blacklist'
      })
      .expect(200);

    // 2. Add URL rules
    await request(app)
      .post('/api/firewall/url')
      .send({
        values: ['system-test.com'],
        mode: 'whitelist'
      })
      .expect(200);

    // 3. Add Port rules
    await request(app)
      .post('/api/firewall/port')
      .send({
        values: [9999, 8888],
        mode: 'blacklist'
      })
      .expect(200);

    // 4. Get all rules and verify
    const allRulesResponse = await request(app)
      .get('/api/firewall/rules')
      .expect(200);

    expect(allRulesResponse.body.ips.blacklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: '192.168.100.1' }),
        expect.objectContaining({ value: '10.0.100.1' })
      ])
    );

    expect(allRulesResponse.body.urls.whitelist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'system-test.com' })
      ])
    );

    // 5. Update rule status
    const urlRule = allRulesResponse.body.urls.whitelist.find(
      (rule: any) => rule.value === 'system-test.com'
    );

    await request(app)
      .put('/api/firewall/rules')
      .send({
        url: {
          ids: [urlRule.id],
          active: false
        }
      })
      .expect(200);

    // 6. Delete some rules
    const deleteResponse = await request(app)
      .delete('/api/firewall/ip')
      .send({
        values: ['192.168.100.1'],
        mode: 'blacklist'
      })
      .expect(200);

    expect(deleteResponse.body.deleted).toBeGreaterThan(0);

    const finalRulesResponse = await request(app)
      .get('/api/firewall/rules')
      .expect(200);

    const remainingIPs = finalRulesResponse.body.ips.blacklist.map((rule: any) => rule.value);
    expect(remainingIPs).not.toContain('192.168.100.1');
    expect(remainingIPs).toContain('10.0.100.1');
  });
});