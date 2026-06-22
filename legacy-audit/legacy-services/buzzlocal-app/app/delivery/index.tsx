/**
 * DO Delivery Integration - Food and package delivery tracking
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

interface DeliveryOrder {
  id: string;
  restaurant: string;
  items: string[];
  status: 'confirmed' | 'preparing' | 'picked' | 'onway' | 'delivered';
  eta: string;
  driver: {
    name: string;
    phone: string;
    rating: number;
  } | null;
  total: string;
  progress: number;
}

export default function DeliveryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);
  const [pastOrders, setPastOrders] = useState<DeliveryOrder[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string; rating: number; delivery: string }[]>([]);

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    try {
      setActiveOrder({
        id: 'ORD-12345',
        restaurant: 'Spice Garden',
        items: ['Chicken Biryani', 'Naan', 'Lassi'],
        status: 'onway',
        eta: '12 mins',
        driver: {
          name: 'Rahul K.',
          phone: '+91 98765 43210',
          rating: 4.8,
        },
        total: '₹485',
        progress: 75,
      });

      setPastOrders([
        { id: 'ORD-12340', restaurant: 'McDonald\'s', items: ['Burger Combo'], status: 'delivered', eta: '', driver: null, total: '₹299', progress: 100 },
        { id: 'ORD-12335', restaurant: 'Pizza Hut', items: ['Pizza', 'Garlic Bread'], status: 'delivered', eta: '', driver: null, total: '₹650', progress: 100 },
        { id: 'ORD-12330', restaurant: 'KFC', items: ['Bucket', 'Cola'], status: 'delivered', eta: '', driver: null, total: '₹799', progress: 100 },
      ]);

      setRestaurants([
        { id: '1', name: 'Spice Garden', rating: 4.5, delivery: '25-30 min' },
        { id: '2', name: 'Burger King', rating: 4.3, delivery: '20-25 min' },
        { id: '3', name: 'Domino\'s', rating: 4.2, delivery: '30-35 min' },
        { id: '4', name: 'Biryani Blues', rating: 4.7, delivery: '35-40 min' },
      ]);
    } catch (error) {
      console.error('Failed to fetch delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveryData();
    setRefreshing(false);
  };

  const getStatusSteps = (status: string) => {
    const steps = ['confirmed', 'preparing', 'picked', 'onway', 'delivered'];
    const currentIndex = steps.indexOf(status);
    return { steps, currentIndex };
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Order Confirmed';
      case 'preparing': return 'Preparing';
      case 'picked': return 'Picked Up';
      case 'onway': return 'On the Way';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'preparing': return 'restaurant';
      case 'picked': return 'cube';
      case 'onway': return 'car';
      case 'delivered': return 'home';
      default: return 'ellipse';
    }
  };

  const openDOApp = () => {
    Linking.openURL('do://orders');
  };

  const callDriver = () => {
    if (activeOrder?.driver?.phone) {
      Linking.openURL(`tel:${activeOrder.driver.phone}`);
    }
  };

  const renderStatusStep = (step: string, index: number, isLast: boolean, currentIndex: number, status: string) => {
    const isCompleted = index < currentIndex;
    const isCurrent = index === currentIndex;
    const isPending = index > currentIndex;

    return (
      <View key={step} style={styles.stepContainer}>
        <View style={styles.stepRow}>
          <View style={[
            styles.stepDot,
            isCompleted && styles.stepDotCompleted,
            isCurrent && styles.stepDotCurrent,
            isPending && styles.stepDotPending,
          ]}>
            {isCompleted ? (
              <Ionicons name="checkmark" size={12} color="#fff" />
            ) : (
              <Ionicons name={getStatusIcon(step) as any} size={12} color={isCurrent ? '#fff' : COLORS.textSecondary} />
            )}
          </View>
          <View style={[styles.stepLine, isLast && styles.stepLineHidden, isCompleted && styles.stepLineCompleted]} />
        </View>
        <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}>
          {getStatusLabel(step)}
        </Text>
      </View>
    );
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
          <Text style={styles.headerTitle}>DO Delivery</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* DO Integration Banner */}
        <View style={styles.section}>
          <View style={styles.doBanner}>
            <View style={styles.doIconContainer}>
              <Ionicons name="fast-food" size={32} color="#fff" />
            </View>
            <View style={styles.doContent}>
              <Text style={styles.doTitle}>Powered by DO</Text>
              <Text style={styles.doSubtitle}>Food & package delivery in one tap</Text>
            </View>
            <TouchableOpacity style={styles.doButton} onPress={openDOApp}>
              <Text style={styles.doButtonText}>Order Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Order */}
        {activeOrder && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Order</Text>
            <View style={styles.activeOrderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.restaurantName}>{activeOrder.restaurant}</Text>
                  <Text style={styles.orderId}>{activeOrder.id}</Text>
                </View>
                <View style={styles.etaBadge}>
                  <Ionicons name="time" size={14} color={COLORS.primary} />
                  <Text style={styles.etaText}>{activeOrder.eta}</Text>
                </View>
              </View>

              {/* Progress Steps */}
              <View style={styles.progressContainer}>
                {(() => {
                  const { steps, currentIndex } = getStatusSteps(activeOrder.status);
                  return (
                    <View style={styles.stepsRow}>
                      {steps.map((step, index) => renderStatusStep(
                        step,
                        index,
                        index === steps.length - 1,
                        currentIndex,
                        activeOrder.status
                      ))}
                    </View>
                  );
                })()}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${activeOrder.progress}%` }]} />
              </View>

              {/* Order Items */}
              <View style={styles.orderItems}>
                {activeOrder.items.map((item, i) => (
                  <Text key={i} style={styles.itemText}>• {item}</Text>
                ))}
              </View>

              {/* Driver Info */}
              {activeOrder.driver && (
                <View style={styles.driverCard}>
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{activeOrder.driver.name}</Text>
                    <View style={styles.driverRating}>
                      <Ionicons name="star" size={12} color={COLORS.warning} />
                      <Text style={styles.ratingText}>{activeOrder.driver.rating}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.callButton} onPress={callDriver}>
                    <Ionicons name="call" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Order Total */}
              <View style={styles.orderFooter}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{activeOrder.total}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Restaurant Density */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Restaurant Density</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See Map</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.densityCard}>
            <View style={styles.densityMap}>
              <View style={styles.densityGrid}>
                {[
                  { area: 'Koramangala', density: 95, color: COLORS.error },
                  { area: 'HSR', density: 78, color: COLORS.warning },
                  { area: 'Indiranagar', density: 65, color: COLORS.warning },
                  { area: 'BTM', density: 45, color: COLORS.success },
                ].map((loc) => (
                  <View key={loc.area} style={styles.densityItem}>
                    <View style={[styles.densityBar, { backgroundColor: loc.color }]}>
                      <Text style={styles.densityValue}>{loc.density}%</Text>
                    </View>
                    <Text style={styles.densityArea}>{loc.area}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.densityHint}>
              <Ionicons name="bulb" size={14} color={COLORS.warning} />
              {' '}Higher density = more options & faster delivery
            </Text>
          </View>
        </View>

        {/* Quick Restaurants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {restaurants.map((restaurant) => (
              <TouchableOpacity key={restaurant.id} style={styles.restaurantCard} onPress={openDOApp}>
                <View style={styles.restaurantImage}>
                  <Ionicons name="restaurant" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.restaurantNameSmall}>{restaurant.name}</Text>
                <View style={styles.restaurantMeta}>
                  <Ionicons name="star" size={12} color={COLORS.warning} />
                  <Text style={styles.ratingSmall}>{restaurant.rating}</Text>
                  <Text style={styles.deliveryTime}>• {restaurant.delivery}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Past Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Past Orders</Text>
            <TouchableOpacity onPress={openDOApp}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {pastOrders.map((order) => (
            <View key={order.id} style={styles.pastOrderCard}>
              <View style={styles.pastOrderIcon}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              </View>
              <View style={styles.pastOrderInfo}>
                <Text style={styles.pastOrderRestaurant}>{order.restaurant}</Text>
                <Text style={styles.pastOrderItems}>{order.items.join(', ')}</Text>
              </View>
              <View style={styles.pastOrderMeta}>
                <Text style={styles.pastOrderTotal}>{order.total}</Text>
                <TouchableOpacity>
                  <Text style={styles.reorderText}>Reorder</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Open DO Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.openDoButton} onPress={openDOApp}>
            <Ionicons name="fast-food" size={24} color="#fff" />
            <Text style={styles.openDoText}>Open DO App</Text>
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
  doBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  doIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  doContent: {
    flex: 1,
  },
  doTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
  doSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  doButton: {
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  doButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  activeOrderCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  restaurantName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  orderId: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  etaText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepRow: {
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotCompleted: {
    backgroundColor: COLORS.success,
  },
  stepDotCurrent: {
    backgroundColor: COLORS.primary,
  },
  stepDotPending: {
    backgroundColor: COLORS.border,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginTop: 2,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.success,
  },
  stepLineHidden: {
    backgroundColor: 'transparent',
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: SPACING.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  orderItems: {
    marginBottom: SPACING.md,
  },
  itemText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  totalLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  densityCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  densityMap: {
    marginBottom: SPACING.sm,
  },
  densityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  densityItem: {
    alignItems: 'center',
    flex: 1,
  },
  densityBar: {
    width: 40,
    height: 80,
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  densityValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: '#fff',
  },
  densityArea: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  densityHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  restaurantCard: {
    width: 140,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.sm,
  },
  restaurantImage: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  restaurantNameSmall: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingSmall: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  deliveryTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  pastOrderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  pastOrderIcon: {
    marginRight: SPACING.md,
  },
  pastOrderInfo: {
    flex: 1,
  },
  pastOrderRestaurant: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  pastOrderItems: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pastOrderMeta: {
    alignItems: 'flex-end',
  },
  pastOrderTotal: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  reorderText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginTop: 4,
  },
  openDoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
  },
  openDoText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 100,
  },
});
