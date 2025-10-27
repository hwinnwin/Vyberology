/**
 * Supabase Mock Utilities for Integration Tests
 * Part of Production Readiness Phase 2 (P0-001)
 */

import { vi } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';

export const mockUser: User = {
  id: 'test-user-123',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@vyberology.app',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser,
};

export const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn(() => Promise.resolve({
      data: { session: mockSession },
      error: null
    })),
    getUser: vi.fn(() => Promise.resolve({
      data: { user: mockUser },
      error: null
    })),
    signInWithPassword: vi.fn(({ email, password }: { email: string; password: string }) => {
      if (email === 'test@vyberology.app' && password === 'correct-password') {
        return Promise.resolve({
          data: { user: mockUser, session: mockSession },
          error: null,
        });
      }
      return Promise.resolve({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', status: 400 },
      });
    }),
    signUp: vi.fn(({ email, password }: { email: string; password: string }) => {
      return Promise.resolve({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
    }),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn((table: string) => {
    const mockData = {
      readings: [
        {
          id: 'reading-1',
          user_id: mockUser.id,
          raw_input: '11:11',
          reading_data: {
            headline: 'Master Number Reading',
            guidance: 'Test reading content'
          },
          created_at: new Date().toISOString(),
        },
      ],
    };

    return {
      select: vi.fn(() => {
        const selectResult = {
          data: mockData[table as keyof typeof mockData] || [],
          error: null,
        };

        return {
          eq: vi.fn(() => ({
            ...selectResult,
            order: vi.fn(() => Promise.resolve(selectResult)),
            then: vi.fn((resolve) => resolve(selectResult)), // Make it thenable
          })),
          order: vi.fn(() => Promise.resolve(selectResult)),
          single: vi.fn(() =>
            Promise.resolve({
              data: mockData[table as keyof typeof mockData]?.[0] || null,
              error: null,
            })
          ),
          then: vi.fn((resolve) => resolve(selectResult)), // Make it thenable
        };
      }),
      insert: vi.fn((data: unknown) =>
        Promise.resolve({
          data: { ...data, id: 'new-id-123', created_at: new Date().toISOString() },
          error: null,
        })
      ),
      update: vi.fn((data: unknown) => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: { ...data },
            error: null,
          })
        ),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: null,
          })
        ),
      })),
    };
  }),
  functions: {
    invoke: vi.fn((functionName: string, options?: { body?: unknown }) => {
      // Mock Edge Function responses
      if (functionName === 'vybe-reading') {
        return Promise.resolve({
          data: {
            reading: `## 🌍 Vyberology Reading\n\nTest reading for ${JSON.stringify(options?.body)}\n\n### Core Frequency\n11 - Master Intuition`,
          },
          error: null,
        });
      }
      if (functionName === 'ocr') {
        return Promise.resolve({
          data: {
            readings: [
              {
                input_text: '11:11',
                normalized_number: '1111',
                numerology_data: {
                  headline: 'Master Number',
                  keywords: ['intuition', 'awakening'],
                  guidance: 'Test OCR reading',
                },
                chakra_data: {
                  name: 'Crown',
                  element: 'Ether',
                  focus: 'Spiritual awakening',
                  color: '#9333EA',
                },
              },
            ],
          },
          error: null,
        });
      }
      return Promise.resolve({
        data: null,
        error: { message: 'Function not mocked' },
      });
    }),
  },
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
});

export const mockSupabaseClient = createMockSupabaseClient();

/**
 * Setup authenticated user for tests
 */
export const setupAuthenticatedUser = () => {
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: mockSession },
    error: null,
  });
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });
};

/**
 * Setup unauthenticated user for tests
 */
export const setupUnauthenticatedUser = () => {
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
};

/**
 * Setup Edge Function error response
 */
export const setupEdgeFunctionError = (functionName: string, errorMessage: string) => {
  mockSupabaseClient.functions.invoke.mockImplementation((name: string) => {
    if (name === functionName) {
      return Promise.resolve({
        data: null,
        error: { message: errorMessage, status: 500 },
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
};

/**
 * Reset all mocks
 */
export const resetMocks = () => {
  vi.clearAllMocks();
  Object.values(mockSupabaseClient.auth).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      (mock as ReturnType<typeof vi.fn>).mockReset();
    }
  });
};
