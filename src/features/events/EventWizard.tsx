import React, { useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Button } from '../../components/ui/Button';
import { MoneyInput } from '../../components/ui/MoneyInput';
import { StatusPill } from '../../components/ui/StatusPill';
import { getPackForEvent } from 'shared/planning/packs';
import { generatePlan, type GeneratedPlan } from 'shared/planning/engine';
import { formatMoney, inr, type Minor } from 'shared/domain/money/money';
import { type IsoDate, addDays } from 'shared/domain/time/dates';
import type { WorkspaceState } from 'shared/commands/types';
import type { SubEvent, Event } from 'shared/schemas';
import { StepTypeSelection, StepBasicInfo, StepDateSetting } from './WizardSteps';
import { Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface EventWizardProps {
  onCancel?: () => void;
  onSuccess?: (eventId: string) => void;
}

export const EventWizard: React.FC<EventWizardProps> = ({ onCancel, onSuccess }) => {
  const { getEffectiveToday, setCurrentEventId, setActiveTab, addToast } = useUiStore();
  const { setWorkspace } = useWorkspaceStore();
  const today = getEffectiveToday();

  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState<'wedding' | 'birthday' | 'community'>('wedding');
  const [name, setName] = useState('Aditi & Siddharth Wedding');
  const [city, setCity] = useState('Bengaluru');
  const [cityTier, setCityTier] = useState<'tier1' | 'tier2' | 'tier3'>('tier1');
  const [setting, setSetting] = useState<'indoor' | 'outdoor' | 'mixed' | 'home'>('mixed');
  const [date, setDate] = useState<IsoDate>(addDays(today, 90));
  const [isPastReconciliation, setIsPastReconciliation] = useState(false);
  const [budget, setBudget] = useState<Minor>(inr(1500000));
  const [guestCount, setGuestCount] = useState(250);
  const [subEvents, setSubEvents] = useState<string[]>(['Haldi', 'Wedding Ceremony', 'Reception']);
  const [planPreview, setPlanPreview] = useState<GeneratedPlan | null>(null);

  const handleTypeSelect = (type: 'wedding' | 'birthday' | 'community') => {
    setEventType(type);
    const pack = getPackForEvent(type);
    if (pack.presets[0]) setSubEvents(pack.presets[0].startingFunctions);
    if (type === 'birthday') {
      setName("Reyansh's 5th Birthday");
      setBudget(inr(50000));
      setGuestCount(40);
      setSetting('home');
    } else if (type === 'community') {
      setName('Spring Cultural Fest 2026');
      setBudget(inr(500000));
      setGuestCount(500);
      setSetting('outdoor');
    } else {
      setName('Aditi & Siddharth Wedding');
      setBudget(inr(1500000));
      setGuestCount(250);
      setSetting('mixed');
    }
  };

  const handleGeneratePreview = () => {
    const pack = getPackForEvent(eventType);
    const draftEvent: Event = {
      id: `evt_${Date.now()}`,
      name: name || `${eventType.toUpperCase()} Celebration`,
      type: eventType,
      city,
      cityTier,
      date,
      budgetTarget: budget,
      budget,
      contingencyPct: 10,
      guestCount,
      setting,
      priorities: ['food', 'venue', 'photography'],
      createdAt: today,
      updatedAt: today,
    };

    const plan = generatePlan(draftEvent, pack, today);
    setPlanPreview(plan);
    setStep(6);
  };

  const handleApplyPlan = async () => {
    if (!planPreview) return;
    const eventId = `evt_${Date.now()}`;
    const finalEvent: Event = {
      id: eventId,
      name: name || `${eventType.toUpperCase()} Celebration`,
      type: eventType,
      city,
      cityTier,
      date,
      budgetTarget: budget,
      budget,
      contingencyPct: 10,
      guestCount,
      setting,
      priorities: ['food', 'venue', 'photography'],
      createdAt: today,
      updatedAt: today,
    };

    const finalSubEvents: SubEvent[] = subEvents.map((fnName, i) => ({
      id: `se_${i + 1}`,
      eventId,
      name: fnName,
      date,
      expectedGuestCount: guestCount,
    }));

    const newWorkspace: WorkspaceState = {
      event: finalEvent,
      subEvents: finalSubEvents.length > 0 ? finalSubEvents : planPreview.subEvents,
      budgetLines: planPreview.budgetLines,
      commitments: [],
      payments: [],
      tasks: planPreview.tasks,
      vendors: [],
      quotes: [],
      guests: [],
      risks: planPreview.risks,
      activity: [
        {
          id: `act_${Date.now()}`,
          eventId,
          at: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          actor: 'user',
          summary: `Created ${eventType} "${finalEvent.name}" with initial plan`,
          commandType: 'CREATE_EVENT',
          commandTypes: ['CREATE_EVENT'],
          undone: false,
          reversible: false,
        },
      ],
    };

    await setWorkspace(newWorkspace);
    setCurrentEventId(eventId);
    setActiveTab('overview');
    addToast(`Workspace created for "${finalEvent.name}"!`, 'success');
    if (onSuccess) onSuccess(eventId);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Plan New Event
          </h2>
          <p className="text-xs text-stone-500">
            Guided setup with India-first templates, budget intelligence and instant schedule
          </p>
        </div>
        {onCancel && <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">Cancel</Button>}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 text-xs font-medium text-stone-500 border-b border-stone-200 dark:border-stone-800 pb-3">
        {['Type', 'Basic Info', 'Date', 'Budget', 'Functions', 'Plan Preview'].map((lbl, idx) => (
          <div key={idx} className={`flex items-center gap-1.5 ${step === idx + 1 ? 'text-primary font-bold' : step > idx + 1 ? 'text-emerald-600' : 'text-stone-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === idx + 1 ? 'bg-primary text-white' : step > idx + 1 ? 'bg-emerald-500/20 text-emerald-700' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'}`}>
              {step > idx + 1 ? <Check className="w-3 h-3" /> : idx + 1}
            </span>
            <span className="hidden sm:inline">{lbl}</span>
          </div>
        ))}
      </div>

      {step === 1 && <StepTypeSelection eventType={eventType} onSelect={handleTypeSelect} onNext={() => setStep(2)} />}
      {step === 2 && <StepBasicInfo name={name} setName={setName} city={city} setCity={setCity} cityTier={cityTier} setCityTier={setCityTier} setting={setting} setSetting={setSetting} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <StepDateSetting date={date} setDate={setDate} today={today} isPastReconciliation={isPastReconciliation} setIsPastReconciliation={setIsPastReconciliation} onBack={() => setStep(2)} onNext={() => setStep(4)} />}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Set your budget and guest count</h3>
          <div className="space-y-4">
            <MoneyInput label="Target Budget" value={budget} onChange={(val) => { if (val !== null) setBudget(val); }} />
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">Expected Headcount</label>
              <input type="number" min="1" max="50000" value={guestCount} onChange={(e) => setGuestCount(parseInt(e.target.value) || 10)} className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs" />
            </div>
          </div>
          <div className="pt-4 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(3)} className="text-xs"><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
            <Button onClick={() => setStep(5)} className="text-xs">Next: Functions <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Ceremonies & Functions</h3>
          <div className="space-y-2">
            {subEvents.map((fn, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-xs">
                <span className="font-medium">{fn}</span>
                {subEvents.length > 1 && (
                  <button onClick={() => setSubEvents(subEvents.filter((_, i) => i !== idx))} className="text-stone-400 hover:text-rose-500 text-xs">Remove</button>
                )}
              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(4)} className="text-xs"><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
            <Button onClick={handleGeneratePreview} className="text-xs bg-primary text-white">Generate Plan Preview <Sparkles className="w-3.5 h-3.5 ml-1" /></Button>
          </div>
        </div>
      )}

      {step === 6 && planPreview && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">Plan Generated for {name}</div>
              <div className="text-xs text-stone-600 dark:text-stone-400">{planPreview.tasks.length} tasks scheduled • {planPreview.budgetLines.length} budget lines</div>
            </div>
            <StatusPill variant="success">Ready to Apply</StatusPill>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {planPreview.budgetLines.map((line) => (
              <div key={line.id} className="flex justify-between items-center p-2 rounded border border-stone-200 dark:border-stone-800 text-xs bg-stone-50 dark:bg-stone-800/30">
                <span>{line.name}</span>
                <span className="font-mono font-semibold">{formatMoney(line.estimate as any)}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(5)} className="text-xs"><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Adjust Setup</Button>
            <Button onClick={handleApplyPlan} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"><Check className="w-4 h-4" /> Apply & Open Workspace</Button>
          </div>
        </div>
      )}
    </div>
  );
};
