import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { buildAiContext } from './buildAiContext';
import type { AiResponse, ProposalItem } from 'shared/ai/types';
import {
  Sparkles,
  Send,
  X,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface MessageRecord {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  response?: AiResponse;
}

const SUGGESTED_PROMPTS = [
  'Are we over budget?',
  "What's overdue?",
  'Compare my caterer quotes',
  'Plan B for rain',
  'Expected attendance & buffer',
];

export const AssistantPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { workspace, dispatch, undo, canUndo } = useWorkspaceStore();
  const today = useUiStore(s => s.getEffectiveToday());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageRecord[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your GatherWise Copilot. Ask me anything about your budget, vendors, quotes, schedule, or contingencies.`,
    },
  ]);
  const [appliedProposalIds, setAppliedProposalIds] = useState<Set<string>>(new Set());
  const [showToolTraceId, setShowToolTraceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (messageText: string) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading || !workspace) return;

    const userMsgId = 'u-' + Date.now();
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    try {
      const aiContext = buildAiContext(workspace, today);
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, context: aiContext }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: AiResponse = await res.json();
      setMessages(prev => [
        ...prev,
        {
          id: 'a-' + Date.now(),
          sender: 'assistant',
          text: data.text,
          response: data,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          text: "I'm operating in offline mode. Please check your network or try checking the budget and tasks tabs directly.",
          response: {
            text: 'Offline mode',
            evidence: ['Local cache'],
            proposals: [],
            toolTrace: ['Network failed'],
            source: 'fallback',
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProposal = (proposal: ProposalItem) => {
    for (const cmd of proposal.commands) {
      dispatch(cmd);
    }
    setAppliedProposalIds(prev => new Set([...prev, proposal.id]));
  };

  return (
    <div
      role="dialog"
      aria-label="GatherWise Copilot"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl border-l border-border animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface-subtle">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">GatherWise Copilot</h2>
            <p className="text-xs text-text-muted flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-secondary" /> PII-protected context
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close copilot"
          className="rounded p-1 text-text-muted hover:bg-surface hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Undo quick-bar if available */}
      {canUndo() && (
        <div className="flex items-center justify-between bg-primary-subtle/40 px-4 py-1.5 text-xs text-primary border-b border-primary/20">
          <span>Last change can be reverted</span>
          <button
            onClick={() => undo()}
            className="flex items-center gap-1 font-semibold hover:underline"
          >
            <RotateCcw className="h-3 w-3" /> Undo change
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-primary text-text-inverse rounded-tr-none'
                  : 'bg-surface-subtle text-text-primary border border-border rounded-tl-none'
              }`}
            >
              {/* Source Tag for Assistant */}
              {msg.sender === 'assistant' && msg.response && (
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${
                      msg.response.source === 'gemini'
                        ? 'bg-secondary-subtle text-secondary'
                        : 'bg-accent-subtle text-accent-bold'
                    }`}
                  >
                    <Cpu className="h-3 w-3" />
                    {msg.response.source === 'gemini' ? 'Gemini AI' : 'Built-in assistant (no AI)'}
                  </span>
                </div>
              )}

              {/* Message Body */}
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Unverified Numbers Warning */}
              {msg.response?.unverifiedNumbers && msg.response.unverifiedNumbers.length > 0 && (
                <div className="mt-2 rounded bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Some figures are not from your plan data. Check before relying on them:{' '}
                    <strong>{msg.response.unverifiedNumbers.join(', ')}</strong>
                  </span>
                </div>
              )}

              {/* Evidence Chips */}
              {msg.response?.evidence && msg.response.evidence.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.response.evidence.map((chip, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-text-muted border border-border"
                    >
                      ✓ {chip}
                    </span>
                  ))}
                </div>
              )}

              {/* Proposals Cards */}
              {msg.response?.proposals && msg.response.proposals.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Proposed Plan Changes (Review & Approve)
                  </span>
                  {msg.response.proposals.map(prop => {
                    const isApplied = appliedProposalIds.has(prop.id);
                    return (
                      <div
                        key={prop.id}
                        className="rounded-lg border border-primary/30 bg-surface p-2.5 text-xs text-text-primary shadow-xs"
                      >
                        <div className="font-semibold text-primary">{prop.title}</div>
                        <p className="text-text-muted mt-0.5">{prop.whyThis}</p>
                        {prop.impact && (
                          <div className="mt-1.5 flex gap-2 text-[10px] text-text-muted border-t border-border pt-1">
                            {prop.impact.budgetDelta !== 0 && (
                              <span>
                                Budget delta:{' '}
                                {prop.impact.budgetDelta > 0 ? '+' : ''}₹
                                {(prop.impact.budgetDelta / 100).toLocaleString('en-IN')}
                              </span>
                            )}
                            {prop.impact.tasksUpdated > 0 && (
                              <span>Updates: {prop.impact.tasksUpdated} tasks</span>
                            )}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-end gap-2">
                          {isApplied ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApproveProposal(prop)}
                              className="rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-text-inverse hover:bg-primary/90"
                            >
                              Approve & Apply
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Collapsible Tool Trace */}
              {msg.response?.toolTrace && msg.response.toolTrace.length > 0 && (
                <div className="mt-2 border-t border-border/50 pt-1">
                  <button
                    onClick={() =>
                      setShowToolTraceId(showToolTraceId === msg.id ? null : msg.id)
                    }
                    className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary"
                  >
                    <span>{msg.response.toolTrace.length} tools executed</span>
                    {showToolTraceId === msg.id ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  {showToolTraceId === msg.id && (
                    <div className="mt-1 rounded bg-surface p-1.5 font-mono text-[10px] text-text-muted space-y-0.5 border border-border">
                      {msg.response.toolTrace.map((trace, idx) => (
                        <div key={idx}>▸ {trace}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>Consulting event plan data & tools...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompt chips */}
      <div className="border-t border-border bg-surface-subtle/50 px-3 py-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-surface">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about budget, tasks, quotes..."
            maxLength={500}
            disabled={loading}
            className="flex-1 rounded-lg border border-border bg-surface-subtle px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="rounded-lg bg-primary p-2 text-text-inverse hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-1 flex justify-between text-[10px] text-text-muted px-1">
          <span>Copilot reads context through read-only tools</span>
          <span>{input.length}/500</span>
        </div>
      </div>
    </div>
  );
};
