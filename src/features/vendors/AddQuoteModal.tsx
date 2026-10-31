import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { MoneyInput } from '../../components/ui/MoneyInput';
import type { Quotation, Vendor } from 'shared/schemas/vendor';
import type { IsoDate } from 'shared/domain/time/dates';
import { inr, type Minor } from 'shared/domain/money/money';
import { X, Plus, Trash2 } from 'lucide-react';

interface AddQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quote: Quotation) => void;
  eventId: string;
  vendors: Vendor[];
  initialQuote?: Quotation | null;
}

export const AddQuoteModal: React.FC<AddQuoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventId,
  vendors,
  initialQuote,
}) => {
  const [vendorId, setVendorId] = useState(initialQuote?.vendorId || (vendors[0]?.id || ''));
  const [title, setTitle] = useState(initialQuote?.title || '');
  const [model, setModel] = useState<'fixed' | 'per_head' | 'per_unit'>(
    initialQuote?.pricing?.model || 'per_head'
  );
  const [basePrice, setBasePrice] = useState<Minor>(
    inr(initialQuote?.pricing?.baseAmount ? initialQuote.pricing.baseAmount / 100 : 1400)
  );
  const [taxMode, setTaxMode] = useState<'exclusive' | 'inclusive' | 'unknown'>(
    initialQuote?.taxMode || 'exclusive'
  );
  const [gstPct, setGstPct] = useState<number>(initialQuote?.gstPct ?? 18);
  const [serviceChargePct, setServiceChargePct] = useState<number>(initialQuote?.serviceChargePct ?? 0);
  const [depositPct, setDepositPct] = useState<number>(initialQuote?.depositPct ?? 25);
  const [validUntil, setValidUntil] = useState<string>(initialQuote?.validUntil || '');
  const [inclusionsText, setInclusionsText] = useState<string>(
    initialQuote ? Object.keys(initialQuote.inclusions || {}).join(', ') : 'Chafing dishes, Service staff, Welcome mocktail'
  );
  const [notes, setNotes] = useState<string>(initialQuote?.notes || '');

  // Payment schedule splits
  const [scheduleSplits, setScheduleSplits] = useState<{ label: string; pct: number }[]>(
    initialQuote?.paymentSchedule || [
      { label: 'Booking Advance Deposit', pct: 25 },
      { label: 'Pre-event Final Payment', pct: 75 },
    ]
  );

  if (!isOpen) return null;

  const handleAddSplit = () => {
    setScheduleSplits([...scheduleSplits, { label: 'Milestone Payment', pct: 25 }]);
  };

  const handleRemoveSplit = (idx: number) => {
    setScheduleSplits(scheduleSplits.filter((_, i) => i !== idx));
  };

  const handleUpdateSplit = (idx: number, field: 'label' | 'pct', val: any) => {
    const updated = [...scheduleSplits];
    updated[idx] = { ...updated[idx]!, [field]: val };
    setScheduleSplits(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !vendorId) return;

    const inclusionsMap: Record<string, boolean> = {};
    inclusionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((item) => {
        inclusionsMap[item.toLowerCase().replace(/\s+/g, '_')] = true;
      });

    const quote: Quotation = {
      id: initialQuote?.id || `quo_${Date.now()}`,
      eventId,
      vendorId,
      title: title.trim(),
      pricing: {
        model,
        baseAmount: Number(basePrice),
      },
      taxMode,
      gstPct: taxMode === 'exclusive' ? Number(gstPct) : undefined,
      serviceChargePct: Number(serviceChargePct) || undefined,
      depositPct: Number(depositPct),
      inclusions: inclusionsMap,
      paymentSchedule: scheduleSplits.map((s) => ({ label: s.label, pct: Number(s.pct) })),
      validUntil: (validUntil as IsoDate) || undefined,
      status: initialQuote?.status || 'received',
      source: 'manual',
      notes: notes.trim(),
    };

    onSave(quote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {initialQuote ? 'Edit Quotation' : 'Capture Vendor Quotation'}
            </h3>
            <p className="text-xs text-stone-500">Record itemized pricing, taxes, and schedule terms</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Vendor *
              </label>
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Quote Title / Package Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Royal Wedding Buffet"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Pricing Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="per_head">Per Head / Per Plate</option>
                <option value="fixed">Fixed Lumpsum Package</option>
                <option value="per_unit">Per Unit Rate</option>
              </select>
            </div>
            <div>
              <MoneyInput
                label={model === 'per_head' ? 'Rate Per Plate / Person' : 'Base Amount'}
                value={basePrice}
                onChange={(val) => setBasePrice(val || inr(0))}
                placeholder={model === 'per_head' ? '1400' : '250000'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Tax Treatment
              </label>
              <select
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="exclusive">+ Tax Extra</option>
                <option value="inclusive">All-Inclusive (Tax incl.)</option>
                <option value="unknown">Tax Treatment Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                GST % {taxMode === 'exclusive' ? '(Quoted)' : ''}
              </label>
              <input
                type="number"
                min="0"
                max="40"
                value={gstPct}
                disabled={taxMode === 'inclusive'}
                onChange={(e) => setGstPct(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Service Charge %
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={serviceChargePct}
                onChange={(e) => setServiceChargePct(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Inclusions (comma separated)
            </label>
            <input
              type="text"
              value={inclusionsText}
              onChange={(e) => setInclusionsText(e.target.value)}
              placeholder="e.g. Welcome Drinks, 3 Starters, Desserts, Waitstaff"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Deposit % Required
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={depositPct}
                onChange={(e) => setDepositPct(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Quote Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Internal Quotation Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Rate valid if confirmed before Friday"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Payment Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Payment Schedule Milestones
              </label>
              <button
                type="button"
                onClick={handleAddSplit}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Milestone
              </button>
            </div>
            <div className="space-y-2">
              {scheduleSplits.map((split, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={split.label}
                    onChange={(e) => handleUpdateSplit(idx, 'label', e.target.value)}
                    placeholder="Milestone description"
                    className="flex-1 px-3 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={split.pct}
                      onChange={(e) => handleUpdateSplit(idx, 'pct', Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-right"
                    />
                    <span className="text-xs text-stone-500">%</span>
                  </div>
                  {scheduleSplits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSplit(idx)}
                      aria-label="Remove milestone"
                      className="text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {initialQuote ? 'Update Quote' : 'Save Quotation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
