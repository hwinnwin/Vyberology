/**
 * GUARDIAN AEGIS - Main Index
 * The Shield That Protects All
 *
 * ON by default - Protection from moment one
 * User sovereignty - Can be disabled (their choice, their freedom)
 * Protocol 69 - We GIVE protection, never weaponize it
 */

// Core
export { GuardianAegis, getGuardian } from './core';
export { ShieldManager } from './core';
export { ResponseEngine } from './core';

// Layers
export {
  BaseProtectionLayer,
  createChildSafetyLayer,
  createThreatProtectionLayer,
  createPrivacyShieldLayer,
  createConsciousnessGuardLayer,
  createNetworkFortressLayer,
} from './layers';

// Store
export { useGuardianStore, initializeGuardianStore } from './stores';
export type { LayerInfo } from './stores';

// Components
export {
  GuardianPanel,
  ShieldStatus,
  ShieldIcon,
  LayerToggle,
  LayerToggleCompact,
  ThreatAlert,
  ThreatBanner,
} from './components';

// Types
export type {
  ThreatType,
  ThreatSeverity,
  ThreatAction,
  LayerName,
  GuardianConfig,
  ThreatReport,
  ProtectionRequest,
  RequestContext,
  ProtectionResult,
  LayerResult,
  ResponseDecision,
  ProtectionLayer,
  LayerStats,
  WhitelistEntry,
  GuardianEvent,
  GuardianEventHandler,
  BlocklistEntry,
  EngagementPattern,
  ScreenTimeData,
} from './types';
