import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { Guest, SubEvent } from 'shared/schemas';
import { X, Copy, Check, MessageSquare } from 'lucide-react';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guest: Guest) => void;
  eventId: string;
  subEvents: SubEvent[];
  initialGuest?: Guest | null;
}

export const GuestModal: React.FC<GuestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventId,
  subEvents,
  initialGuest,
}) => {
  const [name, setName] = useState(initialGuest?.name || '');
  const [phone, setPhone] = useState(initialGuest?.phone || '');
  const [partySize, setPartySize] = useState<number>(initialGuest?.partySize || 2);
  const [childrenCount, setChildrenCount] = useState<number>(
    (initialGuest?.childrenUnder5 || 0) + (initialGuest?.children5to12 || 0)
  );
  const [side, setSide] = useState<'a' | 'b' | 'shared'>(initialGuest?.side || 'shared');
  const [group, setGroup] = useState(initialGuest?.group || 'family');
  const [dietary, setDietary] = useState<string>(
    Array.isArray(initialGuest?.dietary) ? initialGuest.dietary[0] || 'veg' : initialGuest?.dietary || 'veg'
  );
  const [accessibility, setAccessibility] = useState(initialGuest?.accessibilityNote || '');
  const [notes, setNotes] = useState(initialGuest?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Set initial invitations map
    const invitations: Guest['invitations'] = initialGuest?.invitations || {};
    subEvents.forEach((se) => {
      if (!invitations[se.id]) {
        invitations[se.id] = { invited: true, status: 'pending' };
      }
    });

    const guest: Guest = {
      id: initialGuest?.id || `gst_${Date.now()}`,
      eventId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      partySize: Number(partySize) || 1,
      childrenUnder5: Number(childrenCount) || 0,
      children5to12: 0,
      side,
      group: group.trim() || undefined,
      dietary: dietary as any,
      accessibility: [],
      accessibilityNote: accessibility.trim() || undefined,
      notes: notes.trim() || undefined,
      inviteSent: initialGuest?.inviteSent || 'not_sent',
      invitations,
    };

    onSave(guest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {initialGuest ? 'Edit Guest' : 'Add Guest Unit'}
            </h3>
            <p className="text-xs text-stone-500">Record a primary contact, party size, and dietary tags</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Primary Contact Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anand & Sunita Sharma"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Phone Number (for WhatsApp)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Total Party Size
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Children Count
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={childrenCount}
                onChange={(e) => setChildrenCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Side Affiliation
              </label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="a">Bride Side (Side A)</option>
                <option value="b">Groom Side (Side B)</option>
                <option value="shared">Shared / Mutual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Dietary Preference
              </label>
              <select
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="veg">Vegetarian</option>
                <option value="jain">Jain (No root veggies)</option>
                <option value="non_veg">Non-Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="halal">Halal</option>
                <option value="custom">Other / Allergies</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Relationship Group
              </label>
              <input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="e.g. College Friends, Relatives"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Accessibility & Elder Care Note
            </label>
            <input
              type="text"
              value={accessibility}
              onChange={(e) => setAccessibility(e.target.value)}
              placeholder="e.g. Wheelchair assistance required, Ground floor seating only"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Note: Handled with strict privacy. Displayed only for logistics planning.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Internal Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Needs pick up from railway station"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {initialGuest ? 'Update Guest' : 'Save Guest'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InviteStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
  eventName: string;
  eventDate: string;
  subEvents: SubEvent[];
}

export const InviteStudioModal: React.FC<InviteStudioModalProps> = ({
  isOpen,
  onClose,
  guest,
  eventName,
  eventDate,
  subEvents,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !guest) return null;

  const functionList = subEvents.map((s) => `• ${s.name} (${s.date || eventDate})`).join('\n');
  const template = `Namaste ${guest.name}! 🙏

We are overjoyed to invite you and your family (${guest.partySize} pax) to celebrate with us at:
*${eventName}*

Key Functions:
${functionList}

Kindly confirm your presence so we can arrange your hospitality warmly.
Looking forward to celebrating together!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = guest.phone ? guest.phone.replace(/[^0-9]/g, '') : '';
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(template)}`
    : `https://wa.me/?text=${encodeURIComponent(template)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-stone-900 dark:text-stone-100">WhatsApp Invitation Text</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-xs text-stone-500 mb-2">
            Personalized message for <span className="font-semibold text-stone-800 dark:text-stone-200">{guest.name}</span>.
            Nothing is sent automatically by the app.
          </p>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-mono text-stone-800 dark:text-stone-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {template}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-5 pt-3 border-t border-stone-200 dark:border-stone-800">
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </Button>

          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Open in WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};
