/**
 * Supabase Database Client
 * Provides authenticated access to PostgreSQL via Supabase
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config.js';

/**
 * Database types inferred from schema
 */
export interface Database {
  public: {
    Tables: {
      readings: {
        Row: {
          id: string;
          user_id: string;
          input_name: string;
          input_birthdate: string;
          full_output: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          input_name: string;
          input_birthdate: string;
          full_output: any;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          reading_id: string | null;
          body: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          reading_id?: string | null;
          body: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          body?: string;
          updated_at?: string | null;
        };
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
      };
      reading_tags: {
        Row: {
          reading_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          reading_id: string;
          tag_id: string;
          created_at?: string;
        };
      };
      exports: {
        Row: {
          id: string;
          user_id: string;
          format: 'csv' | 'json';
          status: 'queued' | 'processing' | 'ready' | 'failed';
          url: string | null;
          params: any;
          error: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          format: 'csv' | 'json';
          status?: 'queued' | 'processing' | 'ready' | 'failed';
          url?: string | null;
          params?: any;
          error?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          status?: 'queued' | 'processing' | 'ready' | 'failed';
          url?: string | null;
          error?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      v_elements_daily: {
        Row: {
          user_id: string;
          date: string;
          earth_count: number;
          water_count: number;
          fire_count: number;
          air_count: number;
          ether_count: number;
        };
      };
      v_chakras_daily: {
        Row: {
          user_id: string;
          date: string;
          root_count: number;
          sacral_count: number;
          solar_count: number;
          heart_count: number;
          throat_count: number;
          third_eye_count: number;
          crown_count: number;
        };
      };
    };
    Functions: {
      search_readings: {
        Args: {
          p_user_id: string;
          p_query: string;
        };
        Returns: Array<{
          id: string;
          input_name: string;
          input_birthdate: string;
          created_at: string;
          rank: number;
        }>;
      };
    };
  };
}

/**
 * Service role client - bypasses RLS for server-side operations
 * Use sparingly and only when necessary
 */
let serviceClient: SupabaseClient<Database> | null = null;

export function getServiceClient(): SupabaseClient<Database> {
  if (!serviceClient) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase service role credentials not configured');
    }

    serviceClient = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return serviceClient;
}

/**
 * Create a user-scoped client with their auth token
 * Respects RLS policies
 */
export function getUserClient(token: string): SupabaseClient<Database> {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error('Supabase public credentials not configured');
  }

  return createClient<Database>(config.supabase.url, config.supabase.anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Extract user ID from JWT without verification
 * (Supabase will verify the token when making requests)
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded.sub || null;
  } catch {
    return null;
  }
}
