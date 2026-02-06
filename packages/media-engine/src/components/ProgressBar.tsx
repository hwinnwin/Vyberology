/**
 * ProgressBar - Seekable progress slider with time display
 */

import React, { useCallback, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { usePlayerStore } from '../player/use-player.js';
import { formatTime } from '../utils/time.js';

export interface ProgressBarProps {
  /** Show time labels */
  showTime?: boolean;
  /** Custom class name */
  className?: string;
  /** Height of the progress bar */
  height?: 'sm' | 'md' | 'lg';
}

const heightMap = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

export function ProgressBar({
  showTime = true,
  className,
  height = 'sm',
}: ProgressBarProps) {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);

  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (position / duration) * 100 : 0;
  const displayProgress = isDragging && hoverPosition !== null
    ? (hoverPosition / duration) * 100
    : progress;

  const getPositionFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!progressRef.current || duration <= 0) return 0;
      const rect = progressRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      return (x / rect.width) * duration;
    },
    [duration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const pos = getPositionFromEvent(e);
      setHoverPosition(pos);

      const handleMouseMove = (e: MouseEvent) => {
        const pos = getPositionFromEvent(e);
        setHoverPosition(pos);
      };

      const handleMouseUp = (e: MouseEvent) => {
        const pos = getPositionFromEvent(e);
        seek(pos);
        setIsDragging(false);
        setHoverPosition(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [getPositionFromEvent, seek]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) {
        const pos = getPositionFromEvent(e);
        setHoverPosition(pos);
      }
    },
    [isDragging, getPositionFromEvent]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHoverPosition(null);
    }
  }, [isDragging]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const pos = getPositionFromEvent(e);
      seek(pos);
    },
    [getPositionFromEvent, seek]
  );

  return (
    <div className={clsx('flex items-center gap-3 w-full', className)}>
      {/* Current time */}
      {showTime && (
        <span className="text-xs text-white/60 tabular-nums min-w-[40px] text-right">
          {formatTime(isDragging && hoverPosition !== null ? hoverPosition : position)}
        </span>
      )}

      {/* Progress bar */}
      <div
        ref={progressRef}
        className={clsx(
          'relative flex-1 rounded-full bg-white/20 cursor-pointer group',
          heightMap[height]
        )}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Filled progress */}
        <div
          className={clsx(
            'absolute inset-y-0 left-0 rounded-full bg-white transition-all',
            'group-hover:bg-green-500'
          )}
          style={{ width: `${displayProgress}%` }}
        />

        {/* Hover indicator */}
        {hoverPosition !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${(hoverPosition / duration) * 100}% - 6px)` }}
          />
        )}

        {/* Drag handle */}
        <div
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            isDragging && 'opacity-100 scale-125'
          )}
          style={{ left: `calc(${displayProgress}% - 6px)` }}
        />
      </div>

      {/* Duration */}
      {showTime && (
        <span className="text-xs text-white/60 tabular-nums min-w-[40px]">
          {formatTime(duration)}
        </span>
      )}
    </div>
  );
}
