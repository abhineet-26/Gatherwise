import { useState, useEffect } from 'react';
import { AppShell, type NavItem } from './components/shell/AppShell';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { StatusPill } from './components/ui/StatusPill';
import { CurrencyDisplay } from './components/ui/CurrencyDisplay';
import { inr } from 'shared/domain/money/money';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Plus,
  Users,
  Building2,
  FileText,
  DollarSign,
  Download,
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [capabilities, setCapabilities] = useState<{ ai: boolean; weather: boolean; cloud: boolean }>({
    ai: false,
    weather: true,
    cloud: false,
  });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.capabilities) {
          setCapabilities(data.capabilities);
        }
      })
      .catch(() => {
        // Safe fallback in offline / client-only mode
      });
  }, []);

  return (
    <AppShell
      currentTab={currentTab}
      onNavigate={setCurrentTab}
      eventName="Ananya & Arjun's Wedding"
      eventDate="24 Nov 2026"
      aiEnabled={capabilities.ai}
    >
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Header Greeting & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gw-peacock-700 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-gw-peacock-600 animate-pulse"></span>
                <span>Active Workspace · Bhubaneswar</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-gw-ink-900 mt-1">
                Good morning, Priya 👋
              </h1>
              <p className="text-sm text-gw-ink-600 mt-0.5">
                Planning is on track for <strong className="text-gw-ink-900 font-semibold">Ananya &amp; Arjun's Wedding</strong> · <span className="text-gw-indigo-700 font-bold">42 days remaining</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
                Export PDF
              </Button>
              <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setCurrentTab('tasks')}>
                New Task
              </Button>
            </div>
          </div>

          {/* 4 Spotlight Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Days Remaining */}
            <Card className="flex flex-col justify-between">
              <div className="flex items-center justify-between text-gw-ink-600">
                <span className="text-xs font-bold uppercase tracking-wider">Days Remaining</span>
                <Clock className="w-5 h-5 text-gw-indigo-700" />
              </div>
              <div className="mt-3">
                <div className="text-4xl font-display font-black text-gw-indigo-700">42</div>
                <p className="text-xs text-gw-ink-600 mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gw-marigold-800" />
                  <span>Next: Sangeet &amp; Mehendi</span>
                </p>
              </div>
            </Card>

            {/* Guest Confirmation */}
            <Card className="flex flex-col justify-between">
              <div className="flex items-center justify-between text-gw-ink-600">
                <span className="text-xs font-bold uppercase tracking-wider">Guest Confirmation</span>
                <Users className="w-5 h-5 text-gw-peacock-700" />
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-display font-bold text-gw-ink-900">98</span>
                  <span className="text-sm text-gw-ink-600 font-medium">/ 120 RSVP'd</span>
                </div>
                <div className="w-full bg-gw-sunken rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-gw-peacock-700 h-full rounded-full" style={{ width: '81.6%' }}></div>
                </div>
                <span className="text-[11px] text-gw-peacock-700 font-semibold mt-1 block">82% responded</span>
              </div>
            </Card>

            {/* Committed Budget */}
            <Card className="flex flex-col justify-between">
              <div className="flex items-center justify-between text-gw-ink-600">
                <span className="text-xs font-bold uppercase tracking-wider">Committed Budget</span>
                <DollarSign className="w-5 h-5 text-gw-indigo-700" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-gw-ink-900">
                  <CurrencyDisplay amount={inr(3_12_000)} />
                </div>
                <div className="w-full bg-gw-sunken rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-gw-indigo-700 h-full rounded-full" style={{ width: '69.3%' }}></div>
                </div>
                <span className="text-[11px] text-gw-ink-600 mt-1 block">Target: ₹4,50,000 (69.3%)</span>
              </div>
            </Card>

            {/* Readiness Score */}
            <Card className="flex flex-col justify-between border-l-4 border-l-gw-peacock-700">
              <div className="flex items-center justify-between text-gw-ink-600">
                <span className="text-xs font-bold uppercase tracking-wider">Readiness Bloom</span>
                <TrendingUp className="w-5 h-5 text-gw-peacock-700" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-bold text-gw-peacock-700">78</span>
                    <span className="text-xs text-gw-ink-600 font-medium">/ 100</span>
                  </div>
                  <span className="text-xs font-semibold text-gw-peacock-700 mt-0.5 block">Pace: On Track (+3)</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gw-peacock-50 text-gw-peacock-700 flex items-center justify-center font-bold text-xs">
                  5/5
                </div>
              </div>
            </Card>
          </div>

          {/* Budget Progress & Risk Alerts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Budget Utilization (7 cols) */}
            <Card className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gw-indigo-700" />
                    <h2 className="font-display font-bold text-lg text-gw-ink-900">Budget &amp; Spend Execution</h2>
                  </div>
                  <StatusPill label="INR (₹)" variant="info" size="sm" />
                </div>

                {/* Progress bar */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gw-ink-900 font-semibold">₹3,12,000 committed of ₹4,50,000</span>
                    <span className="text-gw-peacock-700 font-semibold">₹1,38,000 Available</span>
                  </div>
                  <div className="h-3 w-full bg-gw-sunken rounded-full overflow-hidden flex">
                    <div className="bg-gw-indigo-700 h-full" style={{ width: '41.1%' }} title="Paid: ₹1,85,000"></div>
                    <div className="bg-gw-peacock-700 h-full" style={{ width: '28.2%' }} title="Committed: ₹1,27,000"></div>
                    <div className="bg-gw-marigold-400 h-full" style={{ width: '10%' }} title="Contingency Reserve: ₹45,000"></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gw-ink-600 pt-1">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-gw-indigo-700"></span> Paid (₹1,85,000)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-gw-peacock-700"></span> Committed (₹1,27,000)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-gw-marigold-400"></span> Reserve (₹45,000)</span>
                  </div>
                </div>

                {/* Top Category Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-gw-sunken/60">
                    <span className="text-xs text-gw-ink-600 block">Venue &amp; Catering</span>
                    <span className="text-sm font-bold text-gw-ink-900 mt-0.5 block">₹2,10,000</span>
                    <span className="text-[10px] text-gw-peacock-700 font-semibold">46.6%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gw-sunken/60">
                    <span className="text-xs text-gw-ink-600 block">Photography</span>
                    <span className="text-sm font-bold text-gw-ink-900 mt-0.5 block">₹65,000</span>
                    <span className="text-[10px] text-gw-peacock-700 font-semibold">14.4%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gw-sunken/60">
                    <span className="text-xs text-gw-ink-600 block">Decor &amp; Floral</span>
                    <span className="text-sm font-bold text-gw-ink-900 mt-0.5 block">₹85,000</span>
                    <span className="text-[10px] text-gw-peacock-700 font-semibold">18.8%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-gw-line flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setCurrentTab('budget')} className="text-gw-indigo-700 font-semibold">
                  <span>Open Full Budget Ledger</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <span className="text-xs text-gw-ink-600">Reconciled with bank vouchers</span>
              </div>
            </Card>

            {/* Right: Critical Alerts (5 cols) */}
            <Card className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-gw-marigold-800" />
                    <h2 className="font-display font-bold text-lg text-gw-ink-900">Priority Action Items</h2>
                  </div>
                  <StatusPill label="2 Pending" variant="warning" size="sm" />
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-gw-sunken/70 border-l-4 border-l-gw-marigold-400">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gw-ink-900">Catering Headcount Lock</span>
                      <StatusPill label="Due in 4 Days" variant="warning" size="sm" />
                    </div>
                    <p className="text-xs text-gw-ink-600 mt-1">
                      Final headcount lock due soon. 18 pending RSVPs awaiting reply.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gw-sunken/70 border-l-4 border-l-gw-vermilion-600">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gw-ink-900">Sound &amp; Stage Quotation</span>
                      <StatusPill label="2 Days Left" variant="danger" size="sm" />
                    </div>
                    <p className="text-xs text-gw-ink-600 mt-1">
                      Quotation from Melody Pro expires in 48 hours. Price lock requires confirmation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-gw-line flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setCurrentTab('risks')} className="text-gw-ink-700 font-semibold">
                  <span>View Contingency Matrix</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <span className="text-xs text-gw-peacock-700 font-semibold">Rain Contingency Ready</span>
              </div>
            </Card>
          </div>

          {/* Quick Module Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card
              className="p-4 cursor-pointer hover:border-gw-indigo-600 transition-colors flex items-center gap-3"
              onClick={() => setCurrentTab('tasks')}
            >
              <div className="w-10 h-10 rounded-xl bg-gw-indigo-50 text-gw-indigo-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-gw-ink-900 truncate">Tasks &amp; Milestones</h4>
                <span className="text-xs text-gw-ink-600">4 priority tasks</span>
              </div>
            </Card>

            <Card
              className="p-4 cursor-pointer hover:border-gw-indigo-600 transition-colors flex items-center gap-3"
              onClick={() => setCurrentTab('vendors')}
            >
              <div className="w-10 h-10 rounded-xl bg-gw-peacock-50 text-gw-peacock-700 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-gw-ink-900 truncate">Vendors &amp; Quotes</h4>
                <span className="text-xs text-gw-ink-600">7 shortlisted</span>
              </div>
            </Card>

            <Card
              className="p-4 cursor-pointer hover:border-gw-indigo-600 transition-colors flex items-center gap-3"
              onClick={() => setCurrentTab('guests')}
            >
              <div className="w-10 h-10 rounded-xl bg-gw-marigold-100 text-gw-marigold-800 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-gw-ink-900 truncate">Guests &amp; Headcount</h4>
                <span className="text-xs text-gw-ink-600">120 invited</span>
              </div>
            </Card>

            <Card
              className="p-4 cursor-pointer hover:border-gw-indigo-600 transition-colors flex items-center gap-3"
              onClick={() => setCurrentTab('copilot')}
            >
              <div className="w-10 h-10 rounded-xl bg-gw-indigo-50 text-gw-indigo-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-gw-marigold-800" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-gw-ink-900 truncate">AI Copilot</h4>
                <span className="text-xs text-gw-ink-600">Ask &amp; Propose</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {currentTab !== 'dashboard' && (
        <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 rounded-2xl bg-gw-indigo-50 text-gw-indigo-700 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-display font-bold text-gw-ink-900 capitalize mb-1">
            {currentTab.replace('-', ' ')}
          </h2>
          <p className="text-sm text-gw-ink-600 max-w-md mb-6">
            Module ready for Phase implementation with full schema, calculation kernel, and command dispatch.
          </p>
          <Button variant="outline" size="sm" onClick={() => setCurrentTab('dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      )}
    </AppShell>
  );
}
