import { PostgresService } from '../../services/PostgresService';
import database from '../../config/database';
import { firewallRules } from '../../config/schema';
import { eq } from 'drizzle-orm';

export const cleanDatabase = async () => {
  // Clean all test data
  const db = database.getDb();
  await db.delete(firewallRules);
};

export const createTestRule = async (rule: any) => {
  return await PostgresService.createRule(rule);
};

export const validTestData = {
  validIPs: ['192.168.1.1', '10.0.0.1', '127.0.0.1'],
  invalidIPs: ['999.999.999.999', '192.168.1', 'not-an-ip'],
  validPorts: ['80', '443', '22', '8080'],
  invalidPorts: ['0', '65536', '-1', 'not-a-port'],
  validURLs: ['example.com', 'test.org', 'sub.domain.co.uk'],
  validModes: ['blacklist', 'whitelist'],
  invalidModes: ['graylist', 'allowlist']
};