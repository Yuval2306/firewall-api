import database from '../config/database';
import { firewallRules, type FirewallRule, type NewFirewallRule } from '../config/schema';
import { eq, and, inArray } from 'drizzle-orm';

interface GroupedRules {
  ips: { blacklist: Array<{id: number, value: string, active: boolean}>, whitelist: Array<{id: number, value: string, active: boolean}> };
  urls: { blacklist: Array<{id: number, value: string, active: boolean}>, whitelist: Array<{id: number, value: string, active: boolean}> };
  ports: { blacklist: Array<{id: number, value: string, active: boolean}>, whitelist: Array<{id: number, value: string, active: boolean}> };
}

export class PostgresService {
  static async createRule(rule: Omit<NewFirewallRule, 'id' | 'createdAt'>): Promise<FirewallRule> {
    const db = database.getDb();
    const result = await db
      .insert(firewallRules)
      .values(rule)
      .returning();
    return result[0];
  }

  static async deleteRules(type: string, values: string[], mode: string): Promise<FirewallRule[]> {
    const db = database.getDb();
    const result = await db
      .delete(firewallRules)
      .where(
        and(
          eq(firewallRules.type, type),
          inArray(firewallRules.value, values),
          eq(firewallRules.mode, mode)
        )
      )
      .returning();
    return result;
  }

  static async getAllRules(): Promise<GroupedRules> {
    const db = database.getDb();
    const rules = await db
      .select()
      .from(firewallRules)
      .orderBy(firewallRules.createdAt);
    
    const grouped: GroupedRules = {
      ips: { blacklist: [], whitelist: [] },
      urls: { blacklist: [], whitelist: [] },
      ports: { blacklist: [], whitelist: [] }
    };

    rules.forEach((rule) => {
      const item = { id: rule.id, value: rule.value, active: rule.active || false };
      if (rule.type === 'ip') {
        (grouped.ips[rule.mode as 'blacklist' | 'whitelist'] as any[]).push(item);
      } else if (rule.type === 'url') {
        (grouped.urls[rule.mode as 'blacklist' | 'whitelist'] as any[]).push(item);
      } else if (rule.type === 'port') {
        (grouped.ports[rule.mode as 'blacklist' | 'whitelist'] as any[]).push(item);
      }
    });

    return grouped;
  }

  static async updateRuleStatus(updates: any): Promise<any> {
    const db = database.getDb();
    const results: any = { updated: [] };
    
    for (const [type, data] of Object.entries(updates)) {
      if (data && typeof data === 'object' && 'ids' in data) {
        const { ids, active } = data as any;
        if (Array.isArray(ids)) {
          const result = await db
            .update(firewallRules)
            .set({ active })
            .where(
              and(
                inArray(firewallRules.id, ids),
                eq(firewallRules.type, type)
              )
            )
            .returning({
              id: firewallRules.id,
              value: firewallRules.value,
              active: firewallRules.active
            });
          results.updated.push(...result);
        }
      }
    }
    
    return results;
  }
}