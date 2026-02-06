/**
 * GUARDIAN AEGIS - Zustand Store
 * State management for Guardian protection system
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GuardianConfig,
  ThreatReport,
  LayerName,
  LayerStats,
  WhitelistEntry,
  ScreenTimeData,
} from '../types';
import { getGuardian } from '../core/GuardianAegis';

// Layer UI information
export interface LayerInfo {
  name: LayerName;
  displayName: string;
  description: string;
  icon: string;
  enabled: boolean;
  stats: LayerStats;
}

// Store state
interface GuardianState {
  // Config
  config: GuardianConfig;

  // Protection status
  isInitialized: boolean;
  isActive: boolean;

  // Threats
  recentThreats: ThreatReport[];
  totalThreatsBlocked: number;
  totalThreatsWarned: number;

  // Layers
  layers: LayerInfo[];

  // Whitelist
  whitelist: WhitelistEntry[];

  // Screen time (from ConsciousnessGuard)
  screenTime: ScreenTimeData | null;

  // UI state
  showPanel: boolean;
  activeTab: 'overview' | 'layers' | 'threats' | 'settings';
  showThreatAlert: boolean;
  currentThreat: ThreatReport | null;

  // Actions
  initialize: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  setLayerEnabled: (layer: LayerName, enabled: boolean) => void;
  setStrictMode: (strict: boolean) => void;

  addToWhitelist: (domain: string, reason?: string) => void;
  removeFromWhitelist: (domain: string) => void;

  dismissThreat: () => void;
  overrideThreat: (threatId: string) => boolean;
  clearThreatLog: () => void;

  togglePanel: () => void;
  setActiveTab: (tab: GuardianState['activeTab']) => void;

  // Sync from guardian
  syncFromGuardian: () => void;
}

// Default config (matches GuardianAegis defaults)
const defaultConfig: GuardianConfig = {
  enabled: true,
  layers: {
    childSafety: true,
    threatProtection: true,
    privacyShield: true,
    consciousnessGuard: true,
    networkFortress: true,
  },
  strictMode: false,
  notificationsEnabled: true,
};

// Default layer info
const defaultLayers: LayerInfo[] = [
  {
    name: 'childSafety',
    displayName: 'Child Safety',
    description: 'Protects against predators and inappropriate content',
    icon: '🛡️',
    enabled: true,
    stats: { threatsDetected: 0, threatsBlocked: 0, isActive: true },
  },
  {
    name: 'threatProtection',
    displayName: 'Threat Protection',
    description: 'Blocks phishing, malware, and scams',
    icon: '🔒',
    enabled: true,
    stats: { threatsDetected: 0, threatsBlocked: 0, isActive: true },
  },
  {
    name: 'privacyShield',
    displayName: 'Privacy Shield',
    description: 'Blocks trackers and fingerprinting',
    icon: '👁️',
    enabled: true,
    stats: { threatsDetected: 0, threatsBlocked: 0, isActive: true },
  },
  {
    name: 'consciousnessGuard',
    displayName: 'Consciousness Guard',
    description: 'Protects your attention and wellbeing',
    icon: '🧘',
    enabled: true,
    stats: { threatsDetected: 0, threatsBlocked: 0, isActive: true },
  },
  {
    name: 'networkFortress',
    displayName: 'Network Fortress',
    description: 'Secures your network connections',
    icon: '🏰',
    enabled: true,
    stats: { threatsDetected: 0, threatsBlocked: 0, isActive: true },
  },
];

export const useGuardianStore = create<GuardianState>()(
  persist(
    (set, get) => ({
      // Initial state
      config: defaultConfig,
      isInitialized: false,
      isActive: true,
      recentThreats: [],
      totalThreatsBlocked: 0,
      totalThreatsWarned: 0,
      layers: defaultLayers,
      whitelist: [],
      screenTime: null,
      showPanel: false,
      activeTab: 'overview',
      showThreatAlert: false,
      currentThreat: null,

      // Initialize guardian
      initialize: async () => {
        const guardian = getGuardian();
        await guardian.initialize();

        // Subscribe to guardian events
        guardian.on((event) => {
          const state = get();

          switch (event.type) {
            case 'threat:detected':
              set({
                recentThreats: [event.threat, ...state.recentThreats].slice(0, 50),
                showThreatAlert: event.threat.action === 'blocked' || event.threat.action === 'warned',
                currentThreat: event.threat.action === 'blocked' || event.threat.action === 'warned'
                  ? event.threat
                  : state.currentThreat,
              });
              break;

            case 'threat:blocked':
              set({ totalThreatsBlocked: state.totalThreatsBlocked + 1 });
              break;

            case 'guardian:enabled':
              set({ isActive: true });
              break;

            case 'guardian:disabled':
              set({ isActive: false });
              break;

            case 'layer:enabled':
            case 'layer:disabled':
              state.syncFromGuardian();
              break;

            case 'whitelist:added':
              set({
                whitelist: [...state.whitelist, event.entry],
              });
              break;

            case 'whitelist:removed':
              set({
                whitelist: state.whitelist.filter(w => w.domain !== event.domain),
              });
              break;
          }
        });

        // Initial sync
        get().syncFromGuardian();

        set({ isInitialized: true });
      },

      // Enable/disable guardian
      setEnabled: (enabled: boolean) => {
        const guardian = getGuardian();
        guardian.setEnabled(enabled);
        set(state => ({
          config: { ...state.config, enabled },
          isActive: enabled,
        }));
      },

      // Enable/disable a layer
      setLayerEnabled: (layer: LayerName, enabled: boolean) => {
        const guardian = getGuardian();
        guardian.setLayerEnabled(layer, enabled);
        set(state => ({
          config: {
            ...state.config,
            layers: { ...state.config.layers, [layer]: enabled },
          },
          layers: state.layers.map(l =>
            l.name === layer ? { ...l, enabled } : l
          ),
        }));
      },

      // Set strict mode
      setStrictMode: (strict: boolean) => {
        const guardian = getGuardian();
        guardian.setStrictMode(strict);
        set(state => ({
          config: { ...state.config, strictMode: strict },
        }));
      },

      // Whitelist management
      addToWhitelist: (domain: string, reason?: string) => {
        const guardian = getGuardian();
        guardian.addToWhitelist(domain, reason);
      },

      removeFromWhitelist: (domain: string) => {
        const guardian = getGuardian();
        guardian.removeFromWhitelist(domain);
      },

      // Threat management
      dismissThreat: () => {
        set({ showThreatAlert: false, currentThreat: null });
      },

      overrideThreat: (threatId: string) => {
        const guardian = getGuardian();
        const success = guardian.override(threatId);
        if (success) {
          set({ showThreatAlert: false, currentThreat: null });
        }
        return success;
      },

      clearThreatLog: () => {
        const guardian = getGuardian();
        guardian.clearThreatLog();
        set({ recentThreats: [] });
      },

      // UI actions
      togglePanel: () => {
        set(state => ({ showPanel: !state.showPanel }));
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      // Sync from guardian
      syncFromGuardian: () => {
        const guardian = getGuardian();
        const config = guardian.getConfig();
        const threats = guardian.getRecentThreats(50);
        const stats = guardian.getThreatStats();
        const whitelist = guardian.getWhitelist();

        set({
          config,
          isActive: config.enabled,
          recentThreats: threats,
          totalThreatsBlocked: stats.blocked,
          totalThreatsWarned: stats.warned,
          whitelist,
          layers: get().layers.map(layer => ({
            ...layer,
            enabled: config.layers[layer.name],
            stats: {
              threatsDetected: stats.byLayer[layer.name] || 0,
              threatsBlocked: 0, // Would need per-layer tracking
              isActive: config.layers[layer.name],
            },
          })),
        });
      },
    }),
    {
      name: 'guardian-aegis-store',
      version: 1,
      partialize: (state) => ({
        // Only persist these fields
        totalThreatsBlocked: state.totalThreatsBlocked,
        totalThreatsWarned: state.totalThreatsWarned,
      }),
    }
  )
);

// Hook to initialize guardian on app start
export function initializeGuardianStore(): Promise<void> {
  return useGuardianStore.getState().initialize();
}
