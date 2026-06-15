import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
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

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Mock listing data
  const listing = {
    id,
    title: 'Sony Bravia 55" 4K Smart TV',
    price: 45000,
    negotiable: true,
    condition: 'like_new',
    description: 'Excellent condition Sony Bravia TV. Used for 6 months. All accessories included. Original bill available. Selling because upgrading to newer model.',
    images: [],
    location: { area: 'Koramangala 5th Block', showExact: false },
    seller: { name: 'Rahul M.', trustLevel: 'trusted', trustScore: 156 },
    views: 234,
    interested: 12,
    createdAt: '2 days ago',
  };

  const getTrustBadge = (level: string) => {
    const badges: Record<string, { icon: string; color: string }> = {
      trusted: { icon: 'star', color: colors.accentGold },
      verified: { icon: 'checkmark-circle', color: colors.accentGreen },
      expert: { icon: 'ribbon', color: colors.primary },
    };
    return badges[level] || { icon: 'person', color: colors.textMuted };
  };

  const getConditionInfo = (condition: string) => {
    const info: Record<string, { label: string; color: string }> = {
      new: { label: 'New', color: colors.accentGreen },
      like_new: { label: 'Like New', color: colors.primary },
      good: { label: 'Good', color: colors.textSecondary },
      fair: { label: 'Fair', color: colors.accent },
    };
    return info[condition] || { label: condition, color: colors.textMuted };
  };

  const condition = getConditionInfo(listing.condition);
  const trust = getTrustBadge(listing.seller.trustLevel);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Image Placeholder */}
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image" size={64} color={colors.textMuted} />
          <Text style={styles.imageHint}>Tap to add photos</Text>
        </View>

        {/* Price & Title */}
        <View style={styles.header}>
          <Text style={styles.price}>₹{listing.price.toLocaleString()}</Text>
          {listing.negotiable && (
            <View style={styles.negotiableBadge}>
              <Text style={styles.negotiableText}>Negotiable</Text>
            </View>
          )}
        </View>
        <Text style={styles.title}>{listing.title}</Text>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={[styles.conditionBadge, { backgroundColor: condition.color + '20' }]}>
            <Text style={[styles.conditionText, { color: condition.color }]}>{condition.label}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="eye" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{listing.views} views</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="heart" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{listing.interested} interested</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>{listing.location.area}</Text>
              <Text style={styles.locationHint}>
                {listing.location.showExact ? 'Exact location shown' : 'Approximate area shown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Seller */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {listing.seller.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{listing.seller.name}</Text>
              <View style={styles.sellerTrust}>
                <Ionicons name={trust.icon as any} size={14} color={trust.color} />
                <Text style={[styles.sellerTrustText, { color: trust.color }]}>
                  {listing.seller.trustLevel.charAt(0).toUpperCase() + listing.seller.trustLevel.slice(1)} • {listing.seller.trustScore} pts
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileButtonText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posted */}
        <Text style={styles.postedText}>Posted {listing.createdAt}</Text>

        {/* Safety Tips */}
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={20} color={colors.accentGreen} />
          <View style={styles.safetyInfo}>
            <Text style={styles.safetyTitle}>Safety Tips</Text>
            <Text style={styles.safetyText}>Meet in public places. Check item before paying.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble" size={20} color={colors.primary} />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>I'm Interested</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  backButton: { marginBottom: 16 },
  imagePlaceholder: { height: 250, backgroundColor: colors.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  imageHint: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary },
  negotiableBadge: { backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  negotiableText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 18, color: colors.textPrimary, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  conditionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  conditionText: { fontSize: 12, fontWeight: '600' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textMuted },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  locationInfo: { flex: 1 },
  locationText: { fontSize: 14, color: colors.textPrimary },
  locationHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sellerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  sellerAvatarText: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  sellerTrust: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  sellerTrustText: { fontSize: 12 },
  profileButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surfaceLight, borderRadius: 8 },
  profileButtonText: { fontSize: 12, color: colors.textSecondary },
  postedText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginVertical: 16 },
  safetyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accentGreen + '10', borderRadius: 12, padding: 16, gap: 12 },
  safetyInfo: { flex: 1 },
  safetyTitle: { fontSize: 14, fontWeight: '600', color: colors.accentGreen },
  safetyText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  bottomCta: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.surfaceLight, gap: 12 },
  messageButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 16, gap: 8 },
  messageButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  buyButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buyButtonText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
});
