import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Mic, AlertTriangle, Settings, X } from "lucide-react";
import { PermissionType, PermissionStatus, openAppSettings } from "@/lib/permissions";

interface PermissionPromptProps {
  permissionType: PermissionType;
  status: PermissionStatus;
  onRequest?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: "inline" | "modal";
}

export function PermissionPrompt({
  permissionType,
  status,
  onRequest,
  onDismiss,
  className = "",
  variant = "inline"
}: PermissionPromptProps) {
  const getIcon = () => {
    switch (permissionType) {
      case 'camera':
      case 'photos':
        return <Camera className="h-6 w-6" />;
      case 'microphone':
        return <Mic className="h-6 w-6" />;
      default:
        return <AlertTriangle className="h-6 w-6" />;
    }
  };

  const getTitle = () => {
    const titles: Record<PermissionType, string> = {
      camera: 'Camera Permission Needed',
      microphone: 'Microphone Permission Needed',
      photos: 'Photo Library Permission Needed'
    };
    return titles[permissionType];
  };

  const getDescription = () => {
    const descriptions: Record<PermissionType, Record<PermissionStatus, string>> = {
      camera: {
        granted: 'Camera access granted',
        denied: 'Camera access was denied. To use camera features, please enable camera permission in your device settings.',
        prompt: 'This feature requires access to your camera to capture photos with frequency numbers.',
        limited: 'Camera access is limited. Some features may not work as expected.',
        unavailable: 'Camera is not available on this device.'
      },
      microphone: {
        granted: 'Microphone access granted',
        denied: 'Microphone access was denied. To use voice features, please enable microphone permission in your device settings.',
        prompt: 'This feature requires access to your microphone for voice commands like "Hey Lumen".',
        limited: 'Microphone access is limited. Voice features may not work properly.',
        unavailable: 'Microphone is not available on this device.'
      },
      photos: {
        granted: 'Photo library access granted',
        denied: 'Photo library access was denied. To select photos, please enable permission in your device settings.',
        prompt: 'This feature requires access to your photo library to select images with frequency numbers.',
        limited: 'Photo library access is limited. You may not see all photos.',
        unavailable: 'Photo library is not available.'
      }
    };
    return descriptions[permissionType][status];
  };

  const getActionButton = () => {
    if (status === 'granted') {
      return null;
    }

    if (status === 'denied') {
      return (
        <Button
          onClick={openAppSettings}
          className="gap-2 bg-lf-gradient hover:shadow-glow"
        >
          <Settings className="h-4 w-4" />
          Open Settings
        </Button>
      );
    }

    if (status === 'prompt' && onRequest) {
      return (
        <Button
          onClick={onRequest}
          className="gap-2 bg-lf-gradient hover:shadow-glow"
        >
          {getIcon()}
          Grant Permission
        </Button>
      );
    }

    return null;
  };

  const getVariant = () => {
    if (status === 'denied' || status === 'unavailable') {
      return 'destructive';
    }
    return 'default';
  };

  if (variant === "modal") {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
        <Card className="relative w-full max-w-md border-white/10 bg-lf-ink/95 p-8 backdrop-blur">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute right-4 top-4 rounded-full p-1 text-lf-slate hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="flex flex-col items-center text-center">
            <div className={`mb-4 rounded-full p-4 ${
              status === 'denied' || status === 'unavailable'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-lf-violet/20 text-lf-aurora'
            }`}>
              {getIcon()}
            </div>

            <h2 className="mb-3 font-display text-2xl font-bold text-white">
              {getTitle()}
            </h2>

            <p className="mb-6 text-lf-slate">
              {getDescription()}
            </p>

            <div className="flex gap-3">
              {getActionButton()}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="outline"
                  className="border-lf-violet text-lf-violet hover:bg-lf-violet/10"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Inline variant
  return (
    <Alert
      variant={getVariant() as "default" | "destructive"}
      className={`border-lf-violet/30 bg-lf-ink/60 backdrop-blur ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-full p-2 ${
          status === 'denied' || status === 'unavailable'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-lf-violet/20 text-lf-aurora'
        }`}>
          {getIcon()}
        </div>

        <div className="flex-1">
          <AlertTitle className="text-white">
            {getTitle()}
          </AlertTitle>
          <AlertDescription className="mt-2 text-lf-slate">
            {getDescription()}
          </AlertDescription>

          {getActionButton() && (
            <div className="mt-4">
              {getActionButton()}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded-full p-1 text-lf-slate hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Alert>
  );
}
