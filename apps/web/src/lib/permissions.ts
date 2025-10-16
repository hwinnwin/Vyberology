import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Permission types supported by the app
 */
export type PermissionType = 'camera' | 'microphone' | 'photos';

/**
 * Permission status values
 */
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'limited' | 'unavailable';

/**
 * Result of a permission check
 */
export interface PermissionResult {
  status: PermissionStatus;
  canRequest: boolean;
  message?: string;
}

/**
 * Check if we're running on a native mobile platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform (web, ios, android)
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * Check camera permission status
 */
export const checkCameraPermission = async (): Promise<PermissionResult> => {
  if (!isNativePlatform()) {
    // On web, we can't check permissions in advance
    return {
      status: 'prompt',
      canRequest: true,
      message: 'Camera access will be requested when you take a photo'
    };
  }

  try {
    const result = await Camera.checkPermissions();

    if (result.camera === 'granted' || result.photos === 'granted') {
      return {
        status: 'granted',
        canRequest: false
      };
    }

    if (result.camera === 'denied' || result.photos === 'denied') {
      return {
        status: 'denied',
        canRequest: false,
        message: 'Camera access denied. Please enable it in your device settings.'
      };
    }

    return {
      status: 'prompt',
      canRequest: true,
      message: 'Camera permission needed to capture photos'
    };
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return {
      status: 'unavailable',
      canRequest: false,
      message: 'Camera not available on this device'
    };
  }
};

/**
 * Request camera permission
 */
export const requestCameraPermission = async (): Promise<PermissionResult> => {
  if (!isNativePlatform()) {
    // On web, permission is requested when camera is accessed
    return {
      status: 'prompt',
      canRequest: true,
      message: 'Permission will be requested when camera is accessed'
    };
  }

  try {
    const result = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });

    if (result.camera === 'granted' || result.photos === 'granted') {
      return {
        status: 'granted',
        canRequest: false
      };
    }

    if (result.camera === 'denied' || result.photos === 'denied') {
      return {
        status: 'denied',
        canRequest: false,
        message: 'Camera permission denied. Please enable camera access in Settings.'
      };
    }

    return {
      status: result.camera as PermissionStatus,
      canRequest: false,
      message: 'Permission status: ' + result.camera
    };
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return {
      status: 'denied',
      canRequest: false,
      message: 'Failed to request camera permission'
    };
  }
};

/**
 * Check microphone permission status (Web Audio API)
 */
export const checkMicrophonePermission = async (): Promise<PermissionResult> => {
  if (!isNativePlatform()) {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        status: 'unavailable',
        canRequest: false,
        message: 'Microphone not supported in this browser'
      };
    }

    // Try to check permission using Permissions API (not supported in all browsers)
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return {
          status: result.state as PermissionStatus,
          canRequest: result.state === 'prompt',
          message: result.state === 'denied'
            ? 'Microphone access denied. Please enable it in browser settings.'
            : undefined
        };
      }
    } catch (error) {
      // Permissions API not supported, fall through
    }

    return {
      status: 'prompt',
      canRequest: true,
      message: 'Microphone access will be requested when you use voice features'
    };
  }

  // On native platforms, microphone permission is handled by getUserMedia
  // Capacitor doesn't have a dedicated microphone plugin, uses web APIs
  return {
    status: 'prompt',
    canRequest: true,
    message: 'Microphone permission will be requested when needed'
  };
};

/**
 * Request microphone permission
 */
export const requestMicrophonePermission = async (): Promise<PermissionResult> => {
  try {
    // Request access to microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Stop the stream immediately, we just wanted to request permission
    stream.getTracks().forEach(track => track.stop());

    return {
      status: 'granted',
      canRequest: false
    };
  } catch (error) {
    console.error('Error requesting microphone permission:', error);

    if (error instanceof Error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return {
          status: 'denied',
          canRequest: false,
          message: 'Microphone access denied. Please enable microphone in your device settings.'
        };
      }

      if (error.name === 'NotFoundError') {
        return {
          status: 'unavailable',
          canRequest: false,
          message: 'No microphone found on this device'
        };
      }
    }

    return {
      status: 'denied',
      canRequest: false,
      message: 'Failed to access microphone'
    };
  }
};

/**
 * Capture photo with camera (handles permissions automatically)
 */
export const capturePhoto = async (): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    // Check permission first
    const permissionStatus = await checkCameraPermission();

    if (permissionStatus.status === 'denied') {
      return {
        success: false,
        error: permissionStatus.message || 'Camera access denied'
      };
    }

    // Request permission if needed
    if (permissionStatus.canRequest) {
      const requestResult = await requestCameraPermission();
      if (requestResult.status !== 'granted' && requestResult.status !== 'prompt') {
        return {
          success: false,
          error: requestResult.message || 'Camera permission required'
        };
      }
    }

    // Take photo
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });

    return {
      success: true,
      data: image.dataUrl
    };
  } catch (error) {
    console.error('Error capturing photo:', error);

    if (error instanceof Error) {
      // User cancelled
      if (error.message.includes('cancel') || error.message.includes('Cancel')) {
        return {
          success: false,
          error: 'Photo capture cancelled'
        };
      }
    }

    return {
      success: false,
      error: 'Failed to capture photo'
    };
  }
};

/**
 * Pick photo from gallery (handles permissions automatically)
 */
export const pickPhoto = async (): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    // Check permission first
    const permissionStatus = await checkCameraPermission();

    if (permissionStatus.status === 'denied') {
      return {
        success: false,
        error: permissionStatus.message || 'Photo library access denied'
      };
    }

    // Request permission if needed
    if (permissionStatus.canRequest) {
      const requestResult = await requestCameraPermission();
      if (requestResult.status !== 'granted' && requestResult.status !== 'prompt') {
        return {
          success: false,
          error: requestResult.message || 'Photo library permission required'
        };
      }
    }

    // Pick photo from gallery
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos
    });

    return {
      success: true,
      data: image.dataUrl
    };
  } catch (error) {
    console.error('Error picking photo:', error);

    if (error instanceof Error) {
      // User cancelled
      if (error.message.includes('cancel') || error.message.includes('Cancel')) {
        return {
          success: false,
          error: 'Photo selection cancelled'
        };
      }
    }

    return {
      success: false,
      error: 'Failed to select photo'
    };
  }
};

/**
 * Open app settings (for when user needs to enable permissions manually)
 */
export const openAppSettings = async (): Promise<void> => {
  const platform = getPlatform();

  if (platform === 'ios') {
    // iOS: Open app settings
    window.open('app-settings:');
  } else if (platform === 'android') {
    // Android: Intent to app settings
    // This would need a Capacitor plugin for Android settings
    // For now, provide instructions
    alert('Please go to Settings > Apps > Vyberology > Permissions to enable camera/microphone access.');
  } else {
    // Web: Provide instructions
    alert('Please check your browser settings to enable camera/microphone permissions for this site.');
  }
};

/**
 * Get user-friendly permission message
 */
export const getPermissionMessage = (
  permissionType: PermissionType,
  status: PermissionStatus
): string => {
  const messages: Record<PermissionType, Record<PermissionStatus, string>> = {
    camera: {
      granted: 'Camera access granted',
      denied: 'Camera access denied. Please enable it in Settings to capture photos.',
      prompt: 'Camera access needed to capture photos.',
      limited: 'Limited camera access. Some features may not be available.',
      unavailable: 'Camera is not available on this device.'
    },
    microphone: {
      granted: 'Microphone access granted',
      denied: 'Microphone access denied. Please enable it in Settings to use voice features.',
      prompt: 'Microphone access needed for voice commands.',
      limited: 'Limited microphone access. Some features may not be available.',
      unavailable: 'Microphone is not available on this device.'
    },
    photos: {
      granted: 'Photo library access granted',
      denied: 'Photo library access denied. Please enable it in Settings.',
      prompt: 'Photo library access needed to select images.',
      limited: 'Limited photo library access.',
      unavailable: 'Photo library is not available.'
    }
  };

  return messages[permissionType][status] || 'Permission status unknown';
};
