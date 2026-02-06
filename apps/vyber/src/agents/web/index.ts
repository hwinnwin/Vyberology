/**
 * THE VYBER - Web Agents
 * Export all web automation agents
 */

// DOM Agent - Low-level DOM interactions
export { DOMAgent, DOM_AGENT_METADATA } from './DOMAgent';

// Form Agent - Intelligent form detection and filling
export {
  FormAgent,
  FORM_AGENT_METADATA,
  type FormFieldType,
  type FormField,
  type FieldPurpose,
  type DetectedForm,
  type FormType,
} from './FormAgent';

// Navigation Agent - Multi-page navigation
export {
  NavigationAgent,
  NAVIGATION_AGENT_METADATA,
  type NavigationStep,
  type PageInfo,
  type NavigationResult,
} from './NavigationAgent';
