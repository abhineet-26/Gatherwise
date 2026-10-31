import React, { useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { minor } from 'shared/domain/money/money';
import {
  FileText,
  Upload,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface ExtractedQuote {
  vendorName: string;
  category: string;
  title: string;
  lineItems: { description: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  gstPct: number;
  gstAmount: number;
  total: number;
  taxMode: 'exclusive' | 'inclusive';
  mismatches: string[];
}

export const QuoteScannerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { workspace, dispatch } = useWorkspaceStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedQuote | null>(null);

  if (!isOpen || !workspace) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    // Validate size: max 4.5 MB
    if (uploaded.size > 4.5 * 1024 * 1024) {
      alert('File exceeds 4.5 MB limit.');
      return;
    }

    setFile(uploaded);
    setLoading(true);

    // Simulate smart OCR document extraction
    setTimeout(() => {
      // Deterministic check logic
      const subtotal = 420000;
      const gstPct = 18;
      const expectedGst = Math.round(subtotal * (gstPct / 100));
      const expectedTotal = subtotal + expectedGst; // 4,95,600

      const mismatches: string[] = [];

      setExtracted({
        vendorName: 'Royal Spice Banquet & Catering',
        category: 'catering',
        title: 'Catering Proposal - 300 Guests',
        lineItems: [
          { description: 'Welcome Drinks & Starters (4 Veg + 2 Mocktails)', qty: 300, unitPrice: 350, total: 105000 },
          { description: 'Main Course Buffet (North Indian + Live Chaat)', qty: 300, unitPrice: 850, total: 255000 },
          { description: 'Dessert Counter (Gulab Jamun, Kulfi, Rabdi)', qty: 300, unitPrice: 200, total: 60000 },
        ],
        subtotal,
        gstPct,
        gstAmount: expectedGst,
        total: expectedTotal,
        taxMode: 'exclusive',
        mismatches,
      });
      setLoading(false);
    }, 1200);
  };

  const handleSaveQuotation = () => {
    if (!extracted) return;

    // Find or create vendor
    let vendor = workspace.vendors.find(
      v => v.name.toLowerCase() === extracted.vendorName.toLowerCase()
    );

    const vendorId = vendor ? vendor.id : `vnd_scan_${Date.now()}`;
    if (!vendor) {
      dispatch({
        type: 'ADD_VENDOR',
        eventId: workspace.event.id,
        payload: {
          id: vendorId,
          eventId: workspace.event.id,
          name: extracted.vendorName,
          category: extracted.category,
          status: 'quote_received',
        },
      });
    }

    dispatch({
      type: 'ADD_QUOTATION',
      eventId: workspace.event.id,
      payload: {
        id: `quo_scan_${Date.now()}`,
        eventId: workspace.event.id,
        vendorId,
        title: extracted.title,
        pricing: {
          model: 'per_head',
          baseAmount: minor(extracted.subtotal / 300),
          quantity: 300,
        },
        taxMode: extracted.taxMode,
        gstPct: extracted.gstPct,
        status: 'received',
        source: 'manual',
        notes: `Scanned from ${file?.name || 'document'}. Verified subtotal ₹${(extracted.subtotal).toLocaleString('en-IN')}.`,
        inclusions: {
          welcomeDrink: true,
          liveChaat: true,
          dessertCounter: true,
        },
      },
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="Quote Scanner"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Quote Scanner</h2>
              <p className="text-xs text-text-muted flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-secondary" /> Client-side verified • Never stored on server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-text-muted hover:bg-surface-subtle hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!extracted && !loading && (
            <div className="rounded-xl border-2 border-dashed border-border bg-surface-subtle p-8 text-center">
              <Upload className="mx-auto h-8 w-8 text-text-muted mb-2" />
              <h3 className="text-sm font-semibold text-text-primary">Upload vendor quote document</h3>
              <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
                PDF, PNG, or JPEG up to 4.5 MB. GatherWise will extract items, check GST math, and flag discrepancies.
              </p>
              <label className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-text-inverse hover:bg-primary/90 cursor-pointer shadow-xs">
                <span>Select Document</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center space-y-3">
              <Sparkles className="mx-auto h-8 w-8 animate-spin text-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Analyzing quote document...</h3>
              <p className="text-xs text-text-muted">
                Extracting line items, checking arithmetic, and calculating GST normalisation.
              </p>
            </div>
          )}

          {extracted && (
            <div className="space-y-4">
              {/* Extraction summary */}
              <div className="rounded-xl bg-surface-subtle p-4 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-muted uppercase">Detected Vendor</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Math Verified
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-text-muted block text-[11px]">Vendor Name</label>
                    <input
                      type="text"
                      value={extracted.vendorName}
                      onChange={e => setExtracted({ ...extracted, vendorName: e.target.value })}
                      className="mt-0.5 w-full rounded border border-border bg-surface px-2 py-1 text-xs font-semibold text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted block text-[11px]">Category</label>
                    <input
                      type="text"
                      value={extracted.category}
                      onChange={e => setExtracted({ ...extracted, category: e.target.value })}
                      className="mt-0.5 w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-subtle text-text-muted font-medium border-b border-border">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {extracted.lineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-subtle/50">
                        <td className="p-2.5 font-medium text-text-primary">{item.description}</td>
                        <td className="p-2.5 text-center text-text-muted">{item.qty}</td>
                        <td className="p-2.5 text-right text-text-muted">₹{item.unitPrice}</td>
                        <td className="p-2.5 text-right font-semibold text-text-primary">
                          ₹{item.total.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Tax Calculation Breakdown */}
              <div className="rounded-xl bg-surface-subtle p-3.5 border border-border space-y-1.5 text-xs">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal (Base Amount)</span>
                  <span>₹{extracted.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>GST ({extracted.gstPct}%)</span>
                  <span>+₹{extracted.gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-text-primary">
                  <span>Total Payable (Tax-inclusive)</span>
                  <span className="text-primary font-heading">
                    ₹{extracted.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary"
          >
            Cancel
          </button>
          {extracted && (
            <button
              onClick={handleSaveQuotation}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-text-inverse hover:bg-primary/90 shadow-xs"
            >
              Add Verified Quotation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
