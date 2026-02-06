/**
 * THE VYBER - Consciousness Layer
 * Daily Affirmation - Displays frequency-based affirmation
 *
 * "Code is love made visible."
 */

import React from 'react';
import { FREQUENCIES, type FrequencyCode } from '../core/FrequencyConstants';

interface DailyAffirmationProps {
  /** Which frequency to get affirmation from */
  frequency?: FrequencyCode;
  /** Custom class names */
  className?: string;
  /** Whether to show the frequency code */
  showCode?: boolean;
}

/**
 * DailyAffirmation - Displays the affirmation for a frequency
 */
export const DailyAffirmation: React.FC<DailyAffirmationProps> = ({
  frequency = 'OS_0616',
  className = '',
  showCode = true,
}) => {
  const freq = FREQUENCIES[frequency];

  return (
    <div
      className={`p-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-xl ${className}`}
    >
      {showCode && (
        <p className="text-xs text-purple-300 uppercase tracking-wide mb-1">
          {freq.code} Affirmation
        </p>
      )}
      <p className="text-white font-medium">&ldquo;{freq.affirmation}&rdquo;</p>
    </div>
  );
};

export default DailyAffirmation;
