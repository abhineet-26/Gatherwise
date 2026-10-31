import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'sunken' | 'elevated' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-gw-line/80 shadow-sm',
    sunken: 'bg-gw-sunken border border-gw-line/50',
    elevated: 'bg-white shadow-md border border-gw-line/60',
    bordered: 'bg-white border-2 border-gw-line-strong',
  };

  return (
    <div
      className={clsx('rounded-2xl p-5 md:p-6 transition-all', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};
