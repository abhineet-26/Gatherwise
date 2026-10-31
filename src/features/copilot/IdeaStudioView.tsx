import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getPackForEvent } from 'shared/planning/packs';
import type { IdeaSeed } from 'shared/planning/types';
import {
  Lightbulb,
  Search,
  Pin,
  CheckCircle2,
  Sparkles,
  Tag,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

const KINDS = [
  { id: 'all', label: 'All Ideas' },
  { id: 'theme', label: 'Themes' },
  { id: 'menu', label: 'Food & Menu' },
  { id: 'decor', label: 'Decor & Styling' },
  { id: 'activity', label: 'Activities' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'favour', label: 'Favours & Gifts' },
  { id: 'sustainability', label: 'Eco / Green' },
];

export const IdeaStudioView: React.FC = () => {
  const { workspace, dispatch, undo, canUndo } = useWorkspaceStore();
  const [selectedKind, setSelectedKind] = useState('all');
  const [selectedTier, setSelectedTier] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [pinnedIdeaIds, setPinnedIdeaIds] = useState<Set<string>>(new Set());
  const [ideas, setIdeas] = useState<IdeaSeed[]>([]);

  // Load curated pack ideas for current event type
  useEffect(() => {
    if (!workspace) return;
    const pack = getPackForEvent(workspace.event.type);
    setIdeas(pack.ideaLibrary || []);
  }, [workspace?.event.type]);

  if (!workspace) return null;

  const handlePinIdea = (idea: IdeaSeed) => {
    dispatch({
      type: 'ADD_TASK',
      eventId: workspace.event.id,
      payload: {
        id: `task_idea_${Date.now()}`,
        eventId: workspace.event.id,
        title: `Explore: ${idea.title}`,
        category: idea.kind === 'menu' ? 'catering' : idea.kind === 'decor' ? 'decoration' : 'general',
        priority: 'medium',
        dueDate: workspace.event.date,
        status: 'todo',
        notes: `${idea.summary}\n\nWhy this fits:\n${idea.whyItFits.map(w => '• ' + w).join('\n')}`,
      },
    });
    setPinnedIdeaIds(prev => new Set([...prev, idea.id]));
  };

  const filteredIdeas = ideas.filter(idea => {
    if (selectedKind !== 'all' && idea.kind !== selectedKind) return false;
    if (selectedTier !== 'all' && idea.budgetTier !== selectedTier) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = idea.title.toLowerCase().includes(q);
      const matchSummary = idea.summary.toLowerCase().includes(q);
      const matchTag = idea.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchTag) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading text-text-primary">Idea Studio</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary-subtle px-2.5 py-0.5 text-xs font-semibold text-secondary">
              <Sparkles className="h-3 w-3" /> Curated & Context-Aware
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Browse tailored concepts for {workspace.event.type} in {workspace.event.city}. Pin any idea directly into your action checklist.
          </p>
        </div>

        {canUndo() && (
          <button
            onClick={() => undo()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-subtle"
          >
            <RotateCcw className="h-3.5 w-3.5 text-primary" /> Undo last pin
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search concepts by keywords, theme, ingredients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              maxLength={300}
              className="w-full rounded-lg border border-border bg-surface-subtle pl-9 pr-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-text-muted shrink-0" />
            <span className="text-xs text-text-muted">Budget Tier:</span>
            {(['all', 1, 2, 3] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedTier === tier
                    ? 'bg-primary text-text-inverse'
                    : 'bg-surface-subtle text-text-muted hover:text-text-primary'
                }`}
              >
                {tier === 'all' ? 'All' : '₹'.repeat(tier)}
              </button>
            ))}
          </div>
        </div>

        {/* Kind Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {KINDS.map(k => (
            <button
              key={k.id}
              onClick={() => setSelectedKind(k.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                selectedKind === k.id
                  ? 'bg-primary-subtle text-primary border border-primary/30'
                  : 'bg-surface-subtle text-text-muted hover:text-text-primary border border-border'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {/* Idea Cards Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-text-muted mb-3" />
          <h3 className="text-sm font-semibold text-text-primary">No ideas match your filters</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            Try broadening your search term or switching to &ldquo;All Ideas&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map(idea => {
            const isPinned = pinnedIdeaIds.has(idea.id);
            return (
              <div
                key={idea.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted uppercase tracking-wider border border-border">
                      {idea.kind}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-semibold text-text-muted">
                      <span>{'₹'.repeat(idea.budgetTier)}</span>
                      <span className="text-[10px] text-text-muted/60 font-normal">tier</span>
                    </div>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-text-primary font-heading">
                    {idea.title}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted leading-relaxed">
                    {idea.summary}
                  </p>

                  {/* Why it fits bullets */}
                  {idea.whyItFits && idea.whyItFits.length > 0 && (
                    <div className="mt-3 rounded-lg bg-surface-subtle/70 p-2.5 text-xs text-text-primary border border-border/50">
                      <span className="font-semibold text-[11px] text-text-muted uppercase tracking-wider block mb-1">
                        Why this fits your plan
                      </span>
                      <ul className="space-y-1">
                        {idea.whyItFits.map((fit, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-text-muted">
                            <span className="text-secondary shrink-0">•</span>
                            <span>{fit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {idea.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] text-text-muted"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-text-muted">
                    Effort: {idea.effort === 1 ? 'Low' : idea.effort === 2 ? 'Moderate' : 'High'}
                  </span>
                  {isPinned ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary">
                      <CheckCircle2 className="h-4 w-4" /> Pinned to Tasks
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePinIdea(idea)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-subtle px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-text-inverse transition-colors"
                    >
                      <Pin className="h-3.5 w-3.5" /> Pin to Tasks
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
