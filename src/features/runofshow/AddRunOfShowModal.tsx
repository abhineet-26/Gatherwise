import React, { useState } from 'react';
import type { RunOfShowItem } from 'shared/domain/runofshow/types';
import { computeEndTime } from 'shared/domain/runofshow/delayCascade';
import { X, Clock, Plus } from 'lucide-react';

interface AddRunOfShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  subEventId: string;
  onAdd: (item: RunOfShowItem) => void;
}

export const AddRunOfShowModal: React.FC<AddRunOfShowModalProps> = ({
  isOpen,
  onClose,
  subEventId,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState(15);
  const [isFixedTime, setIsFixedTime] = useState(false);
  const [owner, setOwner] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [location, setLocation] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const endTime = computeEndTime(startTime, durationMinutes);
    const item: RunOfShowItem = {
      id: 'ros-' + Date.now(),
      subEventId,
      title: title.trim(),
      startTime,
      durationMinutes,
      endTime,
      bufferAfterMinutes,
      isFixedTime,
      owner: owner.trim() || 'Coordinator',
      ownerPhone: ownerPhone.trim() || undefined,
      location: location.trim() || undefined,
      status: 'upcoming',
    };

    onAdd(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-gw-line bg-white dark:bg-stone-900 p-6 shadow-2xl space-y-4 text-gw-ink-900 dark:text-stone-100">
        <div className="flex items-center justify-between pb-2 border-b border-gw-line">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gw-indigo-700" />
            <h3 className="text-base font-bold">Add Run-of-Show Activity</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gw-ink-600 hover:bg-gw-sunken">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold block mb-1">Activity Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Baraat Assembly / Couple Entry"
              className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none focus:ring-1 focus:ring-gw-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Start Time (HH:mm) *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Duration (min) *</label>
              <input
                type="number"
                min="5"
                max="360"
                value={durationMinutes}
                onChange={e => setDurationMinutes(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Buffer After (min)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={bufferAfterMinutes}
                onChange={e => setBufferAfterMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Location / Stage</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Central Mandap"
                className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Lead / Owner</label>
              <input
                type="text"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                placeholder="e.g. Panditji / DJ Rahul"
                className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Owner Contact Phone</label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={e => setOwnerPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full px-3 py-2 rounded-lg border border-gw-line bg-gw-sunken/40 focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 cursor-pointer">
            <input
              type="checkbox"
              checked={isFixedTime}
              onChange={e => setIsFixedTime(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Fixed Time (Muhurat / Strict):</strong> Delay cascades cannot push this slot
            </span>
          </label>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gw-line text-gw-ink-700 hover:bg-gw-sunken"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gw-indigo-700 hover:bg-gw-indigo-600 text-white font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
