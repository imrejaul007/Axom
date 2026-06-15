/**
 * ReZ Ride Integration - Safe rides and transportation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface RideOption {
  id: string;
  type: 'bike' | 'auto' | 'cab' | 'suv';
  name: string;
  eta: string;
  price: string;
  surge: number;
  seats: number;
  features: string[];
}

interface RecentRide {
  id: string;
  date: string;
  from: string;
  to: string;
  price: string;
  type: string;
}

interface SafetyFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function RidesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pickup, setPickup] = useState('Koramangala, Bangalore');
  const [destination, setDestination] = useState('');
  const [rideOptions, setRideOptions] = useState<RideOption[]>([]);
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [safetyFeatures, setSafetyFeatures] = useState<SafetyFeature[]>([]);

  useEffect(() => {
    fetchRideData();
  }, []);

  const fetchRideData = async () => {
    try {
      setRideOptions([
        { id: '1', type: 'bike', name: 'Bike', eta: '3 min', price: '₹45', surge: 0, seats: 1, features: ['Fastest', 'Affordable'] },
        { id: '2', type: 'auto', name: 'Auto', eta: '5 min', price: '₹75', surge: 0, seats: 3, features: ['AC', 'Shareable'] },
        { id: '3', type: 'cab', name: 'Cab', eta: '7 min', price: '₹120', surge: 1.2, seats: 4, features: ['AC', 'Comfortable'] },
        { id: '4', type: 'suv', name: 'SUV', eta: '10 min', price: '₹180', surge: 0, seats: 6, features: ['AC', 'Spacious', 'Family'] },
      ]);

      setRecentRides([
        { id: '1', date: 'Today, 9:30 AM', from: 'Home', to: 'Office', price: '₹95', type: 'cab' },
        { id: '2', date: 'Yesterday, 6:15 PM', from: 'Office', to: 'Koramangala', price: '₹85', type: 'auto' },
        { id: '3', date: 'May 20, 8:45 AM', from: 'Home', to: 'Forum Mall', price: '₹110', type: 'cab' },
      ]);

      setSafetyFeatures([
        { id: '1', icon: 'location', title: 'Live Location Share', description: 'Share your ride with trusted contacts', enabled: true },
        { id: '2', icon: 'shield-checkmark', title: 'Verified Drivers', description: 'All drivers verified with background check', enabled: true },
        { id: '3', icon: 'alert-circle', title: 'SOS Button', description: 'Emergency alert to police and contacts', enabled: true },
        { id: '4', icon: 'eye', title: 'Ride Verification', description: 'Verify driver and vehicle before boarding', enabled: false },
      ]);
    } catch (error) {
      console.error('Failed to fetch ride data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRideData();
    setRefreshing(false);
  };

  const getRideIcon = (type: string) => {
    switch (type) {
      case 'bike': return 'bicycle';
      case 'auto': return 'car';
      case 'cab': return 'car-sport';
      case 'suv': return 'suv';
      default: return 'car';
    }
  };

  const getRideColor = (type: string) => {
    switch (type) {
      case 'bike': return COLORS.success;
      case 'auto': return COLORS.warning;
      case 'cab': return COLORS.primary;
      case 'suv': return '#9333EA';
      default: return COLORS.primary;
    }
  };

  const openReZRide = () => {
    // Open ReZ Ride app or deep link
    Linking.openURL('rezride://book');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ReZ Ride</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* ReZ Ride Banner */}
        <View style={styles.section}>
          <View style={styles.rezRideBanner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Commission-Free Rides</Text>
              <Text style={styles.bannerSubtitle}>
                10% cashback on every ride, powered by AI
              </Text>
              <View style={styles.bannerFeatures}>
                <View style={styles.featureTag}>
                  <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
                  <Text style={styles.featureText}>Safe</Text>
                </View>
                <View style={styles.featureTag}>
                  <Ionicons name="cash" size={12} color={COLORS.warning} />
                  <Text style={styles.featureText}>10% Cashback</Text>
                </View>
                <View style={styles.featureTag}>
                  <Ionicons name="flash" size={12} color={COLORS.primary} />
                  <Text style={styles.featureText}>AI-Powered</Text>
                </View>
              </View>
            </View>
            <View style={styles.bannerIcon}>
              <Ionicons name="car-sport" size={48} color="#fff" />
            </View>
          </View>
        </View>

        {/* Quick Booking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Book</Text>
          <View style={styles.bookingCard}>
            <View style={styles.locationInput}>
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.success }]} />
                <TouchableOpacity style={styles.locationField}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationText}>{pickup}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.locationDivider} />
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
                <TouchableOpacity style={styles.locationField}>
                  <Text style={styles.locationLabel}>Where to?</Text>
                  <TextInput
                    style={styles.destinationInput}
                    placeholder="Enter destination"
                    placeholderTextColor={COLORS.textSecondary}
                    value={destination}
                    onChangeText={setDestination}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Ride Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choose your ride</Text>
            <View style={styles.surgeBadge}>
              <Ionicons name="warning" size={12} color={COLORS.warning} />
              <Text style={styles.surgeText}>1.2x surge</Text>
            </View>
          </View>
          {rideOptions.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              style={styles.rideCard}
              onPress={openReZRide}
            >
              <View style={[styles.rideIcon, { backgroundColor: getRideColor(ride.type) + '20' }]}>
                <Ionicons name={getRideIcon(ride.type) as any} size={28} color={getRideColor(ride.type)} />
              </View>
              <View style={styles.rideInfo}>
                <Text style={styles.rideName}>{ride.name}</Text>
                <Text style={styles.rideEta}>{ride.eta} • {ride.seats} seats</Text>
                <View style={styles.rideFeatures}>
                  {ride.features.map((feature, i) => (
                    <Text key={i} style={styles.rideFeature}>{feature}</Text>
                  ))}
                </View>
              </View>
              <View style={styles.ridePrice}>
                <Text style={styles.priceText}>{ride.price}</Text>
                {ride.surge > 0 && (
                  <Text style={styles.surgePriceText}>+{ride.surge}x</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Features */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Safety Features</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Settings</Text>
            </TouchableOpacity>
          </View>
          {safetyFeatures.map((feature) => (
            <View key={feature.id} style={styles.safetyCard}>
              <View style={[styles.safetyIcon, { backgroundColor: feature.enabled ? COLORS.successLight : COLORS.card }]}>
                <Ionicons name={feature.icon as any} size={20} color={feature.enabled ? COLORS.success : COLORS.textSecondary} />
              </View>
              <View style={styles.safetyInfo}>
                <Text style={styles.safetyTitle}>{feature.title}</Text>
                <Text style={styles.safetyDescription}>{feature.description}</Text>
              </View>
              <View style={[styles.toggle, feature.enabled && styles.toggleActive]}>
                <View style={[styles.toggleKnob, feature.enabled && styles.toggleKnobActive]} />
              </View>
            </View>
          ))}
        </View>

        {/* Movement Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Suggestions</Text>
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionIcon}>
              <Ionicons name="bulb" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionTitle}>Based on your commute</Text>
              <Text style={styles.suggestionText}>
                We noticed you usually head to MG Road at 9 AM. Want to pre-schedule a cab?
              </Text>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionButtonText}>Schedule Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.suggestionCard}>
            <View style={[styles.suggestionIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="trending-up" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionTitle}>Peak hours alert</Text>
              <Text style={styles.suggestionText}>
                Traffic to Indiranagar is heavy right now. Consider leaving 15 mins earlier or try the metro.
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Rides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Rides</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentRides.map((ride) => (
            <TouchableOpacity key={ride.id} style={styles.recentRideCard}>
              <View style={[styles.recentRideIcon, { backgroundColor: getRideColor(ride.type) + '20' }]}>
                <Ionicons name={getRideIcon(ride.type) as any} size={20} color={getRideColor(ride.type)} />
              </View>
              <View style={styles.recentRideInfo}>
                <Text style={styles.recentRideRoute}>{ride.from} → {ride.to}</Text>
                <Text style={styles.recentRideDate}>{ride.date}</Text>
              </View>
              <Text style={styles.recentRidePrice}>{ride.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Open App Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.openAppButton} onPress={openReZRide}>
            <Ionicons name="car-sport" size={24} color="#fff" />
            <Text style={styles.openAppText}>Open ReZ Ride App</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  section: {
    paddingHorizontal: SPACING.lg,
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
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },
  rezRideBanner: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  bannerFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  featureText: {
    fontSize: FONT_SIZE.xs,
    color: '#fff',
  },
  bannerIcon: {
    marginLeft: SPACING.md,
  },
  bookingCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  locationInput: {},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  locationField: {
    flex: 1,
    paddingVertical: SPACING.sm,
  },
  locationLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  locationText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginTop: 2,
  },
  destinationInput: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginTop: 2,
    padding: 0,
  },
  locationDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
    marginLeft: 6,
  },
  surgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  surgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    fontWeight: '600',
  },
  rideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rideIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rideInfo: {
    flex: 1,
  },
  rideName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  rideEta: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rideFeatures: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
  },
  rideFeature: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  ridePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  surgePriceText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    fontWeight: '600',
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  safetyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  safetyInfo: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  safetyDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.success,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  suggestionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  suggestionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  suggestionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  suggestionButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  suggestionButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#fff',
  },
  recentRideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  recentRideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  recentRideInfo: {
    flex: 1,
  },
  recentRideRoute: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentRideDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  recentRidePrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  openAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
  },
  openAppText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 100,
  },
});
