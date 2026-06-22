/**
 * StayOwn Integration - Hotel guest local services
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface HotelGuest {
  name: string;
  hotel: string;
  room: string;
  checkOut: string;
  loyaltyTier: 'silver' | 'gold' | 'platinum';
}

interface LocalOffer {
  id: string;
  merchant: string;
  type: 'restaurant' | 'spa' | 'transport' | 'attraction';
  title: string;
  discount: string;
  distance: string;
  exclusive: boolean;
}

interface HotelService {
  id: string;
  icon: string;
  title: string;
  description: string;
  available: boolean;
  estimatedTime?: string;
}

export default function StayOwnScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guest, setGuest] = useState<HotelGuest | null>(null);
  const [offers, setOffers] = useState<LocalOffer[]>([]);
  const [services, setServices] = useState<HotelService[]>([]);

  useEffect(() => {
    fetchStayOwnData();
  }, []);

  const fetchStayOwnData = async () => {
    try {
      setGuest({
        name: 'John Smith',
        hotel: 'The Grand Hotel',
        room: 'Room 1205',
        checkOut: 'May 25',
        loyaltyTier: 'gold',
      });

      setOffers([
        { id: '1', merchant: 'Spice Garden', type: 'restaurant', title: '15% Off Lunch', discount: '15%', distance: '0.3 km', exclusive: true },
        { id: '2', merchant: 'Serenity Spa', type: 'spa', title: 'Buy 1 Get 1 Free Massage', discount: '50%', distance: '0.5 km', exclusive: true },
        { id: '3', merchant: 'City Tours', type: 'attraction', title: 'Free City Tour', discount: '100%', distance: '2 km', exclusive: true },
        { id: '4', merchant: 'Airport Shuttle', type: 'transport', title: '₹200 Off Airport Transfer', discount: '₹200', distance: '15 km', exclusive: false },
      ]);

      setServices([
        { id: '1', icon: 'restaurant', title: 'Room Service', description: 'Order food to your room', available: true, estimatedTime: '30 min' },
        { id: '2', icon: 'car', title: 'Airport Transfer', description: 'Book a ride to/from airport', available: true, estimatedTime: '40 min' },
        { id: '3', icon: 'bed', title: 'Late Checkout', description: 'Extend your checkout time', available: true, estimatedTime: 'Instant' },
        { id: '4', icon: 'wifi', title: 'WiFi Password', description: 'Get hotel WiFi details', available: true },
        { id: '5', icon: 'star', title: 'Housekeeping', description: 'Request room cleaning', available: true, estimatedTime: '1 hour' },
        { id: '6', icon: 'help-circle', title: 'Concierge', description: '24/7 guest assistance', available: true },
      ]);
    } catch (error) {
      console.error('Failed to fetch StayOwn data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStayOwnData();
    setRefreshing(false);
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return 'restaurant';
      case 'spa': return 'spa';
      case 'transport': return 'car';
      case 'attraction': return 'ticket';
      default: return 'pricetag';
    }
  };

  const getOfferColor = (type: string) => {
    switch (type) {
      case 'restaurant': return COLORS.warning;
      case 'spa': return '#9333EA';
      case 'transport': return COLORS.primary;
      case 'attraction': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      default: return COLORS.textSecondary;
    }
  };

  const openStayOwn = () => {
    Linking.openURL('stayown://guest');
  };

  const claimOffer = (offerId: string) => {
    // Claim offer logic
    console.log('Claiming offer:', offerId);
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
          <Text style={styles.headerTitle}>StayOwn</Text>
          <TouchableOpacity>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Guest Welcome */}
        {guest && (
          <View style={styles.section}>
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeGreeting}>Welcome, {guest.name.split(' ')[0]}!</Text>
                <Text style={styles.welcomeHotel}>{guest.hotel}</Text>
                <View style={styles.roomInfo}>
                  <View style={styles.roomBadge}>
                    <Ionicons name="bed" size={14} color={COLORS.primary} />
                    <Text style={styles.roomText}>{guest.room}</Text>
                  </View>
                  <Text style={styles.checkOutText}>Check out: {guest.checkOut}</Text>
                </View>
              </View>
              <View style={styles.loyaltyBadge}>
                <Ionicons name="ribbon" size={24} color={getTierColor(guest.loyaltyTier)} />
                <Text style={[styles.loyaltyText, { color: getTierColor(guest.loyaltyTier) }]}>
                  {guest.loyaltyTier.charAt(0).toUpperCase() + guest.loyaltyTier.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Exclusive Offers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exclusive Guest Offers</Text>
            <View style={styles.exclusiveBadge}>
              <Ionicons name="sparkles" size={14} color={COLORS.warning} />
              <Text style={styles.exclusiveText}>Guest Only</Text>
            </View>
          </View>
          {offers.map((offer) => (
            <TouchableOpacity key={offer.id} style={styles.offerCard} onPress={() => claimOffer(offer.id)}>
              <View style={[styles.offerIcon, { backgroundColor: getOfferColor(offer.type) + '20' }]}>
                <Ionicons name={getOfferIcon(offer.type) as any} size={24} color={getOfferColor(offer.type)} />
              </View>
              <View style={styles.offerInfo}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  {offer.exclusive && (
                    <View style={styles.exclusiveTag}>
                      <Ionicons name="star" size={10} color={COLORS.warning} />
                      <Text style={styles.exclusiveTagText}>Exclusive</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.offerMerchant}>{offer.merchant}</Text>
                <View style={styles.offerMeta}>
                  <View style={styles.offerMetaItem}>
                    <Ionicons name="navigate" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.offerMetaText}>{offer.distance}</Text>
                  </View>
                  <View style={[styles.discountBadge, { backgroundColor: COLORS.successLight }]}>
                    <Text style={styles.discountText}>{offer.discount} OFF</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.claimButton}>
                <Text style={styles.claimText}>Claim</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hotel Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hotel Services</Text>
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity key={service.id} style={styles.serviceCard}>
                <View style={[styles.serviceIcon, service.available ? styles.serviceIconActive : styles.serviceIconInactive]}>
                  <Ionicons name={service.icon as any} size={24} color={service.available ? COLORS.primary : COLORS.textSecondary} />
                </View>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
                {service.estimatedTime && (
                  <View style={styles.serviceTime}>
                    <Ionicons name="time" size={10} color={COLORS.textSecondary} />
                    <Text style={styles.serviceTimeText}>{service.estimatedTime}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Local Experiences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore Local Area</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See Map</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.experiencesCard}>
            <View style={styles.experienceHeader}>
              <Ionicons name="compass" size={32} color={COLORS.primary} />
              <View style={styles.experienceInfo}>
                <Text style={styles.experienceTitle}>Discover Koramangala</Text>
                <Text style={styles.experienceSubtitle}>Your neighborhood guide</Text>
              </View>
            </View>
            <View style={styles.experienceStats}>
              <View style={styles.experienceStat}>
                <Text style={styles.statValue}>50+</Text>
                <Text style={styles.statLabel}>Restaurants</Text>
              </View>
              <View style={styles.experienceStat}>
                <Text style={styles.statValue}>20+</Text>
                <Text style={styles.statLabel}>Cafes</Text>
              </View>
              <View style={styles.experienceStat}>
                <Text style={styles.statValue}>10+</Text>
                <Text style={styles.statLabel}>Attractions</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/explore')}>
              <Text style={styles.exploreButtonText}>Explore Neighborhood</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Recommendations */}
        <View style={styles.section}>
          <View style={styles.aiRecommendationsHeader}>
            <View style={styles.aiBadge}>
              <Ionicons name="bulb" size={14} color={COLORS.warning} />
              <Text style={styles.aiBadgeText}>REZ Mind</Text>
            </View>
            <Text style={styles.sectionTitleSm}>Personalized for You</Text>
          </View>
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationIcon}>
              <Ionicons name="restaurant" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Try Spice Garden</Text>
              <Text style={styles.recommendationText}>
                Based on your preferences, this highly-rated restaurant is just 0.3 km away and has an exclusive 15% discount for hotel guests.
              </Text>
              <TouchableOpacity style={styles.recommendationButton}>
                <Text style={styles.recommendationButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.recommendationCard}>
            <View style={[styles.recommendationIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="car" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Traffic Alert</Text>
              <Text style={styles.recommendationText}>
                If you need to leave for the airport, leave now - traffic is light. Via ReZ Ride, it's just 45 mins right now vs 1.5 hours during peak.
              </Text>
              <TouchableOpacity style={styles.recommendationButton}>
                <Text style={styles.recommendationButtonText}>Book Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="key" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Checkout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="car" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Taxi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="call" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Concierge</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Open StayOwn Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.openAppButton} onPress={openStayOwn}>
            <Ionicons name="bed" size={24} color="#fff" />
            <Text style={styles.openAppText}>Open StayOwn App</Text>
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
  sectionTitleSm: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },
  welcomeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: '#fff',
  },
  welcomeHotel: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  roomText: {
    fontSize: FONT_SIZE.sm,
    color: '#fff',
    fontWeight: '600',
  },
  checkOutText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  loyaltyBadge: {
    alignItems: 'center',
  },
  loyaltyText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginTop: 4,
  },
  exclusiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  exclusiveText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    fontWeight: '600',
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  offerIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  offerInfo: {
    flex: 1,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  offerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  exclusiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 2,
  },
  exclusiveTagText: {
    fontSize: 8,
    color: COLORS.warning,
    fontWeight: '600',
  },
  offerMerchant: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  offerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerMetaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  discountBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  discountText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '700',
  },
  claimButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  claimText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#fff',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  serviceCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  serviceIconActive: {
    backgroundColor: COLORS.primaryLight,
  },
  serviceIconInactive: {
    backgroundColor: COLORS.border,
  },
  serviceTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  serviceTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  serviceTimeText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  experiencesCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  experienceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  experienceInfo: {
    marginLeft: SPACING.md,
  },
  experienceTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  experienceSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  experienceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  experienceStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
  },
  exploreButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
  aiRecommendationsHeader: {
    marginBottom: SPACING.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  aiBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  recommendationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  recommendationText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  recommendationButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  recommendationButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
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
