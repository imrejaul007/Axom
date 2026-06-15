import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { Button } from '@/components/ui';
import { eventsService, Event } from '@/services/events';
import { useAuthStore } from '@/store';

const MOCK_EVENT: Event = {
  id: '1',
  title: 'Jazz Night at Bflat',
  slug: 'jazz-night-bflat',
  description: 'Experience an unforgettable evening of live jazz at Bflat Indiranagar. Featuring renowned musicians from across India, this intimate venue comes alive with soulful melodies. Perfect for jazz enthusiasts and casual listeners alike. Complimentary drinks included with entry.',
  type: 'music',
  category: 'music',
  location: {
    latitude: 12.9716,
    longitude: 77.6403,
    address: '100 Feet Road, Indiranagar',
    area: 'Indiranagar',
    city: 'Bangalore',
  },
  startDate: '2026-05-15T20:00:00Z',
  startTime: '8:00 PM',
  endTime: '11:00 PM',
  organizerId: 'org1',
  organizer: {
    id: 'org1',
    name: 'Bflat Music',
    verified: true,
  },
  attendeeCount: 67,
  isPaid: true,
  ticketPrice: 500,
  maxAttendees: 100,
  currentAttendees: 67,
  interestedCount: 156,
  savedCount: 45,
  isRsvped: false,
  status: 'published',
  isInterested: false,
  predictedPeakTime: '9:30 PM',
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, updateCoinBalance } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(MOCK_EVENT);
  const [isLoading, setIsLoading] = useState(false);
  const [isInterested, setIsInterested] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!id || id === '1') return;
    try {
      const data = await eventsService.getEvent(id);
      if (data) {
        setEvent(data);
        setIsInterested(data.isInterested || false);
      }
    } catch (error) {
      console.error('Failed to load event:', error);
    }
  };

  const handleInterest = async () => {
    if (!event) return;
    try {
      const result = await eventsService.expressInterest(event.id);
      setIsInterested(result.interested);
      setEvent({ ...event, interestedCount: (event.interestedCount || 0) + (result.interested ? 1 : -1) });
    } catch (error) {
      Alert.alert('Error', 'Failed to update interest');
    }
  };

  const handleRSVP = async () => {
    if (!event) return;
    setIsLoading(true);
    try {
      const result = await eventsService.purchaseTicket(event.id);
      Alert.alert(
        'Success! 🎉',
        `Your ticket has been confirmed!\n\nTicket Code: ${result.ticket.ticketCode}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to purchase ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    const locationArea = typeof event.location === 'string' ? event.location : (event.location as any)?.area || '';
    try {
      await Share.share({
        title: event.title,
        message: `Check out "${event.title}" on BuzzLocal! ${locationArea}`,
        url: `https://rez.app/events/${event.slug}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const spotsLeft = event.maxAttendees ? event.maxAttendees - (event.currentAttendees || 0) : null;
  const spotsPercentage = event.maxAttendees ? ((event.currentAttendees || 0) / event.maxAttendees) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.coverContainer}>
          <View style={styles.coverPlaceholder}>
            <Ionicons name="musical-notes" size={64} color={COLORS.textMuted} />
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category & Interest */}
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: COLORS.accent + '20' }]}>
              <Text style={[styles.categoryText, { color: COLORS.accent }]}>{event.category}</Text>
            </View>
            <TouchableOpacity style={styles.interestButton} onPress={handleInterest}>
              <Ionicons
                name={isInterested ? 'heart' : 'heart-outline'}
                size={24}
                color={isInterested ? COLORS.error : COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Organizer */}
          <TouchableOpacity style={styles.organizerRow}>
            <View style={styles.organizerAvatar}>
              <Text style={styles.organizerInitial}>{event.organizer?.name?.[0] || 'O'}</Text>
            </View>
            <View style={styles.organizerInfo}>
              <View style={styles.organizerNameRow}>
                <Text style={styles.organizerName}>{event.organizer?.name || 'Organizer'}</Text>
                {event.organizer?.verified && (
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                )}
              </View>
              <Text style={styles.organizerLabel}>Organizer</Text>
            </View>
          </TouchableOpacity>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{event.startTime} - {event.endTime}</Text>
              </View>
            </View>
          </View>

          {/* Location */}
          <TouchableOpacity style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={20} color={COLORS.accent} />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.locationAddress}>{(event.location as any)?.address || event.location}</Text>
              <Text style={styles.locationArea}>{(event.location as any)?.area || ''}, {(event.location as any)?.city || ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Attendance */}
          {spotsLeft !== null && (
            <View style={styles.attendanceSection}>
              <View style={styles.attendanceHeader}>
                <Text style={styles.attendanceLabel}>Attendance</Text>
                <Text style={styles.attendanceCount}>{spotsLeft} spots left</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${spotsPercentage}%` }]} />
              </View>
              <Text style={styles.attendanceText}>
                {event.currentAttendees} going • {event.interestedCount} interested
              </Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* AI Prediction */}
          {event.predictedPeakTime && (
            <View style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                <Text style={styles.predictionTitle}>AI Prediction</Text>
              </View>
              <Text style={styles.predictionText}>
                Peak attendance expected at {event.predictedPeakTime}
              </Text>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>{event.isPaid ? 'Ticket Price' : 'Free Entry'}</Text>
          <Text style={styles.price}>
            {event.isPaid ? `₹${event.ticketPrice}` : 'FREE'}
          </Text>
        </View>
        <Button
          title={event.isPaid ? 'Buy Ticket' : 'RSVP Free'}
          onPress={handleRSVP}
          loading={isLoading}
          style={styles.rsvpButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
  coverContainer: {
    height: 250,
    position: 'relative',
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  categoryText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  interestButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerInitial: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  organizerInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  organizerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 4,
  },
  organizerLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
  },
  infoContent: {
    marginLeft: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  locationAddress: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  locationArea: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  attendanceSection: {
    marginBottom: SPACING.lg,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  attendanceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  attendanceCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
    borderRadius: 3,
  },
  attendanceText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  predictionCard: {
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  predictionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  predictionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceContainer: {
    marginRight: SPACING.md,
  },
  priceLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  price: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  rsvpButton: {
    flex: 1,
  },
});
