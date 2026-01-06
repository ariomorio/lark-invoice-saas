/**
 * Better Auth Configuration
 * 
 * This module configures Better Auth for user authentication and session management.
 * It integrates with Turso database and provides email/password authentication.
 */

import { betterAuth } from 'better-auth';
import { db } from './db';

// Validate required environment variables
if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required');
}

if (!process.env.BETTER_AUTH_URL) {
    throw new Error('BETTER_AUTH_URL environment variable is required');
}

/**
 * Better Auth instance
 * 
 * Configured with:
 * - Turso database adapter
 * - Email/Password authentication
 * - Session management
 * - Security settings
 */
export const auth = betterAuth({
    // Database configuration
    database: {
        // Custom adapter for Turso (libSQL)
        provider: 'sqlite',
        client: db,
    },

    // Base URL for authentication endpoints
    baseURL: process.env.BETTER_AUTH_URL,

    // Secret key for signing tokens and sessions
    secret: process.env.BETTER_AUTH_SECRET,

    // Email and password authentication
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Set to true in production
        minPasswordLength: 8,
    },

    // Session configuration
    session: {
        // Session expiration (7 days)
        expiresIn: 60 * 60 * 24 * 7,

        // Update session activity on each request
        updateAge: 60 * 60 * 24,

        // Cookie configuration
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
    },

    // Security settings
    advanced: {
        // Generate secure session tokens
        generateId: undefined, // Use default UUID v4

        // CSRF protection
        useSecureCookies: process.env.NODE_ENV === 'production',

        // Cross-origin settings
        crossSubDomainCookies: {
            enabled: false,
        },
    },

    // User schema customization (optional)
    user: {
        additionalFields: {
            // Add custom fields here if needed
            // Example: role: { type: 'string', required: false }
        },
    },
});

/**
 * Export auth handlers for API routes
 */
export const { GET, POST } = auth.handler;

/**
 * Type-safe auth instance
 */
export type Auth = typeof auth;

export default auth;
