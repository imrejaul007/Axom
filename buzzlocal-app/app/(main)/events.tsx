import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const EVENT_CATEGORIES = [
  { id: 'music', label: 'Music', icon: 'musical-notes', color: '#E91E63' },
  { id: 'tech', label: 'Tech', icon: 'laptop', color: '#2196F3' },
  { id: 'food', label: 'Food', icon: 'restaurant', color: '#FF9800' },
  { id: 'sports', label: 'Sports', icon: 'football', color: '#4CAF50' },
  { id: 'arts', label: 'Arts', icon: 'color-palette', color: '#9C27B0' },
  { id: 'networking', label: 'Networking', icon: 'people', color: '#00BCD4' },
];

const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Jazz Night at Bflat',
    subtitle: 'Live jazz performance',
    date: 'Tonight',
    time: '8:00 PM',
    location: 'Indiranagar',
    category: 'music',
    attendees: 89,
    image: 'https://picsum.photos/400/200?random=20',
    isTrending: true,
  },
  {
    id: '2',
    title: 'Bangalore Tech Meetup',
    subtitle: 'Weekly networking event',
    date: 'Tomorrow',
    time: '6:30 PM',
    location: 'Koramangala',
    category: 'tech',
    attendees: 156,
    image: 'https://picsum.photos/400/200?random=21',
    isTrending: true,
  },
  {
    id: '3',
    title: 'Food Festival 2026',
    subtitle: 'Street food from across India',
    date: 'This Weekend',
    time: '11:00 AM',
    location: 'MG Road',
    category: 'food',
    attendees: 500,
    image: 'https://picsum.photos/400/200?random=22',
    isTrending: false,
  },
  {
    id: '4',
    title: 'Startup Pitch Night',
    subtitle: '10 startups pitch to investors',
    date: 'May 15',
    time: '5:00 PM',
    location: 'HSR Layout',
    category: 'networking',
    attendees: 234,
    image: 'https://picsum.photos/400/200?random=23',
    isTrending: false,
  },
];

const TODAY_EVENTS = MOCK_EVENTS.slice(0, 2);
const UPCOMING_EVENTS = MOCK_EVENTS.slice(2);

export default function EventsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getCategoryColor = (category: string) => {
    const found = EVENT_CATEGORIES.find(c => c.id === category);
    return found?.color || COLORS.primary;
  };

  const getCategoryIcon = (category: string) => {
    const found = EVENT_CATEGORIES.find(c => c.id === category);
    return found?.icon || 'calendar';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/create-event')}
        >
          <Ionicons name="add" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {EVENT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && { backgroundColor: category.color + '20', borderColor: category.color },
            ]}
            onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={selectedCategory === category.id ? category.color : COLORS.textMuted}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && { color: category.color },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Today */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎉 Today</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsScroll}
          >
            {TODAY_EVENTS.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => router.push(`/event/${event.id}`)}
              >
                <View style={styles.eventImage}>
                  <View style={styles.eventImagePlaceholder}>
                    <Ionicons name="image" size={32} color={COLORS.textMuted} />
                  </View>
                  {event.isTrending && (
                    <View style={styles.trendingBadge}>
                      <Ionicons name="flash" size={12} color={COLORS.text} />
                      <Text style={styles.trendingText}>Hot</Text>
                    </View>
                  )}
                </View>
                <View style={styles.eventContent}>
                  <View style={styles.eventCategory}>
                    <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(event.category) }]} />
                    <Text style={styles.categoryLabel}>{event.category}</Text>
                  </View>
                  <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.eventSubtitle} numberOfLines={1}>{event.subtitle}</Text>
                  <View style={styles.eventMeta}>
                    <View style={styles.eventMetaItem}>
                      <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.eventMetaText}>{event.time}</Text>
                    </View>
                    <View style={styles.eventMetaItem}>
                      <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.eventMetaText}>{event.location}</Text>
                    </View>
                  </View>
                  <View style={styles.attendeesRow}>
                    <View style={styles.attendeesAvatars}>
                      {[1, 2, 3].map((i) => (
                        <View key={i} style={[styles.attendeeAvatar, { marginLeft: i > 1 ? -8 : 0 }]}>
                          <Text style={styles.attendeeInitial}>{String.fromCharCode(64 + i)}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.attendeesCount}>{event.attendees} going</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Upcoming</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {UPCOMING_EVENTS.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.upcomingEventCard}
              onPress={() => router.push(`/event/${event.id}`)}
            >
              <View style={[styles.upcomingDateBadge, { backgroundColor: getCategoryColor(event.category) + '20' }]}>
                <Text style={[styles.upcomingDateDay, { color: getCategoryColor(event.category) }]}>
                  {event.date.split(' ')[0]}
                </Text>
                <Text style={[styles.upcomingDateMonth, { color: getCategoryColor(event.category) }]}>
                  {event.date.split(' ')[1] || ''}
                </Text>
              </View>
              <View style={styles.upcomingContent}>
                <Text style={styles.upcomingTitle}>{event.title}</Text>
                <Text style={styles.upcomingSubtitle}>{event.subtitle}</Text>
                <View style={styles.eventMeta}>
                  <View style={styles.eventMetaItem}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.eventMetaTextSmall}>{event.time}</Text>
                  </View>
                  <View style={styles.eventMetaItem}>
                    <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.eventMetaTextSmall}>{event.location}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.rsvpButton}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={styles.rsvpText}>RSVP</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  eventsScroll: {
    paddingHorizontal: SPACING.md,
  },
  eventCard: {
    width: 260,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  eventImage: {
    height: 120,
    position: 'relative',
  },
  eventImagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  trendingText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 4,
  },
  eventContent: {
    padding: SPACING.md,
  },
  eventCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  eventTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  eventSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  eventMeta: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  eventMetaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  eventMetaTextSmall: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  attendeesAvatars: {
    flexDirection: 'row',
  },
  attendeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  attendeeInitial: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: '600',
  },
  attendeesCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  upcomingDateBadge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  upcomingDateDay: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  upcomingDateMonth: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  upcomingSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rsvpButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.sm,
  },
  rsvpText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
