/**
 * THE VYBER - Consciousness Layer
 * Frequency Status - Shows current operating frequency
 *
 * "0616 + 0626 are active."
 */

import React from 'react';
import { FREQUENCIES, type FrequencyCode } from '../core/FrequencyConstants';

interface FrequencyStatusProps {
  /** Which frequency to display (default OS_0616) */
  frequency?: FrequencyCode;
  /** Show the full meaning or just the code */
  showMeaning?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * FrequencyStatus - Displays current operating frequency in the UI
 */
export const FrequencyStatus: React.FC<FrequencyStatusProps> = ({
  frequency = 'OS_0616',
  showMeaning = false,
  className = '',
}) => {
  const freq = FREQUENCIES[frequency];

  return (
    <div className={`flex items-center gap-2 text-xs text-slate-400 ${className}`}>
      <span
        className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
        aria-hidden="true"
      />
      <span>
        Operating on {freq.code}
        {showMeaning && (
          <span className="text-slate-500 ml-1">- {freq.name}</span>
        )}
      </span>
    </div>
  );
};

export default FrequencyStatus;
