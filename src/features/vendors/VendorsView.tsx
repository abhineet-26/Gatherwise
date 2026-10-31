import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import type { Vendor, Quotation } from 'shared/schemas/vendor';
import { VendorModal } from './VendorModals';
import { AddQuoteModal } from './AddQuoteModal';
import { QuoteComparisonView } from './QuoteComparisonView';
import { 
  Building2, 
  Phone, 
  MessageSquare, 
  Plus, 
  CheckSquare, 
  FileText, 
  Scale, 
  Edit, 
  Trash2
} from 'lucide-react';

export const VendorsView: React.FC = () => {
  const { workspace, dispatch } = useWorkspaceStore();
  const { addToast } = useUiStore();

  const [activeTab, setActiveTab] = useState<'directory' | 'quotes'>('directory');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  if (!workspace) return null;

  const { event, vendors, quotes } = workspace;

  const filteredVendors = vendors.filter((v) => {
    const matchesStatus = selectedStatus === 'all' || v.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
    return matchesStatus && matchesCategory;
  });

  const handleSaveVendor = async (vendor: Vendor) => {
    if (editingVendor) {
      await dispatch({
        type: 'UPDATE_VENDOR',
        eventId: event.id,
        payload: vendor as any,
        meta: { summary: `Updated vendor ${vendor.name}` },
      });
      addToast(`Updated vendor "${vendor.name}"`, 'success');
    } else {
      await dispatch({
        type: 'ADD_VENDOR',
        eventId: event.id,
        payload: vendor as any,
        meta: { summary: `Added vendor ${vendor.name}` },
      });
      addToast(`Added vendor "${vendor.name}" to pipeline`, 'success');
    }
    setEditingVendor(null);
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    const confirmed = window.confirm(`Delete vendor "${vendor.name}"? Quotes associated will remain.`);
    if (!confirmed) return;

    await dispatch({
      type: 'DELETE_VENDOR',
      eventId: event.id,
      payload: { id: vendor.id },
      meta: { summary: `Deleted vendor ${vendor.name}` },
    });
    addToast(`Deleted vendor "${vendor.name}"`, 'info');
  };

  const handleSaveQuote = async (quote: Quotation) => {
    await dispatch({
      type: 'ADD_QUOTATION',
      eventId: event.id,
      payload: quote as any,
      meta: { summary: `Added quote ${quote.title}` },
    });
    addToast(`Recorded quotation "${quote.title}"`, 'success');
    setIsAddQuoteOpen(false);
  };

  const categoryQuestions: Record<string, string[]> = {
    catering: [
      'Per-plate rate inclusive or exclusive of 18% GST?',
      'Live counter setups included in base rate?',
      'Chafing dishes, cutlery, and uniform staff included?',
      'Overtime policy for kitchen staff after midnight',
    ],
    venue: [
      'AC power backup generator fuel included or metered extra?',
      'Curfew time for outdoor music / loudspeaker sound (10 PM rule)?',
      'In-house decorator royalty or corkage charges?',
      'Rooms included for bride/groom family changing?',
    ],
    photography: [
      'Number of traditional vs candid shooters per function',
      'Drone coverage permits included?',
      'Turnaround time for 3-minute teaser reel and full cinematic film',
      'RAW footage hard drive delivery terms',
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            Vendors & Quotations
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Compare quotes side-by-side with tax normalisation and track vendor commitments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-stone-200 dark:border-stone-800 p-0.5 bg-stone-100 dark:bg-stone-900">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Directory ({vendors.length})
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'quotes'
                  ? 'bg-white dark:bg-stone-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Scale className="w-3.5 h-3.5" /> Quote Comparison ({quotes.length})
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddQuoteOpen(true)}
          >
            <FileText className="w-4 h-4 mr-1" /> Add Quote
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingVendor(null);
              setIsAddVendorOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Vendor
          </Button>
        </div>
      </div>

      {activeTab === 'quotes' ? (
        <QuoteComparisonView onAddQuote={() => setIsAddQuoteOpen(true)} />
      ) : (
        <>
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-stone-500">Pipeline:</span>
              {['all', 'to_research', 'shortlisted', 'contacted', 'quote_received', 'booked'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-500">Category:</span>
              <select
                aria-label="Filter vendors by category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 capitalize"
              >
                <option value="all">All Categories</option>
                <option value="catering">Catering</option>
                <option value="venue">Venue</option>
                <option value="photography">Photography</option>
                <option value="decoration">Decoration</option>
                <option value="music_sound">Sound & DJ</option>
                <option value="attire_beauty">Attire & Beauty</option>
              </select>
            </div>
          </div>

          {/* Vendors Grid */}
          {filteredVendors.length === 0 ? (
            <Card className="p-8 text-center">
              <Building2 className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h4 className="font-semibold text-stone-800 dark:text-stone-200">No vendors found</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                No vendors match your current filter. Add a supplier or choose another pipeline stage.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddVendorOpen(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Vendor
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVendors.map((vendor) => {
                const vendorQuotes = quotes.filter((q) => q.vendorId === vendor.id);
                const questions = categoryQuestions[vendor.category] || [];

                return (
                  <Card key={vendor.id} className="p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                            {vendor.category} • {vendor.city || 'Local'}
                          </span>
                          <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                            {vendor.name}
                          </h4>
                        </div>
                        <StatusPill
                          variant={
                            vendor.status === 'booked'
                              ? 'success'
                              : vendor.status === 'quote_received'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {(vendor.status || 'to_research').replace(/_/g, ' ')}
                        </StatusPill>
                      </div>

                      {/* Contact Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                        {vendor.contactPhone || vendor.contact?.phone ? (
                          <>
                            <a
                              href={`tel:${(vendor.contactPhone || vendor.contact?.phone || '').replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" /> Call
                            </a>
                            <a
                              href={`https://wa.me/${(vendor.contactPhone || vendor.contact?.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hello ${vendor.name}, reaching out regarding ${event.name} on ${event.date}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp
                            </a>
                          </>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">No phone recorded</span>
                        )}
                        <span className="text-xs text-stone-400 ml-auto font-mono">
                          {vendorQuotes.length} quote(s)
                        </span>
                      </div>

                      {/* Category Enquiry Checklist */}
                      {questions.length > 0 && (
                        <div className="mt-3 p-2.5 rounded bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block mb-1">
                            Key Contract Checklist
                          </span>
                          <ul className="text-[11px] text-stone-600 dark:text-stone-400 space-y-0.5">
                            {questions.slice(0, 2).map((q, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <CheckSquare className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => {
                          setEditingVendor(vendor);
                          setIsAddVendorOpen(true);
                        }}
                        className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteVendor(vendor)}
                        className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <VendorModal
        isOpen={isAddVendorOpen}
        onClose={() => {
          setIsAddVendorOpen(false);
          setEditingVendor(null);
        }}
        onSave={handleSaveVendor}
        eventId={event.id}
        initialVendor={editingVendor}
      />

      <AddQuoteModal
        isOpen={isAddQuoteOpen}
        onClose={() => setIsAddQuoteOpen(false)}
        onSave={handleSaveQuote}
        eventId={event.id}
        vendors={vendors}
      />
    </div>
  );
};
