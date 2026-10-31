import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-gw-ink-700 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-gw-ink-600 pointer-events-none flex items-center">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full h-10 rounded-lg border bg-white text-sm text-gw-ink-900 placeholder:text-gw-ink-600/60 focus:outline-none focus:ring-2 focus:ring-gw-indigo-600 transition-colors',
            icon ? 'pl-9 pr-3' : 'px-3',
            error ? 'border-gw-vermilion-600 focus:ring-gw-vermilion-600' : 'border-gw-line focus:border-gw-indigo-600',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-gw-vermilion-600 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-gw-ink-600">{hint}</p>}
    </div>
  );
};
