import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import type { Guest } from 'shared/schemas';
import { GuestModal } from './GuestModals';
import { InviteStudioModal } from './InviteStudioModal';
import { GuestCsvModal } from './GuestCsvModal';
import { HeadcountPlannerView } from './HeadcountPlannerView';
import { SeatingHelperModal } from './SeatingHelperModal';
import { GuestTable } from './GuestTable';
import { Search, FileSpreadsheet, UserPlus, Utensils, Mail, Armchair } from 'lucide-react';

export const GuestsView: React.FC = () => {
  const { workspace, dispatch } = useWorkspaceStore();
  const { addToast } = useUiStore();

  const [activeTab, setActiveTab] = useState<'directory' | 'planner'>('directory');
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;

  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isInviteStudioOpen, setIsInviteStudioOpen] = useState(false);
  const [isSeatingModalOpen, setIsSeatingModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [inviteGuest, setInviteGuest] = useState<Guest | null>(null);

  if (!workspace) return null;

  const { event, subEvents, guests } = workspace;
  const activeSubEvent = subEvents[0];

  // Filtering
  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.phone && g.phone.includes(search));
    const matchesSide = sideFilter === 'all' || g.side === sideFilter;
    const matchesDietary = dietaryFilter === 'all' || g.dietary === dietaryFilter;
    return matchesSearch && matchesSide && matchesDietary;
  });

  const totalPages = Math.ceil(filteredGuests.length / pageSize) || 1;
  const paginatedGuests = filteredGuests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSaveGuest = async (guest: Guest) => {
    if (editingGuest) {
      await dispatch({
        type: 'UPDATE_GUEST',
        eventId: event.id,
        payload: guest as any,
        meta: { summary: `Updated guest ${guest.name}` },
      });
      addToast(`Updated guest "${guest.name}"`, 'success');
    } else {
      await dispatch({
        type: 'ADD_GUEST',
        eventId: event.id,
        payload: guest as any,
        meta: { summary: `Added guest ${guest.name}` },
      });
      addToast(`Added guest "${guest.name}" (${guest.partySize} pax)`, 'success');
    }
    setEditingGuest(null);
  };

  const handleDeleteGuest = async (guest: Guest) => {
    const confirmed = window.confirm(`Remove ${guest.name} from guest list?`);
    if (!confirmed) return;

    await dispatch({
      type: 'DELETE_GUEST',
      eventId: event.id,
      payload: { id: guest.id },
      meta: { summary: `Deleted guest ${guest.name}` },
    });
    addToast(`Removed guest "${guest.name}"`, 'info');
  };

  const handleUpdateRsvp = async (guest: Guest, subEventId: string, status: any) => {
    await dispatch({
      type: 'SET_RSVP',
      eventId: event.id,
      payload: {
        guestId: guest.id,
        subEventId,
        status,
        confirmedParty: status === 'attending' ? guest.partySize : 0,
      },
      meta: { summary: `Updated RSVP for ${guest.name}` },
    });
    addToast(`RSVP updated: ${guest.name} is ${status}`, 'info');
  };

  const handleImportCsv = async (imported: Guest[]) => {
    for (const g of imported) {
      await dispatch({
        type: 'ADD_GUEST',
        eventId: event.id,
        payload: g as any,
        meta: { summary: `Imported guest ${g.name}` },
      });
    }
    addToast(`Successfully imported ${imported.length} guests!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            Guest List & RSVPs
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Organized invitation units, dietary preferences, and catering attendance estimates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-stone-200 dark:border-stone-800 p-0.5 bg-stone-100 dark:bg-stone-900">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Guest Units ({guests.length})
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'planner'
                  ? 'bg-white dark:bg-stone-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" /> Headcount Planner
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsInviteStudioOpen(true)}
          >
            <Mail className="w-4 h-4 mr-1 text-primary" /> Invite Studio
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSeatingModalOpen(true)}
          >
            <Armchair className="w-4 h-4 mr-1 text-amber-600" /> Seating Helper
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCsvModalOpen(true)}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Import / Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingGuest(null);
              setIsAddGuestOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-1" /> Add Guest
          </Button>
        </div>
      </div>

      {activeTab === 'planner' ? (
        <HeadcountPlannerView />
      ) : (
        <>
          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by guest name or phone..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-500">Side:</span>
                <select
                  aria-label="Filter guests by side"
                  value={sideFilter}
                  onChange={(e) => {
                    setSideFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 capitalize"
                >
                  <option value="all">All Sides</option>
                  <option value="bride">Bride Side</option>
                  <option value="groom">Groom Side</option>
                  <option value="mutual">Mutual</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-500">Dietary:</span>
                <select
                  aria-label="Filter guests by dietary preference"
                  value={dietaryFilter}
                  onChange={(e) => {
                    setDietaryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 capitalize"
                >
                  <option value="all">All Diets</option>
                  <option value="veg">Vegetarian</option>
                  <option value="jain">Jain</option>
                  <option value="non_veg">Non-Veg</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
            </div>
          </div>

          <GuestTable
            guests={paginatedGuests}
            activeSubEvent={activeSubEvent}
            onUpdateRsvp={handleUpdateRsvp}
            onEdit={(g) => {
              setEditingGuest(g);
              setIsAddGuestOpen(true);
            }}
            onDelete={handleDeleteGuest}
            onInvite={setInviteGuest}
            onAddNew={() => {
              setEditingGuest(null);
              setIsAddGuestOpen(true);
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            totalFiltered={filteredGuests.length}
          />
        </>
      )}

      {/* Modals */}
      <GuestModal
        isOpen={isAddGuestOpen}
        onClose={() => {
          setIsAddGuestOpen(false);
          setEditingGuest(null);
        }}
        onSave={handleSaveGuest}
        eventId={event.id}
        subEvents={subEvents}
        initialGuest={editingGuest}
      />

      <InviteStudioModal
        isOpen={isInviteStudioOpen || !!inviteGuest}
        onClose={() => {
          setIsInviteStudioOpen(false);
          setInviteGuest(null);
        }}
      />

      <GuestCsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={handleImportCsv}
        existingGuests={guests}
        eventId={event.id}
      />

      <SeatingHelperModal
        isOpen={isSeatingModalOpen}
        onClose={() => setIsSeatingModalOpen(false)}
        guests={guests}
      />
    </div>
  );
};
