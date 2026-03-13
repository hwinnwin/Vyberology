// Cloud Sync Utilities
// Handles syncing reading history between local storage and Supabase cloud

import { supabase } from "@/integrations/supabase/client";
import { getReadingHistory, type HistoricalReading } from "./readingHistory";

export interface CloudSyncStatus {
  enabled: boolean;
  lastSync: string | null;
  localCount: number;
  cloudCount: number;
  syncing: boolean;
  error: string | null;
}

/**
 * Check if cloud sync is enabled
 */
export const isCloudSyncEnabled = (): boolean => {
  return localStorage.getItem('vyberology_cloud_sync') === 'true';
};

/**
 * Check if user has given data collection consent
 */
export const hasDataConsent = (): boolean => {
  return localStorage.getItem('vyberology_data_consent') === 'true';
};

/**
 * Sync local readings to cloud
 */
export const syncToCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, count: 0, error: "User not authenticated" };
    }

    // Check if sync is enabled
    if (!isCloudSyncEnabled()) {
      return { success: false, count: 0, error: "Cloud sync not enabled" };
    }

    // Get local readings
    const localReadings = getReadingHistory();
    if (localReadings.length === 0) {
      return { success: true, count: 0 };
    }

    // Prepare readings for cloud storage
    const readingsToSync = localReadings.map(reading => ({
      inputType: reading.inputType,
      inputValue: reading.inputValue,
      reading: reading.reading,
      numbers: reading.numbers || [],
      timestamp: reading.timestamp,
    }));

    // Call bulk sync function
    const { data, error } = await supabase.rpc('bulk_sync_readings', {
      readings_json: readingsToSync,
      user_uuid: user.id,
      consent_given: hasDataConsent(),
    });

    if (error) throw error;

    // Update last sync timestamp
    localStorage.setItem('vyberology_last_sync', new Date().toISOString());

    return { success: true, count: data || 0 };
  } catch (error) {
    console.error("Cloud sync error:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

interface CloudReading {
  id: string;
  user_id: string;
  input_type: string;
  input_value: string;
  reading_text: string;
  numbers: string[];
  data_consent_given: boolean;
  created_at: string;
}

/**
 * Fetch readings from cloud
 */
export const fetchFromCloud = async (): Promise<{ success: boolean; readings: CloudReading[]; error?: string }> => {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, readings: [], error: "User not authenticated" };
    }

    // Fetch user's readings from cloud
    const { data, error } = await supabase
      .from('user_readings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, readings: data || [] };
  } catch (error) {
    console.error("Fetch from cloud error:", error);
    return {
      success: false,
      readings: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Get cloud sync status
 */
export const getCloudSyncStatus = async (): Promise<CloudSyncStatus> => {
  const enabled = isCloudSyncEnabled();
  const lastSync = localStorage.getItem('vyberology_last_sync');
  const localCount = getReadingHistory().length;

  if (!enabled) {
    return {
      enabled: false,
      lastSync: null,
      localCount,
      cloudCount: 0,
      syncing: false,
      error: null,
    };
  }

  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        enabled: true,
        lastSync,
        localCount,
        cloudCount: 0,
        syncing: false,
        error: "Not authenticated",
      };
    }

    // Get cloud count
    const { count, error } = await supabase
      .from('user_readings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) throw error;

    return {
      enabled: true,
      lastSync,
      localCount,
      cloudCount: count || 0,
      syncing: false,
      error: null,
    };
  } catch (error) {
    return {
      enabled: true,
      lastSync,
      localCount,
      cloudCount: 0,
      syncing: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Delete all cloud readings for current user
 */
export const clearCloudData = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from('user_readings')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Clear cloud data error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Get user's most frequent patterns from cloud
 */
export const getCloudFrequentPatterns = async (limit: number = 10): Promise<{ pattern: string; count: number }[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_user_frequent_patterns', {
      user_uuid: user.id,
      limit_count: limit,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Get frequent patterns error:", error);
    return [];
  }
};

/**
 * Auto-sync when readings change (call this after saving a reading)
 */
export const autoSync = async (reading: Omit<HistoricalReading, 'id' | 'timestamp'>): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insert single reading
    const { error } = await supabase.from('user_readings').insert({
      user_id: user.id,
      input_type: reading.inputType,
      input_value: reading.inputValue,
      reading_text: reading.reading,
      numbers: reading.numbers || [],
      data_consent_given: hasDataConsent(),
    });

    if (error) {
      console.error("Auto-sync error:", error);
    }
  } catch (error) {
    console.error("Auto-sync error:", error);
  }
};
