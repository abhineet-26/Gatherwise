import React, { useState } from 'react';
import { DemoBanner } from '../demo/DemoBanner';
import {
  LayoutDashboard,
  Calendar,
  Wallet,
  CheckSquare,
  Store,
  Users,
  Sparkles,
  ShieldAlert,
  FileSpreadsheet,
  Settings,
  Plus,
  Search,
  ChevronRight,
  HelpCircle,
  Bell,
  Menu,
  X,
  SlidersHorizontal,
  Lightbulb,
} from 'lucide-react';
import clsx from 'clsx';

export type NavItem =
  | 'dashboard'
  | 'events'
  | 'budget'
  | 'tasks'
  | 'vendors'
  | 'guests'
  | 'ideas'
  | 'copilot'
  | 'what-if'
  | 'risks'
  | 'reconciliation'
  | 'settings';

export interface AppShellProps {
  currentTab: NavItem;
  onNavigate: (tab: NavItem) => void;
  onToggleCopilot?: () => void;
  onGoHome?: () => void;
  children: React.ReactNode;
  eventName?: string;
  eventDate?: string;
  aiEnabled?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onNavigate,
  onToggleCopilot,
  onGoHome,
  children,
  eventName = "Ananya & Arjun's Wedding",
  eventDate = 'Nov 24, 2026',
  aiEnabled = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: NavItem; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'events', label: 'My Events', icon: <Calendar className="w-5 h-5" /> },
    { id: 'budget', label: 'Budget Planner', icon: <Wallet className="w-5 h-5" /> },
    { id: 'tasks', label: 'Timeline & Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'vendors', label: 'Vendors & Quotes', icon: <Store className="w-5 h-5" /> },
    { id: 'guests', label: 'Guests & RSVP', icon: <Users className="w-5 h-5" /> },
    { id: 'ideas', label: 'Idea Studio', icon: <Lightbulb className="w-5 h-5" /> },
    { id: 'copilot', label: 'AI Copilot', icon: <Sparkles className="w-5 h-5" />, badge: aiEnabled ? 'Live' : 'Rule-based' },
    { id: 'what-if', label: 'What-if Lab', icon: <SlidersHorizontal className="w-5 h-5" /> },
    { id: 'risks', label: 'Risks & Contingency', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'reconciliation', label: 'Post-Event Audit', icon: <FileSpreadsheet className="w-5 h-5" /> },
  ];

  const handleNav = (id: NavItem) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gw-paper text-gw-ink-900 flex flex-col antialiased">
      {/* Top Demo Banner */}
      <DemoBanner />

      <div className="flex flex-1 relative">
        {/* Desktop Sidebar (Left Rail) */}
        <aside className="hidden lg:flex fixed left-0 top-[29px] bottom-0 w-64 bg-white border-r border-gw-line flex-col justify-between z-40 select-none">
          <div className="flex flex-col">
            {/* Brand Logo & Title */}
            <div
              className="p-4 flex items-center gap-3 border-b border-gw-line/70 cursor-pointer hover:bg-gw-sunken/50 transition-colors"
              onClick={onGoHome}
              title="Return to Home / Landing Page"
            >
              <div className="w-9 h-9 rounded-xl bg-gw-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                GW
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display font-bold text-base text-gw-indigo-700 leading-tight">GatherWise</span>
                <span className="text-[11px] text-gw-ink-600 truncate font-medium">India Event Intelligence</span>
              </div>
            </div>

            {/* Event Quick Switcher */}
            <div className="p-3 border-b border-gw-line/50">
              <div className="p-2.5 rounded-xl bg-gw-sunken border border-gw-line/60 flex items-center justify-between">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-bold text-gw-ink-900 truncate">{eventName}</span>
                  <span className="text-[11px] text-gw-ink-600">{eventDate}</span>
                </div>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-gw-indigo-100 text-gw-indigo-700">
                  Active
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
              {navLinks.map((link) => {
                const isActive = currentTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNav(link.id)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                      isActive
                        ? 'bg-gw-indigo-50 text-gw-indigo-700 font-semibold shadow-xs'
                        : 'text-gw-ink-700 hover:bg-gw-sunken hover:text-gw-ink-900'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={clsx(isActive ? 'text-gw-indigo-700' : 'text-gw-ink-600')}>
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className={clsx(
                        'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                        isActive ? 'bg-gw-indigo-700 text-white' : 'bg-gw-sunken text-gw-ink-600'
                      )}>
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer User & Settings */}
          <div className="p-3 border-t border-gw-line bg-white flex flex-col gap-2">
            <button
              onClick={() => handleNav('settings')}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gw-ink-700 hover:bg-gw-sunken transition-colors',
                currentTab === 'settings' && 'bg-gw-indigo-50 text-gw-indigo-700 font-semibold'
              )}
            >
              <Settings className="w-4 h-4 text-gw-ink-600" />
              <span>Workspace Settings</span>
            </button>
            <div className="flex items-center gap-2.5 px-2 pt-1">
              <div className="w-8 h-8 rounded-full bg-gw-peacock-700 text-white flex items-center justify-center font-bold text-xs">
                PS
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gw-ink-900 truncate">Priya Sharma</span>
                <span className="text-[10px] text-gw-ink-600 truncate">Lead Host &amp; Organizer</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-gw-ink-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col justify-between p-4 shadow-2xl z-50">
              <div className="flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-gw-line">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gw-indigo-700 text-white flex items-center justify-center font-bold text-sm">
                      GW
                    </div>
                    <span className="font-display font-bold text-base text-gw-indigo-700">GatherWise</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-gw-ink-600 hover:bg-gw-sunken">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="py-4 space-y-1 overflow-y-auto">
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => handleNav(link.id)}
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                        currentTab === link.id
                          ? 'bg-gw-indigo-50 text-gw-indigo-700 font-semibold'
                          : 'text-gw-ink-700 hover:bg-gw-sunken'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {link.icon}
                        <span>{link.label}</span>
                      </div>
                      {link.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gw-sunken text-gw-ink-600 font-semibold">
                          {link.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="pt-3 border-t border-gw-line">
                <button
                  onClick={() => handleNav('settings')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gw-ink-700 hover:bg-gw-sunken"
                >
                  <Settings className="w-4 h-4 text-gw-ink-600" />
                  <span>Workspace Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="h-16 bg-white/95 backdrop-blur-md border-b border-gw-line px-4 md:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gw-ink-700 hover:bg-gw-sunken"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gw-ink-600 shrink-0 font-medium">
                <span className="text-gw-indigo-700 font-bold">GatherWise</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-gw-ink-900 truncate max-w-[160px]">{eventName}</span>
              </div>

              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gw-ink-600/70" />
                <input
                  type="text"
                  placeholder="Search tasks, vendors, budget lines..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-gw-sunken/80 border border-gw-line/80 text-xs text-gw-ink-900 placeholder:text-gw-ink-600/60 focus:outline-none focus:ring-2 focus:ring-gw-indigo-600 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Currency Badge */}
              <div className="hidden md:flex items-center gap-1 bg-gw-sunken px-2.5 py-1 rounded-lg text-xs font-semibold text-gw-indigo-700 border border-gw-line/60">
                <span>INR</span>
                <span>₹</span>
              </div>

              {/* Ask Copilot Button */}
              <button
                onClick={onToggleCopilot || (() => onNavigate('copilot'))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gw-indigo-50 hover:bg-gw-indigo-100 text-gw-indigo-700 font-semibold text-xs border border-gw-indigo-200 shadow-xs transition-colors"
                aria-label="Open AI Copilot"
              >
                <Sparkles className="w-3.5 h-3.5 text-gw-marigold-800" />
                <span className="hidden sm:inline">Ask Copilot</span>
              </button>

              {/* Quick Action Button */}
              <button
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gw-indigo-700 hover:bg-gw-indigo-600 text-white font-medium text-xs shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Task</span>
              </button>

              <button className="p-2 rounded-lg text-gw-ink-600 hover:text-gw-ink-900 hover:bg-gw-sunken transition-colors" aria-label="Help">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gw-ink-600 hover:text-gw-ink-900 hover:bg-gw-sunken transition-colors relative" aria-label="Notifications">
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-gw-vermilion-600 absolute top-1.5 right-1.5"></span>
              </button>
            </div>
          </header>

          {/* Page Main Outlet */}
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gw-line flex items-center justify-around z-40 px-2 py-1 shadow-lg">
        <button
          onClick={() => handleNav('dashboard')}
          className={clsx('flex flex-col items-center gap-1 p-1 text-xs', currentTab === 'dashboard' ? 'text-gw-indigo-700 font-bold' : 'text-gw-ink-600')}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => handleNav('budget')}
          className={clsx('flex flex-col items-center gap-1 p-1 text-xs', currentTab === 'budget' ? 'text-gw-indigo-700 font-bold' : 'text-gw-ink-600')}
        >
          <Wallet className="w-5 h-5" />
          <span>Budget</span>
        </button>
        <button
          onClick={() => handleNav('tasks')}
          className={clsx('flex flex-col items-center gap-1 p-1 text-xs', currentTab === 'tasks' ? 'text-gw-indigo-700 font-bold' : 'text-gw-ink-600')}
        >
          <CheckSquare className="w-5 h-5" />
          <span>Tasks</span>
        </button>
        <button
          onClick={() => handleNav('copilot')}
          className={clsx('flex flex-col items-center gap-1 p-1 text-xs', currentTab === 'copilot' ? 'text-gw-indigo-700 font-bold' : 'text-gw-ink-600')}
        >
          <Sparkles className="w-5 h-5 text-gw-marigold-800" />
          <span>Copilot</span>
        </button>
        <button
          onClick={() => handleNav('guests')}
          className={clsx('flex flex-col items-center gap-1 p-1 text-xs', currentTab === 'guests' ? 'text-gw-indigo-700 font-bold' : 'text-gw-ink-600')}
        >
          <Users className="w-5 h-5" />
          <span>Guests</span>
        </button>
      </nav>
    </div>
  );
};
