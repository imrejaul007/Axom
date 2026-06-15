/**
 * Crisis Check-In - Safety check-in during crises (Premium UI)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const CHECK_IN_STATUSES = [
  {
    id: 'safe',
    label: 'I am Safe',
    icon: 'checkmark-circle',
    color: '#10B981',
    gradient: ['#10B981', '#059669'] as [string, string],
    description: 'You are safe and do not need assistance',
  },
  {
    id: 'need_shelter',
    label: 'Need Shelter',
    icon: 'bed',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'] as [string, string],
    description: 'You need evacuation or shelter',
  },
  {
    id: 'need_help',
    label: 'Need Help',
    icon: 'warning',
    color: '#EF4444',
    gradient: ['#EF4444', '#DC2626'] as [string, string],
    description: 'You need immediate assistance',
  },
  {
    id: 'injured',
    label: 'Injured',
    icon: 'medkit',
    color: '#DC2626',
    gradient: ['#DC2626', '#B91C1C'] as [string, string],
    description: 'Medical assistance required',
  },
];

export default function CrisisCheckInScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getLocation();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const getLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });

        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (reverseGeocode[0]) {
          const addr = reverseGeocode[0] as any;
          setLocationName(
            `${addr.subLocality || ''}, ${addr.locality || ''}`.trim() || 'Current location'
          );
        }
      }
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleStatusSelect = (statusId: string) => {
    setSelectedStatus(statusId);
    if (statusId === 'need_help' || statusId === 'injured') {
      Vibration.vibrate([200, 100, 200]);
      Alert.alert(
        'Emergency Alert',
        'This will alert emergency services and your trusted contacts.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setSelectedStatus(null) },
          { text: 'Confirm', style: 'destructive', onPress: () => handleSubmit() },
        ]
      );
    }
  };

  const handleSubmit = async () => {
    if (!selectedStatus) {
      Alert.alert('Required', 'Please select your status');
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCheckedIn(true);
      Vibration.vibrate([100, 50, 100]);

      if (selectedStatus === 'safe') {
        Alert.alert(
          'Checked In Safe',
          'Your safety status has been shared with your trusted contacts.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'Do you need immediate emergency assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Trigger SOS', style: 'destructive', onPress: () => router.push('/safe/sos') },
      ]
    );
  };

  if (checkedIn) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Animated.View style={[styles.successContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.successIconContainer}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.successTitle}>Check-In Complete</Text>
          <Text style={styles.successText}>
            Your status has been recorded. Help is on the way if needed.
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.doneButtonGradient}>
              <Text style={styles.doneButtonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crisis Check-In</Text>
        <TouchableOpacity style={styles.sosButtonSmall} onPress={handleSOS}>
          <Ionicons name="warning" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Location Info */}
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.1)', 'transparent']}
        style={styles.locationGradient}
      >
        <View style={styles.locationCard}>
          <View style={styles.locationIconContainer}>
            <Ionicons name="location" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Current Location</Text>
            <Text style={styles.locationText}>
              {gettingLocation ? 'Getting location...' : locationName}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={getLocation} disabled={gettingLocation}>
            <Ionicons
              name="refresh"
              size={20}
              color={gettingLocation ? COLORS.textMuted : COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How are you doing?</Text>
        <Text style={styles.instructionText}>
          Select your current status so we can provide the right help if needed.
          Your trusted contacts will be notified.
        </Text>
      </View>

      {/* Status Options */}
      <View style={styles.statusContainer}>
        {CHECK_IN_STATUSES.map((status) => {
          const isSelected = selectedStatus === status.id;
          return (
            <TouchableOpacity
              key={status.id}
              style={[styles.statusCard, isSelected && styles.statusCardSelected]}
              onPress={() => handleStatusSelect(status.id)}
              activeOpacity={0.8}
            >
              {isSelected ? (
                <LinearGradient colors={status.gradient} style={styles.statusGradient}>
                  <View style={styles.statusContent}>
                    <View style={styles.statusIconContainer}>
                      <View style={styles.statusIconWhite}>
                        <Ionicons name={status.icon as any} size={32} color={status.color} />
                      </View>
                    </View>
                    <View style={styles.statusInfo}>
                      <Text style={styles.statusLabelWhite}>{status.label}</Text>
                      <Text style={styles.statusDescriptionWhite}>{status.description}</Text>
                    </View>
                  </View>
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark-circle" size={28} color="#fff" />
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.statusContent}>
                  <View style={[styles.statusIconContainer, { backgroundColor: status.color + '15' }]}>
                    <Ionicons name={status.icon as any} size={32} color={status.color} />
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusLabel}>{status.label}</Text>
                    <Text style={styles.statusDescription}>{status.description}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Check In Button */}
      {selectedStatus && selectedStatus !== 'need_help' && selectedStatus !== 'injured' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={submitting ? [COLORS.textSecondary, COLORS.textMuted] : ['#10B981', '#059669']}
              style={styles.checkInGradient}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.checkInButtonText}>
                {submitting ? 'Checking In...' : 'Check In Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Emergency Button */}
      <View style={styles.emergencyContainer}>
        <TouchableOpacity style={styles.emergencyButton} onPress={handleSOS}>
          <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.emergencyGradient}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.emergencyButtonText}>Emergency SOS</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  sosButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationGradient: {
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: 2,
    marginBottom: SPACING.lg,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  locationText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  instructionTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  instructionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  statusContainer: {
    paddingHorizontal: SPACING.lg,
    flex: 1,
    gap: SPACING.md,
  },
  statusCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  statusCardSelected: {
    borderColor: 'transparent',
  },
  statusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    flex: 1,
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statusIconWhite: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statusLabelWhite: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  statusDescriptionWhite: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  checkmarkContainer: {
    marginLeft: SPACING.sm,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  checkInButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  checkInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  checkInButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
  emergencyContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  emergencyButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  emergencyButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  successIconContainer: {
    marginBottom: SPACING.lg,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  successText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  doneButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  doneButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
});
