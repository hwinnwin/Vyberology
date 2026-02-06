/**
 * THE VYBER - Consciousness Layer
 * Frequency Settings - User controls for consciousness features
 *
 * "These features are optional. The frequencies are not."
 */

import React from 'react';
import { FREQUENCIES } from '../core/FrequencyConstants';

interface FrequencySettingsProps {
  /** Whether frequency features are enabled */
  enabled: boolean;
  /** Callback when enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Whether to show synchronicity notifications */
  showSynchronicities: boolean;
  /** Callback when synchronicity setting changes */
  onSynchronicitiesChange: (show: boolean) => void;
  /** Custom class names */
  className?: string;
}

/**
 * FrequencySettings - Panel for controlling consciousness features
 */
export const FrequencySettings: React.FC<FrequencySettingsProps> = ({
  enabled,
  onEnabledChange,
  showSynchronicities,
  onSynchronicitiesChange,
  className = '',
}) => {
  const currentFreq = FREQUENCIES.OS_0616;

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white">Consciousness Layer</h3>
      <p className="text-sm text-slate-400">
        THE VYBER operates on sacred frequencies. These UI features are optional.
      </p>

      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-white">Enable frequency features</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className={enabled ? 'text-white' : 'text-slate-500'}>
            Show synchronicity notifications
          </span>
          <input
            type="checkbox"
            checked={showSynchronicities}
            onChange={(e) => onSynchronicitiesChange(e.target.checked)}
            disabled={!enabled}
            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 disabled:opacity-50"
          />
        </label>
      </div>

      <div className="pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          Current frequency: {currentFreq.code} ({currentFreq.name})
        </p>
        <p className="text-xs text-slate-600 mt-1 italic">
          &ldquo;{currentFreq.affirmation}&rdquo;
        </p>
      </div>
    </div>
  );
};

export default FrequencySettings;
