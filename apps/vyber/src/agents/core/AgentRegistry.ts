/**
 * THE VYBER - Agent Registry
 * Central registry for managing agent definitions and instances
 */

import type {
  Agent,
  AgentMetadata,
  AgentCapability,
  AgentConfig,
  AgentStatus,
  Task,
  TaskResult,
  LogEntry,
} from '../types';
import { getAgentRuntime } from './AgentRuntime';

// Generate unique IDs
function generateId(): string {
  return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * BaseAgent - Abstract base class for all agents
 * Provides common functionality that all agents share
 */
export abstract class BaseAgent implements Agent {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  config: AgentConfig;

  protected status: AgentStatus = 'idle';
  protected progress = 0;
  protected logs: LogEntry[] = [];
  protected currentTask: Task | null = null;

  constructor(metadata: AgentMetadata) {
    this.id = metadata.id || generateId();
    this.name = metadata.name;
    this.description = metadata.description;
    this.version = metadata.version;
    this.capabilities = metadata.capabilities;
    this.config = {
      maxConcurrentTasks: 1,
      defaultTimeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        backoffMultiplier: 2,
      },
      ...metadata.config,
    };
  }

  // Logging helper
  protected log(
    level: LogEntry['level'],
    message: string,
    data?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      level,
      message,
      data,
      agentId: this.id,
      taskId: this.currentTask?.id,
    };
    this.logs.push(entry);

    // Keep log size manageable
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(-500);
    }
  }

  // Lifecycle methods
  async initialize(): Promise<void> {
    this.status = 'initializing';
    this.log('info', `Initializing ${this.name}`);

    try {
      await this.onInitialize();
      this.status = 'idle';
      this.log('info', `${this.name} initialized successfully`);
    } catch (error) {
      this.status = 'failed';
      this.log('error', `Failed to initialize ${this.name}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async execute(task: Task): Promise<TaskResult> {
    this.currentTask = task;
    this.status = 'running';
    this.progress = 0;
    const startTime = Date.now();
    const taskLogs: LogEntry[] = [];

    this.log('info', `Starting task: ${task.name}`, { taskType: task.type });

    try {
      const result = await this.onExecute(task);

      this.status = 'completed';
      this.progress = 100;
      this.log('info', `Completed task: ${task.name}`, { success: true });

      // Collect logs generated during this task
      taskLogs.push(...this.logs.filter(l => l.taskId === task.id));

      return {
        taskId: task.id,
        success: true,
        data: result,
        duration: Date.now() - startTime,
        logs: taskLogs,
      };
    } catch (error) {
      this.status = 'failed';
      this.log('error', `Task failed: ${task.name}`, {
        error: error instanceof Error ? error.message : String(error),
      });

      taskLogs.push(...this.logs.filter(l => l.taskId === task.id));

      return {
        taskId: task.id,
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        duration: Date.now() - startTime,
        logs: taskLogs,
      };
    } finally {
      this.currentTask = null;
      if (this.status !== 'failed') {
        this.status = 'idle';
      }
    }
  }

  pause(): void {
    if (this.status === 'running') {
      this.status = 'paused';
      this.log('info', `${this.name} paused`);
      this.onPause();
    }
  }

  resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
      this.log('info', `${this.name} resumed`);
      this.onResume();
    }
  }

  terminate(): void {
    this.status = 'terminated';
    this.log('info', `${this.name} terminated`);
    this.onTerminate();
    this.currentTask = null;
  }

  // Status methods
  getStatus(): AgentStatus {
    return this.status;
  }

  getProgress(): number {
    return this.progress;
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getCurrentTask(): Task | null {
    return this.currentTask;
  }

  // Protected helper to update progress
  protected setProgress(value: number): void {
    this.progress = Math.max(0, Math.min(100, value));
  }

  // Abstract methods to be implemented by concrete agents
  protected abstract onInitialize(): Promise<void>;
  protected abstract onExecute(task: Task): Promise<unknown>;
  protected onPause(): void {}
  protected onResume(): void {}
  protected onTerminate(): void {}
}

// Registry event types
export type RegistryEvent =
  | { type: 'agent:registered'; metadata: AgentMetadata }
  | { type: 'agent:unregistered'; agentId: string }
  | { type: 'agent:instantiated'; agent: Agent };

export type RegistryEventHandler = (event: RegistryEvent) => void;

// Agent factory function type
export type AgentFactory = (config?: Partial<AgentConfig>) => Agent;

/**
 * AgentRegistry - Central registry for agent types and instances
 *
 * Features:
 * - Register agent types with metadata
 * - Create agent instances from registered types
 * - Track available capabilities
 * - Discovery of agents by capability
 */
class AgentRegistryImpl {
  private agentTypes: Map<string, { metadata: AgentMetadata; factory: AgentFactory }> = new Map();
  private eventHandlers: Set<RegistryEventHandler> = new Set();

  // Event handling
  subscribe(handler: RegistryEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: RegistryEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Registry event handler error:', error);
      }
    });
  }

  // Register an agent type
  register(metadata: AgentMetadata, factory: AgentFactory): void {
    if (this.agentTypes.has(metadata.id)) {
      console.warn(`Agent type ${metadata.id} already registered, replacing`);
    }

    this.agentTypes.set(metadata.id, { metadata, factory });
    this.emit({ type: 'agent:registered', metadata });

    console.log(`[AgentRegistry] Registered agent type: ${metadata.name} (${metadata.id})`);
  }

  // Unregister an agent type
  unregister(agentTypeId: string): boolean {
    const removed = this.agentTypes.delete(agentTypeId);
    if (removed) {
      this.emit({ type: 'agent:unregistered', agentId: agentTypeId });
    }
    return removed;
  }

  // Create an agent instance
  create(agentTypeId: string, config?: Partial<AgentConfig>): Agent {
    const registered = this.agentTypes.get(agentTypeId);
    if (!registered) {
      throw new Error(`Agent type ${agentTypeId} not registered`);
    }

    const agent = registered.factory(config);

    // Register with runtime
    const runtime = getAgentRuntime();
    runtime.registerAgent(agent);

    this.emit({ type: 'agent:instantiated', agent });

    return agent;
  }

  // Get all registered agent types
  getRegisteredTypes(): AgentMetadata[] {
    return Array.from(this.agentTypes.values()).map(r => r.metadata);
  }

  // Get a specific agent type's metadata
  getTypeMetadata(agentTypeId: string): AgentMetadata | undefined {
    return this.agentTypes.get(agentTypeId)?.metadata;
  }

  // Check if an agent type is registered
  isRegistered(agentTypeId: string): boolean {
    return this.agentTypes.has(agentTypeId);
  }

  // Find agents by capability
  findByCapability(capabilityId: string): AgentMetadata[] {
    return this.getRegisteredTypes().filter(metadata =>
      metadata.capabilities.some(cap => cap.id === capabilityId)
    );
  }

  // Get all available capabilities
  getAllCapabilities(): AgentCapability[] {
    const capabilityMap = new Map<string, AgentCapability>();

    for (const { metadata } of this.agentTypes.values()) {
      for (const capability of metadata.capabilities) {
        if (!capabilityMap.has(capability.id)) {
          capabilityMap.set(capability.id, capability);
        }
      }
    }

    return Array.from(capabilityMap.values());
  }

  // Clear all registrations
  clear(): void {
    this.agentTypes.clear();
  }
}

// Singleton instance
export const AgentRegistry = new AgentRegistryImpl();

// Helper function to create agent metadata
export function defineAgent(
  id: string,
  name: string,
  description: string,
  capabilities: AgentCapability[],
  config?: Partial<AgentConfig>
): AgentMetadata {
  return {
    id,
    name,
    description,
    version: '1.0.0',
    capabilities,
    config: config || {},
  };
}

// Helper to define a capability
export function defineCapability(
  id: string,
  name: string,
  description: string,
  requiredPermissions?: string[]
): AgentCapability {
  return {
    id,
    name,
    description,
    requiredPermissions,
  };
}
