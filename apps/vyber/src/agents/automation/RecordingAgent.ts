/**
 * THE VYBER - Recording Agent
 * Records user interactions for workflow replay
 *
 * Users can record their actions and replay them - true automation power
 */

import {
  BaseAgent,
  defineAgent,
  defineCapability,
  AgentRegistry,
} from '../core/AgentRegistry';
import type {
  Task,
  AgentConfig,
  DOMAction,
  Workflow,
  WorkflowStep,
} from '../types';

// Capabilities
const START_RECORDING_CAPABILITY = defineCapability(
  'recording.start',
  'Start Recording',
  'Start recording user interactions',
  ['recording.control']
);

const STOP_RECORDING_CAPABILITY = defineCapability(
  'recording.stop',
  'Stop Recording',
  'Stop recording and generate workflow',
  ['recording.control']
);

const PAUSE_RECORDING_CAPABILITY = defineCapability(
  'recording.pause',
  'Pause Recording',
  'Pause the recording',
  ['recording.control']
);

const ADD_STEP_CAPABILITY = defineCapability(
  'recording.addStep',
  'Add Step',
  'Manually add a step to the recording',
  ['recording.control']
);

const EXPORT_WORKFLOW_CAPABILITY = defineCapability(
  'recording.export',
  'Export Workflow',
  'Export recording as a reusable workflow',
  ['recording.read']
);

// Agent metadata
const RECORDING_AGENT_METADATA = defineAgent(
  'recording-agent',
  'Recording Agent',
  'Records user interactions to create reusable automation workflows',
  [
    START_RECORDING_CAPABILITY,
    STOP_RECORDING_CAPABILITY,
    PAUSE_RECORDING_CAPABILITY,
    ADD_STEP_CAPABILITY,
    EXPORT_WORKFLOW_CAPABILITY,
  ],
  {
    maxConcurrentTasks: 1,
    defaultTimeout: 0, // No timeout for recording
  }
);

// Recorded action
export interface RecordedAction {
  id: string;
  timestamp: number;
  type: 'click' | 'type' | 'scroll' | 'select' | 'navigate' | 'wait' | 'submit';
  selector?: string;
  value?: string;
  url?: string;
  metadata?: {
    elementTag?: string;
    elementType?: string;
    elementText?: string;
    coordinates?: { x: number; y: number };
    timeSincePrevious?: number;
  };
}

// Recording state
export type RecordingState = 'idle' | 'recording' | 'paused';

// Recording session
export interface RecordingSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  startUrl: string;
  actions: RecordedAction[];
  state: RecordingState;
}

// Task payloads
interface StartRecordingPayload {
  name?: string;
  includeScrolls?: boolean;
  includeHovers?: boolean;
  minTimeBetweenActions?: number;
}

interface StopRecordingPayload {
  generateWorkflow?: boolean;
  workflowName?: string;
}

interface AddStepPayload {
  type: RecordedAction['type'];
  selector?: string;
  value?: string;
}

interface ExportWorkflowPayload {
  name: string;
  description?: string;
  optimizeWaits?: boolean;
}

/**
 * RecordingAgent - Records user interactions
 */
export class RecordingAgent extends BaseAgent {
  private iframeRef: HTMLIFrameElement | null = null;
  private currentSession: RecordingSession | null = null;
  private listeners: Map<string, EventListener> = new Map();
  private lastActionTime: number = 0;
  private recordingConfig: {
    includeScrolls: boolean;
    includeHovers: boolean;
    minTimeBetweenActions: number;
  } = {
    includeScrolls: false,
    includeHovers: false,
    minTimeBetweenActions: 100,
  };

  constructor(agentConfig?: Partial<AgentConfig>) {
    super({
      ...RECORDING_AGENT_METADATA,
      config: { ...RECORDING_AGENT_METADATA.config, ...agentConfig },
    });
  }

  setIframeRef(ref: HTMLIFrameElement | null): void {
    this.iframeRef = ref;
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'RecordingAgent initialized');
  }

  protected async onExecute(task: Task): Promise<unknown> {
    const actionType = task.type.replace('recording.', '');
    const payload = task.payload as Record<string, unknown>;

    switch (actionType) {
      case 'start':
        return this.handleStartRecording(payload as unknown as StartRecordingPayload);
      case 'stop':
        return this.handleStopRecording(payload as unknown as StopRecordingPayload);
      case 'pause':
        return this.handlePauseRecording();
      case 'addStep':
        return this.handleAddStep(payload as unknown as AddStepPayload);
      case 'export':
        return this.handleExportWorkflow(payload as unknown as ExportWorkflowPayload);
      default:
        throw new Error(`Unknown recording action: ${actionType}`);
    }
  }

  private getDocument(): Document {
    if (this.iframeRef?.contentDocument) {
      return this.iframeRef.contentDocument;
    }
    return document;
  }

  private getCurrentUrl(): string {
    try {
      if (this.iframeRef?.contentWindow) {
        return this.iframeRef.contentWindow.location.href;
      }
      return window.location.href;
    } catch {
      return this.iframeRef?.src || window.location.href;
    }
  }

  /**
   * Start recording
   */
  private async handleStartRecording(payload: StartRecordingPayload): Promise<{ sessionId: string; state: RecordingState }> {
    if (this.currentSession?.state === 'recording') {
      throw new Error('Recording already in progress');
    }

    this.log('info', 'Starting recording');

    // Update recording config
    this.recordingConfig = {
      includeScrolls: payload.includeScrolls ?? false,
      includeHovers: payload.includeHovers ?? false,
      minTimeBetweenActions: payload.minTimeBetweenActions ?? 100,
    };

    // Create session
    this.currentSession = {
      id: `recording-${Date.now()}`,
      name: payload.name || `Recording ${new Date().toLocaleString()}`,
      startTime: Date.now(),
      startUrl: this.getCurrentUrl(),
      actions: [],
      state: 'recording',
    };

    // Attach event listeners
    this.attachListeners();

    this.log('info', `Recording started: ${this.currentSession.id}`);

    return {
      sessionId: this.currentSession.id,
      state: 'recording',
    };
  }

  /**
   * Attach event listeners for recording
   */
  private attachListeners(): void {
    const doc = this.getDocument();

    // Click listener
    const clickListener: EventListener = (e: Event) => {
      if (this.currentSession?.state !== 'recording') return;
      const mouseEvent = e as MouseEvent;
      const target = mouseEvent.target as Element;

      this.recordAction({
        type: 'click',
        selector: this.generateSelector(target),
        metadata: {
          elementTag: target.tagName.toLowerCase(),
          elementType: (target as HTMLInputElement).type,
          elementText: target.textContent?.substring(0, 50) || undefined,
          coordinates: { x: mouseEvent.clientX, y: mouseEvent.clientY },
        },
      });
    };
    doc.addEventListener('click', clickListener, true);
    this.listeners.set('click', clickListener);

    // Input listener (for typing)
    const inputListener: EventListener = (e: Event) => {
      if (this.currentSession?.state !== 'recording') return;
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Debounce typing to avoid recording every keystroke
        const lastAction = this.currentSession!.actions[this.currentSession!.actions.length - 1];
        if (lastAction?.type === 'type' && lastAction.selector === this.generateSelector(target)) {
          // Update the last typing action
          lastAction.value = target.value;
          lastAction.timestamp = Date.now();
        } else {
          this.recordAction({
            type: 'type',
            selector: this.generateSelector(target),
            value: target.value,
            metadata: {
              elementTag: target.tagName.toLowerCase(),
              elementType: target.type,
            },
          });
        }
      }
    };
    doc.addEventListener('input', inputListener, true);
    this.listeners.set('input', inputListener);

    // Change listener (for selects)
    const changeListener: EventListener = (e: Event) => {
      if (this.currentSession?.state !== 'recording') return;
      const target = e.target as HTMLSelectElement;

      if (target.tagName === 'SELECT') {
        this.recordAction({
          type: 'select',
          selector: this.generateSelector(target),
          value: target.value,
          metadata: {
            elementTag: 'select',
            elementText: target.options[target.selectedIndex]?.text,
          },
        });
      }
    };
    doc.addEventListener('change', changeListener, true);
    this.listeners.set('change', changeListener);

    // Form submit listener
    const submitListener: EventListener = (e: Event) => {
      if (this.currentSession?.state !== 'recording') return;
      const form = e.target as HTMLFormElement;

      this.recordAction({
        type: 'submit',
        selector: this.generateSelector(form),
        metadata: {
          elementTag: 'form',
        },
      });
    };
    doc.addEventListener('submit', submitListener, true);
    this.listeners.set('submit', submitListener);

    // Scroll listener (optional)
    if (this.recordingConfig.includeScrolls) {
      const scrollListener: EventListener = () => {
        if (this.currentSession?.state !== 'recording') return;

        // Debounce scrolls
        const now = Date.now();
        if (now - this.lastActionTime < 500) return;

        this.recordAction({
          type: 'scroll',
          metadata: {
            coordinates: {
              x: window.scrollX || this.getDocument().documentElement.scrollLeft,
              y: window.scrollY || this.getDocument().documentElement.scrollTop,
            },
          },
        });
      };
      doc.addEventListener('scroll', scrollListener, true);
      this.listeners.set('scroll', scrollListener);
    }

    // Navigation listener (for iframe src changes)
    if (this.iframeRef) {
      const loadListener: EventListener = () => {
        if (this.currentSession?.state !== 'recording') return;

        this.recordAction({
          type: 'navigate',
          url: this.getCurrentUrl(),
        });
      };
      this.iframeRef.addEventListener('load', loadListener);
      this.listeners.set('load', loadListener);
    }
  }

  /**
   * Detach event listeners
   */
  private detachListeners(): void {
    const doc = this.getDocument();

    this.listeners.forEach((listener, type) => {
      if (type === 'load' && this.iframeRef) {
        this.iframeRef.removeEventListener('load', listener);
      } else {
        doc.removeEventListener(type, listener, true);
      }
    });

    this.listeners.clear();
  }

  /**
   * Record an action
   */
  private recordAction(action: Omit<RecordedAction, 'id' | 'timestamp'>): void {
    if (!this.currentSession || this.currentSession.state !== 'recording') return;

    const now = Date.now();

    // Check minimum time between actions
    if (now - this.lastActionTime < this.recordingConfig.minTimeBetweenActions) {
      return;
    }

    const recordedAction: RecordedAction = {
      id: `action-${now}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      ...action,
      metadata: {
        ...action.metadata,
        timeSincePrevious: this.lastActionTime ? now - this.lastActionTime : 0,
      },
    };

    this.currentSession.actions.push(recordedAction);
    this.lastActionTime = now;

    this.log('debug', `Recorded action: ${action.type}`, { action: recordedAction });
  }

  /**
   * Generate a reliable CSS selector for an element
   */
  private generateSelector(element: Element): string {
    // Try ID first
    if (element.id) {
      return `#${element.id}`;
    }

    // Try name attribute
    const name = element.getAttribute('name');
    if (name) {
      return `${element.tagName.toLowerCase()}[name="${name}"]`;
    }

    // Try data-testid
    const testId = element.getAttribute('data-testid');
    if (testId) {
      return `[data-testid="${testId}"]`;
    }

    // Try unique class combination
    const classes = Array.from(element.classList).slice(0, 3);
    if (classes.length > 0) {
      const classSelector = `.${classes.join('.')}`;
      const matches = this.getDocument().querySelectorAll(classSelector);
      if (matches.length === 1) {
        return classSelector;
      }
    }

    // Build path-based selector
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== this.getDocument().body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }

      // Add nth-of-type if needed
      const parent: Element | null = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (child: Element) => child.tagName === current!.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = parent;
    }

    return path.join(' > ');
  }

  /**
   * Stop recording
   */
  private async handleStopRecording(payload: StopRecordingPayload): Promise<{
    sessionId: string;
    actions: RecordedAction[];
    workflow?: Workflow;
  }> {
    if (!this.currentSession) {
      throw new Error('No recording in progress');
    }

    this.log('info', 'Stopping recording');

    this.detachListeners();
    this.currentSession.state = 'idle';
    this.currentSession.endTime = Date.now();

    const result: {
      sessionId: string;
      actions: RecordedAction[];
      workflow?: Workflow;
    } = {
      sessionId: this.currentSession.id,
      actions: this.currentSession.actions,
    };

    // Generate workflow if requested
    if (payload.generateWorkflow) {
      result.workflow = this.generateWorkflow(
        payload.workflowName || this.currentSession.name
      );
    }

    this.log('info', `Recording stopped: ${this.currentSession.actions.length} actions recorded`);

    return result;
  }

  /**
   * Pause recording
   */
  private async handlePauseRecording(): Promise<{ state: RecordingState }> {
    if (!this.currentSession) {
      throw new Error('No recording in progress');
    }

    if (this.currentSession.state === 'recording') {
      this.currentSession.state = 'paused';
      this.log('info', 'Recording paused');
    } else if (this.currentSession.state === 'paused') {
      this.currentSession.state = 'recording';
      this.log('info', 'Recording resumed');
    }

    return { state: this.currentSession.state };
  }

  /**
   * Manually add a step
   */
  private async handleAddStep(payload: AddStepPayload): Promise<{ actionId: string }> {
    if (!this.currentSession) {
      throw new Error('No recording in progress');
    }

    this.recordAction({
      type: payload.type,
      selector: payload.selector,
      value: payload.value,
    });

    const lastAction = this.currentSession.actions[this.currentSession.actions.length - 1];

    return { actionId: lastAction.id };
  }

  /**
   * Export as workflow
   */
  private async handleExportWorkflow(payload: ExportWorkflowPayload): Promise<{ workflow: Workflow }> {
    if (!this.currentSession) {
      throw new Error('No recording session');
    }

    const workflow = this.generateWorkflow(payload.name, payload.description, payload.optimizeWaits);

    return { workflow };
  }

  /**
   * Generate workflow from recorded actions
   */
  private generateWorkflow(name: string, description?: string, optimizeWaits: boolean = true): Workflow {
    if (!this.currentSession) {
      throw new Error('No recording session');
    }

    const steps: WorkflowStep[] = [];

    for (let i = 0; i < this.currentSession.actions.length; i++) {
      const action = this.currentSession.actions[i];

      // Add wait step if there was a significant pause
      if (optimizeWaits && action.metadata?.timeSincePrevious && action.metadata.timeSincePrevious > 1000) {
        steps.push({
          id: `wait-${i}`,
          name: 'Wait',
          agentId: 'dom-agent',
          action: {
            type: 'wait',
            options: {
              delay: Math.min(action.metadata.timeSincePrevious, 5000),
            },
          } as DOMAction,
        });
      }

      // Convert action to workflow step
      const step = this.actionToStep(action, i);
      if (step) {
        steps.push(step);
      }
    }

    return {
      id: `workflow-${Date.now()}`,
      name,
      description,
      steps,
      variables: {
        startUrl: this.currentSession.startUrl,
      },
    };
  }

  /**
   * Convert recorded action to workflow step
   */
  private actionToStep(action: RecordedAction, index: number): WorkflowStep | null {
    switch (action.type) {
      case 'click':
        return {
          id: `step-${index}`,
          name: `Click ${action.metadata?.elementText || action.selector || 'element'}`,
          agentId: 'dom-agent',
          action: {
            type: 'click',
            selector: action.selector,
          } as DOMAction,
        };

      case 'type':
        return {
          id: `step-${index}`,
          name: `Type into ${action.selector}`,
          agentId: 'dom-agent',
          action: {
            type: 'type',
            selector: action.selector,
            value: action.value,
            options: { clearFirst: true },
          } as DOMAction,
        };

      case 'select':
        return {
          id: `step-${index}`,
          name: `Select ${action.metadata?.elementText || action.value}`,
          agentId: 'dom-agent',
          action: {
            type: 'select',
            selector: action.selector,
            value: action.value,
          } as DOMAction,
        };

      case 'scroll':
        if (action.metadata?.coordinates) {
          return {
            id: `step-${index}`,
            name: 'Scroll page',
            agentId: 'dom-agent',
            action: {
              type: 'scroll',
              options: {
                x: action.metadata.coordinates.x,
                y: action.metadata.coordinates.y,
              },
            } as DOMAction,
          };
        }
        return null;

      case 'navigate':
        return {
          id: `step-${index}`,
          name: `Navigate to ${action.url}`,
          agentId: 'navigation-agent',
          action: {
            id: `nav-${index}`,
            type: 'navigation.go',
            name: 'Navigate',
            priority: 'high',
            status: 'queued',
            payload: { url: action.url },
            createdAt: Date.now(),
          } as Task,
        };

      case 'submit':
        return {
          id: `step-${index}`,
          name: 'Submit form',
          agentId: 'form-agent',
          action: {
            id: `submit-${index}`,
            type: 'form.submit',
            name: 'Submit',
            priority: 'high',
            status: 'queued',
            payload: { formSelector: action.selector },
            createdAt: Date.now(),
          } as Task,
        };

      default:
        return null;
    }
  }

  /**
   * Get current session
   */
  public getSession(): RecordingSession | null {
    return this.currentSession;
  }

  /**
   * Get recording state
   */
  public getRecordingState(): RecordingState {
    return this.currentSession?.state || 'idle';
  }

  protected onTerminate(): void {
    this.detachListeners();
    this.currentSession = null;
    this.iframeRef = null;
    this.log('info', 'RecordingAgent terminated');
  }
}

// Factory function
function createRecordingAgent(config?: Partial<AgentConfig>): RecordingAgent {
  return new RecordingAgent(config);
}

// Register the agent type
AgentRegistry.register(RECORDING_AGENT_METADATA, createRecordingAgent);

export { RECORDING_AGENT_METADATA };
