/**
 * Database Schema Index
 * Corporate Finance Manager - Centralized schema exports
 */

// Table exports
export * from "./accounts";
export * from "./transactions";
export * from "./auth";
export * from "./documents";

// Re-export all tables for Drizzle relations
import { accounts } from "./accounts";
import { transactions, journalEntries } from "./transactions";
import { users, sessions, magicLinks, auditLog } from "./auth";
import { rawDocs } from "./documents";

export const schema = {
  accounts,
  transactions,
  journalEntries,
  users,
  sessions,
  magicLinks,
  auditLog,
  rawDocs,
};

// Database relations
import { relations } from "drizzle-orm";

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
  }),
  children: many(accounts),
  journalEntries: many(journalEntries),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  journalEntries: many(journalEntries),
  reversedTransaction: one(transactions, {
    fields: [transactions.reversedTransactionId],
    references: [transactions.id],
  }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  transaction: one(transactions, {
    fields: [journalEntries.transactionId],
    references: [transactions.id],
  }),
  account: one(accounts, {
    fields: [journalEntries.accountId],
    references: [accounts.id],
  }),
}));

// Authentication relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  magicLinks: many(magicLinks),
  auditLogs: many(auditLog),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const magicLinksRelations = relations(magicLinks, ({ one }) => ({
  user: one(users, {
    fields: [magicLinks.userId],
    references: [users.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
  session: one(sessions, {
    fields: [auditLog.sessionId],
    references: [sessions.id],
  }),
}));