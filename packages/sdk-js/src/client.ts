/**
 * Vyberology API Client
 * Typed client for consuming the reading API (Volumes I, II & V)
 */

import type {
  ReadingInput,
  ReadingDataV1,
  ComposedReadingV2,
  ParseResponse,
  ComposeResponse,
  ReadResponse,
  Note,
  CreateNote,
  UpdateNote,
  Tag,
  CreateTag,
  AttachTags,
  HistoryFilters,
  ReadingSummary,
  Export,
  CreateExport,
  ElementDataPoint,
  ChakraDataPoint,
  AnalyticsRange,
} from '@vyberology/types';

export interface VyberologyClientConfig {
  baseUrl: string;
  apiKey?: string;
  fetch?: typeof fetch;
}

export class VyberologyClient {
  private baseUrl: string;
  private apiKey?: string;
  private fetch: typeof fetch;

  constructor(config: VyberologyClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.fetch = config.fetch || globalThis.fetch;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await this.fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.error || `Request failed: ${response.statusText}`
      );
    }

    return response.json();
  }

  // ==========================================================================
  // Volumes I & II: Reading Generation
  // ==========================================================================

  /**
   * Parse input and extract numerology data
   */
  async parse(input: ReadingInput): Promise<ReadingDataV1> {
    const response = await this.request<ParseResponse>('/v1/parse', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'Parse failed');
    }

    return response.data;
  }

  /**
   * Compose narrative reading from engine data
   */
  async compose(data: ReadingDataV1): Promise<ComposedReadingV2> {
    const response = await this.request<ComposeResponse>('/v1/compose', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'Compose failed');
    }

    return response.data;
  }

  /**
   * Generate complete reading from input (parse + compose)
   */
  async read(
    input: ReadingInput
  ): Promise<{ engine: ReadingDataV1; composed: ComposedReadingV2 }> {
    const response = await this.request<ReadResponse>('/v1/read', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'Read failed');
    }

    return response.data;
  }

  // ==========================================================================
  // Volume V: History
  // ==========================================================================

  /**
   * Get reading history with filters
   */
  async history(filters?: Partial<HistoryFilters>): Promise<{
    readings: ReadingSummary[];
    total: number;
    next_cursor?: string;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await this.request<any>(
      `/v1/history?${params.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'History failed');
    }

    return response.data;
  }

  // ==========================================================================
  // Volume V: Notes
  // ==========================================================================

  /**
   * Create a new note
   */
  async createNote(note: CreateNote): Promise<Note> {
    const response = await this.request<any>('/v1/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'Create note failed');
    }

    return response.data;
  }

  /**
   * List notes, optionally filtered by reading
   */
  async listNotes(readingId?: string): Promise<Note[]> {
    const params = readingId ? `?reading_id=${readingId}` : '';
    const response = await this.request<any>(`/v1/notes${params}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'List notes failed');
    }

    return response.data.notes;
  }

  /**
   * Update a note
   */
  async updateNote(id: string, update: UpdateNote): Promise<Note> {
    const response = await this.request<any>(`/v1/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'Update note failed');
    }

    return response.data;
  }

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<void> {
    await this.request(`/v1/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // Volume V: Tags
  // ==========================================================================

  /**
   * Create a new tag
   */
  async createTag(tag: CreateTag): Promise<Tag> {
    const response = await this.request<any>('/v1/tags', {
      method: 'POST',
      body: JSON.stringify(tag),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'Create tag failed');
    }

    return response.data;
  }

  /**
   * List all user tags
   */
  async listTags(): Promise<Tag[]> {
    const response = await this.request<any>('/v1/tags');

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'List tags failed');
    }

    return response.data.tags;
  }

  /**
   * Attach tags to a reading
   */
  async attachTags(readingId: string, tagIds: string[]): Promise<void> {
    await this.request(`/v1/readings/${readingId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag_ids: tagIds }),
    });
  }

  /**
   * Remove a tag from a reading
   */
  async removeTag(readingId: string, tagId: string): Promise<void> {
    await this.request(`/v1/readings/${readingId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // Volume V: Exports
  // ==========================================================================

  /**
   * Request a new export
   */
  async requestExport(exportRequest: CreateExport): Promise<Export> {
    const response = await this.request<any>('/v1/exports', {
      method: 'POST',
      body: JSON.stringify(exportRequest),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'Request export failed');
    }

    return response.data;
  }

  /**
   * Get export status
   */
  async getExport(id: string): Promise<Export> {
    const response = await this.request<any>(`/v1/exports/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'Get export failed');
    }

    return response.data;
  }

  /**
   * List all user exports
   */
  async listExports(): Promise<Export[]> {
    const response = await this.request<any>('/v1/exports');

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'List exports failed');
    }

    return response.data.exports;
  }

  // ==========================================================================
  // Volume V: Analytics
  // ==========================================================================

  /**
   * Get elements distribution over time
   */
  async analyticsElements(range?: AnalyticsRange): Promise<ElementDataPoint[]> {
    const params = new URLSearchParams();
    if (range?.from) params.append('from', range.from);
    if (range?.to) params.append('to', range.to);

    const response = await this.request<any>(
      `/v1/analytics/elements?${params.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'Analytics failed');
    }

    return response.data.series;
  }

  /**
   * Get chakras distribution over time
   */
  async analyticsChakras(range?: AnalyticsRange): Promise<ChakraDataPoint[]> {
    const params = new URLSearchParams();
    if (range?.from) params.append('from', range.from);
    if (range?.to) params.append('to', range.to);

    const response = await this.request<any>(
      `/v1/analytics/chakras?${params.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.error || 'Analytics failed');
    }

    return response.data.series;
  }

  // ==========================================================================
  // System
  // ==========================================================================

  /**
   * Health check
   */
  async health(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return this.request('/health');
  }
}

/**
 * Create a new Vyberology API client
 */
export function createClient(config: VyberologyClientConfig): VyberologyClient {
  return new VyberologyClient(config);
}
