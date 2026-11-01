import React, { useState } from 'react';
import type { RunOfShowItem } from 'shared/domain/runofshow/types';
import { timeToMinutes } from 'shared/domain/runofshow/delayCascade';
import {
  X,
  Clock,
  CheckCircle2,
  Phone,
  MessageCircle,
  Play,
} from 'lucide-react';

interface DayOfModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  subEventName: string;
  items: RunOfShowItem[];
  onApplyDelay: (itemId: string, minutes: number) => void;
  onUpdateStatus: (itemId: string, status: RunOfShowItem['status']) => void;
}

export const DayOfModeModal: React.FC<DayOfModeModalProps> = ({
  isOpen,
  onClose,
  subEventName,
  items,
  onApplyDelay,
  onUpdateStatus,
}) => {
  const [selectedDelayItem, setSelectedDelayItem] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sort items chronologically
  const sorted = [...items].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Determine current "Now" item and "Next" items
  const activeIndex = sorted.findIndex(i => i.status === 'in_progress');
  const nowItem = activeIndex !== -1 ? sorted[activeIndex] : sorted.find(i => i.status === 'upcoming');
  const upcomingItems = sorted.filter(i => i.id !== nowItem?.id && i.status !== 'completed');
  const completedCount = sorted.filter(i => i.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 text-stone-100 antialiased overflow-hidden">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-900 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Day-of Mode</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                LIVE
              </span>
            </h2>
            <p className="text-[11px] text-stone-400 truncate max-w-[220px]">{subEventName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-400">
            {completedCount}/{sorted.length} done
          </span>
          <button
            onClick={onClose}
            aria-label="Exit Day-of Mode"
            className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* NOW CARD (Hero touch target) */}
        {nowItem ? (
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-stone-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Play className="w-3 h-3 fill-current" /> Happening Now
              </span>
              <div className="text-right">
                <span className="text-xl font-mono font-black text-white">{nowItem.startTime}</span>
                <span className="text-xs text-stone-400 block">to {nowItem.endTime}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-white leading-tight">{nowItem.title}</h3>
              {nowItem.location && (
                <p className="text-xs text-stone-300 mt-1 font-medium">📍 {nowItem.location}</p>
              )}
              {nowItem.notes && (
                <p className="text-xs text-stone-400 mt-2 bg-stone-950/60 p-2.5 rounded-lg border border-stone-800">
                  {nowItem.notes}
                </p>
              )}
            </div>

            {/* Owner & Quick Contact Action */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Lead Contact</span>
                <span className="text-sm font-bold text-stone-200">{nowItem.owner || 'Unassigned'}</span>
              </div>
              {nowItem.ownerPhone && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${nowItem.ownerPhone.replace(/\s+/g, '')}`}
                    className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30"
                    title="Call Lead"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${nowItem.ownerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30"
                    title="WhatsApp Lead"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onUpdateStatus(nowItem.id, 'completed')}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Complete
              </button>

              <button
                onClick={() => setSelectedDelayItem(selectedDelayItem === nowItem.id ? null : nowItem.id)}
                className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold text-sm border border-amber-500/30 flex items-center justify-center gap-1.5"
              >
                <Clock className="w-4 h-4 text-amber-400" /> Delay / Cascade
              </button>
            </div>

            {/* Quick Delay Options */}
            {selectedDelayItem === nowItem.id && (
              <div className="p-3 rounded-xl bg-stone-950 border border-amber-500/30 space-y-2">
                <span className="text-xs text-amber-300 font-medium block">Add delay with automatic cascade:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      onApplyDelay(nowItem.id, 15);
                      setSelectedDelayItem(null);
                    }}
                    className="py-2 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 hover:bg-amber-500/30"
                  >
                    +15 min
                  </button>
                  <button
                    onClick={() => {
                      onApplyDelay(nowItem.id, 30);
                      setSelectedDelayItem(null);
                    }}
                    className="py-2 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 hover:bg-amber-500/30"
                  >
                    +30 min
                  </button>
                  <button
                    onClick={() => {
                      onApplyDelay(nowItem.id, 45);
                      setSelectedDelayItem(null);
                    }}
                    className="py-2 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 hover:bg-amber-500/30"
                  >
                    +45 min
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">All scheduled items completed!</h3>
            <p className="text-xs text-stone-400">Great job running this celebration on schedule.</p>
          </div>
        )}

        {/* UP NEXT LIST */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1">
            Up Next in Schedule ({upcomingItems.length})
          </h4>

          {upcomingItems.map(item => (
            <div
              key={item.id}
              className="rounded-xl border border-stone-800 bg-stone-900/70 p-3.5 flex items-center justify-between gap-3 hover:border-stone-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-center font-mono shrink-0">
                  <span className="text-sm font-bold text-white block">{item.startTime}</span>
                  <span className="text-[10px] text-stone-400">{item.durationMinutes}m</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-stone-200 truncate">{item.title}</span>
                    {item.isFixedTime && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                        Fixed
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400 block truncate">
                    {item.owner} {item.location ? `• ${item.location}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onUpdateStatus(item.id, 'in_progress')}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 border border-stone-700"
                >
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
