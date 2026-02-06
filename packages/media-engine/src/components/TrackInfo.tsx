/**
 * TrackInfo - Display current track artwork, title, and artist
 */

import { Music } from 'lucide-react';
import { clsx } from 'clsx';
import { usePlayerStore } from '../player/use-player.js';

export interface TrackInfoProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show album art */
  showArtwork?: boolean;
  /** Custom class name */
  className?: string;
  /** On click handler */
  onClick?: () => void;
}

const sizeMap = {
  sm: {
    artwork: 'h-10 w-10',
    title: 'text-sm',
    artist: 'text-xs',
    icon: 16,
  },
  md: {
    artwork: 'h-14 w-14',
    title: 'text-base',
    artist: 'text-sm',
    icon: 20,
  },
  lg: {
    artwork: 'h-20 w-20',
    title: 'text-lg',
    artist: 'text-base',
    icon: 28,
  },
};

export function TrackInfo({
  size = 'md',
  showArtwork = true,
  className,
  onClick,
}: TrackInfoProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const sizes = sizeMap[size];

  if (!currentTrack) {
    return (
      <div className={clsx('flex items-center gap-3', className)}>
        {showArtwork && (
          <div
            className={clsx(
              'flex items-center justify-center rounded-md bg-white/10',
              sizes.artwork
            )}
          >
            <Music size={sizes.icon} className="text-white/40" />
          </div>
        )}
        <div className="min-w-0">
          <p className={clsx('font-medium text-white/40 truncate', sizes.title)}>
            No track playing
          </p>
          <p className={clsx('text-white/30 truncate', sizes.artist)}>
            Select a track to play
          </p>
        </div>
      </div>
    );
  }

  const artistNames = currentTrack.artists.map((a) => a.name).join(', ');
  const imageUrl = currentTrack.imageUrl || currentTrack.album?.imageUrl;

  return (
    <div
      className={clsx(
        'flex items-center gap-3 min-w-0',
        onClick && 'cursor-pointer hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {/* Artwork */}
      {showArtwork && (
        <div
          className={clsx(
            'flex-shrink-0 rounded-md overflow-hidden bg-white/10',
            sizes.artwork
          )}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={currentTrack.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Music size={sizes.icon} className="text-white/40" />
            </div>
          )}
        </div>
      )}

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            'font-medium text-white truncate',
            sizes.title
          )}
          title={currentTrack.name}
        >
          {currentTrack.name}
        </p>
        <p
          className={clsx(
            'text-white/60 truncate',
            sizes.artist
          )}
          title={artistNames}
        >
          {artistNames}
        </p>
      </div>
    </div>
  );
}
