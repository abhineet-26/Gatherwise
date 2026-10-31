import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { MoneyInput } from '../../components/ui/MoneyInput';
import { inr, type Minor } from 'shared/domain/money/money';
import type { Payment } from 'shared/schemas';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: Minor;
    recipient: string;
    mode: Payment['mode'];
    reference?: string;
  }) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [payAmount, setPayAmount] = useState<Minor>(inr(50000));
  const [payMode, setPayMode] = useState<Payment['mode']>('upi');
  const [payRecipient, setPayRecipient] = useState('');
  const [payRef, setPayRef] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payRecipient.trim() || payAmount <= 0) return;
    onSubmit({
      amount: payAmount,
      recipient: payRecipient.trim(),
      mode: payMode,
      reference: payRef.trim() || undefined,
    });
    setPayRecipient('');
    setPayRef('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
            Record Outgoing Payment
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xs">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <MoneyInput
            label="Amount Paid"
            value={payAmount}
            onChange={(val) => {
              if (val !== null) setPayAmount(val);
            }}
          />

          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Recipient / Vendor *
            </label>
            <input
              type="text"
              required
              value={payRecipient}
              onChange={(e) => setPayRecipient(e.target.value)}
              placeholder="e.g. Royal Greens Banquet, Annapurna Caterers"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Payment Mode
              </label>
              <select
                value={payMode}
                onChange={(e) => setPayMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
              >
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="bank_transfer">NEFT / RTGS / IMPS</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Txn / UTR Reference
              </label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="e.g. UPI/61029381"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-white">
              Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddBudgetLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { category: string; estimate: Minor }) => void;
}

export const AddBudgetLineModal: React.FC<AddBudgetLineModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [newLineCategory, setNewLineCategory] = useState('');
  const [newLineEstimate, setNewLineEstimate] = useState<Minor>(inr(100000));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineCategory.trim()) return;
    onSubmit({
      category: newLineCategory.trim(),
      estimate: newLineEstimate,
    });
    setNewLineCategory('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
            Add Budget Category Line
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xs">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={newLineCategory}
              onChange={(e) => setNewLineCategory(e.target.value)}
              placeholder="e.g. Live Music & DJ, Fireworks, Valet"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
            />
          </div>

          <MoneyInput
            label="Planning Estimate"
            value={newLineEstimate}
            onChange={(val) => {
              if (val !== null) setNewLineEstimate(val);
            }}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-white">
              Add Line
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
