import React, { useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Button } from '../ui/Button';
import { Clock, RotateCcw, Undo2, Calendar } from 'lucide-react';
import { createSeededScenarios } from '../../demo/seedData';

export const DemoBanner: React.FC = () => {
  const { 
    timeTravelOffsetDays, 
    setTimeTravelOffsetDays, 
    resetTimeTravel, 
    getEffectiveToday, 
    currentEventId,
    setCurrentEventId,
    addToast 
  } = useUiStore();
  const { undo, canUndo, setWorkspace } = useWorkspaceStore();
  const [showTimeTravelPicker, setShowTimeTravelPicker] = useState(false);

  const effectiveToday = getEffectiveToday();

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo data to initial seed? Any local changes will be restored.')) return;
    const seeds = createSeededScenarios(new Date().toISOString().slice(0, 10));
    const activeId = currentEventId || 'demo-wedding-pune';
    const activeSeed = seeds[activeId] || seeds['demo-wedding-pune'];
    if (activeSeed) {
      await setWorkspace(activeSeed);
      setCurrentEventId(activeSeed.event.id);
      resetTimeTravel();
      addToast('Demo data restored to initial state', 'success');
    }
  };

  const handleUndo = async () => {
    const success = await undo();
    if (success) {
      addToast('Change undone', 'info');
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-amber-900 dark:text-amber-200">
      <div className="flex items-center gap-2">
        <span className="font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
          Demo Mode
        </span>
        <span className="hidden sm:inline">Data stored only in this browser (IndexedDB).</span>
        {timeTravelOffsetDays !== 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
            <Clock className="w-3.5 h-3.5" />
            Time Travel: {timeTravelOffsetDays > 0 ? `+${timeTravelOffsetDays}` : timeTravelOffsetDays} days ({effectiveToday})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1 sm:mt-0">
        {canUndo() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            className="h-7 text-xs px-2 flex items-center gap-1 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200"
            title="Undo last action"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowTimeTravelPicker(!showTimeTravelPicker)}
          className="h-7 text-xs px-2.5 flex items-center gap-1 bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200"
        >
          <Calendar className="w-3.5 h-3.5" />
          Time Travel
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetDemo}
          className="h-7 text-xs px-2 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
          title="Reset to default seed data"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo
        </Button>
      </div>

      {showTimeTravelPicker && (
        <div className="w-full mt-2 p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              Time Travel Scrubber (Demo Only)
            </div>
            <button 
              onClick={() => setShowTimeTravelPicker(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm"
            >
              ✕
            </button>
          </div>
          <p className="text-stone-600 dark:text-stone-400 text-xs">
            Move "today" to observe how deadlines, Readiness Bloom, pace, overdue warnings, and risk registers react dynamically to the passage of time.
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button
              variant={timeTravelOffsetDays === 0 ? 'primary' : 'secondary'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTimeTravelOffsetDays(0)}
            >
              Today (Real)
            </Button>
            <Button
              variant={timeTravelOffsetDays === 15 ? 'primary' : 'secondary'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTimeTravelOffsetDays(15)}
            >
              +15 Days
            </Button>
            <Button
              variant={timeTravelOffsetDays === 30 ? 'primary' : 'secondary'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTimeTravelOffsetDays(30)}
            >
              +30 Days (T-70)
            </Button>
            <Button
              variant={timeTravelOffsetDays === 70 ? 'primary' : 'secondary'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTimeTravelOffsetDays(70)}
            >
              +70 Days (T-30 Rush)
            </Button>
            <Button
              variant={timeTravelOffsetDays === 95 ? 'primary' : 'secondary'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTimeTravelOffsetDays(95)}
            >
              +95 Days (Event Week)
            </Button>
            <Button
              variant={timeTravelOffsetDays === 105 ? 'primary' : 'secondary'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTimeTravelOffsetDays(105)}
            >
              +105 Days (Reconciliation)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
