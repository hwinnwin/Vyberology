/**
 * THE VYBER - Agents Store
 * Zustand store for managing the agentic engine state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Agent,
  AgentStatus,
  Task,
  LogEntry,
} from '@/agents/types';
import { getAgentRuntime } from '@/agents/core/AgentRuntime';
import { getTaskQueue } from '@/agents/core/TaskQueue';

// Agent instance state (for UI)
export interface AgentInstance {
  id: string;
  typeId: string;
  name: string;
  description: string;
  status: AgentStatus;
  progress: number;
  currentTaskId: string | null;
  createdAt: number;
}

// Task with UI-specific fields
export interface TaskWithMeta extends Task {
  agentName?: string;
}

// Store state
interface AgentsState {
  // Agent instances currently active
  agents: AgentInstance[];

  // Task queue state
  tasks: TaskWithMeta[];
  completedTasks: TaskWithMeta[];
  failedTasks: TaskWithMeta[];

  // UI state
  isQueuePaused: boolean;
  selectedAgentId: string | null;
  selectedTaskId: string | null;
  showLogs: boolean;
  logs: LogEntry[];

  // Settings
  maxConcurrentTasks: number;
  autoRetry: boolean;

  // Actions
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus, progress?: number) => void;

  queueTask: (task: Omit<Task, 'id' | 'status' | 'createdAt'>) => string;
  cancelTask: (taskId: string) => void;
  retryTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  clearFailedTasks: () => void;

  pauseQueue: () => void;
  resumeQueue: () => void;

  selectAgent: (agentId: string | null) => void;
  selectTask: (taskId: string | null) => void;
  toggleLogs: () => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;

  updateSettings: (settings: Partial<{ maxConcurrentTasks: number; autoRetry: boolean }>) => void;

  // Sync with runtime
  syncFromRuntime: () => void;
}

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useAgentsStore = create<AgentsState>()(
  persist(
    (set, get) => ({
      // Initial state
      agents: [],
      tasks: [],
      completedTasks: [],
      failedTasks: [],
      isQueuePaused: false,
      selectedAgentId: null,
      selectedTaskId: null,
      showLogs: false,
      logs: [],
      maxConcurrentTasks: 3,
      autoRetry: true,

      // Agent actions
      addAgent: (agent: Agent) => {
        const instance: AgentInstance = {
          id: agent.id,
          typeId: agent.id.split('-')[0],
          name: agent.name,
          description: agent.description,
          status: agent.getStatus(),
          progress: agent.getProgress(),
          currentTaskId: agent.getCurrentTask()?.id || null,
          createdAt: Date.now(),
        };

        set(state => ({
          agents: [...state.agents.filter(a => a.id !== agent.id), instance],
        }));
      },

      removeAgent: (agentId: string) => {
        const runtime = getAgentRuntime();
        runtime.terminateAgent(agentId);

        set(state => ({
          agents: state.agents.filter(a => a.id !== agentId),
          selectedAgentId: state.selectedAgentId === agentId ? null : state.selectedAgentId,
        }));
      },

      updateAgentStatus: (agentId: string, status: AgentStatus, progress?: number) => {
        set(state => ({
          agents: state.agents.map(a =>
            a.id === agentId
              ? { ...a, status, progress: progress ?? a.progress }
              : a
          ),
        }));
      },

      // Task actions
      queueTask: (taskData) => {
        const queue = getTaskQueue();
        const task = queue.add({
          id: generateId(),
          ...taskData,
        });

        const taskWithMeta: TaskWithMeta = {
          ...task,
          agentName: taskData.agentId
            ? get().agents.find(a => a.id === taskData.agentId)?.name
            : undefined,
        };

        set(state => ({
          tasks: [...state.tasks, taskWithMeta],
        }));

        return task.id;
      },

      cancelTask: (taskId: string) => {
        const queue = getTaskQueue();
        queue.cancel(taskId);

        set(state => ({
          tasks: state.tasks.filter(t => t.id !== taskId),
        }));
      },

      retryTask: (taskId: string) => {
        const queue = getTaskQueue();
        const newTask = queue.retry(taskId);

        if (newTask) {
          set(state => ({
            failedTasks: state.failedTasks.filter(t => t.id !== taskId),
            tasks: [...state.tasks, newTask],
          }));
        }
      },

      clearCompletedTasks: () => {
        set({ completedTasks: [] });
      },

      clearFailedTasks: () => {
        set({ failedTasks: [] });
      },

      // Queue control
      pauseQueue: () => {
        const queue = getTaskQueue();
        queue.pause();
        set({ isQueuePaused: true });
      },

      resumeQueue: () => {
        const queue = getTaskQueue();
        queue.resume();
        set({ isQueuePaused: false });
      },

      // UI actions
      selectAgent: (agentId: string | null) => {
        set({ selectedAgentId: agentId });
      },

      selectTask: (taskId: string | null) => {
        set({ selectedTaskId: taskId });
      },

      toggleLogs: () => {
        set(state => ({ showLogs: !state.showLogs }));
      },

      addLog: (log: LogEntry) => {
        set(state => {
          const logs = [...state.logs, log];
          // Keep last 500 logs
          if (logs.length > 500) {
            return { logs: logs.slice(-500) };
          }
          return { logs };
        });
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      // Settings
      updateSettings: (settings) => {
        set(state => ({
          maxConcurrentTasks: settings.maxConcurrentTasks ?? state.maxConcurrentTasks,
          autoRetry: settings.autoRetry ?? state.autoRetry,
        }));
      },

      // Sync with runtime
      syncFromRuntime: () => {
        const runtime = getAgentRuntime();
        const queue = getTaskQueue();

        // Sync agents
        const agents = runtime.getAllAgents().map(agent => ({
          id: agent.id,
          typeId: agent.id.split('-')[0],
          name: agent.name,
          description: agent.description,
          status: agent.getStatus(),
          progress: agent.getProgress(),
          currentTaskId: agent.getCurrentTask()?.id || null,
          createdAt: Date.now(),
        }));

        // Sync tasks
        const tasks = queue.getAll().map(task => ({
          ...task,
          agentName: task.agentId
            ? agents.find(a => a.id === task.agentId)?.name
            : undefined,
        }));

        const completedTasks = queue.getCompleted();
        const failedTasks = queue.getFailed();

        // Sync logs
        const logs = runtime.getLogs();

        set({
          agents,
          tasks,
          completedTasks,
          failedTasks,
          logs,
          isQueuePaused: queue.paused,
        });
      },
    }),
    {
      name: 'vyber-agents-storage',
      version: 1,
      partialize: (state) => ({
        // Only persist settings
        maxConcurrentTasks: state.maxConcurrentTasks,
        autoRetry: state.autoRetry,
      }),
    }
  )
);

// Set up runtime event listeners
export function initializeAgentStoreSync(): () => void {
  const runtime = getAgentRuntime();
  const queue = getTaskQueue();
  const store = useAgentsStore.getState();

  // Listen to runtime events
  const unsubRuntime = runtime.on('log', (data) => {
    store.addLog(data as LogEntry);
  });

  // Listen to queue events
  const unsubQueue = queue.subscribe((event) => {
    const store = useAgentsStore.getState();

    switch (event.type) {
      case 'task:added':
        store.syncFromRuntime();
        break;
      case 'task:started':
        store.syncFromRuntime();
        break;
      case 'task:completed':
        store.syncFromRuntime();
        break;
      case 'task:failed':
        store.syncFromRuntime();
        break;
      case 'queue:paused':
      case 'queue:resumed':
        store.syncFromRuntime();
        break;
    }
  });

  // Initial sync
  store.syncFromRuntime();

  return () => {
    unsubRuntime();
    unsubQueue();
  };
}
