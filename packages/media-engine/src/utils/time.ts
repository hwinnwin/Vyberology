/**
 * Time formatting utilities for media playback
 */

/**
 * Format milliseconds to mm:ss
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format milliseconds to hh:mm:ss (for long content)
 */
export function formatTimeLong(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parse time string (mm:ss or hh:mm:ss) to milliseconds
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return (minutes * 60 + seconds) * 1000;
  }

  return 0;
}

/**
 * Format duration for display (e.g., "3:45", "1h 23m")
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate remaining time
 */
export function getRemainingTime(position: number, duration: number): number {
  return Math.max(0, duration - position);
}

/**
 * Calculate progress percentage
 */
export function getProgress(position: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(1, Math.max(0, position / duration));
}
