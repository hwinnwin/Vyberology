/**
 * THE VYBER - Automation Agents
 * Export workflow and recording automation
 */

// Workflow Engine - Multi-step workflow orchestration
export {
  WorkflowEngine,
  getWorkflowEngine,
  createWorkflow,
  createStep,
  type WorkflowState,
  type WorkflowContext,
  type WorkflowResult,
  type WorkflowEvent,
} from './WorkflowEngine';

// Recording Agent - Record and replay user interactions
export {
  RecordingAgent,
  RECORDING_AGENT_METADATA,
  type RecordedAction,
  type RecordingState,
  type RecordingSession,
} from './RecordingAgent';
