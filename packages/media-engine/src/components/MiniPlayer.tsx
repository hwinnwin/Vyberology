/**
 * MiniPlayer - Compact player bar for bottom of screen
 * Combines TrackInfo, ProgressBar, and PlayerControls
 */

import { clsx } from 'clsx';
import { TrackInfo } from './TrackInfo.js';
import { ProgressBar } from './ProgressBar.js';
import { PlayerControls } from './PlayerControls.js';
import { VolumeControl } from './VolumeControl.js';
import { usePlayerStore } from '../player/use-player.js';

export interface MiniPlayerProps {
  /** Show volume control */
  showVolume?: boolean;
  /** Custom class name */
  className?: string;
  /** On track info click */
  onExpandClick?: () => void;
}

export function MiniPlayer({
  showVolume = true,
  className,
  onExpandClick,
}: MiniPlayerProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  if (!currentTrack) {
    return null;
  }

  return (
    <div
      className={clsx(
        'w-full bg-gradient-to-b from-neutral-900 to-black',
        'border-t border-white/10',
        className
      )}
    >
      {/* Progress bar at top */}
      <div className="px-4 pt-2">
        <ProgressBar showTime={false} height="sm" />
      </div>

      {/* Main content */}
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        {/* Left: Track info */}
        <div className="flex-1 min-w-0 max-w-xs">
          <TrackInfo size="sm" onClick={onExpandClick} />
        </div>

        {/* Center: Controls */}
        <div className="flex-shrink-0">
          <PlayerControls size="sm" showShuffle={false} showRepeat={false} />
        </div>

        {/* Right: Volume */}
        {showVolume && (
          <div className="flex-1 flex justify-end max-w-xs">
            <VolumeControl iconSize={18} />
          </div>
        )}
      </div>
    </div>
  );
}
