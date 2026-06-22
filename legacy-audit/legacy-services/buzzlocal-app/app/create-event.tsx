import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { Button } from '@/components/ui';

const CATEGORIES = [
  { id: 'music', label: 'Music', icon: 'musical-notes' },
  { id: 'tech', label: 'Tech', icon: 'laptop' },
  { id: 'food', label: 'Food', icon: 'restaurant' },
  { id: 'sports', label: 'Sports', icon: 'football' },
  { id: 'arts', label: 'Arts', icon: 'color-palette' },
  { id: 'networking', label: 'Networking', icon: 'people' },
  { id: 'wellness', label: 'Wellness', icon: 'fitness' },
  { id: 'gaming', label: 'Gaming', icon: 'game-controller' },
];

export default function CreateEventScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    address: '',
    date: '',
    time: '',
    isPaid: false,
    price: '',
  });

  const updateForm = (key: string, value: string | boolean) => {
    setForm({ ...form, [key]: value });
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.category || !form.address || !form.date || !form.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Success! 🎉',
        'Your event has been created!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What's your event called?"
              placeholderTextColor={COLORS.textMuted}
              value={form.title}
              onChangeText={(v) => updateForm('title', v)}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell people what this event is about..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              value={form.description}
              onChangeText={(v) => updateForm('description', v)}
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    form.category === cat.id && styles.categoryChipActive,
                  ]}
                  onPress={() => updateForm('category', cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={form.category === cat.id ? COLORS.text : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      form.category === cat.id && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={styles.label}>Venue Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the venue address"
              placeholderTextColor={COLORS.textMuted}
              value={form.address}
              onChangeText={(v) => updateForm('address', v)}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: SPACING.sm }]}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="May 20, 2026"
                placeholderTextColor={COLORS.textMuted}
                value={form.date}
                onChangeText={(v) => updateForm('date', v)}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Time *</Text>
              <TextInput
                style={styles.input}
                placeholder="6:00 PM"
                placeholderTextColor={COLORS.textMuted}
                value={form.time}
                onChangeText={(v) => updateForm('time', v)}
              />
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.field}>
            <Text style={styles.label}>Pricing</Text>
            <View style={styles.pricingRow}>
              <TouchableOpacity
                style={[styles.pricingOption, !form.isPaid && styles.pricingOptionActive]}
                onPress={() => updateForm('isPaid', false)}
              >
                <Text style={[styles.pricingLabel, !form.isPaid && styles.pricingLabelActive]}>
                  Free
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pricingOption, form.isPaid && styles.pricingOptionActive]}
                onPress={() => updateForm('isPaid', true)}
              >
                <Text style={[styles.pricingLabel, form.isPaid && styles.pricingLabelActive]}>
                  Paid
                </Text>
              </TouchableOpacity>
            </View>
            {form.isPaid && (
              <TextInput
                style={[styles.input, { marginTop: SPACING.sm }]}
                placeholder="Ticket price (₹)"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={form.price}
                onChangeText={(v) => updateForm('price', v)}
              />
            )}
          </View>

          {/* Coin Reward Info */}
          <View style={styles.rewardInfo}>
            <Ionicons name="gift" size={20} color={COLORS.coinGold} />
            <Text style={styles.rewardText}>
              You'll earn 50 ReZ Coins for creating this event!
            </Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Submit */}
        <View style={styles.footer}>
          <Button
            title="Create Event"
            onPress={handleCreate}
            loading={isLoading}
            disabled={!form.title || !form.category}
          />
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  field: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  categoryLabelActive: {
    color: COLORS.text,
  },
  pricingRow: {
    flexDirection: 'row',
  },
  pricingOption: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pricingOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pricingLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  pricingLabelActive: {
    color: COLORS.text,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.coinGold + '10',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xl,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  rewardText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.coinGold,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
});
