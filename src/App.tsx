import { useState, useEffect } from 'react';
import { useWorkspaceStore } from './store/workspaceStore';
import { useUiStore, type WorkspaceTab } from './store/uiStore';
import { AppShell, type NavItem } from './components/shell/AppShell';
import { DashboardView } from './features/dashboard/DashboardView';
import { BudgetView } from './features/budget/BudgetView';
import { TimelineView } from './features/timeline/TimelineView';
import { ActivityView } from './features/activity/ActivityView';
import { SettingsView } from './features/settings/SettingsView';
import { EventWizard } from './features/events/EventWizard';
import { LandingPage } from './features/landing/LandingPage';
import { createSeededScenarios } from './demo/seedData';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Store, Users } from 'lucide-react';

export default function App() {
  const { workspace, loadWorkspace, setWorkspace, repository } = useWorkspaceStore();
  const { 
    setCurrentEventId, 
    activeTab, 
    setActiveTab, 
    getEffectiveToday, 
    toasts, 
    removeToast 
  } = useUiStore();

  const [showWizard, setShowWizard] = useState(false);
  const [showLanding, setShowLanding] = useState(false);

  const today = getEffectiveToday();

  // On initial load, restore existing or seed default demo
  useEffect(() => {
    async function init() {
      const events = await repository.listEvents();

      if (events.length > 0 && !workspace) {
        const firstId = (events[0]?.['id'] as string) || 'demo-wedding-pune';
        await loadWorkspace(firstId);
        setCurrentEventId(firstId);
      } else if (events.length === 0) {
        // Automatically seed the 3 demo events from Appendix A
        const seeds = createSeededScenarios(today);
        for (const s of Object.values(seeds)) {
          await repository.saveWorkspace(s.event.id, s as any);
        }
        const defaultSeed = seeds['demo-wedding-pune']!;
        await setWorkspace(defaultSeed);
        setCurrentEventId(defaultSeed.event.id);
      }
    }
    init();
  }, []);

  const handleNav = (nav: NavItem) => {
    if (nav === 'dashboard') setActiveTab('overview');
    else if (nav === 'budget') setActiveTab('budget');
    else if (nav === 'tasks') setActiveTab('timeline');
    else if (nav === 'events') setActiveTab('overview'); // or show event switcher
    else if (nav === 'settings') setActiveTab('settings');
    else if (nav === 'reconciliation') setActiveTab('budget');
  };

  const navItemMap: Record<WorkspaceTab, NavItem> = {
    overview: 'dashboard',
    timeline: 'tasks',
    budget: 'budget',
    vendors: 'vendors',
    guests: 'guests',
    ideas: 'copilot',
    activity: 'dashboard',
    settings: 'settings',
  };

  if (showLanding) {
    return (
      <LandingPage
        onStartWizard={() => {
          setShowLanding(false);
          setShowWizard(true);
        }}
      />
    );
  }

  if (showWizard) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-10">
        <EventWizard
          onCancel={() => setShowWizard(false)}
          onSuccess={() => setShowWizard(false)}
        />
      </div>
    );
  }

  if (!workspace) {
    return (
      <LandingPage
        onStartWizard={() => setShowWizard(true)}
      />
    );
  }

  return (
    <AppShell
      currentTab={navItemMap[activeTab] || 'dashboard'}
      onNavigate={handleNav}
      eventName={workspace.event.name}
      eventDate={workspace.event.date}
    >
      {/* Dynamic View rendering */}
      {activeTab === 'overview' && <DashboardView />}
      {activeTab === 'timeline' && <TimelineView />}
      {activeTab === 'budget' && <BudgetView />}
      {activeTab === 'activity' && <ActivityView />}
      {activeTab === 'settings' && <SettingsView />}

      {/* Vendors Placeholder View (Full feature in Phase 3) */}
      {activeTab === 'vendors' && (
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" /> Vendors & Quotations
            </h2>
            <Button size="sm" onClick={() => setActiveTab('budget')} className="text-xs">
              View Budget Commitments
            </Button>
          </div>
          <Card className="p-6 text-center text-xs text-stone-500 space-y-2">
            <p className="font-semibold text-stone-700 dark:text-stone-300">
              Vendor Directory & 300-Guest Quote Comparison Engine
            </p>
            <p>
              Loaded {workspace.vendors.length} vendors and {workspace.quotes.length} quotations in current workspace.
              Full vendor pipeline, GST quote normalisation, and catering brief live in Phase 3.
            </p>
          </Card>
        </div>
      )}

      {/* Guests Placeholder View (Full feature in Phase 3) */}
      {activeTab === 'guests' && (
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Guest Management & RSVP
            </h2>
          </div>
          <Card className="p-6 text-center text-xs text-stone-500 space-y-2">
            <p className="font-semibold text-stone-700 dark:text-stone-300">
              Guest List & Per-Function RSVP Tracker
            </p>
            <p>
              Loaded {workspace.guests.length} guest records with dietary flags (Jain, nut-allergy).
              Full headcount planner and catering brief generator live in Phase 3.
            </p>
          </Card>
        </div>
      )}

      {/* Floating Toast Notifications Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg border text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-800 text-white border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-amber-800 text-white border-amber-700'
                : toast.type === 'error'
                ? 'bg-rose-800 text-white border-rose-700'
                : 'bg-stone-900 text-white border-stone-800'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-300 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
