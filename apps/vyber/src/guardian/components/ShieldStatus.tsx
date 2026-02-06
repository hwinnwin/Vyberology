/**
 * GUARDIAN AEGIS - Shield Status Component
 * Shows the current protection status in the toolbar
 */

import { Shield, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGuardianStore } from '../stores/guardianStore';

interface ShieldStatusProps {
  className?: string;
  onClick?: () => void;
}

export function ShieldStatus({ className, onClick }: ShieldStatusProps) {
  const { isActive, recentThreats, totalThreatsBlocked } = useGuardianStore();

  // Count recent threats (last hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentThreatCount = recentThreats.filter(t => t.timestamp > oneHourAgo).length;

  // Determine status
  const getStatusInfo = () => {
    if (!isActive) {
      return {
        icon: ShieldX,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
        label: 'Protection Off',
      };
    }

    if (recentThreatCount > 0) {
      return {
        icon: ShieldAlert,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/20',
        label: `${recentThreatCount} threat${recentThreatCount > 1 ? 's' : ''} detected`,
      };
    }

    return {
      icon: ShieldCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      label: 'Protected',
    };
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
        'hover:opacity-80',
        status.bgColor,
        className
      )}
      title={`Guardian Aegis: ${status.label}\n${totalThreatsBlocked} threats blocked total`}
    >
      <Icon className={cn('h-4 w-4', status.color)} />
      <span className={cn('text-xs font-medium', status.color)}>
        {isActive ? (recentThreatCount > 0 ? recentThreatCount : '') : 'Off'}
      </span>
    </button>
  );
}

/**
 * Compact shield icon for minimal display
 */
export function ShieldIcon({ className, onClick }: ShieldStatusProps) {
  const { isActive, recentThreats } = useGuardianStore();

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentThreatCount = recentThreats.filter(t => t.timestamp > oneHourAgo).length;

  const Icon = !isActive ? ShieldX : recentThreatCount > 0 ? ShieldAlert : Shield;
  const color = !isActive
    ? 'text-muted-foreground'
    : recentThreatCount > 0
    ? 'text-orange-500'
    : 'text-green-500';

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 rounded-lg transition-colors hover:bg-secondary',
        className
      )}
      title={isActive ? 'Guardian Active' : 'Guardian Disabled'}
    >
      <Icon className={cn('h-5 w-5', color)} />
    </button>
  );
}

export default ShieldStatus;
