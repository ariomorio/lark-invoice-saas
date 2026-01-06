/**
 * Database initialization script
 * 
 * This script creates all necessary tables if they don't exist.
 * Run this once to set up the database schema.
 */

import { db } from './db';

const schema = `
-- Users table (managed by Better Auth)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    email_verified INTEGER DEFAULT 0,
    name TEXT,
    image TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Sessions table (managed by Better Auth)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Accounts table (managed by Better Auth - for OAuth providers)
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER,
    scope TEXT,
    password TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider_id, account_id)
);

-- Invoices table (main application data)
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    lark_chat_id TEXT NOT NULL,
    lark_message_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('draft', 'completed')) DEFAULT 'draft',
    data TEXT NOT NULL,
    pdf_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Conversation states table (for interactive flows)
CREATE TABLE IF NOT EXISTS conversation_states (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    state TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    expires_at INTEGER NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_lark_chat_id ON invoices(lark_chat_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_states_chat_id ON conversation_states(chat_id);
CREATE INDEX IF NOT EXISTS idx_conversation_states_expires_at ON conversation_states(expires_at);
`;

export async function initializeDatabase() {
    try {
        console.log('Initializing database schema...');

        // Split schema into individual statements
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // Execute each statement
        for (const statement of statements) {
            await db.execute(statement);
        }

        console.log('Database schema initialized successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Auto-initialize on import - REMOVED for Vercel deployment stability
// initializeDatabase().catch(console.error);
