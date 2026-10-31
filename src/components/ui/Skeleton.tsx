import React from 'react';
import clsx from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gw-line/60',
        variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'h-4 rounded' : 'rounded-xl',
        className
      )}
      {...props}
    />
  );
};
