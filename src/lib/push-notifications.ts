/**
 * Push-notification adapter placeholder.
 * Install `expo-notifications` and wire APNs/FCM via EAS when ready.
 */

export type PushPermissionStatus = 'undetermined' | 'granted' | 'denied' | 'unavailable';

export interface PushNotificationsAdapter {
  getPermissionStatus(): Promise<PushPermissionStatus>;
  requestPermissions(): Promise<PushPermissionStatus>;
  getExpoPushToken(): Promise<string | null>;
  registerForRemoteMessages(): Promise<void>;
}

class PlaceholderPushAdapter implements PushNotificationsAdapter {
  async getPermissionStatus(): Promise<PushPermissionStatus> {
    return 'unavailable';
  }

  async requestPermissions(): Promise<PushPermissionStatus> {
    return 'unavailable';
  }

  async getExpoPushToken(): Promise<string | null> {
    return null;
  }

  async registerForRemoteMessages(): Promise<void> {
    // no-op until expo-notifications is configured
  }
}

export const pushNotifications: PushNotificationsAdapter = new PlaceholderPushAdapter();
