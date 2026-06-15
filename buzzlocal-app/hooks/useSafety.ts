import logger from '../src/utils/logger';

/**
 * BuzzLocal Safety Hooks - Real-time safety features
 *
 * These are the ONLY features that genuinely need WebSockets.
 * Everything else uses polling.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_BUZZLOCAL_SOCKET || 'http://localhost:4023';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;
}

interface SOSAlertData {
  eventId: string;
  from: string;
  type: string;
  location: {
    lat: number;
    lng: number;
    area: string;
  };
  timestamp: number;
}

interface FriendLocation {
  userId: string;
  location: {
    lat: number;
    lng: number;
    accuracy: number;
    speed: number;
    timestamp: number;
  };
}

interface SafeZoneData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  rating: number;
  distance: string;
}

// Shared socket reference (for cross-hook communication)
const sharedSocketRef: { current: Socket | null } = { current: null };

/**
 * WebSocket connection for real-time safety features
 */
export function useSafetySocket(userId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sosAlert, setSOSAlert] = useState<SOSAlertData | null>(null);
  const [friendLocations, setFriendLocations] = useState<Map<string, FriendLocation>>(new Map());

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      logger.info('Safety socket connected');
      setIsConnected(true);
      socket.emit('authenticate', { userId });
    });

    socket.on('disconnect', () => {
      logger.info('Safety socket disconnected');
      setIsConnected(false);
    });

    // SOS Alerts from trusted circle
    socket.on('sos-alert', (alert: SOSAlertData) => {
      setSOSAlert(alert);
      // Play alert sound and vibration
      Notifications.scheduleNotificationAsync({trigger: null,
        content: {
          title: 'SOS Alert!',
          body: 'Someone in your trusted circle triggered SOS',
          data: { alert },
          sound: true,
          interruptionLevel: 'timeSensitive',
        },
      });
    });

    // Nearby SOS (for guardians)
    socket.on('sos-nearby', (alert: SOSAlertData) => {
      setSOSAlert(alert);
      Notifications.scheduleNotificationAsync({trigger: null,
        content: {
          title: 'Nearby SOS Alert',
          body: 'Someone nearby needs help',
          data: { alert },
          sound: true,
          interruptionLevel: 'timeSensitive',
        },
      });
    });

    // Friend location updates
    socket.on('friend-location', (data: FriendLocation) => {
      setFriendLocations(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, data);
        return newMap;
      });
    });

    // Walk with me sessions
    socket.on('walk-started', (data: { userId: string }) => {
      Notifications.scheduleNotificationAsync({trigger: null,
        content: {
          title: 'Walk Started',
          body: `${data.userId} started sharing their walk`,
        },
      });
    });

    socket.on('walk-location-update', (data: { userId: string; location: LocationData; timestamp?: number }) => {
      setFriendLocations(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, {
          userId: data.userId,
          location: {
            ...data.location,
            timestamp: data.timestamp || Date.now(),
          },
        });
        return newMap;
      });
    });

    socket.on('walk-ended', () => {
      Notifications.scheduleNotificationAsync({trigger: null,
        content: {
          title: 'Walk Ended',
          body: 'Your friend has reached their destination safely',
        },
      });
    });

    socketRef.current = socket;
    sharedSocketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      sharedSocketRef.current = null;
    };
  }, [userId]);

  return {
    socket: socketRef.current,
    isConnected,
    sosAlert,
    friendLocations,
    clearSOSAlert: () => setSOSAlert(null),
  };
}

/**
 * SOS Trigger Hook - Critical real-time feature
 */
export function useSOS() {
  const socketRef = sharedSocketRef;
  const [isTriggering, setIsTriggering] = useState(false);
  const [activeEvent, setActiveEvent] = useState<{ eventId: string; status: string } | null>(null);

  const triggerSOS = useCallback(async (type: 'panic' | 'medical' | 'safety' | 'fake_call' = 'panic') => {
    setIsTriggering(true);

    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission required for SOS');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get area
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const area = (address?.district || address?.subregion || 'Unknown') ?? 'Unknown';

      // Emit SOS via socket
      if (socketRef.current?.connected) {
        socketRef.current.emit('sos-trigger', {
          type,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          area,
        });
      }

      // Also call REST API as fallback
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        await fetch(`${process.env.EXPO_PUBLIC_BUZZLOCAL_API}/api/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type,
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            area,
          }),
        });
      }

    } catch (error) {
      console.error('SOS trigger failed:', error);
      throw error;
    } finally {
      setIsTriggering(false);
    }
  }, []);

  const cancelSOS = useCallback(async (eventId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('sos-cancel', eventId);
    }
    setActiveEvent(null);
  }, []);

  const listenForConfirmation = useCallback((callback: (eventId: string) => void) => {
    socketRef.current?.on('sos-confirmed', (data: { eventId: string }) => {
      setActiveEvent({ eventId: data.eventId, status: 'active' });
      callback(data.eventId);
    });

    socketRef.current?.on('sos-error', () => {
      setActiveEvent(null);
    });
  }, []);

  return {
    triggerSOS,
    cancelSOS,
    isTriggering,
    activeEvent,
    listenForConfirmation,
  };
}

/**
 * Walk With Me Hook - Location sharing with trusted circle
 */
export function useWalkWithMe(trustedUserId: string | null) {
  const [isActive, setIsActive] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const socketRef = sharedSocketRef;

  const startWalk = useCallback(async (destinationLat: number, destinationLng: number) => {
    if (!trustedUserId || !socketRef.current?.connected) return;

    // Get initial location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Start watching location
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      (newLocation) => {
        // Calculate ETA (simplified)
        const distance = calculateDistance(
          newLocation.coords.latitude,
          newLocation.coords.longitude,
          destinationLat,
          destinationLng
        );
        setEta(Math.round(distance / 1.4)); // ~1.4 m/s walking speed

        // Send location update
        socketRef.current?.emit('walk-location', {
          lat: newLocation.coords.latitude,
          lng: newLocation.coords.longitude,
          eta: Math.round(distance / 1.4),
        });
      }
    );

    // Notify trusted user
    socketRef.current.emit('walk-with-me-start', {
      trustedUserId,
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    });

    setIsActive(true);
  }, [trustedUserId]);

  const endWalk = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    socketRef.current?.emit('walk-with-me-end');
    setIsActive(false);
    setEta(null);
  }, []);

  return {
    startWalk,
    endWalk,
    isActive,
    eta,
  };
}

/**
 * Trusted Circle Hook - Manage and track trusted contacts
 */
export function useTrustedCircle(userId: string | null) {
  const [circle, setCircle] = useState<{ memberId: string; relationship: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCircle = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BUZZLOCAL_API}/api/trusted-circle/${userId}`);
      const data = await response.json();
      setCircle(data.members || []);
    } catch (error) {
      console.error('Failed to fetch trusted circle:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addMember = useCallback(async (memberId: string, relationship: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BUZZLOCAL_API}/api/trusted-circle/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: [...circle, { memberId, relationship }],
        }),
      });

      if (response.ok) {
        setCircle(prev => [...prev, { memberId, relationship }]);
      }
    } catch (error) {
      console.error('Failed to add trusted circle member:', error);
    }
  }, [userId, circle]);

  const removeMember = useCallback(async (memberId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BUZZLOCAL_API}/api/trusted-circle/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: circle.filter(m => m.memberId !== memberId),
        }),
      });

      if (response.ok) {
        setCircle(prev => prev.filter(m => m.memberId !== memberId));
      }
    } catch (error) {
      console.error('Failed to remove trusted circle member:', error);
    }
  }, [userId, circle]);

  return {
    circle,
    loading,
    fetchCircle,
    addMember,
    removeMember,
  };
}

/**
 * Safe Zones Hook - Nearby safe zones
 */
export function useSafeZones() {
  const [zones, setZones] = useState<SafeZoneData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNearbyZones = useCallback(async (lat: number, lng: number, radius: number = 5000) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BUZZLOCAL_API}/api/safe-zones?lat=${lat}&lng=${lng}&radius=${radius}`
      );
      const data = await response.json();
      setZones(data.zones || []);
    } catch (error) {
      console.error('Failed to fetch safe zones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    zones,
    loading,
    fetchNearbyZones,
  };
}

/**
 * Safe Route Hook - Calculate safe walking routes
 */
export function useSafeRoute() {
  const [route, setRoute] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const calculateRoute = useCallback(async (
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    mode: 'walk' | 'drive' = 'walk'
  ) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BUZZLOCAL_API}/api/safe-route?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}&mode=${mode}`
      );
      const data = await response.json();
      setRoute(data);
    } catch (error) {
      console.error('Failed to calculate safe route:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    route,
    loading,
    calculateRoute,
  };
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Export shared socket ref
export { sharedSocketRef as socketRef };
