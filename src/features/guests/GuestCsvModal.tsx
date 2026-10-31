import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { Guest } from 'shared/schemas';
import { exportGuestsToCsv } from 'shared/domain/export/csv';
import { X, Upload, Download, AlertTriangle, Check } from 'lucide-react';

interface GuestCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (guests: Guest[]) => void;
  existingGuests: Guest[];
  eventId: string;
}

export const GuestCsvModal: React.FC<GuestCsvModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingGuests,
  eventId,
}) => {
  const [parsedGuests, setParsedGuests] = useState<Guest[]>([]);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    try {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        setError('CSV must contain a header row and at least one guest entry.');
        return;
      }

      const headers = lines[0]!.toLowerCase().split(',').map((h) => h.replace(/["']/g, '').trim());
      const nameIdx = headers.findIndex((h) => h.includes('name'));
      const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));
      const sizeIdx = headers.findIndex((h) => h.includes('size') || h.includes('count') || h.includes('pax'));
      const dietaryIdx = headers.findIndex((h) => h.includes('diet'));
      const sideIdx = headers.findIndex((h) => h.includes('side'));
      const groupIdx = headers.findIndex((h) => h.includes('group') || h.includes('relation'));

      if (nameIdx === -1) {
        setError('Could not find a "Name" column in CSV header.');
        return;
      }

      const existingPhones = new Set(existingGuests.map((g) => g.phone?.replace(/[^0-9]/g, '')).filter(Boolean));
      const existingNames = new Set(existingGuests.map((g) => g.name.toLowerCase()));

      let dups = 0;
      const results: Guest[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i]!.split(',').map((val) => val.replace(/^["']|["']$/g, '').trim());
        const name = row[nameIdx] || '';
        if (!name) continue;

        const phone = phoneIdx !== -1 ? row[phoneIdx] : undefined;
        const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';

        if (existingNames.has(name.toLowerCase()) || (cleanPhone && existingPhones.has(cleanPhone))) {
          dups += 1;
        }

        const partySize = sizeIdx !== -1 ? parseInt(row[sizeIdx] || '1', 10) || 1 : 1;
        const rawDietary = (dietaryIdx !== -1 ? row[dietaryIdx] : 'veg') || 'veg';
        const dietary = ['veg', 'jain', 'non_veg', 'vegan', 'halal'].includes(rawDietary.toLowerCase())
          ? rawDietary.toLowerCase()
          : 'veg';
        const rawSide = (sideIdx !== -1 ? row[sideIdx] : 'shared') || 'shared';
        const side: Guest['side'] = rawSide.toLowerCase() === 'bride' || rawSide.toLowerCase() === 'a' ? 'a' : rawSide.toLowerCase() === 'groom' || rawSide.toLowerCase() === 'b' ? 'b' : 'shared';

        results.push({
          id: `gst_imp_${Date.now()}_${i}`,
          eventId,
          name,
          phone,
          partySize,
          dietary: dietary as any,
          side,
          group: groupIdx !== -1 ? row[groupIdx] : 'Imported',
          inviteSent: 'not_sent',
          invitations: {},
        });
      }

      setParsedGuests(results);
      setDuplicateCount(dups);
      setError('');
    } catch {
      setError('Failed to parse CSV file. Please verify format.');
    }
  };

  const handleApplyImport = () => {
    if (parsedGuests.length === 0) return;
    onImport(parsedGuests);
    onClose();
  };

  const handleExportExisting = () => {
    const csv = exportGuestsToCsv(existingGuests);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gatherwise-guests-${eventId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Import & Export Guest List (CSV)
            </h3>
            <p className="text-xs text-stone-500">
              Strict privacy protection • Formula-injection safe • Indic script UTF-8 BOM
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30">
            <div>
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                Upload CSV File
              </span>
              <p className="text-[11px] text-stone-500">
                Expected columns: Name, Phone, Party Size, Dietary, Side, Group
              </p>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors">
              <Upload className="w-4 h-4" /> Choose CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {parsedGuests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  Ready to import: {parsedGuests.length} guests
                </span>
                {duplicateCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {duplicateCount} potential duplicate(s) flagged
                  </span>
                )}
              </div>

              {/* Preview Table */}
              <div className="max-h-48 overflow-y-auto border border-stone-200 dark:border-stone-700 rounded-lg text-xs">
                <table className="w-full text-left">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Pax</th>
                      <th className="p-2">Dietary</th>
                      <th className="p-2">Side</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {parsedGuests.slice(0, 10).map((g, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                        <td className="p-2 font-medium text-stone-900 dark:text-stone-100">{g.name}</td>
                        <td className="p-2 font-mono text-stone-500">{g.phone || '—'}</td>
                        <td className="p-2 font-mono">{g.partySize}</td>
                        <td className="p-2 capitalize">{g.dietary}</td>
                        <td className="p-2 capitalize">{g.side}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportExisting}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Export Current List ({existingGuests.length})
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={parsedGuests.length === 0}
                onClick={handleApplyImport}
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Import {parsedGuests.length} Guests
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
