/**
 * Place Details - Detailed view of a place/venue
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const MOCK_PLACE = {
  id: '1',
  name: 'The Hummingbird Garden',
  type: 'Restaurant',
  category: 'cafe',
  rating: 4.5,
  reviewCount: 328,
  priceRange: '₹₹',
  address: '42, 100 Feet Road, Indiranagar, Bangalore',
  distance: '1.2 km',
  hours: '8:00 AM - 10:00 PM',
  phone: '+91 80 4567 8900',
  website: 'https://example.com',
  images: [],
  features: ['Outdoor Seating', 'Pet Friendly', 'Free WiFi', 'Parking', 'Wheelchair Accessible'],
  trending: true,
  safeArea: true,
  vibes: ['Cozy', 'Quiet', 'Study Friendly'],
};

const PLACE_TYPE_ICONS: Record<string, string> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  bar: 'wine',
  gym: 'fitness',
  park: 'leaf',
  hospital: 'medical',
  school: 'school',
  shopping: 'cart',
  default: 'location',
};

export default function PlaceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [place, setPlace] = useState(MOCK_PLACE);
  const [isSaved, setIsSaved] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const typeIcon = PLACE_TYPE_ICONS[place.category] || PLACE_TYPE_ICONS.default;

  const handleCall = () => {
    Linking.openURL(`tel:${place.phone}`);
  };

  const handleDirections = () => {
    Alert.alert('Directions', 'Would open maps with directions to this place');
  };

  const handleShare = () => {
    Alert.alert('Share', `Share ${place.name} with friends`);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    Alert.alert(isSaved ? 'Removed' : 'Saved', `${place.name} ${isSaved ? 'removed from' : 'added to'} saved places`);
  };

  const handleBookTable = () => {
    Alert.alert('Book Table', 'Would open table booking flow');
  };

  const handleCheckIn = () => {
    Alert.alert('Check In', `Checked in at ${place.name}`);
  };

  const renderImagePlaceholder = () => (
    <View style={styles.imagePlaceholder}>
      <Ionicons name={typeIcon as any} size={64} color={COLORS.textMuted} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          {place.images.length > 0 ? (
            <Image source={{ uri: place.images[currentImageIndex] }} style={styles.image} />
          ) : (
            renderImagePlaceholder()
          )}

          {/* Overlay Actions */}
          <View style={styles.imageOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.topActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Ionicons
                  name={isSaved ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isSaved ? COLORS.error : COLORS.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Trending Badge */}
          {place.trending && (
            <View style={styles.trendingBadge}>
              <Ionicons name="trending-up" size={14} color="#fff" />
              <Text style={styles.trendingText}>Trending</Text>
            </View>
          )}
        </View>

        {/* Place Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.placeName}>{place.name}</Text>
            <View style={styles.safeBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.safeText}>Safe Area</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FBBF24" />
              <Text style={styles.ratingText}>{place.rating}</Text>
              <Text style={styles.reviewCount}>({place.reviewCount})</Text>
            </View>
            <Text style={styles.priceRange}>{place.priceRange}</Text>
            <View style={styles.typeChip}>
              <Ionicons name={typeIcon as any} size={14} color={COLORS.primary} />
              <Text style={styles.typeText}>{place.type}</Text>
            </View>
          </View>

          <View style={styles.distanceRow}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.distanceText}>{place.distance} away</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {place.address}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleDirections}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="navigate" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="call" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.quickActionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleBookTable}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warning + '20' }]}>
              <Ionicons name="calendar" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.quickActionText}>Book</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleCheckIn}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#EC4899' + '20' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#EC4899" />
            </View>
            <Text style={styles.quickActionText}>Check In</Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCards}>
          {/* Hours */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <Text style={styles.infoCardTitle}>Hours</Text>
            </View>
            <Text style={styles.infoCardText}>{place.hours}</Text>
            <Text style={styles.infoCardHint}>Open now</Text>
          </View>

          {/* Features */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.infoCardTitle}>Features</Text>
            </View>
            <View style={styles.featuresList}>
              {place.features.map((feature, index) => (
                <View key={index} style={styles.featureChip}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Vibes */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.warning} />
              <Text style={styles.infoCardTitle}>Vibes</Text>
            </View>
            <View style={styles.vibesList}>
              {place.vibes.map((vibe, index) => (
                <View key={index} style={styles.vibeChip}>
                  <Text style={styles.vibeText}>{vibe}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Offers */}
        <View style={styles.offersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Offers</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.offerCard}>
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>20% OFF</Text>
            </View>
            <View style={styles.offerInfo}>
              <Text style={styles.offerTitle}>Happy Hour</Text>
              <Text style={styles.offerDescription}>2:00 PM - 6:00 PM weekdays</Text>
            </View>
            <TouchableOpacity style={styles.claimButton}>
              <Text style={styles.claimButtonText}>Claim</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleDirections}>
          <Ionicons name="navigate" size={20} color="#fff" />
          <Text style={styles.ctaButtonText}>Get Directions</Text>
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
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingBadge: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  trendingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: '#fff',
  },
  infoSection: {
    padding: SPACING.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  placeName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  safeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  priceRange: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  typeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  addressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  infoCards: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoCardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoCardText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  infoCardHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    marginTop: 4,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  featureChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  featureText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  vibesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  vibeChip: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  vibeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    fontWeight: '500',
  },
  offersSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
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
  },
  seeAllText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  offerCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  offerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  offerBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#fff',
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  offerDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  claimButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  claimButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  ctaButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
});
