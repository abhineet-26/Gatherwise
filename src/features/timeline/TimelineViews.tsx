import React from 'react';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { type IsoDate, asIsoDate, daysBetween } from 'shared/domain/time/dates';
import type { Task } from 'shared/schemas/task';

interface BoardViewProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({ tasks, onToggleComplete }) => {
  const columns = [
    { id: 'todo', label: 'To Do', count: tasks.filter((t) => t.status === 'todo').length },
    { id: 'in_progress', label: 'In Progress', count: tasks.filter((t) => t.status === 'in_progress').length },
    { id: 'done', label: 'Done', count: tasks.filter((t) => t.status === 'done').length },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div
            key={col.id}
            className="bg-stone-100/60 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl p-3 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between pb-1 px-1 border-b border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300">
              <span>{col.label}</span>
              <span className="bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded-full font-mono text-[10px]">
                {col.count}
              </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {colTasks.length === 0 ? (
                <div className="text-[11px] text-stone-400 py-6 text-center italic">Empty column</div>
              ) : (
                colTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="p-3 text-xs space-y-2 cursor-pointer hover:border-primary/40 transition-all shadow-sm"
                    onClick={() => onToggleComplete(task)}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className={`font-semibold ${task.status === 'done' ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'}`}>
                        {task.title}
                      </span>
                      <StatusPill variant={task.priority === 'critical' ? 'danger' : 'neutral'} className="text-[9px] px-1 py-0">
                        {task.priority}
                      </StatusPill>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-500">
                      <span className="capitalize">{task.category}</span>
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface CalendarViewProps {
  tasks: Task[];
  today: IsoDate;
}

export const MonthCalendarView: React.FC<CalendarViewProps> = ({ tasks, today }) => (
  <Card className="p-4 text-xs space-y-3">
    <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
      <span>Schedule Overview</span>
      <span className="text-stone-500 font-normal">Reference Today: {today}</span>
    </div>

    <div className="space-y-2">
      {tasks
        .slice(0, 15)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .map((task) => {
          const diff = daysBetween(today, asIsoDate(task.dueDate));
          return (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 rounded border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-stone-500 text-[11px] w-24">{task.dueDate}</span>
                <span className="font-medium text-stone-900 dark:text-stone-100">{task.title}</span>
              </div>
              <span className="text-[11px] font-mono text-stone-500">
                {diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Today' : `in ${diff}d`}
              </span>
            </div>
          );
        })}
    </div>
  </Card>
);
