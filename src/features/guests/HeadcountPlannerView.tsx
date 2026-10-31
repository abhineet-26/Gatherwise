import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { 
  estimateAttendance, 
  DEFAULT_ATTENDANCE, 
  type AttendanceAssumptions, 
  type RsvpCounts 
} from 'shared/domain/guests/headcount';
import { Utensils, Sliders, Printer } from 'lucide-react';

export const HeadcountPlannerView: React.FC = () => {
  const { workspace } = useWorkspaceStore();
  const [assumptions, setAssumptions] = useState<AttendanceAssumptions>(DEFAULT_ATTENDANCE);
  const [selectedSubEventId, setSelectedSubEventId] = useState<string>('');
  const [showCateringBrief, setShowCateringBrief] = useState(false);

  if (!workspace) return null;

  const { subEvents, guests } = workspace;
  const currentSubEvent = subEvents.find((s) => s.id === selectedSubEventId) || subEvents[0];
  const activeSubEventId = currentSubEvent?.id || '';

  // Calculate RSVP counts for the active sub-event
  let yes = 0;
  let maybe = 0;
  let pending = 0;
  let declined = 0;

  const dietaryCounts: Record<string, number> = {
    veg: 0,
    jain: 0,
    non_veg: 0,
    vegan: 0,
    halal: 0,
  };

  const allergenNotes: string[] = [];

  guests.forEach((g) => {
    const inv = g.invitations?.[activeSubEventId];
    const status = inv?.status || 'pending';
    const pax = inv?.confirmedParty !== undefined ? inv.confirmedParty : g.partySize || 1;

    if (status === 'attending') {
      yes += pax;
      const diet = Array.isArray(g.dietary) ? (g.dietary[0] || 'veg') : (g.dietary || 'veg');
      dietaryCounts[diet] = (dietaryCounts[diet] || 0) + pax;
      const note = g.accessibilityNote || (Array.isArray(g.accessibility) && g.accessibility.length > 0 ? g.accessibility.join(', ') : '');
      if (note) {
        allergenNotes.push(`${g.name}: ${note}`);
      }
    } else if (status === 'tentative') {
      maybe += pax;
    } else if (status === 'declined') {
      declined += pax;
    } else {
      pending += pax;
    }
  });

  const rsvpCounts: RsvpCounts = { yes, maybe, pending, declined };
  const estimate = estimateAttendance(rsvpCounts, assumptions);

  const handlePrintBrief = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Function Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-stone-50/50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Function:</span>
          {subEvents.map((se) => (
            <button
              key={se.id}
              onClick={() => setSelectedSubEventId(se.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSubEventId === se.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
              }`}
            >
              {se.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showCateringBrief ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowCateringBrief(!showCateringBrief)}
          >
            <Utensils className="w-4 h-4 mr-1" />
            {showCateringBrief ? 'Hide Catering Brief' : 'Generate Catering Brief'}
          </Button>
        </div>
      </div>

      {/* Assumptions Customizer */}
      <Card className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-indigo-600" /> Attendance Planning Assumptions (Indian Celebrations Model)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600 dark:text-stone-400">
          <div>
            <div className="flex justify-between mb-1">
              <span>Pending Guest Show-up Rate:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100 font-mono">
                {Math.round(assumptions.pPending * 100)}%
              </span>
            </div>
            <input
              type="range"
              aria-label="Pending guest show-up rate"
              min="20"
              max="100"
              value={Math.round(assumptions.pPending * 100)}
              onChange={(e) =>
                setAssumptions({ ...assumptions, pPending: Number(e.target.value) / 100 })
              }
              className="w-full"
            />
            <span className="text-[10px] text-stone-400">Default 80% (relatives unreplied usually attend)</span>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Tentative / "Maybe" Show-up:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100 font-mono">
                {Math.round(assumptions.pMaybe * 100)}%
              </span>
            </div>
            <input
              type="range"
              aria-label="Tentative guest show-up rate"
              min="10"
              max="90"
              value={Math.round(assumptions.pMaybe * 100)}
              onChange={(e) =>
                setAssumptions({ ...assumptions, pMaybe: Number(e.target.value) / 100 })
              }
              className="w-full"
            />
            <span className="text-[10px] text-stone-400">Default 50% attendance probability</span>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Caterer Food Buffer:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100 font-mono">
                {Math.round(assumptions.bufferPct * 100)}%
              </span>
            </div>
            <input
              type="range"
              aria-label="Caterer food buffer percentage"
              min="0"
              max="20"
              value={Math.round(assumptions.bufferPct * 100)}
              onChange={(e) =>
                setAssumptions({ ...assumptions, bufferPct: Number(e.target.value) / 100 })
              }
              className="w-full"
            />
            <span className="text-[10px] text-stone-400">Extra plates ordered above expected count</span>
          </div>
        </div>
      </Card>

      {/* RSVP & Attendance Estimates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <span className="text-[10px] uppercase font-mono text-stone-500">Confirmed Yes</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{yes}</div>
          <span className="text-[11px] text-stone-400 font-mono">Guaranteed attendees</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <span className="text-[10px] uppercase font-mono text-stone-500">Unreplied Pending</span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{pending}</div>
          <span className="text-[11px] text-stone-400 font-mono">
            {Math.round(pending * assumptions.pPending)} expected to show
          </span>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <span className="text-[10px] uppercase font-mono text-stone-500">Likely Turnout</span>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">{estimate.likely}</div>
          <span className="text-[11px] text-stone-400 font-mono">
            Range: {estimate.low} - {estimate.high}
          </span>
        </Card>

        <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border-2 border-indigo-500">
          <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">
            Catering Headcount
          </span>
          <div className="text-3xl font-extrabold font-mono text-indigo-700 dark:text-indigo-300 mt-1">
            {estimate.cateringHeadcount}
          </div>
          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
            Plate count to order (with {Math.round(assumptions.bufferPct * 100)}% buffer)
          </span>
        </Card>
      </div>

      {/* Catering Brief Section */}
      {showCateringBrief && (
        <Card className="p-6 bg-stone-50/40 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-700">
            <div>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                  Catering Brief: {currentSubEvent?.name || 'Main Event'}
                </h3>
              </div>
              <p className="text-xs text-stone-500">
                Official plate order requirements for banquet manager & master chef
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handlePrintBrief}>
              <Printer className="w-4 h-4 mr-1" /> Print Brief
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider mb-2">
                Dietary Breakdown (Confirmed Plates)
              </h4>
              <div className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
                    <tr>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Plates</th>
                      <th className="p-2.5 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {Object.entries(dietaryCounts).map(([cat, count]) => (
                      <tr key={cat}>
                        <td className="p-2.5 capitalize font-medium text-stone-900 dark:text-stone-100">
                          {cat.replace(/_/g, ' ')}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">{count}</td>
                        <td className="p-2.5 text-right font-mono text-stone-500">
                          {yes > 0 ? Math.round((count / yes) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-stone-50 dark:bg-stone-800/60 font-bold">
                      <td className="p-2.5 text-indigo-600 dark:text-indigo-400">Total Plate Order (with buffer)</td>
                      <td className="p-2.5 text-right font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                        {estimate.cateringHeadcount}
                      </td>
                      <td className="p-2.5 text-right font-mono text-indigo-600 dark:text-indigo-400">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider mb-2">
                Special Dietary & Elder Accommodation Flags
              </h4>
              {allergenNotes.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                  {allergenNotes.map((note, i) => (
                    <li
                      key={i}
                      className="p-2 rounded bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40"
                    >
                      ⚠️ {note}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 rounded border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30 text-xs text-stone-500 italic">
                  No special accessibility or allergy alerts recorded for confirmed guests.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
