import React from 'react';
import clsx from 'clsx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border-2 border-dashed border-gw-line bg-white/60',
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-gw-indigo-50 text-gw-indigo-700 flex items-center justify-center mb-4 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-base md:text-lg font-display font-bold text-gw-ink-900 mb-1">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-gw-ink-600 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
