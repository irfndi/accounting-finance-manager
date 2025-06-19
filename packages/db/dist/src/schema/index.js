"use strict";
/**
 * Database Schema Index
 * Corporate Finance Manager - Centralized schema exports
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogRelations = exports.magicLinksRelations = exports.sessionsRelations = exports.usersRelations = exports.journalEntriesRelations = exports.transactionsRelations = exports.accountsRelations = exports.schema = void 0;
// Table exports
__exportStar(require("./accounts"), exports);
__exportStar(require("./transactions"), exports);
__exportStar(require("./auth"), exports);
__exportStar(require("./documents"), exports);
// Re-export all tables for Drizzle relations
const accounts_1 = require("./accounts");
const transactions_1 = require("./transactions");
const auth_1 = require("./auth");
const documents_1 = require("./documents");
exports.schema = {
    accounts: accounts_1.accounts,
    transactions: transactions_1.transactions,
    journalEntries: transactions_1.journalEntries,
    users: auth_1.users,
    sessions: auth_1.sessions,
    magicLinks: auth_1.magicLinks,
    auditLog: auth_1.auditLog,
    rawDocs: documents_1.rawDocs,
};
// Database relations
const drizzle_orm_1 = require("drizzle-orm");
exports.accountsRelations = (0, drizzle_orm_1.relations)(accounts_1.accounts, ({ one, many }) => ({
    parent: one(accounts_1.accounts, {
        fields: [accounts_1.accounts.parentId],
        references: [accounts_1.accounts.id],
    }),
    children: many(accounts_1.accounts),
    journalEntries: many(transactions_1.journalEntries),
}));
exports.transactionsRelations = (0, drizzle_orm_1.relations)(transactions_1.transactions, ({ one, many }) => ({
    journalEntries: many(transactions_1.journalEntries),
    reversedTransaction: one(transactions_1.transactions, {
        fields: [transactions_1.transactions.reversedTransactionId],
        references: [transactions_1.transactions.id],
    }),
}));
exports.journalEntriesRelations = (0, drizzle_orm_1.relations)(transactions_1.journalEntries, ({ one }) => ({
    transaction: one(transactions_1.transactions, {
        fields: [transactions_1.journalEntries.transactionId],
        references: [transactions_1.transactions.id],
    }),
    account: one(accounts_1.accounts, {
        fields: [transactions_1.journalEntries.accountId],
        references: [accounts_1.accounts.id],
    }),
}));
// Authentication relations
exports.usersRelations = (0, drizzle_orm_1.relations)(auth_1.users, ({ many }) => ({
    sessions: many(auth_1.sessions),
    magicLinks: many(auth_1.magicLinks),
    auditLogs: many(auth_1.auditLog),
}));
exports.sessionsRelations = (0, drizzle_orm_1.relations)(auth_1.sessions, ({ one }) => ({
    user: one(auth_1.users, {
        fields: [auth_1.sessions.userId],
        references: [auth_1.users.id],
    }),
}));
exports.magicLinksRelations = (0, drizzle_orm_1.relations)(auth_1.magicLinks, ({ one }) => ({
    user: one(auth_1.users, {
        fields: [auth_1.magicLinks.userId],
        references: [auth_1.users.id],
    }),
}));
exports.auditLogRelations = (0, drizzle_orm_1.relations)(auth_1.auditLog, ({ one }) => ({
    user: one(auth_1.users, {
        fields: [auth_1.auditLog.userId],
        references: [auth_1.users.id],
    }),
    session: one(auth_1.sessions, {
        fields: [auth_1.auditLog.sessionId],
        references: [auth_1.sessions.id],
    }),
}));
