import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useFcmToken() {
  const { token } = useAuthStore();

  useEffect(() => {
    // Push notifications are not supported on web
    if (!token || !Device.isDevice || Platform.OS === 'web') return;

    async function register() {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Rendez',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const { data: fcmToken } = await Notifications.getExpoPushTokenAsync();
        await api.post('/devices/token', { fcmToken, platform: Platform.OS });
      } catch (err) {
        // R2-M7: Wrap in __DEV__ guard — FCM error details leak to production logs otherwise.
        if (__DEV__) console.warn('[FCM] Registration failed:', err);
      }
    }

    register();
  }, [token]);
}
