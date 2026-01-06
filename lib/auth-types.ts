/**
 * Better Auth Type Definitions
 * 
 * This module provides TypeScript type definitions for Better Auth
 * to ensure type safety throughout the application.
 */

/**
 * User type from database
 */
export interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string | null;
    image: string | null;
    createdAt: number;
    updatedAt: number;
}

/**
 * Session type from database
 */
export interface Session {
    id: string;
    userId: string;
    expiresAt: number;
    token: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: number;
    updatedAt: number;
}

/**
 * Account type from database (for OAuth providers)
 */
export interface Account {
    id: string;
    userId: string;
    accountId: string;
    providerId: string;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    scope: string | null;
    password: string | null;
    createdAt: number;
    updatedAt: number;
}

/**
 * Auth session context (available in API routes and server components)
 */
export interface AuthSession {
    session: Session | null;
    user: User | null;
}

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
    email: string;
    password: string;
    name?: string;
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
    email: string;
    password: string;
}

/**
 * Auth response
 */
export interface AuthResponse {
    user: User;
    session: Session;
}

/**
 * Auth error
 */
export interface AuthError {
    message: string;
    code?: string;
}
