/**
 * THE VYBER - Agentic Engine Types
 * Core type definitions for the agent system
 */

// Agent status enum
export type AgentStatus =
  | 'idle'
  | 'initializing'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'terminated';

// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// Task status
export type TaskStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

// Log entry for agent activity
export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
  agentId?: string;
  taskId?: string;
}

// Task definition
export interface Task {
  id: string;
  type: string;
  name: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  payload: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  retriesRemaining?: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  agentId?: string;
  parentTaskId?: string;
  childTaskIds?: string[];
}

// Task result
export interface TaskResult {
  taskId: string;
  success: boolean;
  data?: unknown;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  duration: number;
  logs: LogEntry[];
}

// Agent capability descriptor
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  requiredPermissions?: string[];
}

// Agent configuration
export interface AgentConfig {
  maxConcurrentTasks?: number;
  defaultTimeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
}

// Core agent interface - all agents implement this
export interface Agent {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  config: AgentConfig;

  // Lifecycle methods
  initialize(): Promise<void>;
  execute(task: Task): Promise<TaskResult>;
  pause(): void;
  resume(): void;
  terminate(): void;

  // Status methods
  getStatus(): AgentStatus;
  getProgress(): number;
  getLogs(): LogEntry[];
  getCurrentTask(): Task | null;
}

// Agent metadata for registration
export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  icon?: string;
  capabilities: AgentCapability[];
  config: AgentConfig;
}

// DOM action types for web automation
export type DOMActionType =
  | 'click'
  | 'type'
  | 'select'
  | 'scroll'
  | 'hover'
  | 'focus'
  | 'blur'
  | 'wait'
  | 'screenshot'
  | 'extract';

// DOM action definition
export interface DOMAction {
  type: DOMActionType;
  selector?: string;
  value?: string;
  options?: {
    delay?: number;
    timeout?: number;
    scrollIntoView?: boolean;
    clearFirst?: boolean;
  };
}

// Extracted data from page
export interface ExtractedData {
  selector: string;
  type: 'text' | 'html' | 'attribute' | 'value' | 'list';
  value: string | string[];
  attribute?: string;
}

// Workflow step definition
export interface WorkflowStep {
  id: string;
  name: string;
  agentId: string;
  action: DOMAction | Task;
  conditions?: WorkflowCondition[];
  onSuccess?: string; // next step ID
  onFailure?: string; // step ID or 'abort'
}

// Workflow condition
export interface WorkflowCondition {
  type: 'element_exists' | 'element_visible' | 'text_contains' | 'url_matches' | 'custom';
  selector?: string;
  value?: string;
  negate?: boolean;
}

// Workflow definition
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  variables?: Record<string, unknown>;
  schedule?: WorkflowSchedule;
}

// Workflow schedule
export interface WorkflowSchedule {
  enabled: boolean;
  cron?: string;
  interval?: number;
  timezone?: string;
  nextRun?: number;
  lastRun?: number;
}

// Monitor configuration
export interface MonitorConfig {
  url: string;
  selector?: string;
  checkInterval: number;
  conditions: MonitorCondition[];
  notifications: NotificationConfig[];
}

// Monitor condition
export interface MonitorCondition {
  type: 'price_below' | 'price_above' | 'text_changed' | 'element_appeared' | 'element_disappeared' | 'custom';
  value?: string | number;
  selector?: string;
}

// Notification configuration
export interface NotificationConfig {
  type: 'browser' | 'desktop' | 'email' | 'webhook';
  enabled: boolean;
  config?: Record<string, unknown>;
}

// Research report
export interface ResearchReport {
  id: string;
  title: string;
  query: string;
  sources: ResearchSource[];
  summary: string;
  sections: ReportSection[];
  createdAt: number;
  updatedAt: number;
}

// Research source
export interface ResearchSource {
  url: string;
  title: string;
  excerpt?: string;
  relevance: number;
  accessedAt: number;
}

// Report section
export interface ReportSection {
  title: string;
  content: string;
  sources: string[]; // URLs
}
