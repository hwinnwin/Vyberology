/**
 * THE VYBER - Workflow Engine
 * Multi-step workflow orchestration for browser automation
 *
 * Unlike Atlas's 10-minute shopping cart chaos, we execute workflows
 * with precision and speed - Protocol 69 in action
 */

import type {
  Workflow,
  WorkflowStep,
  WorkflowCondition,
  Task,
  TaskPriority,
} from '../types';
import { getAgentRuntime } from '../core/AgentRuntime';
import { getTaskQueue } from '../core/TaskQueue';

// Workflow execution state
export type WorkflowState = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

// Workflow execution context
export interface WorkflowContext {
  workflowId: string;
  variables: Record<string, unknown>;
  currentStepIndex: number;
  stepResults: Map<string, unknown>;
  startTime: number;
  state: WorkflowState;
  error?: string;
}

// Workflow result
export interface WorkflowResult {
  workflowId: string;
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  duration: number;
  stepResults: Record<string, unknown>;
  error?: string;
}

// Workflow event
export type WorkflowEvent =
  | { type: 'workflow:started'; workflow: Workflow }
  | { type: 'workflow:completed'; result: WorkflowResult }
  | { type: 'workflow:failed'; error: string; workflowId: string }
  | { type: 'workflow:cancelled'; workflowId: string }
  | { type: 'workflow:paused'; workflowId: string }
  | { type: 'workflow:resumed'; workflowId: string }
  | { type: 'step:started'; workflowId: string; step: WorkflowStep }
  | { type: 'step:completed'; workflowId: string; stepId: string; result: unknown }
  | { type: 'step:failed'; workflowId: string; stepId: string; error: string };

type WorkflowEventHandler = (event: WorkflowEvent) => void;

/**
 * WorkflowEngine - Orchestrates multi-step browser automation
 */
export class WorkflowEngine {
  private static instance: WorkflowEngine | null = null;

  private workflows: Map<string, Workflow> = new Map();
  private runningWorkflows: Map<string, WorkflowContext> = new Map();
  private eventHandlers: Set<WorkflowEventHandler> = new Set();
  private scheduledWorkflows: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  /**
   * Register a workflow
   */
  public registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);

    // Set up schedule if specified
    if (workflow.schedule?.enabled) {
      this.scheduleWorkflow(workflow);
    }
  }

  /**
   * Unregister a workflow
   */
  public unregisterWorkflow(workflowId: string): void {
    this.workflows.delete(workflowId);
    this.cancelSchedule(workflowId);
  }

  /**
   * Get all registered workflows
   */
  public getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get a workflow by ID
   */
  public getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Execute a workflow
   */
  public async execute(workflowId: string, variables?: Record<string, unknown>): Promise<WorkflowResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return this.executeWorkflow(workflow, variables);
  }

  /**
   * Execute a workflow directly (without registration)
   */
  public async executeWorkflow(workflow: Workflow, variables?: Record<string, unknown>): Promise<WorkflowResult> {
    // Check if already running
    if (this.runningWorkflows.has(workflow.id)) {
      throw new Error(`Workflow already running: ${workflow.id}`);
    }

    // Create execution context
    const context: WorkflowContext = {
      workflowId: workflow.id,
      variables: { ...workflow.variables, ...variables },
      currentStepIndex: 0,
      stepResults: new Map(),
      startTime: Date.now(),
      state: 'running',
    };

    this.runningWorkflows.set(workflow.id, context);
    this.emit({ type: 'workflow:started', workflow });

    try {
      // Execute steps
      let currentStepId: string | undefined = workflow.steps[0]?.id;

      while (currentStepId && context.state === 'running') {
        const step = workflow.steps.find(s => s.id === currentStepId);
        if (!step) {
          throw new Error(`Step not found: ${currentStepId}`);
        }

        context.currentStepIndex = workflow.steps.findIndex(s => s.id === currentStepId);

        // Check conditions
        if (step.conditions && step.conditions.length > 0) {
          const conditionsMet = await this.evaluateConditions(step.conditions, context);
          if (!conditionsMet) {
            // Skip to next step or designated failure step
            currentStepId = step.onFailure === 'abort' ? undefined : step.onFailure || workflow.steps[context.currentStepIndex + 1]?.id;
            continue;
          }
        }

        // Execute step
        this.emit({ type: 'step:started', workflowId: workflow.id, step });

        try {
          const result = await this.executeStep(step, context);
          context.stepResults.set(step.id, result);
          this.emit({ type: 'step:completed', workflowId: workflow.id, stepId: step.id, result });

          // Determine next step
          currentStepId = step.onSuccess || workflow.steps[context.currentStepIndex + 1]?.id;
        } catch (stepError) {
          const errorMessage = stepError instanceof Error ? stepError.message : String(stepError);
          this.emit({ type: 'step:failed', workflowId: workflow.id, stepId: step.id, error: errorMessage });

          // Handle failure
          if (step.onFailure === 'abort') {
            throw stepError;
          } else if (step.onFailure) {
            currentStepId = step.onFailure;
          } else {
            throw stepError;
          }
        }

        // Check for pause (can be triggered externally during async step execution)
        // Re-fetch state to check for external modifications
        const currentState = this.runningWorkflows.get(workflow.id)?.state;
        if (currentState === 'paused') {
          await this.waitForResume(workflow.id);
        }
      }

      // Success
      context.state = 'completed';
      const result = this.createResult(workflow, context, true);
      this.emit({ type: 'workflow:completed', result });
      return result;

    } catch (error) {
      context.state = 'failed';
      context.error = error instanceof Error ? error.message : String(error);
      const result = this.createResult(workflow, context, false);
      this.emit({ type: 'workflow:failed', error: context.error, workflowId: workflow.id });
      return result;

    } finally {
      this.runningWorkflows.delete(workflow.id);
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<unknown> {
    const runtime = getAgentRuntime();
    const queue = getTaskQueue();

    // Resolve variables in action
    const resolvedAction = this.resolveVariables(step.action, context);

    // Create task for the step
    const task: Task = {
      id: `${context.workflowId}-${step.id}-${Date.now()}`,
      type: this.getTaskType(resolvedAction),
      name: step.name,
      priority: 'high' as TaskPriority,
      status: 'queued',
      payload: this.getTaskPayload(resolvedAction),
      createdAt: Date.now(),
      timeout: 60000,
    };

    // Add to queue and execute
    queue.add(task);

    // Get agent for this task type
    const agentId = this.getAgentForTask(task.type);
    if (!agentId) {
      throw new Error(`No agent available for task type: ${task.type}`);
    }

    // Execute
    const result = await runtime.executeTask(agentId, task);

    if (!result.success) {
      throw new Error(result.error?.message || 'Step execution failed');
    }

    return result.data;
  }

  /**
   * Get task type from action
   */
  private getTaskType(action: WorkflowStep['action']): string {
    if ('type' in action && 'selector' in action) {
      // DOMAction
      return `dom.${action.type}`;
    }
    // Task
    return (action as Task).type;
  }

  /**
   * Get task payload from action
   */
  private getTaskPayload(action: WorkflowStep['action']): Record<string, unknown> {
    if ('type' in action && 'selector' in action) {
      // DOMAction - convert to payload
      return {
        selector: action.selector,
        value: action.value,
        ...action.options,
      };
    }
    // Task - use its payload
    return (action as Task).payload;
  }

  /**
   * Get agent ID for task type
   */
  private getAgentForTask(taskType: string): string | null {
    const runtime = getAgentRuntime();
    const agents = runtime.getAllAgents();

    // Find agent that can handle this task type
    for (const agent of agents) {
      const capability = agent.capabilities.find(c => c.id === taskType);
      if (capability) {
        return agent.id;
      }
    }

    // Default mappings
    if (taskType.startsWith('dom.')) {
      return agents.find(a => a.id.includes('dom'))?.id || null;
    }
    if (taskType.startsWith('form.')) {
      return agents.find(a => a.id.includes('form'))?.id || null;
    }
    if (taskType.startsWith('navigation.')) {
      return agents.find(a => a.id.includes('navigation'))?.id || null;
    }

    return null;
  }

  /**
   * Resolve variables in action
   */
  private resolveVariables(action: WorkflowStep['action'], context: WorkflowContext): WorkflowStep['action'] {
    const actionStr = JSON.stringify(action);

    // Replace {{variable}} patterns
    const resolved = actionStr.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
      if (context.variables[varName] !== undefined) {
        return String(context.variables[varName]);
      }
      // Check step results
      if (context.stepResults.has(varName)) {
        return JSON.stringify(context.stepResults.get(varName));
      }
      return `{{${varName}}}`;
    });

    return JSON.parse(resolved);
  }

  /**
   * Evaluate step conditions
   */
  private async evaluateConditions(conditions: WorkflowCondition[], context: WorkflowContext): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context);
      const finalResult = condition.negate ? !result : result;

      if (!finalResult) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(condition: WorkflowCondition, _context: WorkflowContext): Promise<boolean> {
    switch (condition.type) {
      case 'element_exists':
        if (!condition.selector) return false;
        return !!document.querySelector(condition.selector);

      case 'element_visible':
        if (!condition.selector) return false;
        const element = document.querySelector(condition.selector);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;

      case 'text_contains':
        if (!condition.selector || !condition.value) return false;
        const textEl = document.querySelector(condition.selector);
        return textEl?.textContent?.includes(condition.value) || false;

      case 'url_matches':
        if (!condition.value) return false;
        return new RegExp(condition.value).test(window.location.href);

      case 'custom':
        // Custom conditions would need a callback mechanism
        return true;

      default:
        return true;
    }
  }

  /**
   * Create workflow result
   */
  private createResult(workflow: Workflow, context: WorkflowContext, success: boolean): WorkflowResult {
    const stepResults: Record<string, unknown> = {};
    context.stepResults.forEach((value, key) => {
      stepResults[key] = value;
    });

    return {
      workflowId: workflow.id,
      success,
      completedSteps: context.stepResults.size,
      totalSteps: workflow.steps.length,
      duration: Date.now() - context.startTime,
      stepResults,
      error: context.error,
    };
  }

  /**
   * Pause a running workflow
   */
  public pause(workflowId: string): boolean {
    const context = this.runningWorkflows.get(workflowId);
    if (context && context.state === 'running') {
      context.state = 'paused';
      this.emit({ type: 'workflow:paused', workflowId });
      return true;
    }
    return false;
  }

  /**
   * Resume a paused workflow
   */
  public resume(workflowId: string): boolean {
    const context = this.runningWorkflows.get(workflowId);
    if (context && context.state === 'paused') {
      context.state = 'running';
      this.emit({ type: 'workflow:resumed', workflowId });
      return true;
    }
    return false;
  }

  /**
   * Wait for workflow to be resumed
   */
  private waitForResume(workflowId: string): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        const context = this.runningWorkflows.get(workflowId);
        if (!context || context.state !== 'paused') {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * Cancel a running workflow
   */
  public cancel(workflowId: string): boolean {
    const context = this.runningWorkflows.get(workflowId);
    if (context) {
      context.state = 'cancelled';
      this.runningWorkflows.delete(workflowId);
      this.emit({ type: 'workflow:cancelled', workflowId });
      return true;
    }
    return false;
  }

  /**
   * Get workflow state
   */
  public getState(workflowId: string): WorkflowState | undefined {
    return this.runningWorkflows.get(workflowId)?.state;
  }

  /**
   * Get workflow context
   */
  public getContext(workflowId: string): WorkflowContext | undefined {
    return this.runningWorkflows.get(workflowId);
  }

  /**
   * Schedule a workflow
   */
  private scheduleWorkflow(workflow: Workflow): void {
    if (!workflow.schedule?.enabled) return;

    // Cancel existing schedule
    this.cancelSchedule(workflow.id);

    // Simple interval-based scheduling
    if (workflow.schedule.interval) {
      const intervalId = setInterval(() => {
        this.executeWorkflow(workflow).catch(console.error);
      }, workflow.schedule.interval);

      this.scheduledWorkflows.set(workflow.id, intervalId);
    }

    // Cron scheduling would require a cron parser library
    // For now, just use interval
  }

  /**
   * Cancel workflow schedule
   */
  private cancelSchedule(workflowId: string): void {
    const intervalId = this.scheduledWorkflows.get(workflowId);
    if (intervalId) {
      clearInterval(intervalId);
      this.scheduledWorkflows.delete(workflowId);
    }
  }

  /**
   * Subscribe to workflow events
   */
  public subscribe(handler: WorkflowEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Emit event
   */
  private emit(event: WorkflowEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('[WorkflowEngine] Event handler error:', error);
      }
    });
  }

  /**
   * Shutdown
   */
  public shutdown(): void {
    // Cancel all running workflows
    this.runningWorkflows.forEach((_, id) => this.cancel(id));

    // Cancel all schedules
    this.scheduledWorkflows.forEach((_, id) => this.cancelSchedule(id));

    this.workflows.clear();
    this.eventHandlers.clear();
  }
}

// Singleton getter
export function getWorkflowEngine(): WorkflowEngine {
  return WorkflowEngine.getInstance();
}

/**
 * Helper to create a workflow
 */
export function createWorkflow(
  id: string,
  name: string,
  steps: WorkflowStep[],
  options?: Partial<Workflow>
): Workflow {
  return {
    id,
    name,
    steps,
    description: options?.description,
    variables: options?.variables,
    schedule: options?.schedule,
  };
}

/**
 * Helper to create a workflow step
 */
export function createStep(
  id: string,
  name: string,
  agentId: string,
  action: WorkflowStep['action'],
  options?: Partial<WorkflowStep>
): WorkflowStep {
  return {
    id,
    name,
    agentId,
    action,
    conditions: options?.conditions,
    onSuccess: options?.onSuccess,
    onFailure: options?.onFailure,
  };
}
