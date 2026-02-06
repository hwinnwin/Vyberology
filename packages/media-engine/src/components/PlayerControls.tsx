/**
 * PlayerControls - Play/pause, next, previous, shuffle, repeat buttons
 * Inspired by Spotube's player controls
 */

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
} from 'lucide-react';
import { clsx } from 'clsx';
import { usePlayerStore } from '../player/use-player.js';
import type { LoopMode } from '../types/player.js';

export interface PlayerControlsProps {
  /** Size of control buttons */
  size?: 'sm' | 'md' | 'lg';
  /** Show shuffle button */
  showShuffle?: boolean;
  /** Show repeat button */
  showRepeat?: boolean;
  /** Custom class name */
  className?: string;
}

const sizeMap = {
  sm: { button: 'h-8 w-8', icon: 16, playIcon: 20 },
  md: { button: 'h-10 w-10', icon: 20, playIcon: 24 },
  lg: { button: 'h-12 w-12', icon: 24, playIcon: 32 },
};

export function PlayerControls({
  size = 'md',
  showShuffle = true,
  showRepeat = true,
  className,
}: PlayerControlsProps) {
  const state = usePlayerStore((s) => s.state);
  const shuffled = usePlayerStore((s) => s.shuffled);
  const loopMode = usePlayerStore((s) => s.loopMode);

  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const setLoopMode = usePlayerStore((s) => s.setLoopMode);

  const isPlaying = state === 'playing';
  const isLoading = state === 'loading' || state === 'buffering';
  const sizes = sizeMap[size];

  const cycleLoopMode = () => {
    const modes: LoopMode[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(loopMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setLoopMode(nextMode);
  };

  const getLoopIcon = () => {
    if (loopMode === 'one') {
      return <Repeat1 size={sizes.icon} />;
    }
    return <Repeat size={sizes.icon} />;
  };

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {/* Shuffle */}
      {showShuffle && (
        <button
          onClick={toggleShuffle}
          className={clsx(
            'flex items-center justify-center rounded-full transition-colors',
            'hover:bg-white/10 active:bg-white/20',
            sizes.button,
            shuffled ? 'text-green-500' : 'text-white/60 hover:text-white'
          )}
          title={shuffled ? 'Shuffle on' : 'Shuffle off'}
        >
          <Shuffle size={sizes.icon} />
        </button>
      )}

      {/* Previous */}
      <button
        onClick={() => previous()}
        className={clsx(
          'flex items-center justify-center rounded-full transition-colors',
          'text-white hover:bg-white/10 active:bg-white/20',
          sizes.button
        )}
        title="Previous"
      >
        <SkipBack size={sizes.icon} fill="currentColor" />
      </button>

      {/* Play/Pause */}
      <button
        onClick={toggle}
        disabled={isLoading}
        className={clsx(
          'flex items-center justify-center rounded-full transition-all',
          'bg-white text-black hover:scale-105 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          size === 'sm' && 'h-10 w-10',
          size === 'md' && 'h-12 w-12',
          size === 'lg' && 'h-14 w-14'
        )}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
        ) : isPlaying ? (
          <Pause size={sizes.playIcon} fill="currentColor" />
        ) : (
          <Play size={sizes.playIcon} fill="currentColor" className="ml-1" />
        )}
      </button>

      {/* Next */}
      <button
        onClick={() => next()}
        className={clsx(
          'flex items-center justify-center rounded-full transition-colors',
          'text-white hover:bg-white/10 active:bg-white/20',
          sizes.button
        )}
        title="Next"
      >
        <SkipForward size={sizes.icon} fill="currentColor" />
      </button>

      {/* Repeat */}
      {showRepeat && (
        <button
          onClick={cycleLoopMode}
          className={clsx(
            'flex items-center justify-center rounded-full transition-colors',
            'hover:bg-white/10 active:bg-white/20',
            sizes.button,
            loopMode !== 'off'
              ? 'text-green-500'
              : 'text-white/60 hover:text-white'
          )}
          title={`Repeat: ${loopMode}`}
        >
          {getLoopIcon()}
        </button>
      )}
    </div>
  );
}
