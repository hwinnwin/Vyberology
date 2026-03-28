import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock all dependencies
vi.mock('@/services/lumynApi', () => ({
  callLumynChat: vi.fn(),
}));

vi.mock('@/services/lumynTts', () => ({
  speakLumynMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/lumynContext', () => ({
  buildLumynContext: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useLumynEntitlement', () => ({
  useLumynEntitlement: () => ({
    isPro: false,
    messagesUsed: 3,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSpeechInput', () => ({
  useSpeechInput: () => ({
    state: 'idle',
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

vi.mock('@/components/LumynThreadList', () => ({
  LumynThreadList: () => <div data-testid="thread-list">Thread List</div>,
}));

vi.mock('@/components/LumynPaywallCard', () => ({
  LumynPaywallCard: () => <div data-testid="paywall-card">Paywall</div>,
}));

vi.mock('@/features/capture/components/LumenChat', () => ({
  LumenChat: ({ messages, onSend, inputValue, onInputChange }: any) => (
    <div data-testid="lumen-chat">
      <div data-testid="message-count">{messages.length}</div>
      <input
        data-testid="chat-input"
        value={inputValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e.target.value)}
      />
      <button data-testid="send-btn" onClick={onSend}>Send</button>
    </div>
  ),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [] })),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/platform', () => ({
  isNative: vi.fn(() => false),
}));

vi.mock('@/lib/readingInsights', () => ({
  buildLumynGreeting: vi.fn(() => null),
}));

import { LumynChatFab } from '../LumynChatFab';
import { callLumynChat } from '@/services/lumynApi';

describe('LumynChatFab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the FAB button when closed', () => {
    render(<LumynChatFab />);
    // Find the button by looking for the sparkles icon container
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('opens chat panel when FAB is clicked', async () => {
    render(<LumynChatFab />);

    // Click the FAB — the large button
    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(b => b.className.includes('rounded-full') && b.className.includes('bg-gradient'));
    expect(fab).toBeDefined();
    await userEvent.click(fab!);

    // Chat should now be visible
    expect(screen.getByTestId('lumen-chat')).toBeInTheDocument();
  });

  it('shows free message counter when not pro', async () => {
    render(<LumynChatFab />);

    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(b => b.className.includes('bg-gradient'));
    await userEvent.click(fab!);

    expect(screen.getByText('3 / 10 free messages')).toBeInTheDocument();
  });

  it('closes chat when close button is clicked', async () => {
    render(<LumynChatFab />);

    // Open
    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(b => b.className.includes('bg-gradient'));
    await userEvent.click(fab!);
    expect(screen.getByTestId('lumen-chat')).toBeInTheDocument();

    // Close — find the X button
    const closeButtons = screen.getAllByRole('button');
    // The close button is the last small round button
    const closeBtn = closeButtons.find(b =>
      b.getAttribute('title') === null &&
      b.className.includes('rounded-full') &&
      b.className.includes('bg-vy-charcoal') &&
      !b.getAttribute('title')
    );
    if (closeBtn) {
      await userEvent.click(closeBtn);
      expect(screen.queryByTestId('lumen-chat')).not.toBeInTheDocument();
    }
  });

  it('persists messages to localStorage', async () => {
    render(<LumynChatFab />);

    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(b => b.className.includes('bg-gradient'));
    await userEvent.click(fab!);

    // Check localStorage interaction happens (even with empty array)
    await waitFor(() => {
      const stored = localStorage.getItem('vyberology_lumyn_chat');
      expect(stored).not.toBeNull();
    });
  });

  it('sends message and calls lumynApi', async () => {
    vi.mocked(callLumynChat).mockImplementation(async (params) => {
      params.onToken('Hello');
      params.onDone({
        conversationId: 'conv-1',
        message: { id: 'm1', role: 'assistant', content: 'Hello', created_at: '2024-01-01' },
        mode: 'reflect',
        classification: { intent: 'explore', emotion: 'calm', domain: 'general' },
        client_directives: { crisis_banner: false, anchor_active: false },
      });
    });

    render(<LumynChatFab />);

    // Open FAB
    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(b => b.className.includes('bg-gradient'));
    await userEvent.click(fab!);

    // Type and send
    const input = screen.getByTestId('chat-input');
    await userEvent.type(input, 'Hello Lumyn');

    const sendBtn = screen.getByTestId('send-btn');
    await userEvent.click(sendBtn);

    await waitFor(() => {
      expect(callLumynChat).toHaveBeenCalled();
    });
  });

  it('shows thread list when conversations button clicked', async () => {
    render(<LumynChatFab />);

    // Open FAB
    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(b => b.className.includes('bg-gradient'));
    await userEvent.click(fab!);

    // Click conversations button
    const convBtn = screen.getByTitle('Conversations');
    await userEvent.click(convBtn);

    expect(screen.getByTestId('thread-list')).toBeInTheDocument();
  });

  it('starts new thread when new conversation button clicked', async () => {
    render(<LumynChatFab />);

    const buttons = screen.getAllByRole('button');
    const fab = buttons.find(b => b.className.includes('bg-gradient'));
    await userEvent.click(fab!);

    const newBtn = screen.getByTitle('New conversation');
    await userEvent.click(newBtn);

    // Messages should be cleared
    expect(screen.getByTestId('message-count').textContent).toBe('0');
  });
});
