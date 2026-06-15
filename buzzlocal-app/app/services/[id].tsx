import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

const REVIEWS = [
  { id: '1', name: 'Priya S.', rating: 5, date: '1 week ago', comment: 'Excellent service! Very professional and on time.' },
  { id: '2', name: 'Rahul M.', rating: 5, date: '2 weeks ago', comment: 'Great work, highly recommended!' },
  { id: '3', name: 'Amit K.', rating: 4, date: '1 month ago', comment: 'Good service, completed on time.' },
];

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const provider = {
    id,
    name: 'Rajesh Kumar',
    profession: 'Electrician',
    category: 'electrician',
    rating: 4.8,
    reviewCount: 156,
    distance: '0.8 km',
    price: '₹200-500',
    verified: true,
    available: true,
    phone: '+91 98765 43210',
    description: 'Experienced electrician with 10+ years of experience. Specializing in home electrical repairs, wiring, and installations.',
    services: ['Electrical Repairs', 'Wiring', 'Switch Board Installation', 'Fan Installation', 'AC Service'],
    workingHours: '8 AM - 8 PM, All days',
  };

  const handleCall = () => {
    Linking.openURL(`tel:${provider.phone}`);
  };

  const handleBook = () => {
    Alert.alert('Booking', 'This feature is coming soon!', [{ text: 'OK' }]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{provider.name.split(' ').map(n => n[0]).join('')}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{provider.name}</Text>
              {provider.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />
                </View>
              )}
            </View>
            <Text style={styles.profession}>{provider.profession}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.accentGold} />
              <Text style={styles.rating}>{provider.rating}</Text>
              <Text style={styles.reviewCount}>({provider.reviewCount} reviews)</Text>
              <Text style={styles.distance}>• {provider.distance}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color={colors.accentGreen} />
            <Text style={styles.callText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappButton}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Availability */}
        <View style={styles.availabilityCard}>
          <View style={[styles.availabilityDot, { backgroundColor: provider.available ? colors.accentGreen : colors.accent }]} />
          <Text style={styles.availabilityText}>
            {provider.available ? 'Available Now' : 'Busy - Available tomorrow'}
          </Text>
        </View>

        {/* Price */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceValue}>{provider.price}</Text>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{provider.description}</Text>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          <View style={styles.servicesList}>
            {provider.services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Working Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          <View style={styles.hoursCard}>
            <Ionicons name="time" size={20} color={colors.primary} />
            <Text style={styles.hoursText}>{provider.workingHours}</Text>
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {REVIEWS.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerAvatar}>
                  <Text style={styles.reviewerInitial}>{review.name[0]}</Text>
                </View>
                <View style={styles.reviewerInfo}>
                  <Text style={styles.reviewerName}>{review.name}</Text>
                  <View style={styles.reviewMeta}>
                    <View style={styles.stars}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons key={i} name="star" size={12} color={i < review.rating ? colors.accentGold : colors.textMuted} />
                      ))}
                    </View>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  backButton: { marginBottom: 16 },
  profileCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary },
  profileInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  verifiedBadge: {},
  profession: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  rating: { fontSize: 14, fontWeight: '600', color: colors.accentGold },
  reviewCount: { fontSize: 12, color: colors.textMuted },
  distance: { fontSize: 12, color: colors.textMuted },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  callButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentGreen + '20', borderRadius: 12, paddingVertical: 14, gap: 8 },
  callText: { fontSize: 16, fontWeight: '600', color: colors.accentGreen },
  whatsappButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#075E54' + '20', borderRadius: 12, paddingVertical: 14, gap: 8 },
  whatsappText: { fontSize: 16, fontWeight: '600', color: '#25D366' },
  availabilityCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 16, gap: 8 },
  availabilityDot: { width: 10, height: 10, borderRadius: 5 },
  availabilityText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  priceCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20, alignItems: 'center' },
  priceLabel: { fontSize: 12, color: colors.textMuted },
  priceValue: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  servicesList: { backgroundColor: colors.surface, borderRadius: 12, padding: 12 },
  serviceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  serviceText: { fontSize: 14, color: colors.textPrimary },
  hoursCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  hoursText: { fontSize: 14, color: colors.textPrimary },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAllText: { fontSize: 14, color: colors.primary },
  reviewCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', marginBottom: 12 },
  reviewerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  reviewerInitial: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  reviewerInfo: { flex: 1, marginLeft: 12 },
  reviewerName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  stars: { flexDirection: 'row' },
  reviewDate: { fontSize: 12, color: colors.textMuted },
  reviewComment: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  bottomCta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.surfaceLight },
  bookButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  bookButtonText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
});
