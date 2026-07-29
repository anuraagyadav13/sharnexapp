import { useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
  PermissionStatus,
} from 'react-native-permissions';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

export type NormalizedPermissionResult = 'granted' | 'denied' | 'blocked';

export type PermissionFeature = 'Camera' | 'Photo Library' | 'Microphone' | 'Contacts' | 'Notifications';

/**
 * Returns platform-specific permission constants based on feature type
 */
const getPlatformPermission = (feature: 'camera' | 'photoLibrary' | 'microphone' | 'contacts'): Permission | null => {
  if (Platform.OS === 'ios') {
    switch (feature) {
      case 'camera':
        return PERMISSIONS.IOS.CAMERA;
      case 'photoLibrary':
        return PERMISSIONS.IOS.PHOTO_LIBRARY;
      case 'microphone':
        return PERMISSIONS.IOS.MICROPHONE;
      case 'contacts':
        return PERMISSIONS.IOS.CONTACTS;
      default:
        return null;
    }
  } else if (Platform.OS === 'android') {
    switch (feature) {
      case 'camera':
        return PERMISSIONS.ANDROID.CAMERA;
      case 'photoLibrary':
        // Android 13+ (API 33+) uses READ_MEDIA_IMAGES
        return (Platform.Version as number) >= 33
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
      case 'microphone':
        return PERMISSIONS.ANDROID.RECORD_AUDIO;
      case 'contacts':
        return PERMISSIONS.ANDROID.READ_CONTACTS;
      default:
        return null;
    }
  }
  return null;
};

/**
 * Normalizes react-native-permissions RESULTS to 'granted' | 'denied' | 'blocked'
 */
const normalizeResult = (status: PermissionStatus): NormalizedPermissionResult => {
  switch (status) {
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return 'granted';
    case RESULTS.BLOCKED:
      return 'blocked';
    case RESULTS.DENIED:
    case RESULTS.UNAVAILABLE:
    default:
      return 'denied';
  }
};

/**
 * Prompts user with an Alert when permission is blocked permanently
 */
const promptBlockedAlert = (featureName: PermissionFeature) => {
  Alert.alert(
    `${featureName} Permission Blocked`,
    `Permission for ${featureName.toLowerCase()} has been blocked. Please enable it manually in your device settings to use this feature.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          Linking.openSettings().catch(() => {
            console.warn('Unable to open settings');
          });
        },
      },
    ],
    { cancelable: true }
  );
};

export const usePermissions = () => {
  /**
   * Check status of a specific permission
   */
  const checkPermission = useCallback(async (feature: 'camera' | 'photoLibrary' | 'microphone' | 'contacts'): Promise<NormalizedPermissionResult> => {
    const permission = getPlatformPermission(feature);
    if (!permission) return 'granted'; // Default fallback if platform not supported
    try {
      const status = await check(permission);
      return normalizeResult(status);
    } catch (err) {
      console.warn(`[usePermissions] Error checking ${feature} permission:`, err);
      return 'denied';
    }
  }, []);

  /**
   * Request Camera Permission
   */
  const requestCamera = useCallback(async (): Promise<NormalizedPermissionResult> => {
    const permission = getPlatformPermission('camera');
    if (!permission) return 'granted';

    try {
      const status = await request(permission);
      const normalized = normalizeResult(status);
      if (normalized === 'blocked') {
        promptBlockedAlert('Camera');
      }
      return normalized;
    } catch (err) {
      console.warn('[usePermissions] Error requesting camera permission:', err);
      return 'denied';
    }
  }, []);

  /**
   * Request Photo Library / Storage Permission
   */
  const requestPhotoLibrary = useCallback(async (): Promise<NormalizedPermissionResult> => {
    const permission = getPlatformPermission('photoLibrary');
    if (!permission) return 'granted';

    try {
      const status = await request(permission);
      const normalized = normalizeResult(status);
      if (normalized === 'blocked') {
        promptBlockedAlert('Photo Library');
      }
      return normalized;
    } catch (err) {
      console.warn('[usePermissions] Error requesting photo library permission:', err);
      return 'denied';
    }
  }, []);

  /**
   * Request Microphone Permission
   */
  const requestMicrophone = useCallback(async (): Promise<NormalizedPermissionResult> => {
    const permission = getPlatformPermission('microphone');
    if (!permission) return 'granted';

    try {
      const status = await request(permission);
      const normalized = normalizeResult(status);
      if (normalized === 'blocked') {
        promptBlockedAlert('Microphone');
      }
      return normalized;
    } catch (err) {
      console.warn('[usePermissions] Error requesting microphone permission:', err);
      return 'denied';
    }
  }, []);

  /**
   * Request Contacts Permission
   */
  const requestContacts = useCallback(async (): Promise<NormalizedPermissionResult> => {
    const permission = getPlatformPermission('contacts');
    if (!permission) return 'granted';

    try {
      const status = await request(permission);
      const normalized = normalizeResult(status);
      if (normalized === 'blocked') {
        promptBlockedAlert('Contacts');
      }
      return normalized;
    } catch (err) {
      console.warn('[usePermissions] Error requesting contacts permission:', err);
      return 'denied';
    }
  }, []);

  /**
   * Request Notifications Permission via @notifee/react-native
   */
  const requestNotifications = useCallback(async (): Promise<NormalizedPermissionResult> => {
    try {
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
          settings.authorizationStatus === AuthorizationStatus.PROVISIONAL) {
        return 'granted';
      } else if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
        return 'denied';
      } else {
        promptBlockedAlert('Notifications');
        return 'blocked';
      }
    } catch (err) {
      console.warn('[usePermissions] Error requesting notification permission:', err);
      return 'denied';
    }
  }, []);

  return {
    checkPermission,
    requestCamera,
    requestPhotoLibrary,
    requestMicrophone,
    requestContacts,
    requestNotifications,
  };
};

export default usePermissions;
