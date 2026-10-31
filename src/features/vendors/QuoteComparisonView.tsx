import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { normalizeQuote, compareQuotes, type QuoteInput } from 'shared/domain/quotes/quotes';
import { formatMoney, minor } from 'shared/domain/money/money';
import { asIsoDate } from 'shared/domain/time/dates';
import type { Quotation } from 'shared/schemas/vendor';
import { CheckCircle2, AlertTriangle, Scale, Plus, Award } from 'lucide-react';

interface QuoteComparisonViewProps {
  onAddQuote: () => void;
}

export const QuoteComparisonView: React.FC<QuoteComparisonViewProps> = ({ onAddQuote }) => {
  const { workspace, dispatch } = useWorkspaceStore();
  const { getEffectiveToday, addToast } = useUiStore();
  const today = getEffectiveToday();

  const [selectedCategory, setSelectedCategory] = useState<string>('catering');
  const [headcount, setHeadcount] = useState<number>(workspace?.event.guestCount || 300);
  const [priceWeight, setPriceWeight] = useState<number>(40);
  const [inclusionsWeight, setInclusionsWeight] = useState<number>(30);
  const [reliabilityWeight, setReliabilityWeight] = useState<number>(30);

  if (!workspace) return null;

  const { event, vendors, quotes, commitments } = workspace;

  // Filter quotes by category
  const categoryQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const v = vendors.find((vend) => vend.id === q.vendorId);
      return v?.category === selectedCategory || q.budgetLineId === selectedCategory;
    });
  }, [quotes, vendors, selectedCategory]);

  // Transform quotes to domain QuoteInput
  const domainQuotes: QuoteInput[] = useMemo(() => {
    return categoryQuotes.map((q) => {
      const v = vendors.find((vend) => vend.id === q.vendorId);
      const isPerHead = q.pricing?.model === 'per_head';
      return {
        id: q.id,
        vendorId: q.vendorId,
        category: v?.category || 'catering',
        pricing: isPerHead
          ? { type: 'per_head', unit: minor(q.pricing?.baseAmount || 140000) }
          : { type: 'fixed', amount: minor(q.pricing?.baseAmount || 25000000) },
        taxMode: q.taxMode as any,
        gstPct: q.gstPct,
        serviceChargePct: q.serviceChargePct,
        inclusions: q.inclusions || {},
        depositPct: q.depositPct,
        validUntil: q.validUntil ? asIsoDate(q.validUntil) : undefined,
      };
    });
  }, [categoryQuotes, vendors]);

  const normCtx = {
    headcount,
    defaultGstPct: 18,
    today,
  };

  // Compare quotes using MCDA engine
  const comparison = useMemo(() => {
    if (domainQuotes.length === 0) return null;
    return compareQuotes(domainQuotes, normCtx, {
      weights: {
        price: priceWeight / 100,
        inclusions: inclusionsWeight / 100,
        reliability: reliabilityWeight / 100,
      },
    });
  }, [domainQuotes, normCtx, priceWeight, inclusionsWeight, reliabilityWeight]);

  const handleAcceptQuote = async (quote: Quotation, likelyAmount: number) => {
    const confirmed = window.confirm(
      `Accept quotation "${quote.title}" for ₹${(likelyAmount / 100).toLocaleString('en-IN')}? This will book the vendor and generate the payment schedule.`
    );
    if (!confirmed) return;

    await dispatch({
      type: 'ACCEPT_QUOTATION',
      eventId: event.id,
      payload: {
        quoteId: quote.id,
        commitmentAmount: likelyAmount,
        headcountAtAcceptance: headcount,
      },
      meta: { summary: `Accepted quote ${quote.title}` },
    });

    addToast(`Accepted quote "${quote.title}". Commitment and payment milestones recorded.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Controls & Sensitivity */}
      <Card className="p-4 bg-stone-50/50 dark:bg-stone-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Category:</span>
            {['catering', 'venue', 'photography', 'decoration'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-500">Sensitivity Headcount:</span>
            {[250, 300, 350].map((count) => (
              <button
                key={count}
                onClick={() => setHeadcount(count)}
                className={`px-2.5 py-1 text-xs rounded border font-mono ${
                  headcount === count
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                }`}
              >
                {count} pax
              </button>
            ))}
            <input
              type="number"
              aria-label="Custom guest headcount"
              value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value) || 1)}
              className="w-20 px-2 py-1 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-center"
            />
          </div>
        </div>

        {/* MCDA Weights Bar */}
        <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-700 flex flex-wrap items-center gap-6 text-xs text-stone-600 dark:text-stone-400">
          <span className="font-semibold flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" /> MCDA Weights:
          </span>
          <label className="flex items-center gap-2">
            Price: {priceWeight}%
            <input
              type="range"
              min="10"
              max="80"
              value={priceWeight}
              onChange={(e) => setPriceWeight(Number(e.target.value))}
              className="w-20"
            />
          </label>
          <label className="flex items-center gap-2">
            Inclusions: {inclusionsWeight}%
            <input
              type="range"
              min="10"
              max="80"
              value={inclusionsWeight}
              onChange={(e) => setInclusionsWeight(Number(e.target.value))}
              className="w-20"
            />
          </label>
          <label className="flex items-center gap-2">
            Reliability: {reliabilityWeight}%
            <input
              type="range"
              min="10"
              max="80"
              value={reliabilityWeight}
              onChange={(e) => setReliabilityWeight(Number(e.target.value))}
              className="w-20"
            />
          </label>
        </div>
      </Card>

      {/* Quote Comparison Grid */}
      {categoryQuotes.length === 0 ? (
        <Card className="p-8 text-center">
          <Scale className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h4 className="font-semibold text-stone-800 dark:text-stone-200">No quotes recorded for {selectedCategory}</h4>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Record at least 2 quotes to evaluate side-by-side normalised true costs including taxes.
          </p>
          <Button variant="primary" size="sm" onClick={onAddQuote} className="mt-4">
            <Plus className="w-4 h-4 mr-1" /> Add Quotation
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryQuotes.map((q) => {
            const vendor = vendors.find((v) => v.id === q.vendorId);
            const domainQ = domainQuotes.find((dq) => dq.id === q.id);
            const norm = domainQ ? normalizeQuote(domainQ, normCtx) : null;
            const ranked = comparison?.ranked.find((r) => r.quoteId === q.id);
            const isAccepted = q.status === 'accepted';
            const isCommitted = commitments.some((c) => c.quotationId === q.id && c.status === 'active');

            return (
              <Card
                key={q.id}
                className={`p-5 flex flex-col justify-between transition-all ${
                  isAccepted || isCommitted
                    ? 'border-2 border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20'
                    : ranked?.score && ranked.score > 80
                    ? 'border-indigo-300 dark:border-indigo-700 shadow-md'
                    : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                        {vendor?.name || 'Unknown Vendor'}
                      </span>
                      <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">{q.title}</h4>
                    </div>
                    {ranked?.score !== null && ranked?.score !== undefined && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono">
                        <Award className="w-3.5 h-3.5" />
                        {Math.round(ranked.score)}/100
                      </div>
                    )}
                  </div>

                  {/* Normalized Payable Big Figure */}
                  <div className="my-3 p-3 rounded-lg bg-stone-100/70 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                    <span className="text-[11px] text-stone-500 block">Normalised Total Payable (with tax)</span>
                    <div className="text-xl font-extrabold text-stone-900 dark:text-stone-100 font-mono mt-0.5">
                      {norm ? formatMoney(norm.payableLikely) : '₹0'}
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono">
                      @ {headcount} guests • {q.taxMode === 'exclusive' ? `+ ${q.gstPct ?? 18}% GST` : 'All-inclusive'}
                    </span>
                  </div>

                  {/* Itemized Normalization Breakdown */}
                  <div className="text-xs space-y-1 py-2 border-y border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400">
                    <div className="flex justify-between">
                      <span>Base calculation:</span>
                      <span className="font-mono">{norm ? formatMoney(norm.base) : '₹0'}</span>
                    </div>
                    {norm && norm.serviceCharge > 0 && (
                      <div className="flex justify-between">
                        <span>Service Charge:</span>
                        <span className="font-mono">{formatMoney(norm.serviceCharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax Treatment:</span>
                      <span className="capitalize font-mono">{q.taxMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deposit Required:</span>
                      <span className="font-mono">{q.depositPct ?? 25}%</span>
                    </div>
                  </div>

                  {/* Inclusions summary */}
                  <div className="my-3">
                    <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                      Inclusions Checklist:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(q.inclusions || {}).length > 0 ? (
                        Object.keys(q.inclusions || {}).map((inc) => (
                          <span
                            key={inc}
                            className="text-[10px] px-2 py-0.5 rounded bg-stone-200/60 dark:bg-stone-700 text-stone-800 dark:text-stone-200 capitalize"
                          >
                            ✓ {inc.replace(/_/g, ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">No specific inclusions recorded</span>
                      )}
                    </div>
                  </div>

                  {/* Flags */}
                  {norm && norm.flags.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {norm.flags.map((f) => (
                        <div
                          key={f}
                          className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="capitalize">{f.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <StatusPill variant={isAccepted || isCommitted ? 'success' : 'neutral'}>
                    {isAccepted || isCommitted ? 'Accepted' : q.status}
                  </StatusPill>

                  {!isAccepted && !isCommitted && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => norm && handleAcceptQuote(q, norm.payableLikely)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accept Quote
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
