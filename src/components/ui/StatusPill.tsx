import React from 'react';
import clsx from 'clsx';

export type StatusPillVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

export interface StatusPillProps {
  label: string;
  variant?: StatusPillVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = 'neutral',
  icon,
  size = 'md',
  className,
}) => {
  const variants: Record<StatusPillVariant, string> = {
    success: 'bg-gw-peacock-50 text-gw-peacock-700 border border-gw-peacock-600/30',
    warning: 'bg-gw-marigold-100 text-gw-marigold-800 border border-gw-marigold-800/30',
    danger: 'bg-gw-vermilion-50 text-gw-vermilion-700 border border-gw-vermilion-600/30',
    info: 'bg-gw-indigo-50 text-gw-indigo-700 border border-gw-indigo-600/20',
    neutral: 'bg-gw-sunken text-gw-ink-700 border border-gw-line',
    accent: 'bg-gw-marigold-400 text-gw-ink-900 font-semibold border border-gw-marigold-800/20',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full shrink-0 tracking-wide',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
