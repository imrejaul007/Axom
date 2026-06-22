/**
 * REZ Safe Hub - Premium Safety Dashboard (Enhanced UI/UX)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const SAFETY_FEATURES: Array<{
  icon;
  title: string;
  subtitle: string;
  color: string;
  gradient: readonly [string, string];
}> = [
  { icon: 'shield-checkmark', title: 'Women Safety', subtitle: 'Enhanced protection', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] as const },
  { icon: 'navigate', title: 'Safe Routes', subtitle: 'Well-lit paths', color: '#10B981', gradient: ['#10B981', '#059669'] as const },
  { icon: 'alert-circle', title: 'Report', subtitle: 'Report incidents', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] as const },
  { icon: 'people', title: 'Trusted Circle', subtitle: 'Emergency contacts', color: '#6366F1', gradient: ['#6366F1', '#4F46E5'] as const },
  { icon: 'map', title: 'Safe Zone Map', subtitle: 'Nearby safe places', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] as const },
  { icon: 'footsteps', title: 'Walk With Me', subtitle: 'Virtual companion', color: '#EC4899', gradient: ['#EC4899', '#DB2777'] as const },
];

const EMERGENCY_CONTACTS = [
  { name: 'Police', number: '100', icon: 'shield', color: '#3B82F6' },
  { name: 'Ambulance', number: '108', icon: 'medical', color: '#EF4444' },
  { name: 'Women Helpline', number: '181', icon: 'call', color: '#EC4899' },
];

const NEARBY_SAFE_PLACES = [
  { name: 'Cubbon Park Police Station', distance: '500m', type: 'police' },
  { name: 'Manipal Hospital', distance: '1.2km', type: 'hospital' },
  { name: 'Women Shelter Center', distance: '2km', type: 'shelter' },
];

export default function SafeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [safetyScore, setSafetyScore] = useState(78);
  const [isSOSPressed, setIsSOSPressed] = useState(false);
  const sosScaleAnim = new Animated.Value(1);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return { color: '#10B981', label: 'Safe', emoji: '🟢' };
    if (score >= 60) return { color: '#FACC15', label: 'Moderate', emoji: '🟡' };
    if (score >= 40) return { color: '#F97316', label: 'Caution', emoji: '🟠' };
    return { color: '#EF4444', label: 'High Alert', emoji: '🔴' };
  };

  const safetyInfo = getSafetyColor(safetyScore);

  const handleSOS = () => {
    router.push('/safe/sos');
  };

  const handleSOSPress = () => {
    setIsSOSPressed(true);
    Animated.spring(sosScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleSOSRelease = () => {
    setIsSOSPressed(false);
    Animated.spring(sosScaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const getSafeIcon = (type: string) => {
    switch (type) {
      case 'police': return 'shield-checkmark';
      case 'hospital': return 'medical';
      case 'shelter': return 'home';
      default: return 'location';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>REZ Safe</Text>
          <Text style={styles.headerSubtitle}>Your safety companion</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Safety Score Card */}
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.15)', 'transparent']}
        style={styles.scoreGradient}
      >
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <View style={[styles.scoreCircle, { borderColor: safetyInfo.color }]}>
              <Text style={[styles.scoreNumber, { color: safetyInfo.color }]}>{safetyScore}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </View>
          <View style={styles.scoreRight}>
            <View style={styles.scoreStatusBadge}>
              <Text style={styles.scoreEmoji}>{safetyInfo.emoji}</Text>
              <Text style={[styles.scoreStatus, { color: safetyInfo.color }]}>{safetyInfo.label}</Text>
            </View>
            <View style={styles.scoreLocation}>
              <Ionicons name="location" size={14} color={COLORS.textSecondary} />
              <Text style={styles.scoreAreaText}>Koramangala, Bangalore</Text>
            </View>
            <Text style={styles.scoreTime}>Updated 5 min ago</Text>
          </View>
        </View>
      </LinearGradient>

      {/* SOS Button */}
      <Animated.View style={[styles.sosContainer, { transform: [{ scale: sosScaleAnim }] }]}>
        <Pressable
          style={({ pressed }) => [
            styles.sosButton,
            pressed && styles.sosButtonPressed,
          ]}
          onPress={handleSOS}
          onPressIn={handleSOSPress}
          onPressOut={handleSOSRelease}
        >
          <LinearGradient
            colors={isSOSPressed ? ['#DC2626', '#B91C1C'] : ['#EF4444', '#DC2626']}
            style={styles.sosGradient}
          >
            <View style={styles.sosIconContainer}>
              <Ionicons name="warning" size={36} color="#fff" />
            </View>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosHint}>Tap for emergency options</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emergencyScroll}>
          {EMERGENCY_CONTACTS.map((contact, index) => (
            <TouchableOpacity key={index} style={styles.emergencyCard}>
              <LinearGradient
                colors={[contact.color + '20', contact.color + '10']}
                style={styles.emergencyGradient}
              >
                <View style={[styles.emergencyIcon, { backgroundColor: contact.color }]}>
                  <Ionicons name={contact.icon as any} size={20} color="#fff" />
                </View>
                <Text style={styles.emergencyName}>{contact.name}</Text>
                <Text style={styles.emergencyNumber}>{contact.number}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Safety Features Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Features</Text>
        <View style={styles.featuresGrid}>
          {SAFETY_FEATURES.map((feature, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.featureCard,
                pressed && styles.featureCardPressed,
              ]}
              onPress={() => router.push(`/safe/${feature.title.toLowerCase().replace(/ /g, '-')}`)}
            >
              <LinearGradient
                colors={feature.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureGradient}
              >
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon as any} size={28} color="#fff" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Nearby Safe Places */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Safe Places</Text>
          <TouchableOpacity onPress={() => router.push('/safe/map')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.safePlacesList}>
          {NEARBY_SAFE_PLACES.map((place, index) => (
            <View key={index} style={styles.safePlaceCard}>
              <View style={[styles.safePlaceIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name={getSafeIcon(place.type) as any} size={20} color={COLORS.success} />
              </View>
              <View style={styles.safePlaceInfo}>
                <Text style={styles.safePlaceName}>{place.name}</Text>
                <View style={styles.safePlaceMeta}>
                  <Ionicons name="location" size={12} color={COLORS.textMuted} />
                  <Text style={styles.safePlaceDistance}>{place.distance}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.directionsButton}>
                <Ionicons name="navigate" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Report */}
      <TouchableOpacity style={styles.reportBanner} onPress={() => router.push('/safe/report')}>
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
          style={styles.reportGradient}
        >
          <View style={styles.reportIconContainer}>
            <Ionicons name="megaphone" size={24} color={COLORS.warning} />
          </View>
          <View style={styles.reportContent}>
            <Text style={styles.reportTitle}>Report an Incident</Text>
            <Text style={styles.reportSubtitle}>Help keep your community safe</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerContent: {},
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  scoreGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: 2,
    marginBottom: SPACING.lg,
  },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  scoreLeft: {
    marginRight: SPACING.lg,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scoreRight: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  scoreEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreAreaText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  scoreTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  sosContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  sosButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  sosButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  sosGradient: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
  },
  sosIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sosText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
  },
  sosHint: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emergencyScroll: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  emergencyCard: {
    marginRight: SPACING.md,
  },
  emergencyGradient: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    minWidth: 100,
  },
  emergencyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emergencyName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  emergencyNumber: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  featureCard: {
    width: '48%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  featureCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  featureGradient: {
    padding: SPACING.md,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  safePlacesList: {
    gap: SPACING.sm,
  },
  safePlaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  safePlaceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  safePlaceInfo: {
    flex: 1,
  },
  safePlaceName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  safePlaceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safePlaceDistance: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  directionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportBanner: {
    marginBottom: SPACING.lg,
  },
  reportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  reportSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  bottomSpacer: {
    height: 100,
  },
});
