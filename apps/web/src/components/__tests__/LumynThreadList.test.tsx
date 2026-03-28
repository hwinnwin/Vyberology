import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/integrations/supabase/client', () => {
  const mockQuery = vi.fn();
  return {
    supabase: {
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } } })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: mockQuery,
            })),
          })),
        })),
      })),
      _mockQuery: mockQuery,
    },
  };
});

import { LumynThreadList } from '../LumynThreadList';
import { supabase } from '@/integrations/supabase/client';

describe('LumynThreadList', () => {
  const defaultProps = {
    currentConversationId: undefined,
    isPro: false,
    onSelectThread: vi.fn(),
    onNewThread: vi.fn(),
    onUpgrade: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "New conversation" button', async () => {
    (supabase as any)._mockQuery.mockResolvedValue({ data: [], error: null });
    render(<LumynThreadList {...defaultProps} />);
    expect(screen.getByText('New conversation')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    (supabase as any)._mockQuery.mockReturnValue(new Promise(() => {})); // never resolves
    render(<LumynThreadList {...defaultProps} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows empty state when no threads', async () => {
    (supabase as any)._mockQuery.mockResolvedValue({ data: [], error: null });
    render(<LumynThreadList {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('No conversations yet.')).toBeInTheDocument();
    });
  });

  it('renders threads when available', async () => {
    (supabase as any)._mockQuery.mockResolvedValue({
      data: [
        {
          id: 'conv-1',
          title: 'My first chat',
          mode: 'reflect',
          status: 'active',
          created_at: '2024-06-15T10:00:00Z',
        },
      ],
      error: null,
    });

    render(<LumynThreadList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('My first chat')).toBeInTheDocument();
    });
  });

  it('calls onSelectThread when a thread is clicked', async () => {
    const thread = {
      id: 'conv-1',
      title: 'Test Chat',
      mode: 'reflect',
      status: 'active',
      created_at: '2024-06-15T10:00:00Z',
    };
    (supabase as any)._mockQuery.mockResolvedValue({ data: [thread], error: null });

    render(<LumynThreadList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Test Chat'));
    expect(defaultProps.onSelectThread).toHaveBeenCalledWith(thread);
  });

  it('calls onNewThread when new conversation button clicked', async () => {
    (supabase as any)._mockQuery.mockResolvedValue({ data: [], error: null });
    render(<LumynThreadList {...defaultProps} />);
    await userEvent.click(screen.getByText('New conversation'));
    expect(defaultProps.onNewThread).toHaveBeenCalled();
  });

  it('shows upgrade banner for free users', async () => {
    (supabase as any)._mockQuery.mockResolvedValue({ data: [], error: null });
    render(<LumynThreadList {...defaultProps} isPro={false} />);

    await waitFor(() => {
      expect(screen.getByText(/upgrade to lumyn pro/i)).toBeInTheDocument();
    });
  });

  it('hides upgrade banner for pro users', async () => {
    (supabase as any)._mockQuery.mockResolvedValue({ data: [], error: null });
    render(<LumynThreadList {...defaultProps} isPro={true} />);

    await waitFor(() => {
      expect(screen.queryByText(/upgrade to lumyn pro/i)).not.toBeInTheDocument();
    });
  });

  it('calls onUpgrade when upgrade button clicked', async () => {
    (supabase as any)._mockQuery.mockResolvedValue({ data: [], error: null });
    render(<LumynThreadList {...defaultProps} isPro={false} />);

    await waitFor(() => {
      expect(screen.getByText(/upgrade to lumyn pro/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/upgrade to lumyn pro/i));
    expect(defaultProps.onUpgrade).toHaveBeenCalled();
  });
});
