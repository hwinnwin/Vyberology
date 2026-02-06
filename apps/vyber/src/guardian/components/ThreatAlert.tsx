/**
 * GUARDIAN AEGIS - Threat Alert Component
 * Modal for displaying threat warnings
 */

import { X, ShieldAlert, AlertTriangle, Ban, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGuardianStore } from '../stores/guardianStore';
import type { ThreatSeverity, ThreatReport } from '../types';

const SEVERITY_CONFIG: Record<ThreatSeverity, {
  icon: typeof AlertTriangle;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  critical: {
    icon: Ban,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  high: {
    icon: ShieldAlert,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  low: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
};

export function ThreatAlert() {
  const { showThreatAlert, currentThreat, dismissThreat, overrideThreat } = useGuardianStore();

  if (!showThreatAlert || !currentThreat) return null;

  const config = SEVERITY_CONFIG[currentThreat.severity];
  const Icon = config.icon;
  const canOverride = currentThreat.action === 'warned' ||
    (currentThreat.action === 'blocked' && !['predator', 'grooming'].includes(currentThreat.type));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-md mx-4 rounded-xl border-2 shadow-2xl',
          config.bgColor,
          config.borderColor
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div>
              <h3 className="font-semibold">
                {currentThreat.action === 'blocked' ? 'Blocked' : 'Warning'}
              </h3>
              <p className="text-xs text-muted-foreground capitalize">
                {currentThreat.severity} severity
              </p>
            </div>
          </div>
          <button
            onClick={dismissThreat}
            className="p-1 rounded hover:bg-secondary text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm">{currentThreat.description}</p>

          {currentThreat.url && (
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">URL</p>
              <p className="text-sm font-mono break-all">{currentThreat.url}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-secondary px-2 py-1 rounded capitalize">
              {currentThreat.type.replace('_', ' ')}
            </span>
            <span className="text-xs bg-secondary px-2 py-1 rounded">
              {currentThreat.layer}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            onClick={dismissThreat}
            className="flex-1 py-2 px-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors font-medium text-sm"
          >
            {currentThreat.action === 'blocked' ? 'Go Back' : 'Dismiss'}
          </button>

          {canOverride && (
            <button
              onClick={() => overrideThreat(currentThreat.id)}
              className="flex-1 py-2 px-4 rounded-lg border border-border hover:bg-secondary transition-colors font-medium text-sm text-muted-foreground"
            >
              Proceed Anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline threat warning (non-modal)
 */
interface ThreatBannerProps {
  threat: ThreatReport;
  onDismiss?: () => void;
  onOverride?: () => void;
  className?: string;
}

export function ThreatBanner({ threat, onDismiss, onOverride, className }: ThreatBannerProps) {
  const config = SEVERITY_CONFIG[threat.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', config.color)} />
      <p className="flex-1 text-sm">{threat.description}</p>
      <div className="flex items-center gap-2">
        {onOverride && threat.action === 'warned' && (
          <button
            onClick={onOverride}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Allow
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-secondary text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ThreatAlert;
