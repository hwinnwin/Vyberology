/**
 * FullPlayer - Full-screen player view
 * Large artwork, full controls, lyrics support
 */

import { ChevronDown, ListMusic } from 'lucide-react';
import { clsx } from 'clsx';
import { ProgressBar } from './ProgressBar.js';
import { PlayerControls } from './PlayerControls.js';
import { VolumeControl } from './VolumeControl.js';
import { usePlayerStore } from '../player/use-player.js';

export interface FullPlayerProps {
  /** Custom class name */
  className?: string;
  /** On close/minimize click */
  onClose?: () => void;
  /** On queue button click */
  onQueueClick?: () => void;
}

export function FullPlayer({
  className,
  onClose,
  onQueueClick,
}: FullPlayerProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const imageUrl = currentTrack?.imageUrl || currentTrack?.album?.imageUrl;
  const artistNames = currentTrack?.artists.map((a) => a.name).join(', ') || '';

  return (
    <div
      className={clsx(
        'flex flex-col h-full w-full',
        'bg-gradient-to-b from-neutral-800 to-black',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronDown size={24} className="text-white" />
        </button>

        <div className="text-center">
          <p className="text-xs text-white/60 uppercase tracking-wider">
            Now Playing
          </p>
          {currentTrack?.album && (
            <p className="text-sm text-white font-medium truncate max-w-[200px]">
              {currentTrack.album.name}
            </p>
          )}
        </div>

        <button
          onClick={onQueueClick}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ListMusic size={24} className="text-white" />
        </button>
      </div>

      {/* Artwork */}
      <div className="flex-1 flex items-center justify-center px-8 py-4">
        <div className="relative w-full max-w-sm aspect-square">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={currentTrack?.name}
              className="w-full h-full object-cover rounded-lg shadow-2xl"
            />
          ) : (
            <div className="w-full h-full bg-neutral-800 rounded-lg shadow-2xl flex items-center justify-center">
              <div className="text-6xl">🎵</div>
            </div>
          )}
        </div>
      </div>

      {/* Track info and controls */}
      <div className="px-8 pb-8 space-y-6">
        {/* Track name and artist */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white truncate">
            {currentTrack?.name || 'No track playing'}
          </h2>
          <p className="text-lg text-white/60 truncate mt-1">
            {artistNames || 'Unknown artist'}
          </p>
        </div>

        {/* Progress */}
        <ProgressBar showTime height="md" />

        {/* Controls */}
        <div className="flex items-center justify-center">
          <PlayerControls size="lg" />
        </div>

        {/* Volume */}
        <div className="flex justify-center">
          <VolumeControl />
        </div>
      </div>
    </div>
  );
}
