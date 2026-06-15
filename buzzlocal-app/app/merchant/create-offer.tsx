/**
 * Create Offer - Create a new merchant offer/coupon (Premium UI)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const OFFER_TYPES = [
  { id: 'discount', label: 'Discount', icon: 'pricetag', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] as [string, string] },
  { id: 'bogo', label: 'Buy 1 Get 1', icon: 'gift', color: '#F97316', gradient: ['#F97316', '#EA580C'] as [string, string] },
  { id: 'cashback', label: 'Cashback', icon: 'cash', color: '#10B981', gradient: ['#10B981', '#059669'] as [string, string] },
  { id: 'freebie', label: 'Free Item', icon: 'cube', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] as [string, string] },
];

const VALID_FOR_OPTIONS = [
  { id: '1', label: '1 Day' },
  { id: '7', label: '7 Days' },
  { id: '14', label: '14 Days' },
  { id: '30', label: '30 Days' },
  { id: 'unlimited', label: 'Unlimited' },
];

export default function CreateOfferScreen() {
  const router = useRouter();
  const [offerType, setOfferType] = useState<string>('discount');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [minOrder, setMinOrder] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [validFor, setValidFor] = useState('7');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedOfferType = OFFER_TYPES.find((t) => t.id === offerType);

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an offer title');
      return false;
    }
    if (!discountValue.trim()) {
      Alert.alert('Required', 'Please enter a discount value');
      return false;
    }
    if (discountType === 'percent' && parseInt(discountValue) > 100) {
      Alert.alert('Invalid', 'Percentage cannot exceed 100%');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Offer Created!',
        'Your offer has been published and is now live.',
        [
          { text: 'View Offers', onPress: () => router.push('/merchant/offers') },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = () => {
    Alert.alert(
      'Offer Preview',
      `Title: ${title || 'Untitled'}\nType: ${selectedOfferType?.label}\nDiscount: ${discountValue}${discountType === 'percent' ? '%' : '₹'}`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <View style={styles.closeButtonInner}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Offer</Text>
          <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
            <View style={styles.previewButtonInner}>
              <Ionicons name="eye" size={20} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Offer Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offer Type *</Text>
          <View style={styles.offerTypesGrid}>
            {OFFER_TYPES.map((type) => {
              const isSelected = offerType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.offerTypeCard, isSelected && styles.offerTypeCardSelected]}
                  onPress={() => setOfferType(type.id)}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <LinearGradient colors={type.gradient} style={styles.offerTypeGradient}>
                      <View style={styles.offerTypeIconSelected}>
                        <Ionicons name={type.icon as any} size={24} color={type.color} />
                      </View>
                      <Text style={styles.offerTypeLabelSelected}>{type.label}</Text>
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.offerTypeContent}>
                      <View style={[styles.offerTypeIcon, { backgroundColor: type.color + '15' }]}>
                        <Ionicons name={type.icon as any} size={24} color={type.color} />
                      </View>
                      <Text style={styles.offerTypeLabel}>{type.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="pricetag" size={20} color={COLORS.textSecondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Offer Title *"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="document-text" size={20} color={COLORS.textSecondary} />
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your offer (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>
        </View>

        {/* Discount Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discount Settings</Text>

          <Text style={styles.inputLabel}>Discount Value *</Text>
          <View style={styles.discountRow}>
            <TouchableOpacity
              style={[
                styles.discountTypeButton,
                discountType === 'percent' && styles.discountTypeButtonActive,
              ]}
              onPress={() => setDiscountType('percent')}
            >
              {discountType === 'percent' ? (
                <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.discountTypeGradient}>
                  <Text style={styles.discountTypeTextActive}>%</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.discountTypeText}>%</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.discountTypeButton,
                discountType === 'flat' && styles.discountTypeButtonActive,
              ]}
              onPress={() => setDiscountType('flat')}
            >
              {discountType === 'flat' ? (
                <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.discountTypeGradient}>
                  <Text style={styles.discountTypeTextActive}>₹</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.discountTypeText}>₹</Text>
              )}
            </TouchableOpacity>
            <View style={styles.discountInputContainer}>
              <TextInput
                style={styles.discountInput}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="cart" size={20} color={COLORS.textSecondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Minimum Order Value (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={minOrder}
              onChangeText={setMinOrder}
              keyboardType="numeric"
            />
          </View>

          {discountType === 'percent' && (
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="speedometer" size={20} color={COLORS.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Maximum Discount (optional)"
                placeholderTextColor={COLORS.textMuted}
                value={maxDiscount}
                onChangeText={setMaxDiscount}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        {/* Validity Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validity</Text>

          <View style={styles.validForRow}>
            {VALID_FOR_OPTIONS.map((option) => {
              const isSelected = validFor === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.validForChip, isSelected && styles.validForChipSelected]}
                  onPress={() => setValidFor(option.id)}
                >
                  {isSelected ? (
                    <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.validForGradient}>
                      <Text style={styles.validForChipTextSelected}>{option.label}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.validForChipText}>{option.label}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="infinite" size={20} color={COLORS.textSecondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Usage Limit (leave empty for unlimited)"
              placeholderTextColor={COLORS.textMuted}
              value={usageLimit}
              onChangeText={setUsageLimit}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Activation */}
        <View style={styles.section}>
          <View style={styles.switchCard}>
            <View style={styles.switchInfo}>
              <View style={[styles.switchIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="power" size={20} color={COLORS.success} />
              </View>
              <View style={styles.switchTexts}>
                <Text style={styles.switchLabel}>Activate Offer</Text>
                <Text style={styles.switchHint}>
                  Turn on to make this offer visible to customers
                </Text>
              </View>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={isActive ? COLORS.primary : '#fff'}
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <LinearGradient
            colors={submitting ? [COLORS.textSecondary, COLORS.textMuted] : ['#6366F1', '#8B5CF6']}
            style={styles.submitGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>
              {submitting ? 'Creating...' : 'Create Offer'}
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  previewButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  offerTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  offerTypeCard: {
    width: '48%',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  offerTypeCardSelected: {
    borderColor: 'transparent',
  },
  offerTypeGradient: {
    alignItems: 'center',
    padding: SPACING.md,
    minHeight: 100,
  },
  offerTypeContent: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    minHeight: 100,
  },
  offerTypeIconSelected: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  offerTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  offerTypeLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  offerTypeLabelSelected: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  discountTypeButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  discountTypeButtonActive: {},
  discountTypeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
  },
  discountTypeText: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
    textAlign: 'center',
    lineHeight: 48,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  discountTypeTextActive: {
    color: '#fff',
  },
  discountInputContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  discountInput: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  validForRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  validForChip: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  validForChipSelected: {},
  validForGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  validForChipText: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
    backgroundColor: COLORS.card,
  },
  validForChipTextSelected: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#fff',
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  switchTexts: {
    flex: 1,
  },
  switchLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  submitButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  submitButtonDisabled: {},
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  submitButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
});
