import { useState, useEffect } from "react";
import { X, Key, Save, Check } from "lucide-react";
import { toast } from "@/lib/toast";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const key = localStorage.getItem("vyber_claude_api_key") || "";
      setApiKey(key);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("vyber_claude_api_key", apiKey);
    setSaved(true);
    toast("Settings saved.", { variant: "success" });
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="settings-title" className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4" />
              Claude API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              aria-label="Claude API key"
              className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-vyber-purple focus:ring-2 focus:ring-vyber-purple/20"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-vyber-purple hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              For production, use the server proxy so API keys are not exposed in the browser.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Help & Legal</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <a
                href="/help.html"
                className="text-vyber-purple hover:underline"
              >
                Help
              </a>
              <a
                href="/privacy.html"
                className="text-vyber-purple hover:underline"
              >
                Privacy Policy
              </a>
              <a
                href="/terms.html"
                className="text-vyber-purple hover:underline"
              >
                Terms of Service
              </a>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-vyber-purple to-vyber-pink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
