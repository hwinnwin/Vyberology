// apps/web/src/hooks/useLumynEntitlement.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export type LumynEntitlement = {
  isPro: boolean
  messagesUsed: number
  isLoading: boolean
  refetch: () => Promise<void>
}

export function useLumynEntitlement(): LumynEntitlement {
  const [isPro, setIsPro] = useState(false)
  const [messagesUsed, setMessagesUsed] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsPro(false)
        setMessagesUsed(0)
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('lumyn_pro, lumyn_pro_until, lumyn_messages_used')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error || !data) {
        setIsPro(false)
        setMessagesUsed(0)
        return
      }

      const resolvedPro =
        data.lumyn_pro &&
        (data.lumyn_pro_until === null || new Date(data.lumyn_pro_until) > new Date())

      setIsPro(resolvedPro)
      setMessagesUsed(data.lumyn_messages_used ?? 0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { isPro, messagesUsed, isLoading, refetch: fetch }
}
