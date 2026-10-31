import React from 'react';
import { useUiStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { createSeededScenarios } from '../../demo/seedData';
import { 
  Sparkles, 
  ArrowRight, 
  Flower, 
  Coins, 
  HeartHandshake,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onStartWizard: () => void;
  onOpenWorkspace?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartWizard, onOpenWorkspace }) => {
  const { getEffectiveToday, setCurrentEventId, setActiveTab, addToast } = useUiStore();
  const { workspace, setWorkspace } = useWorkspaceStore();
  const today = getEffectiveToday();

  const handleLoadDemo = async (scenarioKey: string) => {
    const seeds = createSeededScenarios(today);
    const scenario = seeds[scenarioKey] || seeds['demo-wedding-pune'];
    if (scenario) {
      await setWorkspace(scenario);
      setCurrentEventId(scenario.event.id);
      setActiveTab('overview');
      addToast(`Loaded demo: "${scenario.event.name}"`, 'success');
      onOpenWorkspace?.();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
          <Sparkles className="w-3.5 h-3.5" /> India-First Event Planning Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-stone-900 dark:text-stone-50 max-w-3xl mx-auto leading-tight">
          Access the joy. <br className="hidden sm:inline" />
          <span className="text-primary">Master the planning.</span>
        </h1>

        <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
          GatherWise blends Indian celebration culture with institutional planning precision. Safe integer paise budgets, multi-function ceremony timelines, deterministic quote comparisons, and an AI copilot that proposes while you approve.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {workspace && (
            <Button
              size="lg"
              onClick={() => onOpenWorkspace?.()}
              className="text-sm bg-secondary hover:bg-secondary/90 text-white font-bold px-6 py-3 shadow-lg flex items-center gap-2"
            >
              Resume: {workspace.event.name} <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          <Button
            size="lg"
            onClick={() => handleLoadDemo('demo-wedding-pune')}
            className="text-sm bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 shadow-lg flex items-center gap-2"
          >
            Try the Demo <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={onStartWizard}
            className="text-sm font-semibold px-6 py-3"
          >
            Create Your Event
          </Button>
        </div>

        {/* Quick Demo Scenarios Selector */}
        <div className="pt-10 max-w-4xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
            Or launch a pre-seeded scenario (Appendix A)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <Card
              className="p-4 cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
              onClick={() => handleLoadDemo('demo-wedding-pune')}
            >
              <div className="flex items-center justify-between mb-1">
                <StatusPill variant="neutral" className="text-[10px]">Tier 1 • Wedding</StatusPill>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-primary transition-colors">
                Aarohi & Kabir's Wedding
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Pune • 3 Functions • ₹18 Lakhs • 260 guests • Compares 2 caterers & overdue deposit
              </p>
            </Card>

            <Card
              className="p-4 cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
              onClick={() => handleLoadDemo('demo-birthday-indore')}
            >
              <div className="flex items-center justify-between mb-1">
                <StatusPill variant="neutral" className="text-[10px]">Tier 2 • Birthday</StatusPill>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-primary transition-colors">
                Ananya's 6th Birthday
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Indore • Home Terrace • ₹45,000 • 35 guests • Compressed 21-day timeline & allergy brief
              </p>
            </Card>

            <Card
              className="p-4 cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
              onClick={() => handleLoadDemo('demo-technova-nagpur')}
            >
              <div className="flex items-center justify-between mb-1">
                <StatusPill variant="neutral" className="text-[10px]">Tier 2 • Community</StatusPill>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-primary transition-colors">
                TechNova College Fest
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Nagpur • 3 Days • ₹6.5 Lakhs • 1,200 footfall • Stage permits, sponsor pipeline & audio
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Three Core Differentiators */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-stone-200 dark:border-stone-800">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100">
            Engineered for Real-World Indian Celebrations
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Built upon mathematical domain kernels, not superficial checklist forms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-primary flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
              Indian Financial Rigour
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Never let totals drift by a paisa. Integer-paise budget identity (projected, committed, paid, outstanding), GST quote normalisation, UPI/cash payment logs, and Indian number parsing ("5 lakh", "2.5cr").
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Flower className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
              Readiness Bloom & Pace
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Real preparation across five dimensions: Budget, Tasks, Essentials, Guests, and Safety Net. Compare current progress against expected readiness to immediately detect if you are ahead or behind.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
              AI Copilot with Human Approval
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Gemini 3.8 behind strict server guardrails. The AI only reads read-only tools and submits structured proposals. Every change shows a deterministic impact diff, requires your approval, and is 100% undoable.
            </p>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-6 text-center text-xs text-stone-500">
        <p>GatherWise • Challenge 5 Standard Scope • Data saved locally in browser IndexedDB</p>
      </footer>
    </div>
  );
};
