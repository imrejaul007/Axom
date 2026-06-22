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
  accentGold: '#FFD700',
  danger: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

const CIRCLE_MEMBERS = [
  { id: '1', name: 'Mom', phone: '+91 98765 43210', relationship: 'Family', notifyOn: 'always' },
  { id: '2', name: 'Dad', phone: '+91 98765 43211', relationship: 'Family', notifyOn: 'always' },
  { id: '3', name: 'Priya', phone: '+91 98765 43212', relationship: 'Friend', notifyOn: 'emergency_only' },
];

export default function TrustedCircleScreen() {
  const router = useRouter();
  const [members, setMembers] = useState(CIRCLE_MEMBERS);
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phone: '', relationship: '' });

  const handleAdd = () => {
    if (!newMember.name || !newMember.phone) {
      Alert.alert('Missing Info', 'Please enter name and phone number');
      return;
    }
    setMembers([...members, { id: Date.now().toString(), ...newMember, notifyOn: 'always' }]);
    setNewMember({ name: '', phone: '', relationship: '' });
    setShowAdd(false);
    Alert.alert('Success', `${newMember.name} added to your trusted circle`);
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert('Remove Contact', `Remove ${name} from your trusted circle?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setMembers(members.filter(m => m.id !== id)) },
    ]);
  };

  const handleSOS = () => {
    if (members.length === 0) {
      Alert.alert('No Contacts', 'Please add trusted contacts first');
      return;
    }
    Alert.alert(
      'Trigger SOS',
      `This will alert ${members.length} trusted contacts with your location. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Trigger SOS', style: 'destructive', onPress: () => Alert.alert('SOS Sent', 'Your contacts have been notified') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Trusted Circle</Text>
        <Text style={styles.subtitle}>Your emergency contacts will be notified when you trigger SOS</Text>

        {/* SOS Button */}
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <Ionicons name="alert-circle" size={24} color={colors.textPrimary} />
          <Text style={styles.sosButtonText}>Trigger SOS to All Contacts</Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your trusted circle will receive your location when you trigger SOS. They can see your real-time location for 30 minutes.
          </Text>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Circle Members ({members.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAdd(!showAdd)}>
              <Ionicons name={showAdd ? 'close' : 'add'} size={20} color={colors.primary} />
              <Text style={styles.addButtonText}>{showAdd ? 'Cancel' : 'Add'}</Text>
            </TouchableOpacity>
          </View>

          {/* Add Form */}
          {showAdd && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor={colors.textMuted}
                value={newMember.name}
                onChangeText={(text) => setNewMember({ ...newMember, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={colors.textMuted}
                value={newMember.phone}
                onChangeText={(text) => setNewMember({ ...newMember, phone: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Relationship (e.g., Family, Friend)"
                placeholderTextColor={colors.textMuted}
                value={newMember.relationship}
                onChangeText={(text) => setNewMember({ ...newMember, relationship: text })}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
                <Text style={styles.saveButtonText}>Add to Circle</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Member List */}
          {members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberPhone}>{member.phone}</Text>
                <View style={styles.memberMeta}>
                  <Text style={styles.memberRelation}>{member.relationship}</Text>
                  <View style={[styles.notifyBadge, member.notifyOn === 'always' && styles.notifyBadgeActive]}>
                    <Text style={[styles.notifyText, member.notifyOn === 'always' && styles.notifyTextActive]}>
                      {member.notifyOn === 'always' ? 'Always' : 'Emergency Only'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(member.id, member.name)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {members.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No trusted contacts yet</Text>
              <Text style={styles.emptyHint}>Add contacts to notify in emergencies</Text>
            </View>
          )}
        </View>

        {/* Auto Check-in */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto Check-in</Text>
          <View style={styles.checkinCard}>
            <View style={styles.checkinInfo}>
              <Text style={styles.checkinTitle}>Enable Auto Check-in</Text>
              <Text style={styles.checkinDesc}>
                Get reminded to check in safe after traveling alone
              </Text>
            </View>
            <View style={styles.toggle}>
              <View style={styles.toggleActive} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  backButton: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  sosButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger, borderRadius: 12, padding: 16, gap: 12, marginBottom: 16 },
  sosButtonText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.primary + '10', borderRadius: 12, padding: 12, gap: 12, marginBottom: 24 },
  infoText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addButtonText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  addForm: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, gap: 12 },
  input: { backgroundColor: colors.surfaceLight, borderRadius: 8, padding: 12, fontSize: 14, color: colors.textPrimary },
  saveButton: { backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  memberPhone: { fontSize: 13, color: colors.textMuted },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  memberRelation: { fontSize: 12, color: colors.textSecondary },
  notifyBadge: { backgroundColor: colors.surfaceLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  notifyBadgeActive: { backgroundColor: colors.accentGreen + '20' },
  notifyText: { fontSize: 10, color: colors.textMuted },
  notifyTextActive: { color: colors.accentGreen },
  removeButton: { padding: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textMuted, marginTop: 16 },
  emptyHint: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  checkinCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 16 },
  checkinInfo: { flex: 1 },
  checkinTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  checkinDesc: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: colors.accentGreen, padding: 2, justifyContent: 'center' },
  toggleActive: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.textPrimary, alignSelf: 'flex-end' },
});
