/**
 * GUARDIAN AEGIS - Guardian Panel Component
 * Main control panel for all Guardian settings
 */

import { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  X,
  Settings,
  History,
  Layers,
  Trash2,
  Plus,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGuardianStore, initializeGuardianStore } from '../stores/guardianStore';
import { LayerToggle } from './LayerToggle';
import type { ThreatSeverity, LayerName, ThreatReport } from '../types';

interface GuardianPanelProps {
  className?: string;
  onClose?: () => void;
}

type TabId = 'overview' | 'layers' | 'threats' | 'settings';

const TABS: { id: TabId; label: string; icon: typeof Shield }[] = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'threats', label: 'Threats', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const SEVERITY_COLORS: Record<ThreatSeverity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

export function GuardianPanel({ className, onClose }: GuardianPanelProps) {
  const {
    isInitialized,
    isActive,
    config,
    layers,
    recentThreats,
    totalThreatsBlocked,
    whitelist,
    activeTab,
    setActiveTab,
    setEnabled,
    setLayerEnabled,
    setStrictMode,
    addToWhitelist,
    removeFromWhitelist,
    clearThreatLog,
  } = useGuardianStore();

  const [newWhitelistDomain, setNewWhitelistDomain] = useState('');

  // Initialize guardian
  useEffect(() => {
    if (!isInitialized) {
      initializeGuardianStore();
    }
  }, [isInitialized]);

  const handleAddWhitelist = () => {
    if (newWhitelistDomain.trim()) {
      addToWhitelist(newWhitelistDomain.trim());
      setNewWhitelistDomain('');
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          {isActive ? (
            <ShieldCheck className="h-6 w-6 text-green-500" />
          ) : (
            <ShieldX className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <h2 className="font-semibold">Guardian Aegis</h2>
            <p className="text-xs text-muted-foreground">
              {isActive ? 'All shields active' : 'Protection disabled'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <OverviewTab
            isActive={isActive}
            setEnabled={setEnabled}
            totalThreatsBlocked={totalThreatsBlocked}
            recentThreats={recentThreats}
            layers={layers}
          />
        )}

        {activeTab === 'layers' && (
          <LayersTab layers={layers} setLayerEnabled={setLayerEnabled} />
        )}

        {activeTab === 'threats' && (
          <ThreatsTab
            recentThreats={recentThreats}
            clearThreatLog={clearThreatLog}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            config={config}
            setStrictMode={setStrictMode}
            whitelist={whitelist}
            newWhitelistDomain={newWhitelistDomain}
            setNewWhitelistDomain={setNewWhitelistDomain}
            addToWhitelist={handleAddWhitelist}
            removeFromWhitelist={removeFromWhitelist}
          />
        )}
      </div>
    </div>
  );
}

// Overview Tab
interface OverviewTabProps {
  isActive: boolean;
  setEnabled: (enabled: boolean) => void;
  totalThreatsBlocked: number;
  recentThreats: { id: string; timestamp: number; type: string; severity: ThreatSeverity }[];
  layers: { name: string; enabled: boolean; stats: { threatsDetected: number } }[];
}

function OverviewTab({
  isActive,
  setEnabled,
  totalThreatsBlocked,
  recentThreats,
  layers,
}: OverviewTabProps) {
  const enabledLayers = layers.filter((l) => l.enabled).length;
  const todayThreats = recentThreats.filter(
    (t) => t.timestamp > Date.now() - 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <div
        className={cn(
          'p-4 rounded-xl border-2 transition-colors',
          isActive
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-muted/50 border-border'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isActive ? (
              <ShieldCheck className="h-10 w-10 text-green-500" />
            ) : (
              <ShieldX className="h-10 w-10 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-semibold text-lg">
                {isActive ? 'Protection Active' : 'Protection Disabled'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? `${enabledLayers} layers protecting you`
                  : 'Enable to protect your browsing'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEnabled(!isActive)}
            className={cn(
              'relative w-14 h-8 rounded-full transition-colors',
              isActive ? 'bg-green-500' : 'bg-muted'
            )}
            role="switch"
            aria-checked={isActive}
          >
            <span
              className={cn(
                'absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform',
                isActive ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-secondary/30 text-center">
          <p className="text-2xl font-bold text-green-500">{totalThreatsBlocked}</p>
          <p className="text-xs text-muted-foreground">Threats Blocked</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 text-center">
          <p className="text-2xl font-bold text-orange-500">{todayThreats}</p>
          <p className="text-xs text-muted-foreground">Today</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 text-center">
          <p className="text-2xl font-bold text-blue-500">{enabledLayers}/5</p>
          <p className="text-xs text-muted-foreground">Layers Active</p>
        </div>
      </div>

      {/* Recent Threats */}
      {recentThreats.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </h4>
          <div className="space-y-2">
            {recentThreats.slice(0, 3).map((threat) => (
              <div
                key={threat.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20"
              >
                <span className={cn('w-2 h-2 rounded-full', SEVERITY_COLORS[threat.severity])} />
                <span className="text-sm capitalize flex-1">
                  {threat.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(threat.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Layers Tab
interface LayersTabProps {
  layers: OverviewTabProps['layers'] & { icon?: string; displayName?: string; description?: string }[];
  setLayerEnabled: (layer: LayerName, enabled: boolean) => void;
}

function LayersTab({ layers, setLayerEnabled }: LayersTabProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Enable or disable individual protection layers based on your preferences.
      </p>
      {layers.map((layer) => (
        <LayerToggle
          key={layer.name}
          layer={layer as Parameters<typeof LayerToggle>[0]['layer']}
          onToggle={(enabled) => setLayerEnabled(layer.name as LayerName, enabled)}
        />
      ))}
    </div>
  );
}

// Threats Tab
interface ThreatsTabProps {
  recentThreats: ThreatReport[];
  clearThreatLog: () => void;
}

function ThreatsTab({ recentThreats, clearThreatLog }: ThreatsTabProps) {
  if (recentThreats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ShieldCheck className="h-12 w-12 text-green-500/30 mb-4" />
        <p className="text-sm text-muted-foreground">No threats detected</p>
        <p className="text-xs text-muted-foreground/70">
          Guardian Aegis is protecting you
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {recentThreats.length} threat{recentThreats.length !== 1 ? 's' : ''} logged
        </p>
        <button
          onClick={clearThreatLog}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-3 w-3" />
          Clear Log
        </button>
      </div>

      <div className="space-y-2">
        {recentThreats.map((threat) => (
          <div
            key={threat.id}
            className="p-3 rounded-lg border border-border bg-secondary/20"
          >
            <div className="flex items-start gap-3">
              <span className={cn('w-2 h-2 rounded-full mt-1.5', SEVERITY_COLORS[threat.severity])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm capitalize">
                    {threat.type.replace('_', ' ')}
                  </span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    threat.action === 'blocked' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
                  )}>
                    {threat.action}
                  </span>
                </div>
                {threat.description && (
                  <p className="text-xs text-muted-foreground mt-1">{threat.description}</p>
                )}
                {threat.url && (
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono">
                    {threat.url}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatTimeAgo(threat.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Settings Tab
interface SettingsTabProps {
  config: { strictMode: boolean };
  setStrictMode: (strict: boolean) => void;
  whitelist: { domain: string; addedAt: number; reason?: string }[];
  newWhitelistDomain: string;
  setNewWhitelistDomain: (domain: string) => void;
  addToWhitelist: () => void;
  removeFromWhitelist: (domain: string) => void;
}

function SettingsTab({
  config,
  setStrictMode,
  whitelist,
  newWhitelistDomain,
  setNewWhitelistDomain,
  addToWhitelist,
  removeFromWhitelist,
}: SettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Strict Mode */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
        <div>
          <h4 className="font-medium">Strict Mode</h4>
          <p className="text-xs text-muted-foreground">
            Block more aggressively, fewer warnings
          </p>
        </div>
        <button
          onClick={() => setStrictMode(!config.strictMode)}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors',
            config.strictMode ? 'bg-orange-500' : 'bg-muted'
          )}
          role="switch"
          aria-checked={config.strictMode}
        >
          <span
            className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
              config.strictMode ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Whitelist */}
      <div>
        <h4 className="font-medium mb-3">Whitelisted Domains</h4>
        <p className="text-xs text-muted-foreground mb-3">
          These domains will bypass Guardian protection
        </p>

        {/* Add Domain */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newWhitelistDomain}
            onChange={(e) => setNewWhitelistDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addToWhitelist()}
            placeholder="example.com"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={addToWhitelist}
            disabled={!newWhitelistDomain.trim()}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Whitelist Items */}
        {whitelist.length > 0 ? (
          <div className="space-y-2">
            {whitelist.map((entry) => (
              <div
                key={entry.domain}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/20"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{entry.domain}</span>
                </div>
                <button
                  onClick={() => removeFromWhitelist(entry.domain)}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            No domains whitelisted
          </p>
        )}
      </div>
    </div>
  );
}

// Helper function
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default GuardianPanel;
