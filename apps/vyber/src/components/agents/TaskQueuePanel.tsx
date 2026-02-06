/**
 * THE VYBER - Task Queue Panel
 * UI component for viewing and managing the agent task queue
 */

import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  X,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentsStore, initializeAgentStoreSync } from '@/stores/agents';
import type { Task, TaskPriority } from '@/agents/types';

interface TaskQueuePanelProps {
  className?: string;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function TaskQueuePanel({ className }: TaskQueuePanelProps) {
  const {
    tasks,
    completedTasks,
    failedTasks,
    isQueuePaused,
    pauseQueue,
    resumeQueue,
    cancelTask,
    retryTask,
    clearCompletedTasks,
    clearFailedTasks,
    syncFromRuntime,
  } = useAgentsStore();

  const [showCompleted, setShowCompleted] = useState(false);
  const [showFailed, setShowFailed] = useState(false);

  // Initialize sync on mount
  useEffect(() => {
    const cleanup = initializeAgentStoreSync();
    return cleanup;
  }, []);

  // Sync periodically
  useEffect(() => {
    const interval = setInterval(syncFromRuntime, 1000);
    return () => clearInterval(interval);
  }, [syncFromRuntime]);

  const runningTasks = tasks.filter(t => t.status === 'running');
  const queuedTasks = tasks.filter(t => t.status === 'queued');
  const pausedTasks = tasks.filter(t => t.status === 'paused');

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="font-semibold text-sm">Task Queue</h3>
          <p className="text-xs text-muted-foreground">
            {runningTasks.length} running, {queuedTasks.length} queued
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={isQueuePaused ? resumeQueue : pauseQueue}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isQueuePaused
                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                : 'text-muted-foreground hover:bg-secondary'
            )}
            title={isQueuePaused ? 'Resume queue' : 'Pause queue'}
          >
            {isQueuePaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Task Lists */}
      <div className="flex-1 overflow-y-auto">
        {/* Running Tasks */}
        {runningTasks.length > 0 && (
          <TaskSection title="Running" count={runningTasks.length} defaultOpen>
            {runningTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onCancel={() => cancelTask(task.id)}
              />
            ))}
          </TaskSection>
        )}

        {/* Queued Tasks */}
        {queuedTasks.length > 0 && (
          <TaskSection title="Queued" count={queuedTasks.length} defaultOpen>
            {queuedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onCancel={() => cancelTask(task.id)}
              />
            ))}
          </TaskSection>
        )}

        {/* Paused Tasks */}
        {pausedTasks.length > 0 && (
          <TaskSection title="Paused" count={pausedTasks.length}>
            {pausedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onCancel={() => cancelTask(task.id)}
              />
            ))}
          </TaskSection>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <TaskSection
            title="Completed"
            count={completedTasks.length}
            isOpen={showCompleted}
            onToggle={() => setShowCompleted(!showCompleted)}
            action={
              <button
                onClick={clearCompletedTasks}
                className="p-1 rounded hover:bg-secondary text-muted-foreground"
                title="Clear completed"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            }
          >
            {completedTasks.slice(0, 10).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            {completedTasks.length > 10 && (
              <p className="text-xs text-muted-foreground px-3 py-2">
                +{completedTasks.length - 10} more
              </p>
            )}
          </TaskSection>
        )}

        {/* Failed Tasks */}
        {failedTasks.length > 0 && (
          <TaskSection
            title="Failed"
            count={failedTasks.length}
            isOpen={showFailed}
            onToggle={() => setShowFailed(!showFailed)}
            action={
              <button
                onClick={clearFailedTasks}
                className="p-1 rounded hover:bg-secondary text-muted-foreground"
                title="Clear failed"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            }
          >
            {failedTasks.slice(0, 10).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onRetry={() => retryTask(task.id)}
              />
            ))}
          </TaskSection>
        )}

        {/* Empty State */}
        {tasks.length === 0 && completedTasks.length === 0 && failedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">No tasks in queue</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Tasks will appear here when agents start working
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Section Component
interface TaskSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  action?: React.ReactNode;
}

function TaskSection({
  title,
  count,
  children,
  defaultOpen = false,
  isOpen,
  onToggle,
  action,
}: TaskSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isOpen ?? internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen(!internalOpen));

  return (
    <div className="border-b border-border">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full px-4 py-2 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
            {count}
          </span>
        </div>
        {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  onCancel?: () => void;
  onRetry?: () => void;
}

function TaskCard({ task, onCancel, onRetry }: TaskCardProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-vyber-purple" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDuration = (start?: number, end?: number) => {
    if (!start) return '';
    const endTime = end || Date.now();
    const seconds = Math.floor((endTime - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="mx-2 mb-1 rounded-lg border border-border bg-secondary/20 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Status Icon */}
        <div className="flex-shrink-0">{getStatusIcon()}</div>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{task.name}</span>
            <span
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                PRIORITY_COLORS[task.priority]
              )}
              title={PRIORITY_LABELS[task.priority]}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{task.type}</span>
            {task.startedAt && (
              <>
                <span>•</span>
                <span>{formatDuration(task.startedAt, task.completedAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {task.status === 'failed' && onRetry && (
            <button
              onClick={onRetry}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              title="Retry"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          {(task.status === 'queued' || task.status === 'running') && onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskQueuePanel;
