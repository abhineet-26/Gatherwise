import React, { useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import type { RunOfShowItem } from 'shared/domain/runofshow/types';
import {
  timeToMinutes,
  detectConflicts,
} from 'shared/domain/runofshow/delayCascade';
import { DayOfModeModal } from './DayOfModeModal';
import { AddRunOfShowModal } from './AddRunOfShowModal';
import { VolunteerRosterModal } from '../volunteers/VolunteerRosterModal';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Smartphone,
  Trash2,
  Calendar,
  MapPin,
  User,
  Users,
} from 'lucide-react';

export const RunOfShowView: React.FC = () => {
  const { workspace, dispatch } = useWorkspaceStore();
  const { addToast } = useUiStore();
  const subEvents = workspace?.subEvents || [];

  const [activeSubEventId, setActiveSubEventId] = useState<string>(
    subEvents[0]?.id || 'main'
  );
  const [dayOfOpen, setDayOfOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);
  const [delayModalItem, setDelayModalItem] = useState<string | null>(null);

  if (!workspace) return null;

  const currentItems: RunOfShowItem[] = (workspace.runOfShow || []).filter(
    item => item.subEventId === activeSubEventId
  );

  const sortedItems = [...currentItems].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  const conflicts = detectConflicts(currentItems);
  const activeSubEvent = subEvents.find(s => s.id === activeSubEventId);

  const handleAddItem = (item: RunOfShowItem) => {
    dispatch({
      type: 'ADD_RUN_OF_SHOW_ITEM',
      eventId: workspace.event.id,
      payload: item as unknown as Record<string, unknown>,
    });
    addToast(`Added "${item.title}" to schedule`, 'success');
  };

  const handleDeleteItem = (id: string, title: string) => {
    dispatch({
      type: 'DELETE_RUN_OF_SHOW_ITEM',
      eventId: workspace.event.id,
      payload: { id },
    });
    addToast(`Removed "${title}"`, 'info');
  };

  const handleApplyDelay = (itemId: string, minutes: number) => {
    dispatch({
      type: 'APPLY_RUN_OF_SHOW_DELAY',
      eventId: workspace.event.id,
      payload: { itemId, delayMinutes: minutes },
    });
    addToast(`Applied ${minutes} min delay cascade`, 'warning');
  };

  const handleUpdateStatus = (itemId: string, status: RunOfShowItem['status']) => {
    const item = currentItems.find(i => i.id === itemId);
    if (!item) return;

    dispatch({
      type: 'UPDATE_RUN_OF_SHOW_ITEM',
      eventId: workspace.event.id,
      payload: { ...item, status } as unknown as Record<string, unknown>,
    });
    addToast(`Marked "${item.title}" as ${status}`, 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-gw-ink-900 dark:text-stone-100 flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-gw-indigo-700" />
            <span>Run-of-Show & Day-of Schedule</span>
          </h1>
          <p className="text-xs text-gw-ink-600 dark:text-stone-400 mt-1">
            Minute-by-minute timeline coordination with automatic buffer absorption and delay cascades (EXE-01, EXE-02).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setVolunteerModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 hover:bg-stone-50 text-stone-700 dark:text-stone-200 font-semibold text-xs shadow-xs flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-emerald-600" /> Volunteers
          </button>

          <button
            onClick={() => setDayOfOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4" /> Launch Day-of Mode
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gw-indigo-700 hover:bg-gw-indigo-600 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Activity
          </button>
        </div>
      </div>

      {/* Function Selector Tabs */}
      {subEvents.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-gw-line">
          {subEvents.map(se => (
            <button
              key={se.id}
              onClick={() => setActiveSubEventId(se.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeSubEventId === se.id
                  ? 'bg-gw-indigo-700 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-gw-ink-700 dark:text-stone-300 border border-gw-line hover:bg-gw-sunken'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{se.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Function Context Banner */}
      {activeSubEvent && (
        <div className="rounded-xl border border-gw-line bg-white dark:bg-stone-900 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gw-indigo-50 text-gw-indigo-700 font-bold text-xs">
              {activeSubEvent.startTime || '18:00'} - {activeSubEvent.endTime || '23:00'}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gw-ink-900 dark:text-stone-100">{activeSubEvent.name}</h2>
              <p className="text-xs text-gw-ink-600 dark:text-stone-400">
                {activeSubEvent.venue || 'Main Venue'} • {activeSubEvent.expectedGuestCount || 100} guests expected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-gw-sunken text-gw-ink-700 font-medium border border-gw-line">
              {sortedItems.length} activities scheduled
            </span>
          </div>
        </div>
      )}

      {/* Conflict & Fixed-Time Breach Alerts */}
      {conflicts.map((conf, idx) => (
        <div
          key={idx}
          className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Schedule Conflict Detected</strong>
            <span>{conf.message}</span>
          </div>
        </div>
      ))}

      {/* Timeline Schedule List */}
      <div className="space-y-3">
        {sortedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gw-line bg-white dark:bg-stone-900 p-12 text-center space-y-3">
            <Clock className="w-10 h-10 text-gw-ink-600/40 mx-auto" />
            <h3 className="text-base font-bold text-gw-ink-900 dark:text-stone-100">No activities scheduled yet</h3>
            <p className="text-xs text-gw-ink-600 dark:text-stone-400 max-w-sm mx-auto">
              Plan the minute-by-minute execution for {activeSubEvent?.name || 'this ceremony'}. Add items with buffers to prevent delays.
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gw-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add First Activity
            </button>
          </div>
        ) : (
          sortedItems.map(item => {
            const isDelayed = item.status === 'delayed';
            const isCompleted = item.status === 'completed';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-stone-50/50 dark:bg-stone-950/40 border-gw-line opacity-75'
                    : isDelayed
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-white dark:bg-stone-900 border-gw-line'
                }`}
              >
                {/* Left Time Block */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-20 text-center font-mono shrink-0">
                    <span className="text-base font-bold text-gw-ink-900 dark:text-stone-100 block">
                      {item.startTime}
                    </span>
                    <span className="text-[11px] text-gw-ink-600 dark:text-stone-400">
                      to {item.endTime}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-sm font-bold ${isCompleted ? 'line-through text-stone-500' : 'text-gw-ink-900 dark:text-stone-100'}`}>
                        {item.title}
                      </h3>
                      {item.isFixedTime && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          Fixed Muhurat
                        </span>
                      )}
                      {item.bufferAfterMinutes > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono">
                          +{item.bufferAfterMinutes}m buffer
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gw-ink-600 dark:text-stone-400">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5" /> {item.owner}
                      </span>
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {item.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Tools */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleUpdateStatus(item.id, isCompleted ? 'upcoming' : 'completed')}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-gw-sunken hover:bg-emerald-500/10 text-gw-ink-700 border border-gw-line'
                    }`}
                    title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDelayModalItem(delayModalItem === item.id ? null : item.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-gw-sunken hover:bg-amber-500/10 text-xs font-medium text-gw-ink-700 border border-gw-line flex items-center gap-1"
                    title="Cascade Delay"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Delay</span>
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id, item.title)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Delay Cascade Trigger Dropdown */}
                {delayModalItem === item.id && (
                  <div className="w-full sm:w-auto p-2.5 rounded-xl bg-gw-sunken border border-amber-500/30 flex items-center gap-2 mt-2 sm:mt-0">
                    <span className="text-xs text-amber-800 font-semibold">Cascade Delay:</span>
                    <button
                      onClick={() => {
                        handleApplyDelay(item.id, 15);
                        setDelayModalItem(null);
                      }}
                      className="px-2 py-1 rounded bg-white text-xs font-bold border border-gw-line hover:border-amber-500"
                    >
                      +15m
                    </button>
                    <button
                      onClick={() => {
                        handleApplyDelay(item.id, 30);
                        setDelayModalItem(null);
                      }}
                      className="px-2 py-1 rounded bg-white text-xs font-bold border border-gw-line hover:border-amber-500"
                    >
                      +30m
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Run-of-Show Modal */}
      <AddRunOfShowModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        subEventId={activeSubEventId}
        onAdd={handleAddItem}
      />

      {/* Day-of Mobile Mode Modal */}
      <DayOfModeModal
        isOpen={dayOfOpen}
        onClose={() => setDayOfOpen(false)}
        subEventName={activeSubEvent?.name || 'Ceremony'}
        items={currentItems}
        onApplyDelay={handleApplyDelay}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Volunteer Shift Roster Modal (EXE-03) */}
      <VolunteerRosterModal
        isOpen={volunteerModalOpen}
        onClose={() => setVolunteerModalOpen(false)}
        eventName={activeSubEvent?.name || workspace.event.name}
      />
    </div>
  );
};
