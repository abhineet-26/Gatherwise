import { useState, useEffect } from 'react';
import { useWorkspaceStore } from './store/workspaceStore';
import { useUiStore, type WorkspaceTab } from './store/uiStore';
import { AppShell, type NavItem } from './components/shell/AppShell';
import { DashboardView } from './features/dashboard/DashboardView';
import { BudgetView } from './features/budget/BudgetView';
import { TimelineView } from './features/timeline/TimelineView';
import { VendorsView } from './features/vendors/VendorsView';
import { GuestsView } from './features/guests/GuestsView';
import { ActivityView } from './features/activity/ActivityView';
import { SettingsView } from './features/settings/SettingsView';
import { EventWizard } from './features/events/EventWizard';
import { LandingPage } from './features/landing/LandingPage';
import { AssistantPanel } from './features/copilot/AssistantPanel';
import { IdeaStudioView } from './features/copilot/IdeaStudioView';
import { WhatIfView } from './features/whatif/WhatIfView';
import { createSeededScenarios } from './demo/seedData';

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
  const [assistantOpen, setAssistantOpen] = useState(false);

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
    else if (nav === 'vendors') setActiveTab('vendors');
    else if (nav === 'guests') setActiveTab('guests');
    else if (nav === 'ideas') setActiveTab('ideas');
    else if (nav === 'what-if') setActiveTab('what-if');
    else if (nav === 'copilot') setAssistantOpen(true);
    else if (nav === 'events') setActiveTab('overview');
    else if (nav === 'settings') setActiveTab('settings');
    else if (nav === 'reconciliation') setActiveTab('budget');
  };

  const navItemMap: Record<WorkspaceTab, NavItem> = {
    overview: 'dashboard',
    timeline: 'tasks',
    budget: 'budget',
    vendors: 'vendors',
    guests: 'guests',
    ideas: 'ideas',
    'what-if': 'what-if',
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
      onToggleCopilot={() => setAssistantOpen(prev => !prev)}
      eventName={workspace.event.name}
      eventDate={workspace.event.date}
    >
      {/* Dynamic View rendering */}
      {activeTab === 'overview' && <DashboardView />}
      {activeTab === 'timeline' && <TimelineView />}
      {activeTab === 'budget' && <BudgetView />}
      {activeTab === 'activity' && <ActivityView />}
      {activeTab === 'settings' && <SettingsView />}

      {/* Vendors & Quotations View */}
      {activeTab === 'vendors' && <VendorsView />}

      {/* Guests & RSVPs View */}
      {activeTab === 'guests' && <GuestsView />}

      {/* Idea Studio View */}
      {activeTab === 'ideas' && <IdeaStudioView />}

      {/* What-if Lab View */}
      {activeTab === 'what-if' && <WhatIfView />}

      {/* Floating Assistant Drawer */}
      <AssistantPanel isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />

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
