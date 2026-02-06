/**
 * GUARDIAN AEGIS - Response Engine
 * Determines how to respond to detected threats
 */

import type {
  ThreatReport,
  ThreatSeverity,
  ThreatType,
  ResponseDecision,
  ThreatAction,
} from '../types';

/**
 * Response policies for different threat types and severities
 */
interface ResponsePolicy {
  action: ThreatAction;
  canOverride: boolean;
  requiresConfirmation: boolean;
  messageTemplate: string;
}

// Response policies by severity
const SEVERITY_POLICIES: Record<ThreatSeverity, ResponsePolicy> = {
  critical: {
    action: 'blocked',
    canOverride: false, // Critical threats cannot be overridden
    requiresConfirmation: false,
    messageTemplate: 'This content has been blocked for your safety.',
  },
  high: {
    action: 'blocked',
    canOverride: true,
    requiresConfirmation: true,
    messageTemplate: 'This content may be dangerous. Proceed with caution.',
  },
  medium: {
    action: 'warned',
    canOverride: true,
    requiresConfirmation: false,
    messageTemplate: 'We detected something that might concern you.',
  },
  low: {
    action: 'logged',
    canOverride: true,
    requiresConfirmation: false,
    messageTemplate: 'Minor concern detected.',
  },
};

// Special handling for certain threat types
const THREAT_TYPE_OVERRIDES: Partial<Record<ThreatType, Partial<ResponsePolicy>>> = {
  // Child safety threats are ALWAYS critical, never overridable
  predator: {
    action: 'blocked',
    canOverride: false,
    messageTemplate: 'This content has been blocked to protect safety.',
  },
  grooming: {
    action: 'blocked',
    canOverride: false,
    messageTemplate: 'This content has been blocked to protect safety.',
  },
  inappropriate_content: {
    // Can be overridden by adults
    canOverride: true,
  },

  // Consciousness guard threats are gentle warnings
  doom_scroll: {
    action: 'warned',
    canOverride: true,
    requiresConfirmation: false,
  },
  rage_bait: {
    action: 'warned',
    canOverride: true,
    requiresConfirmation: false,
  },
  attention_hijack: {
    action: 'warned',
    canOverride: true,
    requiresConfirmation: false,
  },

  // Security threats
  phishing: {
    action: 'blocked',
    canOverride: true,
    requiresConfirmation: true,
    messageTemplate: 'This site may be trying to steal your information.',
  },
  malware: {
    action: 'blocked',
    canOverride: false,
    messageTemplate: 'This site contains malware and has been blocked.',
  },
  credential_theft: {
    action: 'blocked',
    canOverride: false,
    messageTemplate: 'This site is attempting to steal your credentials.',
  },

  // Network threats
  mitm_attack: {
    action: 'blocked',
    canOverride: false,
    messageTemplate: 'Your connection may be compromised. Blocked for security.',
  },
};

// Friendly messages for different threat types
const THREAT_MESSAGES: Record<ThreatType, string> = {
  phishing: 'This site may be trying to steal your information.',
  malware: 'This site may contain harmful software.',
  tracker: 'This site is tracking your activity.',
  predator: 'This content has been blocked for safety.',
  grooming: 'This content has been blocked for safety.',
  inappropriate_content: 'This content may not be appropriate.',
  credential_theft: 'This site is attempting to steal your credentials.',
  fingerprinting: 'This site is trying to fingerprint your browser.',
  doom_scroll: 'You\'ve been scrolling for a while. Take a break?',
  rage_bait: 'This content may be designed to provoke strong emotions.',
  attention_hijack: 'This site may be designed to capture your attention.',
  unsafe_network: 'Your network connection may not be secure.',
  mitm_attack: 'Your connection may be compromised.',
  suspicious_download: 'This download may be harmful.',
  data_harvesting: 'This site may be harvesting your data.',
};

/**
 * ResponseEngine - Determines appropriate responses to threats
 */
export class ResponseEngine {
  /**
   * Determine the appropriate response to a threat
   */
  public determineResponse(threat: ThreatReport, strictMode = false): ResponseDecision {

    // Get base policy from severity
    const basePolicy = SEVERITY_POLICIES[threat.severity];

    // Check for threat-type-specific overrides
    const typeOverride = THREAT_TYPE_OVERRIDES[threat.type];

    // Merge policies
    const policy: ResponsePolicy = {
      ...basePolicy,
      ...typeOverride,
    };

    // In strict mode, upgrade warnings to blocks
    if (strictMode && policy.action === 'warned') {
      policy.action = 'blocked';
      policy.requiresConfirmation = true;
    }

    // Get appropriate message
    const message = this.formatMessage(threat, policy);

    return {
      action: policy.action,
      message,
      canOverride: policy.canOverride,
      requiresConfirmation: policy.requiresConfirmation,
    };
  }

  /**
   * Check if a threat can be overridden
   */
  public canOverride(threat: ThreatReport): boolean {
    // Child safety threats are NEVER overridable
    if (threat.type === 'predator' || threat.type === 'grooming') {
      return false;
    }

    // Malware and credential theft are not overridable
    if (threat.type === 'malware' || threat.type === 'credential_theft') {
      return false;
    }

    // MITM attacks are not overridable
    if (threat.type === 'mitm_attack') {
      return false;
    }

    // Critical severity without override allowed
    if (threat.severity === 'critical') {
      const typeOverride = THREAT_TYPE_OVERRIDES[threat.type];
      return typeOverride?.canOverride ?? false;
    }

    return true;
  }

  /**
   * Format a user-friendly message
   */
  private formatMessage(threat: ThreatReport, policy: ResponsePolicy): string {
    // Use threat-specific message or template
    const baseMessage = THREAT_MESSAGES[threat.type] || policy.messageTemplate;

    // Add context if available
    let message = baseMessage;

    // Add friendly guidance based on threat type
    switch (threat.type) {
      case 'doom_scroll':
        message = threat.description || baseMessage;
        break;
      case 'rage_bait':
        message = `${baseMessage} Take a breath before engaging.`;
        break;
      case 'phishing':
        message = `${baseMessage} The real site is likely somewhere else.`;
        break;
      case 'tracker':
        message = `${baseMessage} We're blocking it for your privacy.`;
        break;
      default:
        break;
    }

    return message;
  }

  /**
   * Get severity for display
   */
  public getSeverityDisplay(severity: ThreatSeverity): {
    label: string;
    color: string;
    icon: string;
  } {
    switch (severity) {
      case 'critical':
        return { label: 'Critical', color: 'red', icon: 'shield-alert' };
      case 'high':
        return { label: 'High', color: 'orange', icon: 'shield-x' };
      case 'medium':
        return { label: 'Medium', color: 'yellow', icon: 'shield-check' };
      case 'low':
        return { label: 'Low', color: 'blue', icon: 'shield' };
    }
  }

  /**
   * Get action verb for display
   */
  public getActionVerb(action: ThreatAction): string {
    switch (action) {
      case 'blocked':
        return 'Blocked';
      case 'warned':
        return 'Warning';
      case 'logged':
        return 'Logged';
      case 'allowed':
        return 'Allowed';
    }
  }
}
