// apps/web/src/lib/lumynEntitlement.ts

/**
 * Shared client-side entitlement resolver.
 * Must match the server-side resolveLumynEntitlement in supabase/functions/lumyn-chat/db.ts.
 * If the resolution rule changes, update both.
 */
export function resolveClientLumynEntitlement(profile: {
  lumyn_pro: boolean
  lumyn_pro_until: string | null
}): boolean {
  return (
    profile.lumyn_pro &&
    (profile.lumyn_pro_until === null || new Date(profile.lumyn_pro_until) > new Date())
  )
}
