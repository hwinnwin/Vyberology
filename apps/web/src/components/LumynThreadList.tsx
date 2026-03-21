// apps/web/src/components/LumynThreadList.tsx
import { useEffect, useState, useCallback } from 'react'
import { Plus, MessageSquare, Crown } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import type { LumynConversation } from '@/types/lumyn'

interface Props {
  currentConversationId: string | undefined
  isPro: boolean
  onSelectThread: (conversation: LumynConversation) => void
  onNewThread: () => void
  onUpgrade: () => void
}

export function LumynThreadList({
  currentConversationId,
  isPro,
  onSelectThread,
  onNewThread,
  onUpgrade,
}: Props) {
  const [threads, setThreads] = useState<LumynConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadThreads = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('lumyn_conversations')
        .select('id, title, mode, status, created_at, ended_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!isPro) {
        query = query.limit(1)
      } else {
        query = query.limit(10)
      }

      const { data, error } = await query
      if (!error && data) setThreads(data as LumynConversation[])
    } finally {
      setIsLoading(false)
    }
  }, [isPro])

  useEffect(() => { loadThreads() }, [loadThreads])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="flex flex-col h-full">
      {/* New conversation button */}
      <button
        onClick={onNewThread}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-vy-charcoal hover:bg-vy-charcoal/5 transition-colors border-b border-vy-charcoal/10"
      >
        <Plus className="w-4 h-4" />
        New conversation
      </button>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-vy-charcoal/40">Loading…</div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-xs text-vy-charcoal/40">No conversations yet.</div>
        ) : (
          threads.map((thread) => {
            const title = thread.title || `Conversation · ${formatDate(thread.created_at)}`
            const isActive = thread.id === currentConversationId
            return (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread)}
                className={`w-full text-left px-4 py-3 border-b border-vy-charcoal/[0.06] transition-colors hover:bg-vy-charcoal/5 ${
                  isActive ? 'bg-vy-gold/10' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <MessageSquare className="w-3 h-3 text-vy-charcoal/30 shrink-0" />
                  <span className="text-sm font-medium text-vy-charcoal truncate">{title}</span>
                </div>
                <div className="flex items-center gap-2 pl-5">
                  <span className="text-[10px] uppercase tracking-wide text-vy-charcoal/30">
                    {thread.mode}
                  </span>
                  <span className="text-[10px] text-vy-charcoal/30">·</span>
                  <span className="text-[10px] text-vy-charcoal/30">
                    {formatDate(thread.created_at)}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Pro upgrade banner — free users only */}
      {!isPro && (
        <div className="border-t border-vy-charcoal/10 p-4">
          <p className="text-xs text-vy-charcoal/50 mb-2">
            Unlock full conversation history with Pro.
          </p>
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1.5 w-full justify-center py-2 rounded-lg bg-gradient-to-r from-vy-gold to-amber-500 text-white text-xs font-semibold"
          >
            <Crown className="w-3 h-3" />
            Upgrade to Lumyn Pro
          </button>
        </div>
      )}
    </div>
  )
}
