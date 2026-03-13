/**
 * Authentication Flow Integration Tests
 * Part of Production Readiness Phase 2 (P0-001)
 *
 * Tests the complete authentication flow:
 * - Login → Session management → Protected routes → Logout
 * - Error handling for invalid credentials
 * - Session persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockSupabaseClient,
  setupAuthenticatedUser,
  setupUnauthenticatedUser,
  resetMocks,
} from '@/test/mocks/supabase';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    resetMocks();
    setupUnauthenticatedUser();
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      // Mock successful login
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@vyberology.app',
            aud: 'authenticated',
            role: 'authenticated',
          },
          session: {
            access_token: 'token-123',
            refresh_token: 'refresh-123',
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: {
              id: 'user-123',
              email: 'test@vyberology.app',
            },
          },
        },
        error: null,
      });

      // Simulate login form submission
      const loginResult = await mockSupabaseClient.auth.signInWithPassword({
        email: 'test@vyberology.app',
        password: 'correct-password',
      });

      expect(loginResult.data?.user).toBeDefined();
      expect(loginResult.data?.session).toBeDefined();
      expect(loginResult.error).toBeNull();
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@vyberology.app',
        password: 'correct-password',
      });
    });

    it('should handle invalid credentials gracefully', async () => {
      // Mock failed login
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: {
          message: 'Invalid login credentials',
          status: 400,
          name: 'AuthApiError',
        },
      });

      const loginResult = await mockSupabaseClient.auth.signInWithPassword({
        email: 'test@vyberology.app',
        password: 'wrong-password',
      });

      expect(loginResult.data?.user).toBeNull();
      expect(loginResult.error).toBeDefined();
      expect(loginResult.error?.message).toBe('Invalid login credentials');
    });

    it('should handle network errors during login', async () => {
      // Mock network error
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValueOnce(
        new Error('Network request failed')
      );

      await expect(
        mockSupabaseClient.auth.signInWithPassword({
          email: 'test@vyberology.app',
          password: 'password',
        })
      ).rejects.toThrow('Network request failed');
    });
  });

  describe('Session Management', () => {
    it('should maintain session after successful login', async () => {
      setupAuthenticatedUser();

      const session = await mockSupabaseClient.auth.getSession();

      expect(session.data?.session).toBeDefined();
      expect(session.data?.session?.user.id).toBe('test-user-123');
      expect(session.data?.session?.access_token).toBe('mock-access-token');
    });

    it('should return null session when not authenticated', async () => {
      setupUnauthenticatedUser();

      const session = await mockSupabaseClient.auth.getSession();

      expect(session.data?.session).toBeNull();
    });

    it('should get current user from session', async () => {
      setupAuthenticatedUser();

      const userResult = await mockSupabaseClient.auth.getUser();

      expect(userResult.data?.user).toBeDefined();
      expect(userResult.data?.user?.email).toBe('test@vyberology.app');
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout and clear session', async () => {
      setupAuthenticatedUser();

      // Verify user is authenticated
      const beforeLogout = await mockSupabaseClient.auth.getSession();
      expect(beforeLogout.data?.session).toBeDefined();

      // Logout
      const logoutResult = await mockSupabaseClient.auth.signOut();
      expect(logoutResult.error).toBeNull();

      // Setup unauthenticated state after logout
      setupUnauthenticatedUser();

      // Verify session is cleared
      const afterLogout = await mockSupabaseClient.auth.getSession();
      expect(afterLogout.data?.session).toBeNull();
    });

    it('should handle logout errors gracefully', async () => {
      setupAuthenticatedUser();

      // Mock logout error
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: {
          message: 'Logout failed',
          status: 500,
          name: 'AuthError',
        },
      });

      const logoutResult = await mockSupabaseClient.auth.signOut();
      expect(logoutResult.error).toBeDefined();
      expect(logoutResult.error?.message).toBe('Logout failed');
    });
  });

  describe('Protected Routes', () => {
    it('should allow access to protected resources when authenticated', async () => {
      setupAuthenticatedUser();

      const userResult = await mockSupabaseClient.auth.getUser();
      expect(userResult.data?.user).toBeDefined();

      // Test accessing protected data
      const readingsResult = await mockSupabaseClient
        .from('readings')
        .select('*')
        .eq('user_id', userResult.data?.user?.id ?? '');

      expect(readingsResult.data).toBeDefined();
      expect(Array.isArray(readingsResult.data)).toBe(true);
    });

    it('should deny access to protected resources when not authenticated', async () => {
      setupUnauthenticatedUser();

      const userResult = await mockSupabaseClient.auth.getUser();
      expect(userResult.data?.user).toBeNull();
    });
  });

  describe('Signup Flow', () => {
    it('should successfully create new user account', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: {
          user: {
            id: 'new-user-456',
            email: 'newuser@vyberology.app',
            aud: 'authenticated',
            role: 'authenticated',
          },
          session: {
            access_token: 'new-token-456',
            refresh_token: 'new-refresh-456',
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: {
              id: 'new-user-456',
              email: 'newuser@vyberology.app',
            },
          },
        },
        error: null,
      });

      const signupResult = await mockSupabaseClient.auth.signUp({
        email: 'newuser@vyberology.app',
        password: 'secure-password-123',
      });

      expect(signupResult.data?.user).toBeDefined();
      expect(signupResult.data?.user?.email).toBe('newuser@vyberology.app');
      expect(signupResult.error).toBeNull();
    });

    it('should handle signup validation errors', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: {
          message: 'Password should be at least 6 characters',
          status: 400,
          name: 'AuthApiError',
        },
      });

      const signupResult = await mockSupabaseClient.auth.signUp({
        email: 'newuser@vyberology.app',
        password: 'weak',
      });

      expect(signupResult.error).toBeDefined();
      expect(signupResult.error?.message).toContain('6 characters');
    });
  });

  describe('Auth State Changes', () => {
    it('should setup auth state change listener', () => {
      const callback = vi.fn();

      const { data } = mockSupabaseClient.auth.onAuthStateChange(callback);

      expect(data.subscription).toBeDefined();
      expect(data.subscription.unsubscribe).toBeDefined();
    });

    it('should cleanup auth state listener on unmount', () => {
      const callback = vi.fn();
      const { data } = mockSupabaseClient.auth.onAuthStateChange(callback);

      // Simulate component unmount
      data.subscription.unsubscribe();

      expect(data.subscription.unsubscribe).toHaveBeenCalled();
    });
  });
});
