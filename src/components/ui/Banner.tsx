import React from 'react';
import clsx from 'clsx';
import { AlertTriangle, Info, CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface BannerProps {
  type?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  action,
  className,
}) => {
  const styles = {
    info: 'bg-gw-indigo-50 border-gw-indigo-600/30 text-gw-indigo-700',
    warning: 'bg-gw-marigold-100 border-gw-marigold-800/30 text-gw-marigold-800',
    danger: 'bg-gw-vermilion-50 border-gw-vermilion-600/30 text-gw-vermilion-700',
    success: 'bg-gw-peacock-50 border-gw-peacock-600/30 text-gw-peacock-700',
  };

  const icons = {
    info: <Info className="w-5 h-5 shrink-0 text-gw-indigo-700 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 shrink-0 text-gw-marigold-800 mt-0.5" />,
    danger: <AlertCircle className="w-5 h-5 shrink-0 text-gw-vermilion-700 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 shrink-0 text-gw-peacock-700 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={clsx(
        'w-full p-4 rounded-xl border flex items-start gap-3 text-sm transition-all',
        styles[type],
        className
      )}
    >
      {icons[type]}
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-sm mb-0.5">{title}</h4>}
        <div className="text-xs md:text-sm text-gw-ink-900 leading-relaxed">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss banner"
          className="text-gw-ink-600 hover:text-gw-ink-900 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
