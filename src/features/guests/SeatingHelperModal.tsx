import React, { useState } from 'react';
import type { Guest } from 'shared/schemas';
import { X, Users, Plus, Check } from 'lucide-react';

interface TableAssignment {
  id: string;
  name: string; // e.g. "Table 1 (Elders & Family)"
  capacity: number;
  assignedGuestIds: string[];
}

interface SeatingHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
}

export const SeatingHelperModal: React.FC<SeatingHelperModalProps> = ({
  isOpen,
  onClose,
  guests,
}) => {
  const [tables, setTables] = useState<TableAssignment[]>([
    { id: 't1', name: 'Table 1: Immediate Family', capacity: 8, assignedGuestIds: [] },
    { id: 't2', name: 'Table 2: Bride Friends', capacity: 8, assignedGuestIds: [] },
    { id: 't3', name: 'Table 3: Groom Friends', capacity: 8, assignedGuestIds: [] },
  ]);
  const [selectedTableId, setSelectedTableId] = useState<string>('t1');
  const [newTableName, setNewTableName] = useState('');

  if (!isOpen) return null;

  const activeTable = tables.find(t => t.id === selectedTableId) || tables[0]!;

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const newT: TableAssignment = {
      id: 'tbl-' + Date.now(),
      name: newTableName.trim(),
      capacity: 8,
      assignedGuestIds: [],
    };
    setTables(prev => [...prev, newT]);
    setSelectedTableId(newT.id);
    setNewTableName('');
  };

  const handleToggleGuest = (guestId: string) => {
    setTables(prev =>
      prev.map(t => {
        if (t.id === selectedTableId) {
          const isAssigned = t.assignedGuestIds.includes(guestId);
          return {
            ...t,
            assignedGuestIds: isAssigned
              ? t.assignedGuestIds.filter(id => id !== guestId)
              : [...t.assignedGuestIds, guestId],
          };
        }
        return t;
      })
    );
  };

  // Find all assigned guests across tables
  const assignedSet = new Set(tables.flatMap(t => t.assignedGuestIds));
  const assignedGuestsInActiveTable = guests.filter(g => activeTable.assignedGuestIds.includes(g.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-gw-line bg-white dark:bg-stone-900 shadow-2xl text-gw-ink-900 dark:text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gw-line p-4 bg-gw-sunken/40">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-gw-indigo-700" />
            <div>
              <h2 className="text-base font-bold">Smart Seating Helper (GUE-09)</h2>
              <p className="text-xs text-gw-ink-600 dark:text-stone-400">
                Organize table arrangements and group dietary needs together.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gw-ink-600 hover:bg-gw-sunken">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tables Carousel / Selector */}
        <div className="border-b border-gw-line p-3 bg-gw-paper/60 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex gap-2">
            {tables.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTableId(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                  selectedTableId === t.id
                    ? 'bg-gw-indigo-700 text-white border-gw-indigo-700 shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-gw-ink-700 dark:text-stone-300 border-gw-line hover:bg-gw-sunken'
                }`}
              >
                {t.name} ({t.assignedGuestIds.length}/{t.capacity})
              </button>
            ))}
          </div>

          <form onSubmit={handleAddTable} className="flex gap-1 shrink-0">
            <input
              type="text"
              value={newTableName}
              onChange={e => setNewTableName(e.target.value)}
              placeholder="+ New Table name"
              className="px-2 py-1 text-xs rounded border border-gw-line bg-white dark:bg-stone-800"
            />
            <button type="submit" className="p-1 rounded bg-gw-indigo-700 text-white text-xs">
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Content Body: Left Table Details, Right Guest Checkbox List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gw-line flex-1 overflow-hidden">
          {/* Active Table Details */}
          <div className="p-4 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{activeTable.name}</h3>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-gw-sunken border border-gw-line">
                Seats: {activeTable.assignedGuestIds.length} / {activeTable.capacity}
              </span>
            </div>

            {assignedGuestsInActiveTable.length === 0 ? (
              <p className="text-xs text-stone-400 italic pt-4">No guests seated at this table yet. Select guests from the right panel.</p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {assignedGuestsInActiveTable.map(g => (
                  <div
                    key={g.id}
                    className="p-2 rounded-lg bg-gw-sunken/60 border border-gw-line flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold block">{g.name}</span>
                      <span className="text-[10px] text-gw-ink-600">{g.partySize} pax • {Array.isArray(g.dietary) ? g.dietary.join(', ') : (g.dietary || 'Standard')}</span>
                    </div>
                    <button
                      onClick={() => handleToggleGuest(g.id)}
                      className="text-stone-400 hover:text-rose-600 text-[10px] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guest Selector */}
          <div className="p-4 overflow-y-auto space-y-2">
            <span className="text-xs font-semibold uppercase text-stone-400 tracking-wider block">
              Available Guests ({guests.length})
            </span>
            <div className="space-y-1">
              {guests.map(g => {
                const isAtCurrentTable = activeTable.assignedGuestIds.includes(g.id);
                const isAssignedElse = !isAtCurrentTable && assignedSet.has(g.id);

                return (
                  <button
                    key={g.id}
                    onClick={() => handleToggleGuest(g.id)}
                    className={`w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                      isAtCurrentTable
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                        : isAssignedElse
                        ? 'bg-stone-100 dark:bg-stone-800/40 border-gw-line opacity-60 text-stone-400'
                        : 'bg-white dark:bg-stone-900 border-gw-line hover:bg-gw-sunken'
                    }`}
                  >
                    <div>
                      <span className="block">{g.name}</span>
                      <span className="text-[10px] opacity-75">{g.partySize} pax</span>
                    </div>
                    {isAtCurrentTable ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : isAssignedElse ? (
                      <span className="text-[10px] italic">Other table</span>
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gw-line bg-gw-sunken/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gw-indigo-700 text-white font-semibold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
