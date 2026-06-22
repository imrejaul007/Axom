/**
 * Service Bookings - View and manage service bookings (Premium UI)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

interface Booking {
  id: string;
  providerId: string;
  providerName: string;
  service: {
    name: string;
    price: number;
  };
  scheduledAt: Date;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  address: string;
}

const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    providerId: 'p1',
    providerName: 'Rajesh Plumbing',
    service: { name: 'Pipe Repair', price: 500 },
    scheduledAt: new Date(Date.now() + 86400000 * 2),
    status: 'confirmed',
    address: '123 Main Street, Koramangala',
  },
  {
    id: '2',
    providerId: 'p2',
    providerName: 'Beauty Salon Elite',
    service: { name: 'Haircut + Styling', price: 800 },
    scheduledAt: new Date(Date.now() + 86400000 * 5),
    status: 'pending',
    address: '45 MG Road, Brigade',
  },
  {
    id: '3',
    providerId: 'p3',
    providerName: 'Home Clean Pro',
    service: { name: 'Full House Cleaning', price: 2500 },
    scheduledAt: new Date(Date.now() - 86400000 * 3),
    status: 'completed',
    address: '78 Indiranagar, 100ft Road',
  },
  {
    id: '4',
    providerId: 'p4',
    providerName: 'Quick Electricians',
    service: { name: 'AC Service', price: 1200 },
    scheduledAt: new Date(Date.now() - 86400000 * 7),
    status: 'completed',
    address: '12 HSR Layout, Sector 2',
  },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] as [string, string] },
  confirmed: { label: 'Confirmed', color: '#10B981', gradient: ['#10B981', '#059669'] as [string, string] },
  in_progress: { label: 'In Progress', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] as [string, string] },
  completed: { label: 'Completed', color: '#10B981', gradient: ['#10B981', '#059669'] as [string, string] },
  cancelled: { label: 'Cancelled', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] as [string, string] },
};

export default function ServiceBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const filteredBookings = bookings.filter((booking) => {
    const isPast = booking.scheduledAt < new Date();
    if (activeTab === 'upcoming') {
      return !isPast && booking.status !== 'cancelled';
    }
    return isPast || booking.status === 'completed' || booking.status === 'cancelled';
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking with ${booking.providerName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            setBookings((prev) =>
              prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
            );
          },
        },
      ]
    );
  };

  const handleReschedule = (booking: Booking) => {
    Alert.alert('Reschedule', 'Would open date picker to reschedule');
  };

  const handleViewDetails = (booking: Booking) => {
    router.push(`/services/book/${booking.id}`);
  };

  const handleRate = (booking: Booking) => {
    Alert.alert('Rate Service', `Rate your experience with ${booking.providerName}`);
  };

  const handleRebook = (booking: Booking) => {
    router.push(`/services/${booking.providerId}`);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const isPast = item.scheduledAt < new Date();

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => handleViewDetails(item)}
        activeOpacity={0.9}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.providerInfo}>
            <View style={styles.providerAvatar}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.providerAvatarGradient}>
                <Text style={styles.providerAvatarText}>
                  {item.providerName.charAt(0)}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.providerDetails}>
              <Text style={styles.providerName}>{item.providerName}</Text>
              <Text style={styles.serviceName}>{item.service.name}</Text>
            </View>
          </View>
          <LinearGradient colors={statusConfig.gradient} style={styles.statusBadge}>
            <Ionicons name={statusConfig.label === 'Completed' ? 'checkmark-circle' : 'time'} size={12} color="#fff" />
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </LinearGradient>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.detailText}>
              {formatDate(item.scheduledAt)} at {formatTime(item.scheduledAt)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.detailText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        </View>

        <View style={styles.bookingFooter}>
          <Text style={styles.price}>{formatPrice(item.service.price)}</Text>

          <View style={styles.actions}>
            {item.status === 'pending' && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleReschedule(item)}
              >
                <Ionicons name="calendar-outline" size={16} color={COLORS.text} />
                <Text style={styles.secondaryButtonText}>Reschedule</Text>
              </TouchableOpacity>
            )}
            {(item.status === 'pending' || item.status === 'confirmed') && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(item)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            {item.status === 'completed' && (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleRate(item)}
                >
                  <Ionicons name="star" size={16} color="#fff" />
                  <Text style={styles.primaryButtonText}>Rate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => handleRebook(item)}
                >
                  <Text style={styles.secondaryButtonText}>Book Again</Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === 'cancelled' && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleRebook(item)}
              >
                <Text style={styles.secondaryButtonText}>Rebook</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['upcoming', 'past'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            {activeTab === tab ? (
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.tabGradient}>
                <Text style={styles.tabTextActive}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <Text style={styles.tabTextInactive}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.emptyIcon}>
                <Ionicons
                  name={activeTab === 'upcoming' ? 'calendar-outline' : 'time-outline'}
                  size={48}
                  color="#fff"
                />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' ? 'No Upcoming Bookings' : 'No Past Bookings'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming'
                ? "You don't have unknown scheduled services"
                : "You haven't completed unknown services yet"}
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/services')}
            >
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.browseButtonGradient}>
                <Text style={styles.browseButtonText}>Browse Services</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
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
    fontWeight: '800',
    color: COLORS.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  tabActive: {},
  tabGradient: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  tabInactive: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  tabTextActive: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
  tabTextInactive: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  bookingCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  providerAvatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerAvatarText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#fff',
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  serviceName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#fff',
  },
  bookingDetails: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingLeft: 64,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  price: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  primaryButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  cancelButton: {
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIconContainer: {
    marginBottom: SPACING.lg,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  browseButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  browseButtonGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  browseButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
});
