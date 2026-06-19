/**
 * Events Discovery Screen
 * Find people attending events - integration with Z-Events
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rendezEventsService, RendezEvent, AttendeeProfile } from '../../services/events/rendezEvents';

const COLORS = {
  primary: '#6366f1',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  background: '#0f0f23',
  card: '#1a1a2e',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
};

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'music', label: 'Music', icon: 'musical-notes' },
  { key: 'networking', label: 'Networking', icon: 'people' },
  { key: 'food', label: 'Food', icon: 'restaurant' },
  { key: 'tech', label: 'Tech', icon: 'laptop' },
  { key: 'sports', label: 'Sports', icon: 'fitness' },
  { key: 'arts', label: 'Arts', icon: 'color-palette' },
];

export default function EventsDiscoveryScreen() {
  const [events, setEvents] = useState<RendezEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RendezEvent | null>(null);
  const [attendees, setAttendees] = useState<AttendeeProfile[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [activeCategory]);

  const loadEvents = async () => {
    try {
      const params: any = { limit: 20 };
      if (activeCategory !== 'all') {
        params.category = activeCategory;
      }
      const result = await rendezEventsService.getEventsWithAttendees(params);
      setEvents(result.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleEventSelect = async (event: RendezEvent) => {
    setSelectedEvent(event);
    const eventAttendees = await rendezEventsService.getEventAttendees(event.id);
    setAttendees(eventAttendees);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderEventCard = ({ item }: { item: RendezEvent }) => (
    <TouchableOpacity style={styles.eventCard} onPress={() => handleEventSelect(item)}>
      <Image
        source={{ uri: item.coverImage || 'https://via.placeholder.com/120' }}
        style={styles.eventImage}
      />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
          {item.organizer.verified && (
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          )}
        </View>
        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="calendar" size={14} color={COLORS.textSecondary} />
          <Text style={styles.eventMetaText}>{formatDate(item.startDate)}</Text>
        </View>
        <View style={styles.eventMeta}>
          <Ionicons name="location" size={14} color={COLORS.textSecondary} />
          <Text style={styles.eventMetaText} numberOfLines={1}>{item.venue.name}</Text>
        </View>
        <View style={styles.eventFooter}>
          <View style={styles.attendeesPreview}>
            <Ionicons name="people" size={14} color={COLORS.primary} />
            <Text style={styles.attendeesText}>
              {item.currentAttendees} attending
            </Text>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              {item.isPaid ? `₹${item.minPrice}` : 'Free'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAttendeeCard = ({ item }: { item: AttendeeProfile }) => (
    <TouchableOpacity style={styles.attendeeCard}>
      <View style={styles.attendeeAvatar}>
        <Image
          source={{ uri: item.photos[0] || 'https://via.placeholder.com/60' }}
          style={styles.attendeePhoto}
        />
        {item.compatibility && (
          <View style={styles.compatibilityBadge}>
            <Text style={styles.compatibilityText}>{item.compatibility}%</Text>
          </View>
        )}
      </View>
      <Text style={styles.attendeeName}>{item.name}</Text>
      <Text style={styles.attendeeBio} numberOfLines={1}>{item.bio}</Text>
      <View style={styles.attendeeInterests}>
        {item.interests.slice(0, 2).map((interest) => (
          <View key={interest} style={styles.interestTag}>
            <Text style={styles.interestText}>{interest}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.connectButton}>
        <Ionicons name="person-add" size={14} color="#fff" />
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEventDetail = () => {
    if (!selectedEvent) return null;

    return (
      <View style={styles.detailModal}>
        <TouchableOpacity
          style={styles.closeDetail}
          onPress={() => setSelectedEvent(null)}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Image
          source={{ uri: selectedEvent.coverImage || 'https://via.placeholder.com/400x200' }}
          style={styles.detailImage}
        />

        <ScrollView style={styles.detailContent}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
            <View style={styles.detailMeta}>
              <Ionicons name="calendar" size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailMetaText}>
                {formatDate(selectedEvent.startDate)} at {selectedEvent.startTime}
              </Text>
            </View>
            <View style={styles.detailMeta}>
              <Ionicons name="location" size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailMetaText}>{selectedEvent.venue.name}</Text>
            </View>
            <View style={styles.detailMeta}>
              <Ionicons name="people" size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailMetaText}>
                {selectedEvent.currentAttendees} attending • {selectedEvent.maxAttendees || '∞'} spots
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.bookButton}>
            <Ionicons name="ticket" size={20} color="#fff" />
            <Text style={styles.bookButtonText}>
              {selectedEvent.isPaid ? `Book - ₹${selectedEvent.minPrice}` : 'Get Free Ticket'}
            </Text>
          </TouchableOpacity>

          <View style={styles.attendeesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Attendees ({attendees.length})
              </Text>
              <Text style={styles.sectionSubtitle}>
                Connect with people going to this event
              </Text>
            </View>

            <FlatList
              data={attendees}
              renderItem={renderAttendeeCard}
              keyExtractor={(item) => item.userId}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.attendeesList}
              ListEmptyComponent={() => (
                <View style={styles.emptyAttendees}>
                  <Text style={styles.emptyText}>No attendees yet</Text>
                </View>
              )}
            />
          </View>

          {/* AI Recommendation */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiEmoji}>🧞</Text>
              <Text style={styles.aiTitle}>AI Match</Text>
            </View>
            <Text style={styles.aiText}>
              Based on your interests, 3 attendees have high compatibility with you!
            </Text>
            <TouchableOpacity style={styles.aiButton}>
              <Text style={styles.aiButtonText}>View Matches</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Events</Text>
        <Text style={styles.headerSubtitle}>Meet people at events</Text>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryChip, activeCategory === cat.key && styles.categoryChipActive]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={activeCategory === cat.key ? '#fff' : COLORS.textSecondary}
            />
            <Text style={[styles.categoryChipText, activeCategory === cat.key && styles.categoryChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        )}
      />

      {/* Event Detail Modal */}
      {selectedEvent && renderEventDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categories: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  eventsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  eventImage: {
    width: 100,
    height: 140,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  attendeesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeesText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  priceTag: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  detailModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
  },
  closeDetail: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailImage: {
    width: '100%',
    height: 220,
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  detailHeader: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailMetaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  attendeesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  attendeesList: {
    paddingVertical: 8,
  },
  attendeeCard: {
    width: 140,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  attendeeAvatar: {
    position: 'relative',
    marginBottom: 8,
  },
  attendeePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  compatibilityBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compatibilityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  attendeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  attendeeBio: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  attendeeInterests: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  interestTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  interestText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  emptyAttendees: {
    padding: 20,
  },
  aiCard: {
    backgroundColor: COLORS.accent + '20',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiEmoji: {
    fontSize: 20,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  aiText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  aiButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});