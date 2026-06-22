/**
 * SOS Screen - Emergency trigger interface (Premium Design)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

const SOS_OPTIONS = [
  { id: 'panic', icon: 'alert-circle', label: 'Panic', color: '#EF4444', description: 'Immediate emergency', gradient: ['#EF4444', '#DC2626'] as [string, string] },
  { id: 'medical', icon: 'medkit', label: 'Medical', color: '#F87171', description: 'Health emergency', gradient: ['#F87171', '#EF4444'] as [string, string] },
  { id: 'safety', icon: 'shield', label: 'Safety', color: '#FBBF24', description: 'Safety concern', gradient: ['#FBBF24', '#F59E0B'] as [string, string] },
  { id: 'fake_call', icon: 'call', label: 'Fake Call', color: '#60A5FA', description: 'Discreet exit', gradient: ['#60A5FA', '#3B82F6'] as [string, string] },
];

export default function SOSScreen() {
  const router = useRouter();
  const { triggerSOS, isTriggering } = { triggerSOS: async () => {}, isTriggering: false };
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for SOS button
  useEffect(() => {
    if (isPressing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isPressing]);

  const handleSOSPress = useCallback(() => {
    if (!selectedType) {
      Alert.alert('Select Type', 'Please select an emergency type first');
      return;
    }

    Alert.alert(
      'Trigger SOS?',
      'This will notify your trusted contacts and emergency services.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              Vibration.vibrate([500, 200, 500]);
              Alert.alert('SOS Activated', 'Help is on the way. Stay calm.');
              router.push('/safe/alerts/active');
            } catch (error) {
              Alert.alert('Error', 'Failed to trigger SOS. Please try again.');
            }
          },
        },
      ]
    );
  }, [selectedType, router]);

  const startPress = () => setIsPressing(true);
  const cancelPress = () => setIsPressing(false);

  const handleFakeCall = () => {
    setSelectedType('fake_call');
    Alert.alert(
      'Fake Call Ready',
      'Your phone will ring in 30 seconds with a realistic call sound.',
      [
        { text: 'Cancel', onPress: () => setSelectedType(null) },
        {
          text: 'Activate',
          onPress: () => {
            Alert.alert('Fake Call', 'Call incoming in 30 seconds...');
            setTimeout(() => {
              Alert.alert('📞 Incoming Call', 'Mom calling...');
            }, 30000);
          },
        },
      ]
    );
  };

  const selectedOption = SOS_OPTIONS.find(opt => opt.id === selectedType);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Emergency SOS</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Ready</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['rgba(239, 68, 68, 0.15)', 'transparent']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Stay Calm</Text>
          <Text style={styles.heroSubtitle}>
            Select an emergency type and press the SOS button. Your trusted contacts will be notified immediately.
          </Text>
        </View>
      </View>

      {/* Emergency Type Selection */}
      <View style={styles.typeContainer}>
        <Text style={styles.sectionTitle}>Emergency Type</Text>
        <View style={styles.typeGrid}>
          {SOS_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.typeCard,
                selectedType === option.id && styles.typeCardSelected,
                pressed && styles.typeCardPressed,
              ]}
              onPress={() => setSelectedType(option.id)}
              onLongPress={option.id === 'fake_call' ? handleFakeCall : undefined}
            >
              <LinearGradient
                colors={selectedType === option.id ? option.gradient : ['#1F1F2E', '#1A1A2E']}
                style={styles.typeGradient}
              >
                <View style={[styles.typeIconContainer, { backgroundColor: option.color + '30' }]}>
                  <Ionicons name={option.icon as any} size={28} color={option.color} />
                </View>
                <Text style={[styles.typeLabel, selectedType === option.id && { color: '#fff' }]}>
                  {option.label}
                </Text>
                <Text style={[styles.typeDescription, selectedType === option.id && styles.typeDescriptionSelected]}>
                  {option.description}
                </Text>
              </LinearGradient>
              {selectedType === option.id && (
                <View style={[styles.selectedIndicator, { backgroundColor: option.color }]} />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Trusted Circle Info */}
      <View style={styles.circleInfo}>
        <View style={styles.circleHeader}>
          <View style={styles.circleIconContainer}>
            <Ionicons name="people" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.circleTitle}>Trusted Circle</Text>
          <View style={styles.circleBadge}>
            <Text style={styles.circleCount}>3 contacts</Text>
          </View>
        </View>
        <View style={styles.circleContacts}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.contactAvatar}>
              <Text style={styles.contactInitial}>{['M', 'D', 'S'][i - 1]}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.manageButton} onPress={() => router.push('/safe/circle')}>
            <Ionicons name="add" size={16} color={COLORS.primary} />
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SOS Button */}
      <View style={styles.sosContainer}>
        <Animated.View
          style={[
            styles.sosGlow,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6],
              }),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        <Pressable
          style={({ pressed }) => [
            styles.sosButton,
            !selectedType && styles.sosButtonDisabled,
            pressed && styles.sosButtonPressed,
          ]}
          onPress={handleSOSPress}
          onPressIn={startPress}
          onPressOut={cancelPress}
          disabled={!selectedType || isTriggering}
        >
          <LinearGradient
            colors={selectedOption?.gradient || ['#EF4444', '#DC2626']}
            style={styles.sosGradient}
          >
            <View style={styles.sosInner}>
              <Ionicons name="warning" size={48} color="#fff" />
              <Text style={styles.sosText}>
                {isTriggering ? 'Activating...' : 'SOS'}
              </Text>
            </View>
          </LinearGradient>
        </Pressable>

        <Text style={styles.sosHint}>
          {isPressing ? 'Release to trigger' : 'Hold to cancel • Release to trigger'}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[
          { icon: 'navigate', label: 'Safe Route', color: COLORS.primary },
          { icon: 'call', label: 'Call Contact', color: '#10B981' },
          { icon: 'map', label: 'Safe Zone', color: '#FBBF24' },
        ].map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickAction}
            onPress={() => router.push(`/safe/${action.label.toLowerCase().replace(' ', '-')}`)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon as any} size={22} color={action.color} />
            </View>
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    color: '#10B981',
    fontWeight: '500',
  },
  heroSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  heroGradient: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    height: 200,
    borderRadius: 100,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.lg,
  },
  typeContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeCard: {
    width: '48%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  typeCardSelected: {
    borderWidth: 0,
  },
  typeCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  typeGradient: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  typeDescriptionSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  circleInfo: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  circleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  circleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  circleTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  circleBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  circleCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '500',
  },
  circleContacts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -8,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
    marginRight: -8,
  },
  contactInitial: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#fff',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginLeft: SPACING.sm,
    gap: 4,
  },
  manageButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sosContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  sosGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.error,
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  sosButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  sosButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  sosGradient: {
    flex: 1,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosInner: {
    alignItems: 'center',
  },
  sosText: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: '#fff',
    marginTop: SPACING.xs,
    letterSpacing: 2,
  },
  sosHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickAction: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
