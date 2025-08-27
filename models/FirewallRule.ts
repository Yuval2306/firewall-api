import pool from '../config/database';

export interface FirewallRule {
  id?: number;
  type: 'ip' | 'url' | 'port';
  value: string;
  mode: 'blacklist' | 'whitelist';
  active?: boolean;
  created_at?: Date;
}

interface GroupedRules {
  ips: { blacklist: Array<{id: number, value: string, active: boolean}>, whitelist: Array<{id: number, value: string, active: boolean}> };
  urls: { blacklist: Array<{id: number, value: string, active: boolean}>, whitelist: Array<{id: number, value: string, active: boolean}> };
  ports: { blacklist: Array<{id: number, value: string, active: boolean}>, whitelist: Array<{id: number, value: string, active: boolean}> };
}

export class FirewallRuleModel {
  static async create(rule: Omit<FirewallRule, 'id' | 'created_at'>): Promise<FirewallRule> {
    const query = `
      INSERT INTO firewall_rules (type, value, mode, active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [rule.type, rule.value, rule.mode, rule.active ?? true];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(type: string, values: string[], mode: string): Promise<FirewallRule[]> {
    const query = `
      DELETE FROM firewall_rules
      WHERE type = $1 AND value = ANY($2) AND mode = $3
      RETURNING *
    `;
    const result = await pool.query(query, [type, values, mode]);
    return result.rows;
  }

  static async getAll(): Promise<GroupedRules> {
    const query = 'SELECT * FROM firewall_rules ORDER BY created_at DESC';
    const result = await pool.query(query);
    
    const grouped: GroupedRules = {
      ips: { blacklist: [], whitelist: [] },
      urls: { blacklist: [], whitelist: [] },
      ports: { blacklist: [], whitelist: [] }
    };

    result.rows.forEach((row: any) => {
      const item = { id: row.id, value: row.value, active: row.active };
      if (row.type === 'ip') {
        (grouped.ips[row.mode as 'blacklist' | 'whitelist'] as any[]).push(item);
      } else if (row.type === 'url') {
        (grouped.urls[row.mode as 'blacklist' | 'whitelist'] as any[]).push(item);
      } else if (row.type === 'port') {
        (grouped.ports[row.mode as 'blacklist' | 'whitelist'] as any[]).push(item);
      }
    });

    return grouped;
  }

  static async updateStatus(updates: any): Promise<any> {
    const results: any = { updated: [] };
    
    for (const [type, data] of Object.entries(updates)) {
      if (data && typeof data === 'object' && 'ids' in data) {
        const { ids, active } = data as any;
        if (Array.isArray(ids)) {
          const query = `
            UPDATE firewall_rules 
            SET active = $1 
            WHERE id = ANY($2) AND type = $3
            RETURNING id, value, active
          `;
          const result = await pool.query(query, [active, ids, type]);
          results.updated.push(...result.rows);
        }
      }
    }
    
    return results;
  }
}