import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API = 'http://localhost:4020';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  danger: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const res = await axios.get(`${API}/api/housing/properties/${id}`);
      setProperty(res.data.property || res.data);
    } catch (error) {
      console.error('Failed to load property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInquiry = async () => {
    Alert.alert(
      'Contact Owner',
      'Send inquiry to property owner?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await axios.post(`${API}/api/housing/properties/${id}/inquire`, {
                name: 'Demo User',
                phone: '9876543210',
                message: 'I am interested in this property. Please contact me.'
              });
              setInquirySent(true);
              Alert.alert('Success', 'Your inquiry has been sent to the owner!');
            } catch (error) {
              Alert.alert('Error', 'Failed to send inquiry');
            }
          }
        }
      ]
    );
  };

  const handleZeroDeposit = () => {
    router.push('/housing/zero-deposit');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: property.title || 'Property', headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="heart-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Placeholder */}
        <View style={styles.imageContainer}>
          <Ionicons name="image" size={64} color={colors.textMuted} />
          <Text style={styles.imageText}>{property.images?.length || 0} photos</Text>
        </View>

        {/* Main Info */}
        <View style={styles.section}>
          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.address}>
            {property.address?.area}, {property.address?.city} {property.address?.pincode}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>Rs {property.monthlyRent?.toLocaleString('en-IN')}</Text>
            <Text style={styles.priceLabel}>/month</Text>
          </View>

          <View style={styles.tags}>
            {property.furnished && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{property.furnished} furnished</Text>
              </View>
            )}
            {property.foodIncluded && (
              <View style={[styles.tag, styles.tagGreen]}>
                <Text style={[styles.tagText, styles.tagTextGreen]}>Food included</Text>
              </View>
            )}
            {property.tenantType && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{property.tenantType}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="bed" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{property.bedrooms}</Text>
            <Text style={styles.statLabel}>Bedrooms</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="water" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{property.bathrooms}</Text>
            <Text style={styles.statLabel}>Bathrooms</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="resize" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{property.balconies || 0}</Text>
            <Text style={styles.statLabel}>Balconies</Text>
          </View>
        </View>

        {/* Deposit Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Deposit</Text>
          <View style={styles.depositCard}>
            <View>
              <Text style={styles.depositAmount}>Rs {property.securityDeposit?.toLocaleString('en-IN')}</Text>
              <Text style={styles.depositTraditional}>Traditional</Text>
            </View>
            <View style={styles.depositOr}>
              <Text style={styles.depositOrText}>or</Text>
            </View>
            <TouchableOpacity style={styles.zeroDepositCard} onPress={handleZeroDeposit}>
              <Ionicons name="shield-checkmark" size={24} color={colors.accentGreen} />
              <Text style={styles.zeroDepositText}>Zero Deposit</Text>
              <Text style={styles.zeroDepositSubtext}>With Habixo Guarantee</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{property.description}</Text>
        </View>

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {property.amenities.map((amenity: string, i: number) => (
                <View key={i} style={styles.amenityChip}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availabilityRow}>
            <Ionicons name="calendar" size={20} color={colors.textSecondary} />
            <Text style={styles.availabilityText}>
              Available from {new Date(property.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Spacer for bottom buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.contactBtn, inquirySent && styles.contactBtnDisabled]}
          onPress={handleInquiry}
          disabled={inquirySent}
        >
          <Ionicons name={inquirySent ? 'checkmark' : 'chatbubble'} size={20} color={colors.textPrimary} />
          <Text style={styles.contactBtnText}>
            {inquirySent ? 'Inquiry Sent' : 'Contact Owner'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { color: colors.textSecondary, fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  backBtn: { backgroundColor: colors.surface, padding: 10, borderRadius: 12 },
  headerActions: { flexDirection: 'row' },
  headerBtn: { backgroundColor: colors.surface, padding: 10, borderRadius: 12, marginLeft: 8 },
  content: { flex: 1 },
  imageContainer: { height: 200, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  imageText: { color: colors.textMuted, marginTop: 8 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  address: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
  price: { fontSize: 24, fontWeight: '700', color: colors.accentGreen },
  priceLabel: { fontSize: 14, color: colors.textMuted, marginLeft: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  tag: { backgroundColor: colors.surfaceLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  tagGreen: { backgroundColor: colors.accentGreen + '20' },
  tagText: { fontSize: 12, color: colors.textSecondary },
  tagTextGreen: { color: colors.accentGreen },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 8 },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  depositCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  depositAmount: { fontSize: 20, fontWeight: '700', color: colors.danger },
  depositTraditional: { fontSize: 11, color: colors.textMuted },
  depositOr: { flex: 1, alignItems: 'center' },
  depositOrText: { fontSize: 12, color: colors.textMuted },
  zeroDepositCard: { alignItems: 'center', backgroundColor: colors.accentGreen + '20', borderRadius: 12, padding: 12 },
  zeroDepositText: { fontSize: 16, fontWeight: '700', color: colors.accentGreen, marginTop: 4 },
  zeroDepositSubtext: { fontSize: 10, color: colors.textMuted },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  amenityChip: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 8 },
  amenityText: { fontSize: 13, color: colors.textSecondary, marginLeft: 6 },
  availabilityRow: { flexDirection: 'row', alignItems: 'center' },
  availabilityText: { fontSize: 14, color: colors.textSecondary, marginLeft: 8 },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.surfaceLight },
  contactBtn: { backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  contactBtnDisabled: { backgroundColor: colors.accentGreen },
  contactBtnText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginLeft: 8 },
});
