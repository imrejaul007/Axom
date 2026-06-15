import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

const CATEGORIES = [
  { id: 'furniture', label: 'Furniture', icon: 'bed' },
  { id: 'electronics', label: 'Electronics', icon: 'phone-portrait' },
  { id: 'housing', label: 'PG/Rooms', icon: 'home' },
  { id: 'vehicles', label: 'Vehicles', icon: 'car' },
  { id: 'books', label: 'Books', icon: 'book' },
  { id: 'fashion', label: 'Fashion', icon: 'shirt' },
  { id: 'services', label: 'Services', icon: 'construct' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const CONDITIONS = [
  { id: 'new', label: 'New', desc: 'Unused, with tags' },
  { id: 'like_new', label: 'Like New', desc: 'Barely used' },
  { id: 'good', label: 'Good', desc: 'Minor wear' },
  { id: 'fair', label: 'Fair', desc: 'Visible wear' },
];

export default function CreateListingScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [negotiable, setNegotiable] = useState(true);

  const handleSubmit = () => {
    if (!title || !price || !category || !condition) {
      Alert.alert('Missing Info', 'Please fill in all required fields');
      return;
    }
    Alert.alert('Success', 'Your listing has been created!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Listing</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.postButton}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* Photos */}
        <TouchableOpacity style={styles.photoSection}>
          <Ionicons name="camera" size={32} color={colors.textMuted} />
          <Text style={styles.photoText}>Add Photos (1-5)</Text>
          <Text style={styles.photoHint}>Items with photos sell faster</Text>
        </TouchableOpacity>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category *</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryItem, category === cat.id && styles.categoryItemActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Ionicons name={cat.icon as any} size={24} color={category === cat.id ? colors.primary : colors.textMuted} />
                <Text style={[styles.categoryLabel, category === cat.id && styles.categoryLabelActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="What are you selling?"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price *</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceInput}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.priceField}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={[styles.negotiableToggle, negotiable && styles.negotiableToggleActive]}
              onPress={() => setNegotiable(!negotiable)}
            >
              <Ionicons name={negotiable ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={negotiable ? colors.primary : colors.textMuted} />
              <Text style={[styles.negotiableText, negotiable && styles.negotiableTextActive]}>Negotiable</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition *</Text>
          <View style={styles.conditionGrid}>
            {CONDITIONS.map((cond) => (
              <TouchableOpacity
                key={cond.id}
                style={[styles.conditionItem, condition === cond.id && styles.conditionItemActive]}
                onPress={() => setCondition(cond.id)}
              >
                <Text style={[styles.conditionLabel, condition === cond.id && styles.conditionLabelActive]}>{cond.label}</Text>
                <Text style={styles.conditionDesc}>{cond.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          <TouchableOpacity style={styles.locationCard}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.locationText}>Koramangala, Bangalore</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  postButton: { fontSize: 16, fontWeight: '600', color: colors.primary },
  photoSection: { height: 150, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  photoText: { fontSize: 16, color: colors.textPrimary, marginTop: 8 },
  photoHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryItem: { width: '23%', backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' },
  categoryItemActive: { backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary },
  categoryLabel: { fontSize: 11, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  categoryLabelActive: { color: colors.primary },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, fontSize: 16, color: colors.textPrimary },
  textArea: { height: 120, textAlignVertical: 'top' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  priceInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16 },
  currencySymbol: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginRight: 8 },
  priceField: { flex: 1, fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, paddingVertical: 16 },
  negotiableToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  negotiableToggleActive: { backgroundColor: colors.primary + '20' },
  negotiableText: { fontSize: 14, color: colors.textMuted },
  negotiableTextActive: { color: colors.primary, fontWeight: '600' },
  conditionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditionItem: { width: '48%', backgroundColor: colors.surface, borderRadius: 12, padding: 12 },
  conditionItemActive: { backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary },
  conditionLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  conditionLabelActive: { color: colors.primary },
  conditionDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  locationText: { flex: 1, fontSize: 14, color: colors.textPrimary },
});
