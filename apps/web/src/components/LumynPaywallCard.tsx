// apps/web/src/components/LumynPaywallCard.tsx
import { Crown } from 'lucide-react'
import { purchaseTier } from '@/services/purchase'
import { isNative } from '@/lib/platform'

const LUMYN_PRO_PRICE_ID = import.meta.env.VITE_LUMYN_PRO_PRICE_ID ?? ''

interface Props {
  onUpgradeStart?: () => void
}

export function LumynPaywallCard({ onUpgradeStart }: Props) {
  const handleUpgrade = async () => {
    onUpgradeStart?.()

    if (isNative()) {
      // Native subscription path is not yet enabled for Lumyn Pro
      alert('Please visit vyberology.com to upgrade to Lumyn Pro.')
      return
    }

    const result = await purchaseTier('lumyn-pro', {
      priceId: LUMYN_PRO_PRICE_ID,
      fullName: '',
      dob: '',
    })

    if (result.redirectUrl) {
      window.location.href = result.redirectUrl
    }
  }

  return (
    <div className="mx-2 my-1 rounded-2xl border border-vy-gold/30 bg-gradient-to-br from-vy-gold/5 to-amber-50/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Crown className="w-4 h-4 text-vy-gold shrink-0" />
        <span className="text-sm font-semibold text-vy-charcoal">
          You've used your 10 free messages with Lumyn.
        </span>
      </div>
      <p className="text-xs text-vy-charcoal/60 mb-3 pl-6">
        Upgrade to Pro for unlimited conversations, full memory, and all four modes — $14.97/month.
      </p>
      <button
        onClick={handleUpgrade}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-vy-gold to-amber-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Upgrade to Lumyn Pro
      </button>
    </div>
  )
}
