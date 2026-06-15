/**
 * Kiosks Screen - Nearby QR kiosks and location triggers
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Kiosk {
  id: string;
  name: string;
  type: 'mall' | 'restaurant' | 'store' | 'transit' | 'dooh';
  address: string;
  distance: string;
  waitTime: number;
  offers: number;
  lastScanned: string;
  qrAvailable: boolean;
  doohScreen: boolean;
}

interface LocationTrigger {
  id: string;
  name: string;
  type: 'entrance' | 'exit' | 'product' | 'display';
  action: string;
  points: number;
}

export default function KiosksScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [triggers, setTriggers] = useState<LocationTrigger[]>([]);
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);
  const [showKioskModal, setShowKioskModal] = useState(false);

  const filters = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'mall', label: 'Malls', icon: 'business' },
    { id: 'restaurant', label: 'Food', icon: 'restaurant' },
    { id: 'store', label: 'Stores', icon: 'storefront' },
    { id: 'dooh', label: 'DOOH', icon: 'tv' },
  ];

  useEffect(() => {
    fetchKiosksData();
  }, [selectedFilter]);

  const fetchKiosksData = async () => {
    try {
      // Mock data - replace with actual API call
      setKiosks([
        { id: '1', name: 'Forum Mall', type: 'mall', address: 'Koramangala', distance: '0.2 km', waitTime: 0, offers: 5, lastScanned: '2 days ago', qrAvailable: true, doohScreen: true },
        { id: '2', name: 'Spice Garden', type: 'restaurant', address: 'HSR Layout', distance: '0.5 km', waitTime: 5, offers: 2, lastScanned: '1 week ago', qrAvailable: true, doohScreen: false },
        { id: '3', name: 'UB City', type: 'mall', address: 'MG Road', distance: '1.2 km', waitTime: 0, offers: 8, lastScanned: 'Never', qrAvailable: true, doohScreen: true },
        { id: '4', name: 'City Mart', type: 'store', address: 'Indiranagar', distance: '0.8 km', waitTime: 0, offers: 3, lastScanned: '3 days ago', qrAvailable: true, doohScreen: false },
        { id: '5', name: 'Metro Station', type: 'transit', address: 'Koramangala', distance: '0.3 km', waitTime: 0, offers: 1, lastScanned: 'Yesterday', qrAvailable: true, doohScreen: true },
        { id: '6', name: 'Electronics Hub', type: 'store', address: 'BTM Layout', distance: '1.5 km', waitTime: 0, offers: 4, lastScanned: 'Never', qrAvailable: true, doohScreen: false },
      ]);

      setTriggers([
        { id: '1', name: 'Mall Entrance', type: 'entrance', action: 'Check-in bonus', points: 10 },
        { id: '2', name: 'Food Court', type: 'product', action: 'View deals', points: 5 },
        { id: '3', name: 'Display Zone', type: 'display', action: 'Watch ad', points: 15 },
        { id: '4', name: 'Exit Gate', type: 'exit', action: 'Rate experience', points: 20 },
      ]);
    } catch (error) {
      console.error('Failed to fetch kiosks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKiosksData();
    setRefreshing(false);
  };

  const getKioskIcon = (type: string) => {
    switch (type) {
      case 'mall': return 'business';
      case 'restaurant': return 'restaurant';
      case 'store': return 'storefront';
      case 'transit': return 'train';
      case 'dooh': return 'tv';
      default: return 'qr-code';
    }
  };

  const getKioskColor = (type: string) => {
    switch (type) {
      case 'mall': return COLORS.primary;
      case 'restaurant': return COLORS.warning;
      case 'store': return COLORS.success;
      case 'transit': return '#9333EA';
      case 'dooh': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const filteredKiosks = selectedFilter === 'all' ? kiosks : kiosks.filter((k) => k.type === selectedFilter);

  const openKioskDetails = (kiosk: Kiosk) => {
    setSelectedKiosk(kiosk);
    setShowKioskModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Kiosks</Text>
        <TouchableOpacity>
          <Ionicons name="scan-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={selectedFilter === filter.id ? '#fff' : COLORS.text}
            />
            <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Active Triggers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Triggers</Text>
          <View style={styles.triggersContainer}>
            {triggers.map((trigger) => (
              <View key={trigger.id} style={styles.triggerCard}>
                <View style={styles.triggerIcon}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.triggerInfo}>
                  <Text style={styles.triggerName}>{trigger.name}</Text>
                  <Text style={styles.triggerAction}>{trigger.action}</Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Ionicons name="logo-bitcoin" size={12} color={COLORS.warning} />
                  <Text style={styles.pointsText}>+{trigger.points}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Nearby Kiosks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Kiosks</Text>
          {filteredKiosks.map((kiosk) => (
            <TouchableOpacity
              key={kiosk.id}
              style={styles.kioskCard}
              onPress={() => openKioskDetails(kiosk)}
            >
              <View style={[styles.kioskIcon, { backgroundColor: getKioskColor(kiosk.type) + '20' }]}>
                <Ionicons name={getKioskIcon(kiosk.type) as any} size={24} color={getKioskColor(kiosk.type)} />
              </View>
              <View style={styles.kioskInfo}>
                <View style={styles.kioskHeader}>
                  <Text style={styles.kioskName}>{kiosk.name}</Text>
                  {kiosk.doohScreen && (
                    <View style={styles.doohBadge}>
                      <Ionicons name="tv" size={10} color={COLORS.error} />
                      <Text style={styles.doohText}>DOOH</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.kioskAddress}>{kiosk.address}</Text>
                <View style={styles.kioskMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="navigate" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>{kiosk.distance}</Text>
                  </View>
                  {kiosk.waitTime > 0 && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={12} color={COLORS.warning} />
                      <Text style={[styles.metaText, { color: COLORS.warning }]}>~{kiosk.waitTime} min wait</Text>
                    </View>
                  )}
                  <View style={styles.offersBadge}>
                    <Ionicons name="pricetag" size={12} color={COLORS.success} />
                    <Text style={styles.offersText}>{kiosk.offers} offers</Text>
                  </View>
                </View>
              </View>
              <View style={styles.kioskAction}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* DOOH Screens */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DOOH Screens</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View Map</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.doohCard}>
            <View style={styles.doohPreview}>
              <View style={styles.doohScreen}>
                <Ionicons name="tv" size={32} color="#fff" />
              </View>
            </View>
            <View style={styles.doohInfo}>
              <Text style={styles.doohTitle}>Nearby DOOH Screens</Text>
              <Text style={styles.doohDescription}>
                Scan QR codes on digital screens for exclusive offers and instant rewards.
              </Text>
              <View style={styles.doohStats}>
                <View style={styles.doohStatItem}>
                  <Text style={styles.doohStatValue}>12</Text>
                  <Text style={styles.doohStatLabel}>Screens nearby</Text>
                </View>
                <View style={styles.doohStatItem}>
                  <Text style={styles.doohStatValue}>5</Text>
                  <Text style={styles.doohStatLabel}>Active offers</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Find a Kiosk</Text>
                <Text style={styles.stepDescription}>
                  Look for BuzzLocal QR kiosks at malls, restaurants, and stores.
                </Text>
              </View>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Scan the QR</Text>
                <Text style={styles.stepDescription}>
                  Open your camera or BuzzLocal app and scan the QR code.
                </Text>
              </View>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Earn Rewards</Text>
                <Text style={styles.stepDescription}>
                  Get instant coins, view exclusive offers, and track your activity.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Kiosk Detail Modal */}
      <Modal
        visible={showKioskModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowKioskModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedKiosk && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowKioskModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedKiosk.name}</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView style={styles.modalContent}>
                {/* Kiosk Info */}
                <View style={styles.modalKioskCard}>
                  <View style={[styles.kioskIconLarge, { backgroundColor: getKioskColor(selectedKiosk.type) + '20' }]}>
                    <Ionicons name={getKioskIcon(selectedKiosk.type) as any} size={40} color={getKioskColor(selectedKiosk.type)} />
                  </View>
                  <Text style={styles.kioskNameLarge}>{selectedKiosk.name}</Text>
                  <Text style={styles.kioskAddressLarge}>{selectedKiosk.address}</Text>
                  <View style={styles.kioskBadges}>
                    {selectedKiosk.qrAvailable && (
                      <View style={styles.availableBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                        <Text style={styles.availableText}>QR Available</Text>
                      </View>
                    )}
                    {selectedKiosk.doohScreen && (
                      <View style={[styles.availableBadge, { backgroundColor: COLORS.errorLight }]}>
                        <Ionicons name="tv" size={14} color={COLORS.error} />
                        <Text style={[styles.availableText, { color: COLORS.error }]}>DOOH Screen</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Offers */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Available Offers</Text>
                  {Array.from({ length: selectedKiosk.offers }).map((_, i) => (
                    <View key={i} style={styles.offerCard}>
                      <View style={styles.offerIcon}>
                        <Ionicons name="pricetag" size={20} color={COLORS.success} />
                      </View>
                      <View style={styles.offerInfo}>
                        <Text style={styles.offerTitle}>Offer {i + 1}</Text>
                        <Text style={styles.offerDescription}>Tap to claim this offer</Text>
                      </View>
                      <TouchableOpacity style={styles.claimButton}>
                        <Text style={styles.claimText}>Claim</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Recent Activity */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Your Activity</Text>
                  <View style={styles.activityCard}>
                    <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
                    <Text style={styles.activityText}>
                      Last scanned: {selectedKiosk.lastScanned}
                    </Text>
                  </View>
                </View>

                {/* Directions */}
                <View style={styles.modalSection}>
                  <TouchableOpacity style={styles.directionsButton}>
                    <Ionicons name="navigate" size={20} color={COLORS.primary} />
                    <Text style={styles.directionsText}>Get Directions</Text>
                    <Text style={styles.distanceText}>{selectedKiosk.distance}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
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
  filterContainer: {
    maxHeight: 50,
    marginBottom: SPACING.md,
  },
  filterContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  filterTextActive: {
    color: '#fff',
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
  triggersContainer: {
    gap: SPACING.sm,
  },
  triggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  triggerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  triggerInfo: {
    flex: 1,
  },
  triggerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  triggerAction: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  pointsText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.warning,
  },
  kioskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  kioskIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  kioskInfo: {
    flex: 1,
  },
  kioskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  kioskName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  doohBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 2,
  },
  doohText: {
    fontSize: 10,
    color: COLORS.error,
    fontWeight: '600',
  },
  kioskAddress: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  kioskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  offersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  offersText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
  },
  kioskAction: {
    padding: SPACING.xs,
  },
  doohCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  doohPreview: {
    width: 100,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doohScreen: {
    width: 60,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doohInfo: {
    flex: 1,
    padding: SPACING.md,
  },
  doohTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  doohDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  doohStats: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.lg,
  },
  doohStatItem: {},
  doohStatValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  doohStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  stepsContainer: {
    alignItems: 'center',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  stepDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  bottomPadding: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  modalKioskCard: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  kioskIconLarge: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  kioskNameLarge: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  kioskAddressLarge: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  kioskBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  availableText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
    fontWeight: '500',
  },
  modalSection: {
    marginBottom: SPACING.xl,
  },
  modalSectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  offerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.successLight,
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
  offerDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  activityText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  directionsText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  distanceText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
