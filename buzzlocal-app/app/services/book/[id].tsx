/**
 * Book Service - Book a specific service provider (Premium UI)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const MOCK_PROVIDER = {
  id: 'p1',
  name: 'Rajesh Plumbing Services',
  phone: '+91 98765 43210',
  rating: 4.8,
  reviewCount: 234,
  verified: true,
  services: [
    { name: 'Pipe Repair', price: 500, description: 'Fix leaking or broken pipes' },
    { name: 'Tap Installation', price: 300, description: 'Install new taps or faucets' },
    { name: 'Bathroom Fitting', price: 1500, description: 'Complete bathroom fixture installation' },
    { name: 'Drain Cleaning', price: 400, description: 'Unclog drains and sinks' },
    { name: 'Water Heater Service', price: 600, description: 'Repair and maintenance' },
  ],
  workingHours: { start: '9:00 AM', end: '7:00 PM' },
  area: 'Koramangala, HSR, Indiranagar',
};

export default function BookServiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const provider = MOCK_PROVIDER;

  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

  const availableSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  ];

  const nextFiveDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const handleBook = async () => {
    if (!selectedService) {
      Alert.alert('Required', 'Please select a service');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Required', 'Please enter your address');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Required', 'Please select a date');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Required', 'Please select a time slot');
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Booking Confirmed!',
        `Your ${provider.services.find((s) => s.name === selectedService)?.name} appointment has been scheduled.`,
        [
          { text: 'View Bookings', onPress: () => router.push('/services/bookings') },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to book service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCall = () => {
    Alert.alert('Call', `Would call ${provider.phone}`);
  };

  const selectedServiceData = provider.services.find((s) => s.name === selectedService);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Service</Text>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.callButtonGradient}>
              <Ionicons name="call" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Provider Info */}
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.1)', 'transparent']}
          style={styles.providerGradient}
        >
          <View style={styles.providerCard}>
            <View style={styles.providerAvatar}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.avatarGradient}>
                <Text style={styles.providerAvatarText}>{provider.name.charAt(0)}</Text>
              </LinearGradient>
            </View>
            <View style={styles.providerInfo}>
              <View style={styles.providerNameRow}>
                <Text style={styles.providerName}>{provider.name}</Text>
                {provider.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  </View>
                )}
              </View>
              <View style={styles.providerMeta}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={styles.ratingText}>{provider.rating}</Text>
                </View>
                <Text style={styles.reviewCount}>({provider.reviewCount} reviews)</Text>
              </View>
              <View style={styles.workingHoursRow}>
                <Ionicons name="time" size={14} color={COLORS.textSecondary} />
                <Text style={styles.workingHours}>
                  {provider.workingHours.start} - {provider.workingHours.end}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Service *</Text>
          <View style={styles.servicesList}>
            {provider.services.map((service) => {
              const isSelected = selectedService === service.name;
              return (
                <TouchableOpacity
                  key={service.name}
                  style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                  onPress={() => setSelectedService(service.name)}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.serviceGradient}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceNameSelected}>{service.name}</Text>
                        <Text style={styles.serviceDescriptionSelected}>{service.description}</Text>
                      </View>
                      <View style={styles.servicePriceContainer}>
                        <Text style={styles.servicePriceSelected}>{formatPrice(service.price)}</Text>
                        <View style={styles.checkmarkCircle}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceDescription}>{service.description}</Text>
                      <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Address *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.addressInput}
              placeholder="Enter your complete address"
              placeholderTextColor={COLORS.textMuted}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dateRow}>
              {nextFiveDays.map((date, index) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                    onPress={() => setSelectedDate(date)}
                  >
                    {isSelected ? (
                      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.dateGradient}>
                        <Text style={styles.dateDaySelected}>
                          {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </Text>
                        <Text style={styles.dateNumberSelected}>{date.getDate()}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.dateContent}>
                        <Text style={styles.dateDay}>
                          {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </Text>
                        <Text style={styles.dateNumber}>{date.getDate()}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time *</Text>
          <View style={styles.timeGrid}>
            {availableSlots.map((time) => {
              const isSelected = selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                  onPress={() => setSelectedTime(time)}
                >
                  {isSelected ? (
                    <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.timeGradient}>
                      <Text style={styles.timeSlotTextSelected}>{time}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.timeSlotText}>{time}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.notesInput}
              placeholder="Any specific requirements or instructions..."
              placeholderTextColor={COLORS.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Summary */}
        {selectedServiceData && (
          <View style={styles.summarySection}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.1)', 'transparent']}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Booking Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service</Text>
                  <Text style={styles.summaryValue}>{selectedService}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryValue}>
                    {selectedDate ? formatDate(selectedDate) : '-'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryValue}>{selectedTime || '-'}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatPrice(selectedServiceData.price)}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bookButton, submitting && styles.bookButtonDisabled]}
          onPress={handleBook}
          disabled={submitting}
        >
          <LinearGradient
            colors={submitting ? [COLORS.textSecondary, COLORS.textMuted] : ['#6366F1', '#8B5CF6']}
            style={styles.bookButtonGradient}
          >
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.bookButtonText}>
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
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
    fontWeight: '700',
    color: COLORS.text,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  callButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerGradient: {
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: 2,
    marginBottom: SPACING.lg,
  },
  providerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  providerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerAvatarText: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: '#fff',
  },
  providerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  providerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  providerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  workingHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  workingHours: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  servicesList: {
    gap: SPACING.sm,
  },
  serviceCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  serviceCardSelected: {
    borderColor: 'transparent',
  },
  serviceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  serviceInfo: {
    padding: SPACING.md,
  },
  serviceName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  serviceNameSelected: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  serviceDescriptionSelected: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  servicePrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 6,
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  servicePriceSelected: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  addressInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateCard: {
    width: 70,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dateCardSelected: {
    borderColor: 'transparent',
  },
  dateGradient: {
    padding: SPACING.sm,
    alignItems: 'center',
  },
  dateContent: {
    padding: SPACING.sm,
    alignItems: 'center',
  },
  dateDay: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  dateDaySelected: {
    fontSize: FONT_SIZE.xs,
    color: '#fff',
    fontWeight: '600',
  },
  dateNumber: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  dateNumberSelected: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#fff',
    marginTop: 2,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timeSlot: {
    width: '31%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  timeSlotSelected: {
    borderColor: 'transparent',
  },
  timeGradient: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  timeSlotText: {
    paddingVertical: SPACING.sm,
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    fontSize: FONT_SIZE.sm,
    color: '#fff',
    fontWeight: '700',
  },
  notesInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summarySection: {
    paddingHorizontal: SPACING.lg,
  },
  summaryGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: 2,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  summaryTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryTotal: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.primary,
  },
  bottomSpacer: {
    height: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bookButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  bookButtonDisabled: {},
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  bookButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
});
