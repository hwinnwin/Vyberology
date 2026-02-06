/**
 * GUARDIAN AEGIS - Type Definitions
 * The Shield That Protects All
 */

// Threat types that Guardian Aegis can detect
export type ThreatType =
  | 'phishing'
  | 'malware'
  | 'tracker'
  | 'predator'
  | 'grooming'
  | 'inappropriate_content'
  | 'credential_theft'
  | 'fingerprinting'
  | 'doom_scroll'
  | 'rage_bait'
  | 'attention_hijack'
  | 'unsafe_network'
  | 'mitm_attack'
  | 'suspicious_download'
  | 'data_harvesting';

// Severity levels
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

// Actions taken in response to threats
export type ThreatAction = 'blocked' | 'warned' | 'logged' | 'allowed';

// Protection layer names
export type LayerName =
  | 'childSafety'
  | 'threatProtection'
  | 'privacyShield'
  | 'consciousnessGuard'
  | 'networkFortress';

// Guardian configuration
export interface GuardianConfig {
  enabled: boolean;
  layers: Record<LayerName, boolean>;
  strictMode: boolean;
  notificationsEnabled: boolean;
  userAge?: number;
}

// Threat report from detection
export interface ThreatReport {
  id: string;
  timestamp: number;
  type: ThreatType;
  severity: ThreatSeverity;
  layer: LayerName;
  url?: string;
  description: string;
  action: ThreatAction;
  userOverride?: boolean;
  metadata?: Record<string, unknown>;
}

// Protection request (input to Guardian)
export interface ProtectionRequest {
  url: string;
  type: 'navigation' | 'resource' | 'form' | 'download' | 'websocket' | 'content';
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  context?: RequestContext;
}

// Additional context for protection analysis
export interface RequestContext {
  pageContent?: string;
  pageTitle?: string;
  userAge?: number;
  sessionDuration?: number;
  scrollDepth?: number;
  tabId?: string;
  referrer?: string;
}

// Protection result (output from Guardian)
export interface ProtectionResult {
  allowed: boolean;
  threats: ThreatReport[];
  blockReason?: string;
  canOverride?: boolean;
  warningMessage?: string;
}

// Layer analysis result
export interface LayerResult {
  layer: LayerName;
  threatDetected: boolean;
  threatType?: ThreatType;
  severity?: ThreatSeverity;
  description?: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

// Response determination
export interface ResponseDecision {
  action: ThreatAction;
  message: string;
  canOverride: boolean;
  requiresConfirmation: boolean;
}

// Protection layer interface
export interface ProtectionLayer {
  name: LayerName;
  displayName: string;
  description: string;
  icon: string;
  initialize(): Promise<void>;
  analyze(request: ProtectionRequest): Promise<LayerResult>;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  getStats(): LayerStats;
}

// Layer statistics
export interface LayerStats {
  threatsDetected: number;
  threatsBlocked: number;
  lastThreatTime?: number;
  isActive: boolean;
}

// Whitelist entry
export interface WhitelistEntry {
  domain: string;
  addedAt: number;
  reason?: string;
  expiresAt?: number;
}

// Guardian event types
export type GuardianEvent =
  | { type: 'threat:detected'; threat: ThreatReport }
  | { type: 'threat:blocked'; threat: ThreatReport }
  | { type: 'threat:overridden'; threat: ThreatReport }
  | { type: 'layer:enabled'; layer: LayerName }
  | { type: 'layer:disabled'; layer: LayerName }
  | { type: 'guardian:enabled' }
  | { type: 'guardian:disabled' }
  | { type: 'whitelist:added'; entry: WhitelistEntry }
  | { type: 'whitelist:removed'; domain: string };

export type GuardianEventHandler = (event: GuardianEvent) => void;

// Blocklist types
export interface BlocklistEntry {
  pattern: string;
  type: 'domain' | 'url' | 'regex';
  category: ThreatType;
  severity: ThreatSeverity;
  source: string;
  addedAt: number;
}

// Engagement pattern for consciousness guard
export interface EngagementPattern {
  type: 'scroll' | 'click' | 'hover' | 'focus' | 'idle';
  timestamp: number;
  intensity: number;
  duration?: number;
}

// Screen time data
export interface ScreenTimeData {
  sessionStart: number;
  totalDuration: number;
  activeTime: number;
  scrollEvents: number;
  pageViews: number;
  breaks: number;
}
