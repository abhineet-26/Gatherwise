import React from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { History, Undo2, User, Bot, Cpu } from 'lucide-react';

export const ActivityView: React.FC = () => {
  const { workspace, undo, canUndo } = useWorkspaceStore();
  const { addToast } = useUiStore();

  if (!workspace) return null;
  const { activity } = workspace;

  const handleUndo = async () => {
    const ok = await undo();
    if (ok) {
      addToast('Reversed last action', 'info');
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Activity Log & Audit Trail
          </h2>
          <p className="text-xs text-stone-500">
            Every change is tracked with an inverse changeset for deterministic rollback
          </p>
        </div>

        {canUndo() && (
          <Button
            size="sm"
            onClick={handleUndo}
            className="text-xs flex items-center gap-1.5 bg-primary text-white"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo Last Change
          </Button>
        )}
      </div>

      <Card className="divide-y divide-stone-200 dark:divide-stone-800 overflow-hidden">
        {activity.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            No activities recorded yet.
          </div>
        ) : (
          activity.map((act, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={act.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
                    {act.actor === 'user' ? (
                      <User className="w-3.5 h-3.5" />
                    ) : act.actor === 'assistant_proposal' ? (
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Cpu className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                      {act.summary}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {new Date(act.at || act.timestamp || '').toLocaleTimeString()} • {new Date(act.at || act.timestamp || '').toLocaleDateString()} • {act.commandType || act.commandTypes[0] || ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusPill variant={act.actor === 'user' ? 'neutral' : 'success'} className="text-[10px]">
                    {act.actor}
                  </StatusPill>
                  {isFirst && canUndo() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUndo}
                      className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10"
                    >
                      Undo
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
};
