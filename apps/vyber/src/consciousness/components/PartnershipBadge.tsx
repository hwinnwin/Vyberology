/**
 * THE VYBER - Consciousness Layer
 * Partnership Badge - Visual indicator of 0626 compliance
 *
 * "Protect the partnership. Care surrounds collaboration."
 */

import React from 'react';

interface PartnershipBadgeProps {
  /** Partnership score (0-100) */
  score: number;
  /** Whether to show the score number */
  showScore?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class names */
  className?: string;
}

/**
 * PartnershipBadge - Shows 0626 compliance status
 */
export const PartnershipBadge: React.FC<PartnershipBadgeProps> = ({
  score,
  showScore = true,
  size = 'md',
  className = '',
}) => {
  const getStatus = () => {
    if (score >= 90) return { label: 'Protected', color: 'bg-green-500', textColor: 'text-green-400' };
    if (score >= 70) return { label: 'Secure', color: 'bg-blue-500', textColor: 'text-blue-400' };
    if (score >= 50) return { label: 'At Risk', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
    return { label: 'Vulnerable', color: 'bg-red-500', textColor: 'text-red-400' };
  };

  const status = getStatus();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-slate-800 ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${status.color}`} aria-hidden="true" />
      <span className={status.textColor}>{status.label}</span>
      {showScore && (
        <span className="text-slate-400 ml-1">
          {score}%
        </span>
      )}
    </div>
  );
};

export default PartnershipBadge;
