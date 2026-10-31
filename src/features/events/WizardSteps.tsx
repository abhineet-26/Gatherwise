import React from 'react';
import { Button } from '../../components/ui/Button';
import { type IsoDate, asIsoDate, daysBetween, addDays } from 'shared/domain/time/dates';
import { 
  Heart, 
  Cake, 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle 
} from 'lucide-react';

export interface StepTypeProps {
  eventType: 'wedding' | 'birthday' | 'community';
  onSelect: (type: 'wedding' | 'birthday' | 'community') => void;
  onNext: () => void;
}

export const StepTypeSelection: React.FC<StepTypeProps> = ({ eventType, onSelect, onNext }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
      What celebration are you planning?
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[
        { id: 'wedding', label: 'Wedding & Engagement', desc: 'Multi-day ceremonies, mandap & rituals', icon: Heart },
        { id: 'birthday', label: 'Birthday & Milestone', desc: 'Party, themed decor, magic & games', icon: Cake },
        { id: 'community', label: 'College / Community Fest', desc: 'Stages, permits, crowd & sponsors', icon: Building2 },
      ].map((t) => {
        const Icon = t.icon;
        const isSelected = eventType === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id as any)}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
              isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
            }`}
          >
            <Icon className={`w-6 h-6 mb-3 ${isSelected ? 'text-primary' : 'text-stone-400'}`} />
            <div>
              <div className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-1">{t.label}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">{t.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
    <div className="pt-4 flex justify-end">
      <Button onClick={onNext} className="flex items-center gap-1.5 text-xs">
        Next: Basic Info <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
);

export interface StepBasicInfoProps {
  name: string;
  setName: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  cityTier: 'tier1' | 'tier2' | 'tier3';
  setCityTier: (v: 'tier1' | 'tier2' | 'tier3') => void;
  setting: 'indoor' | 'outdoor' | 'mixed' | 'home';
  setSetting: (v: 'indoor' | 'outdoor' | 'mixed' | 'home') => void;
  onBack: () => void;
  onNext: () => void;
}

export const StepBasicInfo: React.FC<StepBasicInfoProps> = ({
  name, setName, city, setCity, cityTier, setCityTier, setting, setSetting, onBack, onNext
}) => (
  <div className="space-y-4">
    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
      Give your event a name and location
    </h3>
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">Event Title *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aditi & Siddharth Wedding"
          className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">City Tier</label>
          <select
            value={cityTier}
            onChange={(e) => setCityTier(e.target.value as any)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
          >
            <option value="tier1">Tier 1 (Metro: Pune, Mumbai, Bengaluru...)</option>
            <option value="tier2">Tier 2 (Indore, Nagpur, Lucknow...)</option>
            <option value="tier3">Tier 3 / Regional town</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">Venue Setting</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'indoor', label: 'Indoor AC Banquet' },
            { id: 'outdoor', label: 'Outdoor Lawn' },
            { id: 'mixed', label: 'Mixed / Lawn + Hall' },
            { id: 'home', label: 'Home / Terrace' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSetting(s.id as any)}
              className={`py-2 px-3 text-xs rounded-lg border text-center transition-all ${
                setting === s.id ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-stone-200 dark:border-stone-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
    <div className="pt-4 flex justify-between">
      <Button variant="secondary" onClick={onBack} className="text-xs"><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
      <Button onClick={onNext} className="text-xs">Next: Event Date <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
    </div>
  </div>
);

export interface StepDateProps {
  date: IsoDate;
  setDate: (v: IsoDate) => void;
  today: IsoDate;
  isPastReconciliation: boolean;
  setIsPastReconciliation: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export const StepDateSetting: React.FC<StepDateProps> = ({
  date, setDate, today, isPastReconciliation, setIsPastReconciliation, onBack, onNext
}) => {
  const isPast = daysBetween(today, date) < 0;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">When is the celebration?</h3>
      <div>
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">Event Date *</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(asIsoDate(e.target.value))}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
        />
        <p className="text-[11px] text-stone-500 mt-1">
          Relative to today ({today}): {daysBetween(today, date)} days remaining.
        </p>
      </div>

      {isPast && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            This date is in the past ({daysBetween(today, date)} days ago).
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            GatherWise offers either date correction to the future or past-event reconciliation mode.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant={!isPastReconciliation ? 'primary' : 'secondary'}
              className="text-xs h-7"
              onClick={() => { setDate(addDays(today, 60)); setIsPastReconciliation(false); }}
            >
              Correct Date (+60 Days)
            </Button>
            <Button
              size="sm"
              variant={isPastReconciliation ? 'primary' : 'secondary'}
              className="text-xs h-7"
              onClick={() => setIsPastReconciliation(true)}
            >
              Reconcile Past Event
            </Button>
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-between">
        <Button variant="secondary" onClick={onBack} className="text-xs"><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
        <Button onClick={onNext} className="text-xs">Next: Budget & Guests <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
      </div>
    </div>
  );
};
