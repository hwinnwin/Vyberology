/**
 * Queue - Display and manage playback queue
 */

import { Music, X, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';
import { usePlayerStore } from '../player/use-player.js';
import { formatTime } from '../utils/time.js';
import type { SourcedTrack } from '../types/track.js';

export interface QueueProps {
  /** Custom class name */
  className?: string;
  /** Max height (for scrolling) */
  maxHeight?: string;
}

export function Queue({ className, maxHeight = '400px' }: QueueProps) {
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const skipTo = usePlayerStore((s) => s.skipTo);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);

  if (queue.length === 0) {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-12', className)}>
        <Music size={48} className="text-white/20 mb-4" />
        <p className="text-white/40 text-sm">Queue is empty</p>
        <p className="text-white/30 text-xs mt-1">Add tracks to start playing</p>
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-semibold">Queue</h3>
        <span className="text-white/40 text-sm">{queue.length} tracks</span>
      </div>

      {/* Queue list */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {queue.map((track, index) => (
          <QueueItem
            key={`${track.id}-${index}`}
            track={track}
            index={index}
            isPlaying={index === currentIndex}
            onPlay={() => skipTo(index)}
            onRemove={() => removeFromQueue(index)}
          />
        ))}
      </div>
    </div>
  );
}

interface QueueItemProps {
  track: SourcedTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

function QueueItem({
  track,
  index,
  isPlaying,
  onPlay,
  onRemove,
}: QueueItemProps) {
  const imageUrl = track.imageUrl || track.album?.imageUrl;
  const artistNames = track.artists.map((a) => a.name).join(', ');

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-2 group',
        'hover:bg-white/5 transition-colors',
        isPlaying && 'bg-white/10'
      )}
    >
      {/* Drag handle */}
      <div className="opacity-0 group-hover:opacity-100 cursor-grab text-white/40">
        <GripVertical size={16} />
      </div>

      {/* Index / Playing indicator */}
      <div className="w-5 text-center">
        {isPlaying ? (
          <div className="flex items-center justify-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        ) : (
          <span className="text-white/40 text-sm">{index + 1}</span>
        )}
      </div>

      {/* Artwork */}
      <div
        className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-white/10 cursor-pointer"
        onClick={onPlay}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={track.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music size={16} className="text-white/40" />
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onPlay}>
        <p
          className={clsx(
            'text-sm truncate',
            isPlaying ? 'text-green-500 font-medium' : 'text-white'
          )}
        >
          {track.name}
        </p>
        <p className="text-xs text-white/60 truncate">{artistNames}</p>
      </div>

      {/* Duration */}
      <span className="text-xs text-white/40 tabular-nums">
        {formatTime(track.durationMs)}
      </span>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={clsx(
          'p-1 rounded-full opacity-0 group-hover:opacity-100',
          'hover:bg-white/10 text-white/40 hover:text-white',
          'transition-all'
        )}
      >
        <X size={16} />
      </button>
    </div>
  );
}
