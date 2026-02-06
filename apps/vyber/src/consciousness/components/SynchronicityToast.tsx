/**
 * THE VYBER - Consciousness Layer
 * Synchronicity Toast - Shows when frequency times are detected
 *
 * "Pay attention. You're exactly where you need to be."
 */

import React, { useState, useEffect } from 'react';
import { getFrequencyEngine, type FrequencyEvent } from '../core/FrequencyEngine';

interface SynchronicityToastProps {
  /** Duration in ms before auto-hide (default 5000) */
  duration?: number;
  /** Position on screen */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * SynchronicityToast - Displays frequency synchronicity notifications
 */
export const SynchronicityToast: React.FC<SynchronicityToastProps> = ({
  duration = 5000,
  position = 'top-right',
}) => {
  const [event, setEvent] = useState<FrequencyEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const engine = getFrequencyEngine();

    const unsubscribe = engine.subscribe((frequencyEvent) => {
      if (frequencyEvent.context === 'time') {
        setEvent(frequencyEvent);
        setVisible(true);

        // Auto-hide after duration
        const timer = setTimeout(() => setVisible(false), duration);
        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, [duration]);

  if (!visible || !event) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} bg-purple-900/90 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl z-50 max-w-sm animate-in fade-in slide-in-from-top-2 duration-300`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          ✨
        </span>
        <div>
          <p className="font-semibold text-purple-200">
            {event.frequency.code} - {event.frequency.name}
          </p>
          <p className="text-sm text-purple-300">{event.frequency.meaning}</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="ml-auto text-purple-400 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default SynchronicityToast;
