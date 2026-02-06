/**
 * GUARDIAN AEGIS - Layer Toggle Component
 * Individual toggle for each protection layer
 */

import { cn } from '@/lib/utils';
import type { LayerInfo } from '../stores/guardianStore';

interface LayerToggleProps {
  layer: LayerInfo;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function LayerToggle({ layer, onToggle, className }: LayerToggleProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border border-border',
        'bg-secondary/20 hover:bg-secondary/40 transition-colors',
        className
      )}
    >
      {/* Layer Info */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{layer.icon}</span>
        <div>
          <h4 className="font-medium text-sm">{layer.displayName}</h4>
          <p className="text-xs text-muted-foreground">{layer.description}</p>
          {layer.stats.threatsDetected > 0 && (
            <p className="text-xs text-orange-500 mt-1">
              {layer.stats.threatsDetected} threat{layer.stats.threatsDetected !== 1 ? 's' : ''} detected
            </p>
          )}
        </div>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={() => onToggle(!layer.enabled)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          layer.enabled ? 'bg-green-500' : 'bg-muted'
        )}
        role="switch"
        aria-checked={layer.enabled}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
            layer.enabled ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

/**
 * Compact layer toggle for list view
 */
export function LayerToggleCompact({ layer, onToggle, className }: LayerToggleProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 px-2',
        'border-b border-border last:border-0',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span>{layer.icon}</span>
        <span className="text-sm">{layer.displayName}</span>
        {layer.stats.threatsDetected > 0 && (
          <span className="text-xs bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded">
            {layer.stats.threatsDetected}
          </span>
        )}
      </div>

      <button
        onClick={() => onToggle(!layer.enabled)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors',
          layer.enabled ? 'bg-green-500' : 'bg-muted'
        )}
        role="switch"
        aria-checked={layer.enabled}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
            layer.enabled ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

export default LayerToggle;
