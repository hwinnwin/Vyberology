/**
 * THE VYBER - Task Queue
 * Priority-based task queuing system for agent execution
 */

import type { Task, TaskPriority } from '../types';

// Priority weights for sorting
const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Generate unique IDs
function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Queue event types
export type QueueEvent =
  | { type: 'task:added'; task: Task }
  | { type: 'task:removed'; taskId: string }
  | { type: 'task:updated'; task: Task }
  | { type: 'task:started'; task: Task }
  | { type: 'task:completed'; task: Task }
  | { type: 'task:failed'; task: Task; error: string }
  | { type: 'queue:cleared' }
  | { type: 'queue:paused' }
  | { type: 'queue:resumed' };

export type QueueEventHandler = (event: QueueEvent) => void;

/**
 * TaskQueue - Priority-based task queue
 *
 * Features:
 * - Priority-based ordering (critical > high > medium > low)
 * - FIFO within same priority
 * - Pause/resume functionality
 * - Task dependencies
 * - Event system for reactivity
 */
export class TaskQueue {
  private queue: Task[] = [];
  private completedTasks: Task[] = [];
  private failedTasks: Task[] = [];
  private isPaused = false;
  private maxCompletedHistory = 100;
  private eventHandlers: Set<QueueEventHandler> = new Set();

  constructor() {
    // Initialize
  }

  // Event handling
  subscribe(handler: QueueEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: QueueEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Queue event handler error:', error);
      }
    });
  }

  // Add a task to the queue
  add(taskData: Partial<Task> & { type: string; name: string }): Task {
    const task: Task = {
      id: taskData.id || generateId(),
      type: taskData.type,
      name: taskData.name,
      description: taskData.description,
      priority: taskData.priority || 'medium',
      status: 'queued',
      payload: taskData.payload || {},
      timeout: taskData.timeout,
      retries: taskData.retries,
      retriesRemaining: taskData.retries,
      createdAt: Date.now(),
      parentTaskId: taskData.parentTaskId,
      childTaskIds: taskData.childTaskIds || [],
    };

    // Insert in priority order
    const insertIndex = this.findInsertIndex(task);
    this.queue.splice(insertIndex, 0, task);

    this.emit({ type: 'task:added', task });

    return task;
  }

  // Find the correct position for a task based on priority
  private findInsertIndex(task: Task): number {
    const taskWeight = PRIORITY_WEIGHTS[task.priority];

    for (let i = 0; i < this.queue.length; i++) {
      const existingWeight = PRIORITY_WEIGHTS[this.queue[i].priority];
      if (taskWeight > existingWeight) {
        return i;
      }
    }

    return this.queue.length;
  }

  // Get the next task to execute
  getNext(): Task | null {
    if (this.isPaused) return null;

    // Find the first queued task
    const task = this.queue.find(t => t.status === 'queued');
    if (!task) return null;

    // Check if task has unfinished parent
    if (task.parentTaskId) {
      const parent = this.findTask(task.parentTaskId);
      if (parent && parent.status !== 'completed') {
        return null;
      }
    }

    return task;
  }

  // Mark a task as started
  start(taskId: string): Task | null {
    const task = this.queue.find(t => t.id === taskId);
    if (!task) return null;

    task.status = 'running';
    task.startedAt = Date.now();

    this.emit({ type: 'task:started', task });

    return task;
  }

  // Mark a task as completed
  complete(taskId: string, _result?: unknown): Task | null {
    const index = this.queue.findIndex(t => t.id === taskId);
    if (index === -1) return null;

    const task = this.queue[index];
    task.status = 'completed';
    task.completedAt = Date.now();

    // Remove from queue
    this.queue.splice(index, 1);

    // Add to completed history
    this.completedTasks.unshift(task);
    if (this.completedTasks.length > this.maxCompletedHistory) {
      this.completedTasks.pop();
    }

    this.emit({ type: 'task:completed', task });

    return task;
  }

  // Mark a task as failed
  fail(taskId: string, error: string): Task | null {
    const index = this.queue.findIndex(t => t.id === taskId);
    if (index === -1) return null;

    const task = this.queue[index];
    task.status = 'failed';
    task.completedAt = Date.now();

    // Remove from queue
    this.queue.splice(index, 1);

    // Add to failed history
    this.failedTasks.unshift(task);
    if (this.failedTasks.length > this.maxCompletedHistory) {
      this.failedTasks.pop();
    }

    this.emit({ type: 'task:failed', task, error });

    return task;
  }

  // Cancel a task
  cancel(taskId: string): Task | null {
    const index = this.queue.findIndex(t => t.id === taskId);
    if (index === -1) return null;

    const task = this.queue[index];
    task.status = 'cancelled';
    task.completedAt = Date.now();

    this.queue.splice(index, 1);

    this.emit({ type: 'task:removed', taskId });

    return task;
  }

  // Pause a task
  pauseTask(taskId: string): Task | null {
    const task = this.queue.find(t => t.id === taskId);
    if (!task) return null;

    task.status = 'paused';

    this.emit({ type: 'task:updated', task });

    return task;
  }

  // Resume a task
  resumeTask(taskId: string): Task | null {
    const task = this.queue.find(t => t.id === taskId);
    if (!task || task.status !== 'paused') return null;

    task.status = 'queued';

    this.emit({ type: 'task:updated', task });

    return task;
  }

  // Find a task by ID (in any state)
  findTask(taskId: string): Task | null {
    return (
      this.queue.find(t => t.id === taskId) ||
      this.completedTasks.find(t => t.id === taskId) ||
      this.failedTasks.find(t => t.id === taskId) ||
      null
    );
  }

  // Get all queued tasks
  getQueued(): Task[] {
    return this.queue.filter(t => t.status === 'queued');
  }

  // Get all running tasks
  getRunning(): Task[] {
    return this.queue.filter(t => t.status === 'running');
  }

  // Get all paused tasks
  getPaused(): Task[] {
    return this.queue.filter(t => t.status === 'paused');
  }

  // Get completed tasks
  getCompleted(): Task[] {
    return [...this.completedTasks];
  }

  // Get failed tasks
  getFailed(): Task[] {
    return [...this.failedTasks];
  }

  // Get all tasks (excluding completed/failed history)
  getAll(): Task[] {
    return [...this.queue];
  }

  // Get queue length
  get length(): number {
    return this.queue.length;
  }

  // Get queued count
  get queuedCount(): number {
    return this.queue.filter(t => t.status === 'queued').length;
  }

  // Get running count
  get runningCount(): number {
    return this.queue.filter(t => t.status === 'running').length;
  }

  // Pause the queue
  pause(): void {
    this.isPaused = true;
    this.emit({ type: 'queue:paused' });
  }

  // Resume the queue
  resume(): void {
    this.isPaused = false;
    this.emit({ type: 'queue:resumed' });
  }

  // Check if paused
  get paused(): boolean {
    return this.isPaused;
  }

  // Clear all queued tasks
  clear(): void {
    // Cancel all queued tasks
    this.queue
      .filter(t => t.status === 'queued')
      .forEach(t => {
        t.status = 'cancelled';
        t.completedAt = Date.now();
      });

    this.queue = this.queue.filter(t => t.status === 'running');

    this.emit({ type: 'queue:cleared' });
  }

  // Clear history
  clearHistory(): void {
    this.completedTasks = [];
    this.failedTasks = [];
  }

  // Retry a failed task
  retry(taskId: string): Task | null {
    const failedTask = this.failedTasks.find(t => t.id === taskId);
    if (!failedTask) return null;

    // Remove from failed
    this.failedTasks = this.failedTasks.filter(t => t.id !== taskId);

    // Create new task with same data
    return this.add({
      type: failedTask.type,
      name: failedTask.name,
      description: failedTask.description,
      priority: failedTask.priority,
      payload: failedTask.payload,
      timeout: failedTask.timeout,
      retries: failedTask.retries,
    });
  }

  // Get tasks by agent
  getByAgent(agentId: string): Task[] {
    return this.queue.filter(t => t.agentId === agentId);
  }

  // Assign task to agent
  assignToAgent(taskId: string, agentId: string): Task | null {
    const task = this.queue.find(t => t.id === taskId);
    if (!task) return null;

    task.agentId = agentId;

    this.emit({ type: 'task:updated', task });

    return task;
  }

  // Add child task
  addChildTask(parentTaskId: string, childTaskData: Partial<Task> & { type: string; name: string }): Task {
    const parent = this.findTask(parentTaskId);
    if (!parent) {
      throw new Error(`Parent task ${parentTaskId} not found`);
    }

    const childTask = this.add({
      ...childTaskData,
      parentTaskId,
      priority: childTaskData.priority || parent.priority,
    });

    // Update parent's child list
    if (!parent.childTaskIds) {
      parent.childTaskIds = [];
    }
    parent.childTaskIds.push(childTask.id);

    return childTask;
  }

  // Get queue statistics
  getStats(): {
    total: number;
    queued: number;
    running: number;
    paused: number;
    completed: number;
    failed: number;
    byPriority: Record<TaskPriority, number>;
  } {
    const byPriority: Record<TaskPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    this.queue.forEach(task => {
      byPriority[task.priority]++;
    });

    return {
      total: this.queue.length,
      queued: this.queuedCount,
      running: this.runningCount,
      paused: this.queue.filter(t => t.status === 'paused').length,
      completed: this.completedTasks.length,
      failed: this.failedTasks.length,
      byPriority,
    };
  }
}

// Singleton instance
let queueInstance: TaskQueue | null = null;

export function getTaskQueue(): TaskQueue {
  if (!queueInstance) {
    queueInstance = new TaskQueue();
  }
  return queueInstance;
}

export function resetTaskQueue(): void {
  if (queueInstance) {
    queueInstance.clear();
    queueInstance.clearHistory();
    queueInstance = null;
  }
}
