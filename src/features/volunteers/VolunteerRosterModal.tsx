import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import {
  Users,
  Clock,
  Phone,
  MessageCircle,
  Plus,
  CheckCircle2,
  X,
  ShieldAlert,
} from 'lucide-react';

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  role: string;
  shiftStart: string;
  shiftEnd: string;
  area: string;
  status: 'confirmed' | 'tentative' | 'checked_in';
}

interface VolunteerRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
}

const DEFAULT_VOLUNTEERS: Volunteer[] = [
  {
    id: 'v1',
    name: 'Rahul Sharma',
    phone: '+919876543210',
    role: 'Registration & Welcome Desk',
    shiftStart: '08:00',
    shiftEnd: '13:00',
    area: 'Main Entrance Arch',
    status: 'checked_in',
  },
  {
    id: 'v2',
    name: 'Priya Patel',
    phone: '+919876543211',
    role: 'Catering & Water Stalls',
    shiftStart: '11:30',
    shiftEnd: '16:00',
    area: 'Dining Lawn',
    status: 'confirmed',
  },
  {
    id: 'v3',
    name: 'Amit Verma',
    phone: '+919876543212',
    role: 'Stage & Audio Tech Support',
    shiftStart: '09:00',
    shiftEnd: '15:00',
    area: 'Main Stage',
    status: 'confirmed',
  },
  {
    id: 'v4',
    name: 'Sneha Rao',
    phone: '+919876543213',
    role: 'Security & Parking Marshall',
    shiftStart: '14:00',
    shiftEnd: '20:00',
    area: 'East Gate Parking',
    status: 'tentative',
  },
];

export const VolunteerRosterModal: React.FC<VolunteerRosterModalProps> = ({
  isOpen,
  onClose,
  eventName,
}) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>(DEFAULT_VOLUNTEERS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Crowd Management');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('14:00');
  const [area, setArea] = useState('Venue Grounds');

  if (!isOpen) return null;

  const handleAddVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newVol: Volunteer = {
      id: `v-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || '+919000000000',
      role,
      shiftStart,
      shiftEnd,
      area,
      status: 'confirmed',
    };

    setVolunteers([...volunteers, newVol]);
    setName('');
    setPhone('');
    setShowAddForm(false);
  };

  const toggleCheckIn = (id: string) => {
    setVolunteers(
      volunteers.map(v =>
        v.id === id
          ? {
              ...v,
              status: v.status === 'checked_in' ? 'confirmed' : 'checked_in',
            }
          : v
      )
    );
  };

  // Shift coverage analysis
  const morningCount = volunteers.filter(
    v => v.shiftStart < '12:00' && v.shiftEnd >= '11:00'
  ).length;
  const afternoonCount = volunteers.filter(
    v => v.shiftStart <= '14:00' && v.shiftEnd >= '16:00'
  ).length;
  const eveningCount = volunteers.filter(v => v.shiftEnd >= '18:00').length;

  const coverageGaps = [
    morningCount < 2 && {
      shift: 'Morning Rush (08:00 - 12:00)',
      current: morningCount,
      target: 3,
      reason: 'Crowd arrival and welcome kit distribution peak',
    },
    afternoonCount < 2 && {
      shift: 'Lunch & Session Block (12:00 - 16:00)',
      current: afternoonCount,
      target: 2,
      reason: 'Food stall coordination and seating rotation',
    },
    eveningCount < 2 && {
      shift: 'Evening Wrap & Departure (16:00 - 20:00)',
      current: eveningCount,
      target: 2,
      reason: 'Stage breakdown and parking exit clearance',
    },
  ].filter(Boolean) as Array<{
    shift: string;
    current: number;
    target: number;
    reason: string;
  }>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Volunteer Roster & Shift Gaps
                <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20">
                  EXE-03
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Community shift management and volunteer coverage tracking for{' '}
                {eventName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Coverage Gap Alert Banner */}
          {coverageGaps.length > 0 ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Shift Coverage Warning ({coverageGaps.length} gap{coverageGaps.length > 1 ? 's' : ''} detected)
              </div>
              <ul className="text-xs space-y-1 pl-5 list-disc">
                {coverageGaps.map(g => (
                  <li key={g.shift}>
                    <span className="font-medium">{g.shift}</span>: currently{' '}
                    {g.current}/{g.target} volunteers. ({g.reason})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-emerald-900 dark:text-emerald-200 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              All shifts have adequate volunteer coverage for this event.
            </div>
          )}

          {/* Volunteer List Header & Add Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Active Volunteers ({volunteers.length})
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {showAddForm ? 'Cancel' : 'Add Volunteer'}
            </Button>
          </div>

          {/* Add Volunteer Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddVolunteer}
              className="p-3.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Volunteer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Vikas Nair"
                    className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Role / Responsibility
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Stage Management"
                    className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Station / Area
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. Main Auditorium"
                    className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Shift Start
                  </label>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={e => setShiftStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Shift End
                  </label>
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={e => setShiftEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Volunteer
                </Button>
              </div>
            </form>
          )}

          {/* Volunteer Roster Cards */}
          <div className="space-y-2">
            {volunteers.map(vol => (
              <div
                key={vol.id}
                className="p-3 border border-stone-200 dark:border-stone-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-900 dark:text-stone-100 text-sm">
                      {vol.name}
                    </span>
                    <button
                      onClick={() => toggleCheckIn(vol.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                        vol.status === 'checked_in'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                          : 'bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
                      }`}
                    >
                      {vol.status === 'checked_in' ? '✓ Checked In' : 'Confirmed'}
                    </button>
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-stone-700 dark:text-stone-300 font-medium">
                      {vol.role}
                    </span>
                    <span>• {vol.area}</span>
                    <span className="flex items-center gap-1 font-mono text-stone-600 dark:text-stone-400">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {vol.shiftStart} - {vol.shiftEnd}
                    </span>
                  </div>
                </div>

                {/* Quick Contact & Action Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <a
                    href={`tel:${vol.phone}`}
                    className="p-2 border border-stone-200 dark:border-stone-700 rounded-md text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title={`Call ${vol.name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/${vol.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-emerald-200 dark:border-emerald-800/60 rounded-md text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    title={`WhatsApp ${vol.name}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
