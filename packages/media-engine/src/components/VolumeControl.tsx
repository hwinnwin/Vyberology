/**
 * VolumeControl - Volume slider with mute toggle
 */

import React, { useCallback, useRef, useState } from 'react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { clsx } from 'clsx';
import { usePlayerStore } from '../player/use-player.js';

export interface VolumeControlProps {
  /** Orientation of the slider */
  orientation?: 'horizontal' | 'vertical';
  /** Custom class name */
  className?: string;
  /** Icon size */
  iconSize?: number;
}

export function VolumeControl({
  orientation = 'horizontal',
  className,
  iconSize = 20,
}: VolumeControlProps) {
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const displayVolume = muted ? 0 : volume;

  const getVolumeIcon = () => {
    if (muted || volume === 0) return VolumeX;
    if (volume < 0.33) return Volume;
    if (volume < 0.66) return Volume1;
    return Volume2;
  };

  const Icon = getVolumeIcon();

  const getVolumeFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!sliderRef.current) return volume;
      const rect = sliderRef.current.getBoundingClientRect();

      if (orientation === 'vertical') {
        const y = rect.bottom - e.clientY;
        return Math.max(0, Math.min(1, y / rect.height));
      } else {
        const x = e.clientX - rect.left;
        return Math.max(0, Math.min(1, x / rect.width));
      }
    },
    [orientation, volume]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const vol = getVolumeFromEvent(e);
      setVolume(vol);

      const handleMouseMove = (e: MouseEvent) => {
        const vol = getVolumeFromEvent(e);
        setVolume(vol);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [getVolumeFromEvent, setVolume]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const vol = getVolumeFromEvent(e);
      setVolume(vol);
    },
    [getVolumeFromEvent, setVolume]
  );

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={clsx(
        'flex items-center gap-2 group',
        isVertical && 'flex-col-reverse',
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Mute button */}
      <button
        onClick={toggleMute}
        className={clsx(
          'flex items-center justify-center rounded-full transition-colors',
          'text-white/60 hover:text-white',
          'h-8 w-8 hover:bg-white/10'
        )}
        title={muted ? 'Unmute' : 'Mute'}
      >
        <Icon size={iconSize} />
      </button>

      {/* Volume slider */}
      <div
        ref={sliderRef}
        className={clsx(
          'relative cursor-pointer transition-all',
          isVertical
            ? 'w-1 h-20 rounded-full'
            : 'h-1 w-20 rounded-full',
          'bg-white/20',
          (isHovering || isDragging) && 'bg-white/30'
        )}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        {/* Filled portion */}
        <div
          className={clsx(
            'absolute rounded-full bg-white transition-colors',
            'group-hover:bg-green-500',
            isVertical
              ? 'bottom-0 left-0 right-0'
              : 'top-0 bottom-0 left-0'
          )}
          style={
            isVertical
              ? { height: `${displayVolume * 100}%` }
              : { width: `${displayVolume * 100}%` }
          }
        />

        {/* Handle */}
        <div
          className={clsx(
            'absolute w-3 h-3 rounded-full bg-white shadow-lg',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            isDragging && 'opacity-100'
          )}
          style={
            isVertical
              ? {
                  bottom: `calc(${displayVolume * 100}% - 6px)`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }
              : {
                  left: `calc(${displayVolume * 100}% - 6px)`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }
          }
        />
      </div>
    </div>
  );
}
