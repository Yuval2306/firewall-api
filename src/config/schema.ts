import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const firewallRules = pgTable('firewall_rules', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 10 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  mode: varchar('mode', { length: 10 }).notNull(),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export type FirewallRule = typeof firewallRules.$inferSelect;
export type NewFirewallRule = typeof firewallRules.$inferInsert;