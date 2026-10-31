import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { Guest, SubEvent } from 'shared/schemas';
import { Users, UserPlus, MessageSquare, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface GuestTableProps {
  guests: Guest[];
  activeSubEvent?: SubEvent;
  onUpdateRsvp: (guest: Guest, subEventId: string, status: any) => void;
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
  onInvite: (guest: Guest) => void;
  onAddNew: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalFiltered: number;
}

export const GuestTable: React.FC<GuestTableProps> = ({
  guests,
  activeSubEvent,
  onUpdateRsvp,
  onEdit,
  onDelete,
  onInvite,
  onAddNew,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalFiltered,
}) => {
  if (totalFiltered === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="w-10 h-10 text-stone-400 mx-auto mb-3" />
        <h4 className="font-semibold text-stone-800 dark:text-stone-200">No guests found</h4>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          No entries match your search criteria. Add guests individually or import a CSV.
        </p>
        <Button variant="primary" size="sm" onClick={onAddNew} className="mt-4">
          <UserPlus className="w-4 h-4 mr-1" /> Add Guest
        </Button>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-stone-200 dark:border-stone-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-700">
            <tr>
              <th className="p-3">Guest Name & Group</th>
              <th className="p-3">Side</th>
              <th className="p-3">Party Size</th>
              <th className="p-3">Dietary</th>
              {activeSubEvent && <th className="p-3">RSVP: {activeSubEvent.name}</th>}
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {guests.map((guest) => {
              const inv = activeSubEvent ? guest.invitations?.[activeSubEvent.id] : null;
              const rsvpStatus = inv?.status || 'pending';

              return (
                <tr key={guest.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40">
                  <td className="p-3">
                    <div className="font-semibold text-stone-900 dark:text-stone-100">
                      {guest.name}
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono">
                      {guest.phone || 'No phone'} • {guest.group || 'Family'}
                    </div>
                    {(guest.accessibilityNote || (Array.isArray(guest.accessibility) && guest.accessibility.length > 0)) && (
                      <span className="inline-block mt-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                        ♿ {guest.accessibilityNote || (Array.isArray(guest.accessibility) ? guest.accessibility.join(', ') : '')}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="capitalize px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-[11px]">
                      {guest.side === 'a' ? 'Bride' : guest.side === 'b' ? 'Groom' : 'Shared'}
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className="font-bold text-stone-900 dark:text-stone-100">{guest.partySize}</span>
                    {((guest.childrenUnder5 || 0) + (guest.children5to12 || 0)) > 0 ? (
                      <span className="text-[10px] text-stone-500 block">
                        ({(guest.childrenUnder5 || 0) + (guest.children5to12 || 0)} kids)
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                      {Array.isArray(guest.dietary) ? (guest.dietary.length > 0 ? guest.dietary.join(', ') : 'veg') : (guest.dietary || 'veg')}
                    </span>
                  </td>
                  {activeSubEvent && (
                    <td className="p-3">
                      <select
                        aria-label={`Update RSVP for ${guest.name}`}
                        value={rsvpStatus}
                        onChange={(e) =>
                          onUpdateRsvp(guest, activeSubEvent.id, e.target.value)
                        }
                        className={`px-2 py-1 rounded text-xs font-semibold border ${
                          rsvpStatus === 'attending'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : rsvpStatus === 'declined'
                            ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300'
                            : 'bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="attending">Attending</option>
                        <option value="tentative">Tentative</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                  )}
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onInvite(guest)}
                        title="Invite via WhatsApp"
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(guest)}
                        title="Edit Guest"
                        className="p-1 rounded text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(guest)}
                        title="Delete Guest"
                        className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered} guests
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-stone-200 dark:border-stone-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-stone-200 dark:border-stone-700 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
