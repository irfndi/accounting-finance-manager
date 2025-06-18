/**
 * Database Schema Index
 * Corporate Finance Manager - Centralized schema exports
 */

// Table exports
export * from "./accounts";
export * from "./transactions";

// Re-export all tables for Drizzle relations
import { accounts } from "./accounts";
import { transactions, journalEntries } from "./transactions";

export const schema = {
  accounts,
  transactions,
  journalEntries,
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