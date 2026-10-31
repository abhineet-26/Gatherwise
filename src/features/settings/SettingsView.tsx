import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Settings, Download, Trash2, Printer, Shield, Server } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { workspace, deleteWorkspace } = useWorkspaceStore();
  const { setCurrentEventId, setActiveTab, addToast } = useUiStore();
  const [healthStatus, setHealthStatus] = useState<{ ai: boolean; weather: boolean; cloud: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data.features))
      .catch(() => setHealthStatus({ ai: false, weather: false, cloud: false }));
  }, []);

  if (!workspace) return null;
  const { event } = workspace;

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workspace, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${event.name.toLowerCase().replace(/\s+/g, '-')}-export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Workspace exported as JSON', 'success');
  };

  const handlePrintPlan = () => {
    window.print();
  };

  const handleDeleteEvent = async () => {
    const shouldExport = window.confirm(
      'Before deleting, would you like to download a JSON backup of this event plan?'
    );
    if (shouldExport) {
      handleExportJson();
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${event.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    await deleteWorkspace(event.id);
    setCurrentEventId(null);
    setActiveTab('overview');
    addToast(`Deleted event "${event.name}"`, 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Event Settings & Data Portability
        </h2>
        <p className="text-xs text-stone-500">
          Manage export backups, print views, privacy safeguards and event lifecycle
        </p>
      </div>

      {/* Data Export & Print Card */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          Data Portability & Print Plan
        </h3>
        <p className="text-xs text-stone-500">
          Your data is never locked in. Export a structured JSON backup anytime or generate a clean, print-ready document formatted for paper or PDF save.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleExportJson}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Full Plan (JSON)
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrintPlan}
            className="text-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
          </Button>
        </div>
      </Card>

      {/* System & Capabilities Card */}
      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          System Capabilities
        </h3>
        <p className="text-xs text-stone-500">
          GatherWise operates on zero-config local storage with optional server enhancements.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
          <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between">
            <span>AI Copilot Engine</span>
            <StatusPill variant={healthStatus?.ai ? 'success' : 'neutral'}>
              {healthStatus?.ai ? 'Gemini 3.8' : 'Rule-based Fallback'}
            </StatusPill>
          </div>
          <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between">
            <span>Weather Forecasts</span>
            <StatusPill variant={healthStatus?.weather ? 'success' : 'neutral'}>
              {healthStatus?.weather ? 'Active' : 'Offline'}
            </StatusPill>
          </div>
          <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between">
            <span>Storage Mode</span>
            <StatusPill variant="neutral">
              IndexedDB Local
            </StatusPill>
          </div>
        </div>
      </Card>

      {/* Privacy & Security Card */}
      <Card className="p-5 space-y-2.5">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          Privacy & Security Guarantees
        </h3>
        <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1.5 list-disc pl-4">
          <li><strong>Local Persistence:</strong> All event data is securely retained in your browser's IndexedDB.</li>
          <li><strong>Zero Secret Leakage:</strong> Gemini API keys and credentials exist exclusively on the server.</li>
          <li><strong>PII Minimization:</strong> Guest names, contacts, and personal notes are filtered before LLM context calls.</li>
          <li><strong>Formula Injection Guard:</strong> CSV exports prepend single quotes to dangerous formula triggers.</li>
        </ul>
      </Card>

      {/* Danger Zone */}
      <Card className="p-5 border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10 space-y-3">
        <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Danger Zone
        </h3>
        <p className="text-xs text-rose-600/80">
          Permanently erase this event workspace. You will be prompted to download a backup first.
        </p>

        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteEvent}
            className="text-xs text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-300 dark:border-rose-800"
          >
            Delete Event Workspace
          </Button>
        </div>
      </Card>
    </div>
  );
};
