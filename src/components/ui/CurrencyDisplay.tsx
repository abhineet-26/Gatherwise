import React from 'react';
import { formatMoney, formatInrCompact, type Minor } from 'shared/domain/money/money';
import clsx from 'clsx';

export interface CurrencyDisplayProps {
  amount: Minor;
  compact?: boolean;
  className?: string;
  showSign?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  compact = false,
  className,
  showSign = false,
}) => {
  const formatted = compact ? formatInrCompact(amount) : formatMoney(amount);
  const isPositive = amount > 0;
  const isNegative = amount < 0;

  return (
    <span
      className={clsx(
        'tabular-nums font-semibold tracking-tight inline-flex items-baseline',
        isNegative && 'text-gw-vermilion-700',
        className
      )}
    >
      {showSign && isPositive && '+'}
      {formatted}
    </span>
  );
};
