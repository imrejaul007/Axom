import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export default function OffersScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'nearby' | 'flash'>('all');

  const offers = [
    {
      id: '1',
      merchant: 'Starbucks',
      location: 'Koramangala',
      distance: '200m',
      title: 'Happy Hour!',
      description: 'Buy 1 Get 1 Free on all beverages',
      discount: 'BOGO',
      validTime: '4 PM - 7 PM',
      crowdLevel: 'quiet',
      crowdWait: '5 min',
      expiresIn: '2 hours',
      type: 'happy_hour'
    },
    {
      id: '2',
      merchant: 'FitZone Gym',
      location: 'Indiranagar',
      distance: '800m',
      title: 'Flash Sale!',
      description: '20% off on monthly membership',
      discount: '20%',
      validTime: 'Today only',
      crowdLevel: 'moderate',
      crowdWait: '10 min',
      expiresIn: '4 hours',
      type: 'flash_sale'
    },
    {
      id: '3',
      merchant: 'Biryani Blues',
      location: 'HSR Layout',
      distance: '1.2km',
      title: 'Location Deal',
      description: '10% off when you are within 500m',
      discount: '10%',
      validTime: 'All day',
      crowdLevel: 'busy',
      crowdWait: '20 min',
      expiresIn: '1 day',
      type: 'location_trigger'
    },
    {
      id: '4',
      merchant: 'The Fitness Studio',
      location: 'Koramangala',
      distance: '300m',
      title: 'Crowd Deal',
      description: 'Currently quiet - 15% off yoga class',
      discount: '15%',
      validTime: 'Now',
      crowdLevel: 'quiet',
      crowdWait: '2 min',
      expiresIn: '30 mins',
      type: 'crowd_deal'
    },
  ];

  const getCrowdColor = (level: string) => {
    const levels: Record<string, { color: string; icon: string }> = {
      quiet: { color: colors.accentGreen, icon: 'checkmark-circle' },
      moderate: { color: colors.accentGold, icon: 'alert-circle' },
      busy: { color: colors.accent, icon: 'warning' },
    };
    return levels[level] || levels.moderate;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      happy_hour: 'time',
      flash_sale: 'flash',
      location_trigger: 'location',
      crowd_deal: 'people',
    };
    return icons[type] || 'pricetag';
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Live Offers</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All Offers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'nearby' && styles.filterTabActive]}
          onPress={() => setFilter('nearby')}
        >
          <Text style={[styles.filterText, filter === 'nearby' && styles.filterTextActive]}>Nearby</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'flash' && styles.filterTabActive]}
          onPress={() => setFilter('flash')}
        >
          <Text style={[styles.filterText, filter === 'flash' && styles.filterTextActive]}>Flash Sales</Text>
        </TouchableOpacity>
      </View>

      {/* Offers List */}
      <ScrollView
        style={styles.offersList}
        contentContainerStyle={styles.offersContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {offers.map((offer) => {
          const crowd = getCrowdColor(offer.crowdLevel);

          return (
            <View key={offer.id} style={styles.offerCard}>
              {/* Header */}
              <View style={styles.offerHeader}>
                <View style={styles.merchantInfo}>
                  <Text style={styles.merchantName}>{offer.merchant}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color={colors.textMuted} />
                    <Text style={styles.locationText}>{offer.location}</Text>
                    <Text style={styles.distanceText}>• {offer.distance}</Text>
                  </View>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name={getTypeIcon(offer.type) as any} size={14} color={colors.accent} />
                  <Text style={styles.typeText}>
                    {offer.type === 'happy_hour' ? 'Happy Hour' :
                     offer.type === 'flash_sale' ? 'Flash Sale' :
                     offer.type === 'location_trigger' ? 'Nearby' : 'Crowd Deal'}
                  </Text>
                </View>
              </View>

              {/* Deal */}
              <View style={styles.dealSection}>
                <View style={styles.discountContainer}>
                  <Text style={styles.discountText}>{offer.discount}</Text>
                  <Text style={styles.discountLabel}>OFF</Text>
                </View>
                <View style={styles.dealInfo}>
                  <Text style={styles.dealTitle}>{offer.title}</Text>
                  <Text style={styles.dealDescription}>{offer.description}</Text>
                  <View style={styles.validTime}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.validTimeText}>{offer.validTime}</Text>
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.offerFooter}>
                <View style={styles.crowdInfo}>
                  <View style={[styles.crowdBadge, { backgroundColor: crowd.color + '20' }]}>
                    <Ionicons name={crowd.icon as any} size={14} color={crowd.color} />
                    <Text style={[styles.crowdText, { color: crowd.color }]}>
                      {offer.crowdLevel === 'quiet' ? 'Quiet' :
                       offer.crowdLevel === 'moderate' ? 'Moderate' : 'Busy'}
                    </Text>
                  </View>
                  <Text style={styles.waitText}>~{offer.crowdWait} wait</Text>
                </View>
                <View style={styles.expiresInfo}>
                  <Ionicons name="time" size={12} color={colors.textMuted} />
                  <Text style={styles.expiresText}>Expires in {offer.expiresIn}</Text>
                </View>
              </View>

              {/* CTA */}
              <TouchableOpacity style={styles.ctaButton}>
                <Text style={styles.ctaText}>Redeem Offer</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.textPrimary,
  },
  offersList: {
    flex: 1,
  },
  offersContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  offerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  distanceText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  dealSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  discountContainer: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  discountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  discountLabel: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dealInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dealDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  validTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validTimeText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  crowdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crowdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  crowdText: {
    fontSize: 12,
    fontWeight: '600',
  },
  waitText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  expiresInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiresText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
