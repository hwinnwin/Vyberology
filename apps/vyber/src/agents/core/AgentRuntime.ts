/**
 * THE VYBER - Agent Runtime
 * Core execution environment for all agents
 */

import type {
  Agent,
  Task,
  TaskResult,
  LogEntry,
} from '../types';

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a log entry
function createLog(
  level: LogEntry['level'],
  message: string,
  data?: Record<string, unknown>,
  agentId?: string,
  taskId?: string
): LogEntry {
  return {
    id: generateId(),
    timestamp: Date.now(),
    level,
    message,
    data,
    agentId,
    taskId,
  };
}

/**
 * AgentRuntime - The execution environment for agents
 *
 * Responsibilities:
 * - Manage agent lifecycle (init, run, pause, terminate)
 * - Execute tasks with proper error handling
 * - Track progress and logs
 * - Handle timeouts and retries
 */
export class AgentRuntime {
  private agents: Map<string, Agent> = new Map();
  private runningTasks: Map<string, { agent: Agent; task: Task; abortController: AbortController }> = new Map();
  private logs: LogEntry[] = [];
  private maxLogSize = 1000;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.log('info', 'AgentRuntime initialized');
  }

  // Logging
  private log(
    level: LogEntry['level'],
    message: string,
    data?: Record<string, unknown>,
    agentId?: string,
    taskId?: string
  ): void {
    const entry = createLog(level, message, data, agentId, taskId);
    this.logs.push(entry);

    // Trim logs if too large
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Emit log event
    this.emit('log', entry);

    // Console output for debugging
    const prefix = `[AgentRuntime]${agentId ? ` [${agentId}]` : ''}${taskId ? ` [Task:${taskId.slice(0, 8)}]` : ''}`;
    switch (level) {
      case 'error':
        console.error(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'debug':
        console.debug(prefix, message, data || '');
        break;
      default:
        console.log(prefix, message, data || '');
    }
  }

  // Event system
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  // Agent registration
  registerAgent(agent: Agent): void {
    if (this.agents.has(agent.id)) {
      this.log('warn', `Agent ${agent.id} already registered, replacing`, { agentId: agent.id });
    }

    this.agents.set(agent.id, agent);
    this.log('info', `Agent registered: ${agent.name}`, {
      agentId: agent.id,
      capabilities: agent.capabilities.map(c => c.name)
    }, agent.id);

    this.emit('agent:registered', agent);
  }

  unregisterAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.log('warn', `Agent ${agentId} not found for unregistration`);
      return false;
    }

    // Terminate if running
    if (agent.getStatus() !== 'idle' && agent.getStatus() !== 'terminated') {
      agent.terminate();
    }

    this.agents.delete(agentId);
    this.log('info', `Agent unregistered: ${agent.name}`, { agentId }, agentId);
    this.emit('agent:unregistered', { agentId });

    return true;
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  // Agent initialization
  async initializeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.log('info', `Initializing agent: ${agent.name}`, { agentId }, agentId);

    try {
      await agent.initialize();
      this.log('info', `Agent initialized: ${agent.name}`, { agentId }, agentId);
      this.emit('agent:initialized', agent);
    } catch (error) {
      this.log('error', `Failed to initialize agent: ${agent.name}`, {
        agentId,
        error: error instanceof Error ? error.message : String(error)
      }, agentId);
      throw error;
    }
  }

  // Task execution
  async executeTask(agentId: string, task: Task): Promise<TaskResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const startTime = Date.now();
    const taskLogs: LogEntry[] = [];
    const abortController = new AbortController();

    // Track running task
    this.runningTasks.set(task.id, { agent, task, abortController });

    this.log('info', `Starting task: ${task.name}`, {
      taskId: task.id,
      type: task.type,
      priority: task.priority
    }, agentId, task.id);

    this.emit('task:started', { agentId, task });

    // Set up timeout if specified
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (task.timeout) {
      timeoutId = setTimeout(() => {
        abortController.abort();
        this.log('warn', `Task timed out: ${task.name}`, {
          taskId: task.id,
          timeout: task.timeout
        }, agentId, task.id);
      }, task.timeout);
    }

    try {
      const result = await agent.execute(task);

      // Collect logs from the task
      taskLogs.push(...result.logs);

      const duration = Date.now() - startTime;

      const finalResult: TaskResult = {
        ...result,
        taskId: task.id,
        duration,
        logs: taskLogs,
      };

      this.log(
        result.success ? 'info' : 'warn',
        `Task ${result.success ? 'completed' : 'failed'}: ${task.name}`,
        { taskId: task.id, duration, success: result.success },
        agentId,
        task.id
      );

      this.emit('task:completed', { agentId, task, result: finalResult });

      return finalResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if we should retry
      const retriesRemaining = task.retriesRemaining ?? task.retries ?? 0;
      if (retriesRemaining > 0 && !abortController.signal.aborted) {
        this.log('info', `Retrying task: ${task.name}`, {
          taskId: task.id,
          retriesRemaining
        }, agentId, task.id);

        // Wait before retry (exponential backoff)
        const backoffMs = agent.config.retryPolicy?.backoffMs ?? 1000;
        const multiplier = agent.config.retryPolicy?.backoffMultiplier ?? 2;
        const retryDelay = backoffMs * Math.pow(multiplier, (task.retries ?? 0) - retriesRemaining);

        await new Promise(resolve => setTimeout(resolve, retryDelay));

        return this.executeTask(agentId, {
          ...task,
          retriesRemaining: retriesRemaining - 1,
        });
      }

      const failedResult: TaskResult = {
        taskId: task.id,
        success: false,
        error: {
          message: errorMessage,
          code: abortController.signal.aborted ? 'TIMEOUT' : 'EXECUTION_ERROR',
          stack: error instanceof Error ? error.stack : undefined,
        },
        duration,
        logs: taskLogs,
      };

      this.log('error', `Task failed: ${task.name}`, {
        taskId: task.id,
        error: errorMessage
      }, agentId, task.id);

      this.emit('task:failed', { agentId, task, result: failedResult });

      return failedResult;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      this.runningTasks.delete(task.id);
    }
  }

  // Cancel a running task
  cancelTask(taskId: string): boolean {
    const running = this.runningTasks.get(taskId);
    if (!running) {
      this.log('warn', `Task ${taskId} not found or not running`);
      return false;
    }

    running.abortController.abort();
    this.log('info', `Task cancelled: ${running.task.name}`, { taskId });
    this.emit('task:cancelled', { task: running.task });

    return true;
  }

  // Pause an agent
  pauseAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.log('warn', `Agent ${agentId} not found`);
      return false;
    }

    agent.pause();
    this.log('info', `Agent paused: ${agent.name}`, { agentId }, agentId);
    this.emit('agent:paused', agent);

    return true;
  }

  // Resume an agent
  resumeAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.log('warn', `Agent ${agentId} not found`);
      return false;
    }

    agent.resume();
    this.log('info', `Agent resumed: ${agent.name}`, { agentId }, agentId);
    this.emit('agent:resumed', agent);

    return true;
  }

  // Terminate an agent
  terminateAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.log('warn', `Agent ${agentId} not found`);
      return false;
    }

    // Cancel all running tasks for this agent
    for (const [taskId, running] of this.runningTasks) {
      if (running.agent.id === agentId) {
        running.abortController.abort();
        this.runningTasks.delete(taskId);
      }
    }

    agent.terminate();
    this.log('info', `Agent terminated: ${agent.name}`, { agentId }, agentId);
    this.emit('agent:terminated', agent);

    return true;
  }

  // Get all logs
  getLogs(filter?: { agentId?: string; taskId?: string; level?: LogEntry['level'] }): LogEntry[] {
    if (!filter) return [...this.logs];

    return this.logs.filter(log => {
      if (filter.agentId && log.agentId !== filter.agentId) return false;
      if (filter.taskId && log.taskId !== filter.taskId) return false;
      if (filter.level && log.level !== filter.level) return false;
      return true;
    });
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.log('info', 'Logs cleared');
  }

  // Get running tasks
  getRunningTasks(): Task[] {
    return Array.from(this.runningTasks.values()).map(r => r.task);
  }

  // Shutdown runtime
  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down AgentRuntime');

    // Cancel all running tasks
    for (const [taskId, running] of this.runningTasks) {
      running.abortController.abort();
      this.runningTasks.delete(taskId);
    }

    // Terminate all agents
    for (const agent of this.agents.values()) {
      try {
        agent.terminate();
      } catch (error) {
        this.log('error', `Error terminating agent: ${agent.name}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    this.agents.clear();
    this.eventListeners.clear();

    this.log('info', 'AgentRuntime shutdown complete');
  }
}

// Singleton instance
let runtimeInstance: AgentRuntime | null = null;

export function getAgentRuntime(): AgentRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new AgentRuntime();
  }
  return runtimeInstance;
}

export function resetAgentRuntime(): void {
  if (runtimeInstance) {
    runtimeInstance.shutdown();
    runtimeInstance = null;
  }
}
