import React, { useState, useMemo } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { buildIcsCalendar } from 'shared/domain/export/ics';
import { addDays, asIsoDate } from 'shared/domain/time/dates';
import type { Task } from 'shared/schemas/task';
import { AddTaskModal } from './AddTaskModal';
import { BoardView, MonthCalendarView } from './TimelineViews';
import { 
  Calendar as CalendarIcon, 
  List, 
  Kanban, 
  Plus, 
  Download, 
  Search, 
  CheckCircle2, 
  Trash2,
  Lock,
  GitBranch
} from 'lucide-react';

type ViewMode = 'list' | 'board' | 'calendar';

export const TimelineView: React.FC = () => {
  const { workspace, dispatch } = useWorkspaceStore();
  const { getEffectiveToday, addToast } = useUiStore();
  const today = getEffectiveToday();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  if (!workspace) return null;
  const { event, tasks } = workspace;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [tasks, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.category)));
  }, [tasks]);

  const handleToggleComplete = async (task: Task) => {
    if (task.status === 'done') {
      await dispatch({
        type: 'UPDATE_TASK',
        eventId: event.id,
        payload: { id: task.id, status: 'todo' },
      });
      addToast(`Reopened "${task.title}"`, 'info');
    } else {
      await dispatch({
        type: 'COMPLETE_TASK',
        eventId: event.id,
        payload: { id: task.id },
      });
      addToast(`Completed "${task.title}"`, 'success');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    await dispatch({
      type: 'DELETE_TASK',
      eventId: event.id,
      payload: { id: task.id },
    });
    addToast(`Deleted task "${task.title}"`, 'info');
  };

  const handleCreateTask = async (data: {
    title: string;
    category: string;
    priority: Task['priority'];
    dueDate: string;
  }) => {
    const newTask: Task = {
      id: `task_${Date.now()}`,
      eventId: event.id,
      title: data.title,
      category: data.category,
      priority: data.priority,
      status: 'todo',
      dueDate: asIsoDate(data.dueDate),
      dependsOn: [],
    };

    await dispatch({
      type: 'ADD_TASK',
      eventId: event.id,
      payload: newTask as unknown as Record<string, unknown>,
    });

    addToast(`Added task "${newTask.title}"`, 'success');
  };

  const handleDownloadIcs = () => {
    const icsData = buildIcsCalendar(tasks, event.name);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.name.toLowerCase().replace(/\s+/g, '-')}-schedule.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Calendar (.ics) downloaded successfully', 'success');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" /> Tasks & Timeline
          </h2>
          <p className="text-xs text-stone-500">
            {tasks.filter((t) => t.status === 'done').length} of {tasks.length} tasks completed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800/60 p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1 ${
                viewMode === 'board' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1 ${
                viewMode === 'calendar' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={handleDownloadIcs} className="text-xs h-8 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Export .ics
          </Button>

          <Button size="sm" onClick={() => setShowAddModal(true)} className="text-xs h-8 flex items-center gap-1 bg-primary text-white">
            <Plus className="w-3.5 h-3.5" /> Add Task
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
        >
          <option value="all">All Categories ({tasks.length})</option>
          {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>

      {viewMode === 'list' && (
        <Card className="divide-y divide-stone-200 dark:divide-stone-800 overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">No tasks found.</div>
          ) : (
            filteredTasks.map((task) => {
              const isOverdue = task.status !== 'done' && task.dueDate < today;
              const isDueSoon = task.status !== 'done' && task.dueDate >= today && task.dueDate <= addDays(today, 7);

              return (
                <div
                  key={task.id}
                  className={`p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 ${
                    task.status === 'done' ? 'opacity-60 bg-stone-50/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        task.status === 'done' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300'
                      }`}
                    >
                      {task.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold truncate ${task.status === 'done' ? 'line-through text-stone-500' : ''}`}>
                          {task.title}
                        </span>
                        {task.isLocked && <Lock className="w-3 h-3 text-stone-400" />}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-0.5">
                        <span className="capitalize">{task.category}</span>
                        <span>•</span>
                        <span className={isOverdue ? 'text-rose-600 font-bold' : isDueSoon ? 'text-amber-600 font-semibold' : ''}>
                          Due: {task.dueDate} {isOverdue && '(Overdue)'}
                        </span>
                        {(task.dependsOn?.length ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-stone-400">
                            <GitBranch className="w-3 h-3" /> {task.dependsOn?.length} dep(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusPill variant={task.status === 'done' ? 'success' : isOverdue ? 'danger' : 'neutral'}>
                      {task.status === 'done' ? 'Completed' : task.priority}
                    </StatusPill>
                    <button onClick={() => handleDeleteTask(task)} className="p-1 text-stone-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      )}

      {viewMode === 'board' && <BoardView tasks={filteredTasks} onToggleComplete={handleToggleComplete} />}
      {viewMode === 'calendar' && <MonthCalendarView tasks={filteredTasks} today={today} />}

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        today={today}
        onSubmit={handleCreateTask}
      />
    </div>
  );
};
