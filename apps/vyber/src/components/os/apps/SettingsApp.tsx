import { useState } from "react";
import {
  User,
  Palette,
  Bell,
  Shield,
  Wifi,
  Volume2,
  Monitor,
  Keyboard,
  HardDrive,
  Info,
  ChevronRight,
} from "lucide-react";
import { useOSStore } from "@/stores/os";

interface SettingsSectionProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  isActive?: boolean;
  onClick?: () => void;
}

function SettingsSection({
  icon,
  label,
  description,
  isActive,
  onClick,
}: SettingsSectionProps) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
        isActive
          ? "bg-vyber-purple/20 text-vyber-purple"
          : "hover:bg-white/10"
      }`}
      onClick={onClick}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isActive ? "bg-vyber-purple/30" : "bg-white/10"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {description && (
          <p className="text-sm text-white/50">{description}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-white/30" />
    </button>
  );
}

const WALLPAPERS = [
  {
    id: "gradient-1",
    name: "Cosmic Night",
    value: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  },
  {
    id: "gradient-2",
    name: "Vybe Purple",
    value: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  },
  {
    id: "gradient-3",
    name: "Ocean Blue",
    value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  },
  {
    id: "gradient-4",
    name: "Sunset",
    value: "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #feca57 100%)",
  },
  {
    id: "gradient-5",
    name: "Aurora",
    value: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 50%, #00c9ff 100%)",
  },
  {
    id: "gradient-6",
    name: "Midnight",
    value: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #2d2d44 100%)",
  },
];

export function SettingsApp() {
  const [activeSection, setActiveSection] = useState("appearance");
  const { wallpaper, setWallpaper, dockPosition, setDockPosition, dockAutoHide, setDockAutoHide } =
    useOSStore();

  const sections = [
    { id: "account", icon: <User className="h-5 w-5" />, label: "Account", description: "Profile, sign in" },
    { id: "appearance", icon: <Palette className="h-5 w-5" />, label: "Appearance", description: "Wallpaper, themes" },
    { id: "notifications", icon: <Bell className="h-5 w-5" />, label: "Notifications", description: "Alerts, sounds" },
    { id: "privacy", icon: <Shield className="h-5 w-5" />, label: "Privacy & Security", description: "Permissions" },
    { id: "network", icon: <Wifi className="h-5 w-5" />, label: "Network", description: "Wi-Fi, connections" },
    { id: "sound", icon: <Volume2 className="h-5 w-5" />, label: "Sound", description: "Volume, output" },
    { id: "display", icon: <Monitor className="h-5 w-5" />, label: "Display", description: "Resolution, night shift" },
    { id: "keyboard", icon: <Keyboard className="h-5 w-5" />, label: "Keyboard", description: "Shortcuts, input" },
    { id: "storage", icon: <HardDrive className="h-5 w-5" />, label: "Storage", description: "Disk usage" },
    { id: "about", icon: <Info className="h-5 w-5" />, label: "About", description: "System info" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "appearance":
        return (
          <div className="space-y-6">
            {/* Wallpaper */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Wallpaper</h3>
              <div className="grid grid-cols-3 gap-3">
                {WALLPAPERS.map((wp) => (
                  <button
                    key={wp.id}
                    className={`aspect-video overflow-hidden rounded-xl transition-all ${
                      wallpaper === wp.value
                        ? "ring-2 ring-vyber-purple ring-offset-2 ring-offset-gray-900"
                        : "hover:ring-2 hover:ring-white/30"
                    }`}
                    style={{ background: wp.value }}
                    onClick={() => setWallpaper(wp.value)}
                  >
                    <div className="flex h-full items-end p-2">
                      <span className="text-xs font-medium text-white drop-shadow-lg">
                        {wp.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dock Position */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Dock Position</h3>
              <div className="flex gap-3">
                {(["bottom", "left", "right"] as const).map((pos) => (
                  <button
                    key={pos}
                    className={`flex-1 rounded-xl border-2 p-4 text-center transition-colors ${
                      dockPosition === pos
                        ? "border-vyber-purple bg-vyber-purple/20"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    onClick={() => setDockPosition(pos)}
                  >
                    <span className="capitalize">{pos}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-hide Dock */}
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <div>
                <p className="font-medium">Auto-hide Dock</p>
                <p className="text-sm text-white/50">
                  Hide the dock when not in use
                </p>
              </div>
              <button
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  dockAutoHide ? "bg-vyber-purple" : "bg-white/20"
                }`}
                onClick={() => setDockAutoHide(!dockAutoHide)}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                    dockAutoHide ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-8">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-vyber-purple via-vyber-pink to-vyber-cyan shadow-glow">
                <span className="text-4xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold">VybeOS</h2>
              <p className="text-white/50">Version 1.0.0</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between rounded-lg bg-white/5 p-3">
                <span className="text-white/70">OS Name</span>
                <span>VybeOS</span>
              </div>
              <div className="flex justify-between rounded-lg bg-white/5 p-3">
                <span className="text-white/70">Version</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between rounded-lg bg-white/5 p-3">
                <span className="text-white/70">Kernel</span>
                <span>Vybe Core 0.1.0</span>
              </div>
              <div className="flex justify-between rounded-lg bg-white/5 p-3">
                <span className="text-white/70">Browser Engine</span>
                <span>THE VYBER</span>
              </div>
              <div className="flex justify-between rounded-lg bg-white/5 p-3">
                <span className="text-white/70">AI Engine</span>
                <span>Lumen AI</span>
              </div>
            </div>

            <div className="pt-4 text-center text-sm text-white/40">
              <p>Built with sacred frequencies: 0616, 0626, 224, 369</p>
              <p className="mt-1">© 2024 Vybe Ecosystem</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex h-full items-center justify-center text-white/50">
            <p>Settings panel coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 overflow-y-auto border-r border-white/10 bg-gray-900/50 p-4">
        <h2 className="mb-4 text-xl font-bold">Settings</h2>
        <div className="space-y-1">
          {sections.map((section) => (
            <SettingsSection
              key={section.id}
              icon={section.icon}
              label={section.label}
              description={section.description}
              isActive={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-6 text-2xl font-bold capitalize">
          {sections.find((s) => s.id === activeSection)?.label}
        </h2>
        {renderContent()}
      </div>
    </div>
  );
}
