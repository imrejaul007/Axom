/**
 * CorpPerks Integration - Employee city intelligence and perks
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

interface EmployeeProfile {
  name: string;
  company: string;
  department: string;
  employeeId: string;
  perksBalance: number;
  tier: 'standard' | 'premium' | 'executive';
}

interface PerksOffer {
  id: string;
  merchant: string;
  category: 'food' | 'travel' | 'wellness' | 'shopping' | 'entertainment';
  title: string;
  discount: string;
  points: number;
  validUntil: string;
  featured: boolean;
}

interface CommuteOption {
  type: 'bus' | 'metro' | 'cab' | 'bike';
  from: string;
  to: string;
  duration: string;
  cost: string;
  savings: string;
}

export default function CorpPerksScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [offers, setOffers] = useState<PerksOffer[]>([]);
  const [commuteOptions, setCommuteOptions] = useState<CommuteOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'food', label: 'Food', icon: 'restaurant' },
    { id: 'travel', label: 'Travel', icon: 'car' },
    { id: 'wellness', label: 'Wellness', icon: 'heart' },
    { id: 'shopping', label: 'Shopping', icon: 'bag' },
    { id: 'entertainment', label: 'Fun', icon: 'game-controller' },
  ];

  useEffect(() => {
    fetchCorpPerksData();
  }, [selectedCategory]);

  const fetchCorpPerksData = async () => {
    try {
      setEmployee({
        name: 'Alex Johnson',
        company: 'TechCorp India',
        department: 'Engineering',
        employeeId: 'EMP-12345',
        perksBalance: 2450,
        tier: 'premium',
      });

      setOffers([
        { id: '1', merchant: 'Fresh Menu', category: 'food', title: '30% Off Lunch Orders', discount: '30%', points: 0, validUntil: 'May 31', featured: true },
        { id: '2', merchant: 'Practo', category: 'wellness', title: 'Free Health Checkup', discount: '100%', points: 500, validUntil: 'Jun 15', featured: true },
        { id: '3', merchant: 'Uber Business', category: 'travel', title: '₹500 Off Rides', discount: '₹500', points: 200, validUntil: 'May 30', featured: false },
        { id: '4', merchant: 'Myntra', category: 'shopping', title: '20% Off All Orders', discount: '20%', points: 0, validUntil: 'Jun 1', featured: false },
        { id: '5', merchant: 'BookMyShow', category: 'entertainment', title: 'Buy 1 Get 1 Movie Tickets', discount: '50%', points: 150, validUntil: 'May 28', featured: false },
      ]);

      setCommuteOptions([
        { type: 'metro', from: 'Koramangala', to: 'MG Road', duration: '15 min', cost: '₹40', savings: '₹80' },
        { type: 'bus', from: 'Koramangala', to: 'MG Road', duration: '35 min', cost: '₹25', savings: '₹95' },
        { type: 'cab', from: 'Koramangala', to: 'MG Road', duration: '20 min', cost: '₹180', savings: '₹0' },
        { type: 'bike', from: 'Koramangala', to: 'MG Road', duration: '15 min', cost: '₹60', savings: '₹60' },
      ]);
    } catch (error) {
      console.error('Failed to fetch CorpPerks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCorpPerksData();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return 'restaurant';
      case 'travel': return 'car';
      case 'wellness': return 'heart';
      case 'shopping': return 'bag';
      case 'entertainment': return 'game-controller';
      default: return 'pricetag';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return COLORS.warning;
      case 'travel': return COLORS.primary;
      case 'wellness': return COLORS.error;
      case 'shopping': return '#9333EA';
      case 'entertainment': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getCommuteIcon = (type: string) => {
    switch (type) {
      case 'metro': return 'train';
      case 'bus': return 'bus';
      case 'cab': return 'car';
      case 'bike': return 'bicycle';
      default: return 'car';
    }
  };

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'executive': return { discount: '40%', cashback: '5%', color: '#9333EA' };
      case 'premium': return { discount: '25%', cashback: '3%', color: '#FFD700' };
      default: return { discount: '15%', cashback: '1%', color: '#C0C0C0' };
    }
  };

  const filteredOffers = selectedCategory === 'all' ? offers : offers.filter((o) => o.category === selectedCategory);

  const openCorpPerks = () => {
    Linking.openURL('corpperks://offers');
  };

  const claimOffer = (offerId: string) => {
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
          <Text style={styles.headerTitle}>CorpPerks</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Employee Profile */}
        {employee && (
          <View style={styles.section}>
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileInitial}>{employee.name[0]}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{employee.name}</Text>
                  <Text style={styles.profileCompany}>{employee.company}</Text>
                  <Text style={styles.profileDept}>{employee.department}</Text>
                </View>
              </View>
              <View style={styles.tierBenefits}>
                {(() => {
                  const benefits = getTierBenefits(employee.tier);
                  return (
                    <View style={styles.benefitRow}>
                      <View style={styles.benefitItem}>
                        <Text style={styles.benefitLabel}>Discount</Text>
                        <Text style={[styles.benefitValue, { color: benefits.color }]}>{benefits.discount}</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Text style={styles.benefitLabel}>Cashback</Text>
                        <Text style={[styles.benefitValue, { color: benefits.color }]}>{benefits.cashback}</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Text style={styles.benefitLabel}>Balance</Text>
                        <Text style={styles.benefitValue}>{employee.perksBalance}</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>
          </View>
        )}

        {/* Featured Perks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Perks</Text>
            <TouchableOpacity onPress={openCorpPerks}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {offers.filter((o) => o.featured).map((offer) => (
              <TouchableOpacity key={offer.id} style={styles.featuredCard}>
                <View style={[styles.featuredBadge, { backgroundColor: getCategoryColor(offer.category) }]}>
                  <Text style={styles.featuredBadgeText}>{offer.category.toUpperCase()}</Text>
                </View>
                <Text style={styles.featuredTitle}>{offer.title}</Text>
                <Text style={styles.featuredMerchant}>{offer.merchant}</Text>
                <View style={styles.featuredFooter}>
                  <Text style={styles.featuredDiscount}>{offer.discount} OFF</Text>
                  {offer.points > 0 && (
                    <View style={styles.pointsBadge}>
                      <Ionicons name="logo-bitcoin" size={10} color={COLORS.warning} />
                      <Text style={styles.pointsText}>{offer.points}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? '#fff' : COLORS.text}
              />
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* All Offers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Offers</Text>
          {filteredOffers.map((offer) => (
            <TouchableOpacity key={offer.id} style={styles.offerCard} onPress={() => claimOffer(offer.id)}>
              <View style={[styles.offerIcon, { backgroundColor: getCategoryColor(offer.category) + '20' }]}>
                <Ionicons name={getCategoryIcon(offer.category) as any} size={24} color={getCategoryColor(offer.category)} />
              </View>
              <View style={styles.offerInfo}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerMerchant}>{offer.merchant}</Text>
                <View style={styles.offerMeta}>
                  <Text style={styles.offerValid}>Valid until {offer.validUntil}</Text>
                  {offer.points > 0 && (
                    <View style={styles.pointsBadge}>
                      <Ionicons name="logo-bitcoin" size={10} color={COLORS.warning} />
                      <Text style={styles.pointsText}>{offer.points} pts</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.offerAction}>
                <Text style={styles.offerDiscount}>{offer.discount}</Text>
                <Text style={styles.offerDiscountLabel}>OFF</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Smart Commute */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Smart Commute</Text>
            <View style={styles.aiBadge}>
              <Ionicons name="bulb" size={14} color={COLORS.warning} />
              <Text style={styles.aiBadgeText}>AI Recommended</Text>
            </View>
          </View>
          <View style={styles.commuteCard}>
            <View style={styles.commuteRoute}>
              <View style={styles.commutePoint}>
                <View style={[styles.commuteDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.commuteLabel}>Home</Text>
                <Text style={styles.commuteLocation}>Koramangala</Text>
              </View>
              <View style={styles.commuteArrow}>
                <Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} />
              </View>
              <View style={styles.commutePoint}>
                <View style={[styles.commuteDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.commuteLabel}>Office</Text>
                <Text style={styles.commuteLocation}>MG Road</Text>
              </View>
            </View>
            <View style={styles.commuteOptions}>
              {commuteOptions.slice(0, 4).map((option, index) => (
                <TouchableOpacity key={index} style={styles.commuteOption}>
                  <View style={[styles.commuteIcon, { backgroundColor: getCategoryColor('travel') + '10' }]}>
                    <Ionicons name={getCommuteIcon(option.type) as any} size={20} color={getCategoryColor('travel')} />
                  </View>
                  <View style={styles.commuteDetails}>
                    <Text style={styles.commuteType}>{option.type.charAt(0).toUpperCase() + option.type.slice(1)}</Text>
                    <Text style={styles.commuteTime}>{option.duration}</Text>
                  </View>
                  <View style={styles.commutePricing}>
                    <Text style={styles.commuteCost}>{option.cost}</Text>
                    {option.savings !== '₹0' && (
                      <Text style={styles.commuteSavings}>Save {option.savings}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Wellness Programs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wellness Programs</Text>
          <View style={styles.wellnessCard}>
            <View style={styles.wellnessHeader}>
              <Ionicons name="heart" size={32} color={COLORS.error} />
              <View style={styles.wellnessInfo}>
                <Text style={styles.wellnessTitle}>Health & Wellness</Text>
                <Text style={styles.wellnessSubtitle}>Your employer sponsors these</Text>
              </View>
            </View>
            <View style={styles.wellnessPrograms}>
              <View style={styles.programItem}>
                <Ionicons name="fitness" size={20} color={COLORS.success} />
                <Text style={styles.programText}>Gym Membership (50% subsidized)</Text>
              </View>
              <View style={styles.programItem}>
                <Ionicons name="nutrition" size={20} color={COLORS.warning} />
                <Text style={styles.programText}>Meal Plans (₹500/month credit)</Text>
              </View>
              <View style={styles.programItem}>
                <Ionicons name="medical" size={20} color={COLORS.error} />
                <Text style={styles.programText}>Health Insurance (Family covered)</Text>
              </View>
              <View style={styles.programItem}>
                <Ionicons name="happy" size={20} color={COLORS.primary} />
                <Text style={styles.programText}>Mental Health (8 free sessions)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Open CorpPerks Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.openAppButton} onPress={openCorpPerks}>
            <Ionicons name="briefcase" size={24} color="#fff" />
            <Text style={styles.openAppText}>Open CorpPerks App</Text>
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
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
  },
  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {},
  profileName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#fff',
  },
  profileCompany: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  profileDept: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  tierBenefits: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  benefitRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  benefitItem: {
    alignItems: 'center',
  },
  benefitLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  benefitValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  featuredCard: {
    width: 200,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.sm,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  featuredTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  featuredMerchant: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  featuredDiscount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.success,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  pointsText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    fontWeight: '600',
  },
  categoryScroll: {
    marginBottom: SPACING.md,
  },
  categoryContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
    marginRight: SPACING.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  categoryTextActive: {
    color: '#fff',
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
  offerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  offerMerchant: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
  },
  offerValid: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  offerAction: {
    alignItems: 'center',
  },
  offerDiscount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.success,
  },
  offerDiscountLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
  },
  commuteCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  commuteRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  commutePoint: {
    alignItems: 'center',
    flex: 1,
  },
  commuteDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  commuteLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  commuteLocation: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  commuteArrow: {
    flex: 0.5,
    alignItems: 'center',
  },
  commuteOptions: {},
  commuteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  commuteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  commuteDetails: {
    flex: 1,
  },
  commuteType: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  commuteTime: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  commutePricing: {
    alignItems: 'flex-end',
  },
  commuteCost: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  commuteSavings: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    marginTop: 2,
  },
  wellnessCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  wellnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  wellnessInfo: {
    marginLeft: SPACING.md,
  },
  wellnessTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  wellnessSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  wellnessPrograms: {},
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  programText: {
    fontSize: FONT_SIZE.md,
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
