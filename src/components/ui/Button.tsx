import React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gw-indigo-700 hover:bg-gw-indigo-600 text-white focus:ring-gw-indigo-600',
    secondary: 'bg-gw-peacock-700 hover:bg-gw-peacock-600 text-white focus:ring-gw-peacock-600',
    outline: 'border border-gw-line bg-white hover:bg-gw-sunken text-gw-ink-900 focus:ring-gw-indigo-600',
    ghost: 'hover:bg-gw-sunken text-gw-ink-700 hover:text-gw-ink-900 focus:ring-gw-indigo-600',
    danger: 'bg-gw-vermilion-600 hover:bg-gw-vermilion-700 text-white focus:ring-gw-vermilion-600',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
