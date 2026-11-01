import React, { useState } from 'react';
import type { FundingSource, FundingKind, FundingStage } from 'shared/domain/funding/types';
import { parseMoney, minor } from 'shared/domain/money/money';
import { X, HandCoins, Plus } from 'lucide-react';

interface AddFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (source: FundingSource) => void;
}

export const AddFundingModal: React.FC<AddFundingModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<FundingKind>('sponsor');
  const [stage, setStage] = useState<FundingStage>('prospect');
  const [amountStr, setAmountStr] = useState('');
  const [isInKind, setIsInKind] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedMoney = parseMoney(amountStr || '0');
    const amountPaise = parsedMoney !== null ? parsedMoney : minor(0);

    const source: FundingSource = {
      id: 'fnd-' + Date.now(),
      name: name.trim(),
      kind,
      stage,
      amountPaise,
      isInKind,
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      deliverables: [],
    };

    onAdd(source);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-gw-line bg-white dark:bg-stone-900 p-6 shadow-2xl space-y-4 text-gw-ink-900 dark:text-stone-100">
        <div className="flex items-center justify-between pb-2 border-b border-gw-line">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-gw-indigo-700" />
            <h3 className="text-base font-bold">Add Funding or Sponsor Source</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gw-ink-600 hover:bg-gw-sunken">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold block mb-1">Source / Sponsor Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. State Bank of India / Local Business Assoc"
              className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none focus:ring-1 focus:ring-gw-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Funding Kind</label>
              <select
                value={kind}
                onChange={e => setKind(e.target.value as FundingKind)}
                className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none"
              >
                <option value="sponsor">Corporate Sponsor</option>
                <option value="grant">Grant / Subsidy</option>
                <option value="ticket_sales">Ticket Sales</option>
                <option value="donation">Community Donation</option>
                <option value="internal">Host Contribution</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Pipeline Stage</label>
              <select
                value={stage}
                onChange={e => setStage(e.target.value as FundingStage)}
                className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none"
              >
                <option value="prospect">Prospect (10% prob)</option>
                <option value="pitched">Pitched (25% prob)</option>
                <option value="verbal">Verbal Agreement (60% prob)</option>
                <option value="confirmed">Confirmed / MOU (100%)</option>
                <option value="received">Funds Received in Bank</option>
                <option value="declined">Declined (0%)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Amount (₹) *</label>
            <input
              type="text"
              required
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              placeholder="e.g. 2.5 lakh or ₹2,50,000"
              className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none font-mono"
            />
          </div>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-gw-sunken border border-gw-line cursor-pointer">
            <input
              type="checkbox"
              checked={isInKind}
              onChange={e => setIsInKind(e.target.checked)}
              className="rounded text-gw-indigo-600 focus:ring-gw-indigo-500"
            />
            <span className="text-xs text-gw-ink-700 dark:text-stone-300">
              <strong>In-Kind Sponsor:</strong> Non-cash contribution (e.g. free drinks, banner printing)
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Contact Person</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="e.g. Sneha Deshmukh"
                className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gw-line text-gw-ink-700 hover:bg-gw-sunken"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gw-indigo-700 hover:bg-gw-indigo-600 text-white font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Source
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
