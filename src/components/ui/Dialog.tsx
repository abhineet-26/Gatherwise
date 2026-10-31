import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import clsx from 'clsx';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const maxW = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-gw-ink-900/40 backdrop-blur-sm z-50 transition-opacity animate-in fade-in" />
        <RadixDialog.Content
          className={clsx(
            'fixed left-[50%] top-[50%] z-50 w-[92vw] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-xl border border-gw-line focus:outline-none',
            maxW[maxWidth]
          )}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <RadixDialog.Title className="text-lg font-display font-bold text-gw-ink-900">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="text-xs md:text-sm text-gw-ink-600 mt-1">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <button
                className="rounded-lg p-1.5 text-gw-ink-600 hover:bg-gw-sunken hover:text-gw-ink-900 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </RadixDialog.Close>
          </div>

          <div className="py-2">{children}</div>

          {footer && <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-gw-line">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
