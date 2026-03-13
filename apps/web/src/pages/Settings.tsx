import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Home, Shield, Cloud, HardDrive, Download, Trash2, Info, Database, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { getReadingHistory, clearHistory } from "@/lib/readingHistory";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data storage preferences
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false);
  const [dataCollectionConsent, setDataCollectionConsent] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  // Stats
  const [localReadingsCount, setLocalReadingsCount] = useState(0);
  const [dataSize, setDataSize] = useState("0 KB");

  useEffect(() => {
    // Load preferences from localStorage
    const cloudSync = localStorage.getItem('vyberology_cloud_sync') === 'true';
    const dataConsent = localStorage.getItem('vyberology_data_consent') === 'true';

    setCloudSyncEnabled(cloudSync);
    setDataCollectionConsent(dataConsent);

    // Calculate local storage stats
    const history = getReadingHistory();
    setLocalReadingsCount(history.length);

    const historyString = JSON.stringify(history);
    const sizeInKB = (new Blob([historyString]).size / 1024).toFixed(2);
    setDataSize(`${sizeInKB} KB`);
  }, []);

  const handleCloudSyncToggle = (enabled: boolean) => {
    if (enabled && !dataCollectionConsent) {
      // Show consent dialog first
      setShowConsentDialog(true);
    } else {
      setCloudSyncEnabled(enabled);
      localStorage.setItem('vyberology_cloud_sync', enabled.toString());

      toast({
        title: enabled ? "Cloud sync enabled" : "Cloud sync disabled",
        description: enabled
          ? "Your readings will be backed up to the cloud"
          : "Your readings will only be stored locally",
      });
    }
  };

  const handleDataConsentToggle = (enabled: boolean) => {
    setDataCollectionConsent(enabled);
    localStorage.setItem('vyberology_data_consent', enabled.toString());

    if (!enabled && cloudSyncEnabled) {
      // If they revoke consent, disable cloud sync too
      setCloudSyncEnabled(false);
      localStorage.setItem('vyberology_cloud_sync', 'false');
    }

    toast({
      title: enabled ? "Thank you!" : "Data collection disabled",
      description: enabled
        ? "Your anonymized data will help improve Vyberology for everyone"
        : "We will not collect your reading data",
    });
  };

  const handleAcceptConsent = () => {
    setDataCollectionConsent(true);
    setCloudSyncEnabled(true);
    localStorage.setItem('vyberology_data_consent', 'true');
    localStorage.setItem('vyberology_cloud_sync', 'true');
    setShowConsentDialog(false);

    toast({
      title: "Cloud sync enabled",
      description: "Your readings are now backed up to the cloud",
    });
  };

  const handleExportData = () => {
    const history = getReadingHistory();
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vyberology-readings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported",
      description: "Your reading history has been downloaded",
    });
  };

  const handleClearLocalData = () => {
    if (window.confirm("Are you sure you want to delete all local data? This cannot be undone.")) {
      clearHistory();
      setLocalReadingsCount(0);
      setDataSize("0 KB");

      toast({
        title: "Data cleared",
        description: "All local reading history has been deleted",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
      <div className="container mx-auto px-6 py-12">
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="gap-2 text-white hover:text-lf-aurora"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="gap-2 text-white hover:text-lf-aurora"
          >
            <Home className="h-5 w-5" />
            Home
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-lf-aurora" />
            <h1 className="font-display text-5xl font-bold text-white">
              Settings
            </h1>
          </div>
          <p className="text-lf-slate text-lg">
            Manage your data storage preferences and privacy settings
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Data Sovereignty Section */}
          <Card className="border-lf-aurora/30 bg-lf-gradient/50 p-6 backdrop-blur shadow-glow">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-6 w-6 text-lf-aurora" />
              <h2 className="font-display text-2xl font-bold text-white">Data Sovereignty</h2>
            </div>

            <div className="space-y-6">
              {/* Local Storage Info */}
              <div className="p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <HardDrive className="h-5 w-5 text-lf-violet mt-1" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">Local Storage</h3>
                      <p className="text-sm text-lf-slate mb-2">
                        Your readings are stored on this device only
                      </p>
                      <div className="text-xs text-lf-slate space-y-1">
                        <p>📊 {localReadingsCount} readings stored</p>
                        <p>💾 Using {dataSize} of space</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-green-400">Active</span>
                  </div>
                </div>
              </div>

              {/* Cloud Sync Toggle */}
              <div className="p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Cloud className="h-5 w-5 text-lf-aurora mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Cloud Sync (Optional)</h3>
                      <p className="text-sm text-lf-slate mb-2">
                        Back up your readings to the cloud for cross-device access
                      </p>
                      <ul className="text-xs text-lf-slate space-y-1 mb-3">
                        <li>✓ Access from any device</li>
                        <li>✓ Automatic backups</li>
                        <li>✓ Never lose your history</li>
                        {dataCollectionConsent && <li className="text-lf-aurora">✓ Help improve Vyberology with anonymized insights</li>}
                      </ul>
                    </div>
                  </div>
                  <Switch
                    checked={cloudSyncEnabled}
                    onCheckedChange={handleCloudSyncToggle}
                    className="data-[state=checked]:bg-lf-gradient"
                  />
                </div>
              </div>

              {/* Data Collection Consent */}
              <div className="p-4 rounded-lg bg-lf-midnight/50 border border-lf-aurora/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Globe className="h-5 w-5 text-lf-aurora mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Help Improve Vyberology</h3>
                      <p className="text-sm text-lf-slate mb-2">
                        Share anonymized reading data to help us understand patterns and improve the app
                      </p>
                      <div className="text-xs text-lf-slate space-y-1">
                        <p className="font-semibold text-white">What we collect:</p>
                        <ul className="space-y-1 ml-4">
                          <li>• Reading inputs (numbers, times, patterns)</li>
                          <li>• Frequency of number appearances</li>
                          <li>• Reading types (time, pattern, manual, image)</li>
                          <li>• Aggregate usage statistics</li>
                        </ul>
                        <p className="font-semibold text-white mt-2">What we DON'T collect:</p>
                        <ul className="space-y-1 ml-4">
                          <li>• Your personal information (email, phone)</li>
                          <li>• Full reading text or interpretations</li>
                          <li>• Screenshots or images</li>
                          <li>• Location data</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={dataCollectionConsent}
                    onCheckedChange={handleDataConsentToggle}
                    className="data-[state=checked]:bg-lf-gradient"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Data Management */}
          <Card className="border-lf-violet/30 bg-lf-ink/60 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-6 w-6 text-lf-violet" />
              <h2 className="font-display text-2xl font-bold text-white">Data Management</h2>
            </div>

            <div className="space-y-4">
              {/* Export Data */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-lf-aurora" />
                  <div>
                    <h3 className="font-semibold text-white">Export Your Data</h3>
                    <p className="text-sm text-lf-slate">Download all readings as JSON</p>
                  </div>
                </div>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="border-lf-aurora text-lf-aurora hover:bg-lf-aurora/10"
                  disabled={localReadingsCount === 0}
                >
                  Export
                </Button>
              </div>

              {/* Clear Local Data */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-lf-midnight/50 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-red-400" />
                  <div>
                    <h3 className="font-semibold text-white">Clear Local Data</h3>
                    <p className="text-sm text-lf-slate">Delete all readings from this device</p>
                  </div>
                </div>
                <Button
                  onClick={handleClearLocalData}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                  disabled={localReadingsCount === 0}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </Card>

          {/* Privacy Notice */}
          <Card className="border-lf-violet/30 bg-lf-ink/60 p-6 backdrop-blur">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-lf-aurora mt-1" />
              <div className="text-sm text-lf-slate space-y-2">
                <p className="font-semibold text-white">Your Privacy Matters</p>
                <p>
                  Vyberology is built with privacy-first principles. All data starts on your device.
                  Cloud sync and data collection are completely optional and require your explicit consent.
                </p>
                <p>
                  Read our full <a href="/privacy" className="text-lf-aurora hover:text-lf-violet underline">Privacy Policy</a> and
                  <a href="/terms" className="text-lf-aurora hover:text-lf-violet underline ml-1">Terms of Service</a>.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Consent Dialog Modal */}
      {showConsentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <Card className="border-lf-aurora/50 bg-lf-ink/95 p-8 backdrop-blur max-w-2xl shadow-glow-lg">
            <div className="flex items-start gap-4 mb-6">
              <Globe className="h-8 w-8 text-lf-aurora flex-shrink-0" />
              <div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">
                  Enable Cloud Sync & Data Collection?
                </h2>
                <p className="text-lf-slate">
                  To enable cloud sync, we need your consent to store your readings on our servers.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6 text-sm text-lf-slate">
              <div>
                <h3 className="font-semibold text-white mb-2">What This Means:</h3>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Your readings will be backed up to secure cloud storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Access your history from any device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Your anonymized data helps us improve Vyberology</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lf-aurora">→</span>
                    <span>You can disable this anytime in Settings</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">We Will NOT:</h3>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Sell your data to third parties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Share your personal reading content publicly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Use your data for advertising purposes</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAcceptConsent}
                className="flex-1 bg-lf-gradient hover:shadow-glow"
              >
                Accept & Enable Cloud Sync
              </Button>
              <Button
                onClick={() => setShowConsentDialog(false)}
                variant="outline"
                className="flex-1 border-lf-violet text-lf-violet hover:bg-lf-violet/10"
              >
                No Thanks, Keep Local Only
              </Button>
            </div>

            <p className="text-xs text-lf-slate text-center mt-4">
              By accepting, you agree to our data collection practices as described in our
              <a href="/privacy" className="text-lf-aurora hover:underline ml-1">Privacy Policy</a>.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;
